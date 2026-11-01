import axios from "axios";
import { Request, Response } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";
import { authenticator } from "otplib";
import prisma from "../../../../config/prisma/prisma.js";
import { getKeycloakClientSecret } from "../../../../utils/keycloak/getKeycloakClientSecret.js";

type InitialTOTPRequest = Request & {
  user?: { id?: string };
};

export const verifyInitialTOTP = async (
  req: InitialTOTPRequest,
  res: Response
): Promise<void> => {
  try {
    const code = typeof req.body?.totp === "string" ? req.body.totp.trim() : "";
    if (!/^\d{6}$/.test(code)) {
      res.status(400).json({ message: "Enter the 6-digit authenticator code." });
      return;
    }

    let userId = req.user?.id;
    let refreshToken = req.cookies?.refresh_token as string | undefined;
    const registrationToken = req.cookies?.registration_token as string | undefined;

    if (registrationToken) {
      try {
        const payload = jwt.verify(
          registrationToken,
          process.env.JWT_SECRET!
        ) as JwtPayload;
        userId = typeof payload.userId === "string" ? payload.userId : undefined;
        refreshToken =
          typeof payload.refreshToken === "string"
            ? payload.refreshToken
            : undefined;
      } catch {
        res.clearCookie("registration_token", { path: "/" });
        res.status(401).json({
          message: "Registration setup session expired. Sign in to continue.",
        });
        return;
      }
    }

    if (!userId) {
      res.clearCookie("registration_token", { path: "/" });
      res.status(401).json({
        message: "TOTP setup session is missing or expired. Sign in to continue.",
      });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        username: true,
        email: true,
        firstName: true,
        lastName: true,
        phoneNumber: true,
        role: true,
        department: true,
        provider: true,
        tenantId: true,
        totpSecret: true,
      },
    });

    // Accept one adjacent 30-second interval to tolerate small clock drift
    // between the authenticator device and the development machine.
    const totpVerifier = authenticator.create({
      ...authenticator.allOptions(),
      window: 1,
    });
    if (
      !user?.totpSecret ||
      !totpVerifier.verify({ token: code, secret: user.totpSecret })
    ) {
      res.status(422).json({ message: "Invalid authenticator code. Try the current 6-digit code." });
      return;
    }

    if (refreshToken) {
      const clientSecret = await getKeycloakClientSecret();
      const tokenResponse = await axios.post(
        `${process.env.KEYCLOAK_URL}/realms/${process.env.KEYCLOAK_REALM}/protocol/openid-connect/token`,
        new URLSearchParams({
          grant_type: "refresh_token",
          client_id: process.env.KEYCLOAK_CLIENT_ID!,
          client_secret: clientSecret,
          refresh_token: refreshToken,
        }),
        { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
      );

      const cookieOptions = {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict" as const,
        path: "/",
      };
      res.cookie("access_token", tokenResponse.data.access_token, {
        ...cookieOptions,
        maxAge: 4 * 60 * 60 * 1000,
      });
      res.cookie("refresh_token", tokenResponse.data.refresh_token, {
        ...cookieOptions,
        maxAge: 24 * 60 * 60 * 1000,
      });
    } else if (!req.cookies?.access_token) {
      res.status(401).json({ message: "Authentication session expired. Sign in again." });
      return;
    }

    res.clearCookie("registration_token", { path: "/" });
    const { totpSecret, ...userData } = user;
    res.json({
      message: "Authenticator setup complete.",
      user: userData,
      redirectTo:
        user.role === "IT_VENDOR"
          ? "/vendor/openings"
          : user.role === "HIRING_MANAGER"
            ? "/business-user/hiring"
            : "/user",
    });
  } catch (error) {
    console.error("Initial TOTP verification failed:", error);
    res.status(500).json({ message: "Could not finish authenticator setup." });
  }
};
