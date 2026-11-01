import type { Response, NextFunction } from "express";
import { AuthenticatedRequest } from "../../types/typeIndex.js";
import { isValidRole } from "../../utils/RBAC/isValidRole.js";

export function authorizeRole(requiredrole: string) {
  return async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ) => {
    // authenticateUser runs first on protected routes and verifies the
    // Keycloak token using the realm JWKS before attaching the DB user.
    const user = req.user;
    if (!user) {
      res.status(401).json({ message: "Missing token" });
      return;
    }

    // Validate the provided role
    if (!isValidRole(requiredrole)) {
      res.status(400).json({ message: "Invalid role provided." });
      return;
    }

    if (user.role !== requiredrole) {
      res.status(403).json({
        message: `Access denied: this route requires the ${requiredrole} role.`,
      });
      return;
    }

    next();
  };
}
