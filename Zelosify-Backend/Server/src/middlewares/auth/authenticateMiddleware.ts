import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import jwksClient from "jwks-rsa";
import axios from "axios";
import prisma from "../../config/prisma/prisma.js";
import { getKeycloakClientSecret } from "../../utils/keycloak/getKeycloakClientSecret.js";

const KEYCLOAK_URL = process.env.KEYCLOAK_URL || "http://localhost:8080/auth";
const REALM_NAME = process.env.KEYCLOAK_REALM || "Zelosify";

const keycloakJwksClient = jwksClient({
  jwksUri: `${KEYCLOAK_URL}/realms/${REALM_NAME}/protocol/openid-connect/certs`,
  cache: true,
  cacheMaxAge: 86400000, // 24 hours
  rateLimit: true,
  jwksRequestsPerMinute: 10,
});

// ✅ Extend Express Request to Include User Property
declare module "express-serve-static-core" {
  interface Request {
    user?: any;
  }
}

// Cache for user data
const userCache = new Map();
const USER_CACHE_TTL = 5 * 60 * 1000; // 5 minutes
const refreshRequests = new Map<string, Promise<any>>();

async function exchangeRefreshToken(refreshToken: string) {
  const existing = refreshRequests.get(refreshToken);
  if (existing) return existing;

  const request = (async () => {
    const clientSecret = await getKeycloakClientSecret();
    const response = await axios.post(
      `${KEYCLOAK_URL}/realms/${REALM_NAME}/protocol/openid-connect/token`,
      new URLSearchParams({
        grant_type: "refresh_token",
        client_id: process.env.KEYCLOAK_CLIENT_ID!,
        client_secret: clientSecret,
        refresh_token: refreshToken,
      }),
      { headers: { "Content-Type": "application/x-www-form-urlencoded" }, timeout: 8000 }
    );
    return response.data;
  })();
  refreshRequests.set(refreshToken, request);
  try {
    return await request;
  } finally {
    if (refreshRequests.get(refreshToken) === request) refreshRequests.delete(refreshToken);
  }
}

// 🔹 Middleware: Authenticate User & Refresh Token If Expired
export const authenticateUser = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const token =
      req.headers.authorization?.split(" ")[1] || req.cookies.access_token;

    if (!token) {
      res.status(401).json({ message: "Authentication required" });
      return;
    }

    const decoded = jwt.decode(token, { complete: true });
    if (!decoded || !decoded.payload) {
      res.status(401).json({ message: "Invalid token format" });
      return;
    }

    // Verify token
    try {
      const key = await keycloakJwksClient.getSigningKey(decoded.header.kid);
      const signingKey = key.getPublicKey();

      let verified = jwt.verify(token, signingKey, {
        algorithms: ["RS256"],
        issuer: `${KEYCLOAK_URL}/realms/${REALM_NAME}`,
      }) as jwt.JwtPayload;

      if (!verified || typeof verified !== "object") {
        throw new Error("Token verification failed");
      }

      // Check cache first
      const cachedUser = userCache.get(verified.sub);
      if (cachedUser && cachedUser.timestamp > Date.now() - USER_CACHE_TTL) {
        req.user = cachedUser.data;
        return next();
      }

      const user = await prisma.user.findUnique({
        where: { externalId: verified.sub },
        select: {
          id: true,
          username: true,
          email: true,
          role: true,
          department: true,
          provider: true,
          tenant: {
            select: {
              tenantId: true,
              companyName: true,
            },
          },
        },
      });

      if (!user) {
        console.log(`❌ User not found: ${verified.sub}`);
        res.status(401).json({ message: "User not found" });
        return;
      }

      // Update cache
      userCache.set(verified.sub, {
        data: user,
        timestamp: Date.now(),
      });
      console.log("Authenticate Middleware Passed ✅ : ", user);

      req.user = user;
      next();
    } catch (error) {
      const refreshToken = req.cookies?.refresh_token as string | undefined;
      if (!(error instanceof jwt.TokenExpiredError) || !refreshToken) {
        console.error("Token verification failed:", error);
        res.status(401).json({ message: "Invalid or expired token" });
        return;
      }
      try {
        const tokenResponse = await exchangeRefreshToken(refreshToken);
        const refreshedAccessToken = tokenResponse.access_token as string;
        const refreshedToken = (tokenResponse.refresh_token || refreshToken) as string;
        const refreshedDecoded = jwt.decode(refreshedAccessToken, { complete: true });
        if (!refreshedDecoded?.header?.kid) throw new Error("Refreshed access token is invalid");
        const refreshedKey = await keycloakJwksClient.getSigningKey(refreshedDecoded.header.kid);
        jwt.verify(refreshedAccessToken, refreshedKey.getPublicKey(), {
          algorithms: ["RS256"],
          issuer: `${KEYCLOAK_URL}/realms/${REALM_NAME}`,
        });
        const cookieOptions = {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax" as const,
          path: "/",
        };
        res.cookie("access_token", refreshedAccessToken, {
          ...cookieOptions,
          maxAge: Math.max(60, Number(tokenResponse.expires_in) || 300) * 1000,
        });
        res.cookie("refresh_token", refreshedToken, {
          ...cookieOptions,
          maxAge: Math.max(60, Number(tokenResponse.refresh_expires_in) || 86400) * 1000,
        });
        const refreshedPayload = jwt.decode(refreshedAccessToken) as jwt.JwtPayload | null;
        if (refreshedPayload?.sub) {
          await prisma.user.updateMany({
            where: { externalId: refreshedPayload.sub },
            data: { accessToken: refreshedAccessToken, refreshToken: refreshedToken },
          });
        }
        req.headers.authorization = `Bearer ${refreshedAccessToken}`;
        return authenticateUser(req, res, next);
      } catch (refreshError) {
        console.error("Access token refresh failed:", refreshError);
        res.clearCookie("access_token", { path: "/" });
        res.clearCookie("refresh_token", { path: "/" });
        res.status(401).json({ message: "Session expired. Please sign in again." });
        return;
      }
    }
  } catch (error) {
    console.error("Authentication error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
