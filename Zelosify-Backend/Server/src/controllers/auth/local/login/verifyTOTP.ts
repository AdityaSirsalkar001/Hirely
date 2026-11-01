import { Request, Response } from "express";
import { JwtPayload } from "jsonwebtoken";
import jwt from "jsonwebtoken";
import prisma from "../../../../config/prisma/prisma.js";
import { authenticator } from "otplib";
import { getKeycloakClientSecret } from "../../../../utils/keycloak/getKeycloakClientSecret.js";
import axios from "axios";

export const verifyTOTP = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const totp =
      typeof req.body?.totp === "string" ? req.body.totp.trim() : "";
    const tempToken =
      (typeof req.cookies?.temp_token === "string" && req.cookies.temp_token) ||
      (typeof req.body?.tempToken === "string" && req.body.tempToken) ||
      "";

    if (!tempToken || !totp) {
      res.status(400).json({ message: "Temp token and TOTP are required" });
      return;
    }

    let decoded: JwtPayload;
    try {
      decoded = jwt.verify(tempToken, process.env.JWT_SECRET!) as JwtPayload;
    } catch (error) {
      res.status(401).json({ message: "Invalid or expired temp token" });
      return;
    }

    const userId = decoded.userId as string | undefined;
    if (!userId) {
      res.status(401).json({ message: "Invalid or expired temp token" });
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
        role: true,
        department: true,
        totpSecret: true,
        refreshToken: true,
        tenant: {
          select: {
            tenantId: true,
            companyName: true,
          },
        },
      },
    });

    if (!user) {
      res.status(401).json({ message: "User not found" });
      return;
    }

    // Verify TOTP
    // Allow one adjacent 30-second interval for small clock differences.
    const isValidTOTP = authenticator
      .create({ ...authenticator.allOptions(), window: 1 })
      .verify({ token: totp, secret: user.totpSecret! });

    if (!isValidTOTP) {
      res.status(401).json({ message: "Invalid TOTP code" });
      return;
    }

    const refreshToken =
      (typeof decoded.refreshToken === "string" && decoded.refreshToken) ||
      user.refreshToken;

    if (!refreshToken) {
      res.status(401).json({
        message: "Login session expired. Please enter your password again.",
      });
      return;
    }

    // TOTP is valid, now exchange the refresh token for new access token
    const clientSecret = await getKeycloakClientSecret();

    try {
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

      // Set new access and refresh tokens
      const cookieOptions = {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax" as const,
        path: "/",
      };

      res.cookie("access_token", tokenResponse.data.access_token, {
        ...cookieOptions,
        maxAge: 4 * 3600 * 1000, // 4 hours
      });

      res.cookie("refresh_token", tokenResponse.data.refresh_token, {
        ...cookieOptions,
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
      });

      await prisma.user.update({
        where: { id: user.id },
        data: {
          accessToken: tokenResponse.data.access_token,
          refreshToken: tokenResponse.data.refresh_token,
        },
      });

      res.clearCookie("temp_token", { ...cookieOptions });

      // Remove sensitive data before sending user info
      const { totpSecret, refreshToken: _refreshToken, ...userData } = user;

      // Send the final response
      res.json({
        message: "TOTP verified successfully. Login successful.",
        user: userData,
      });
    } catch (error: any) {
      console.error(
        "❌ Error exchanging refresh token:",
        error.response?.data || error.message
      );
      res.status(401).json({ message: "Failed to authenticate" });
    }
  } catch (error) {
    console.error("❌ Error verifying TOTP:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
