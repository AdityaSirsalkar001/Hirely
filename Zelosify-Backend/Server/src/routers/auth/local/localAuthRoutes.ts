// src/routers/auth/normalAuthRoutes.ts
import {
  Router,
  Request,
  Response,
  NextFunction,
  RequestHandler,
} from "express";
import asyncHandler from "../../../utils/handler/asyncHandler.js";
import { authenticateUser } from "../../../middlewares/auth/authenticateMiddleware.js";
import {
  logout,
  register,
  verifyLogin,
  verifyInitialTOTP,
  verifyTOTP,
} from "../../../controllers/controllers.js";
import { AuthenticatedRequest } from "../../../types/common.js";

/**
 * Wraps async handlers to ensure void return type
 * @param handler - The request handler to wrap
 * @returns Wrapped RequestHandler with proper error handling
 */
const wrapHandler = (handler: RequestHandler): RequestHandler =>
  asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    await handler(req, res, next);
  });

/**
 * Wraps async handlers for middleware-protected routes
 * @param handler - The request handler to wrap
 * @returns Wrapped RequestHandler with proper error handling
 */
const wrapProtectedHandler = (handler: RequestHandler): RequestHandler =>
  asyncHandler(
    async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
      await handler(req, res, next);
    }
  );

const router = Router();

/**
 * =============================================================================
 * LOCAL AUTHENTICATION ROUTES
 * =============================================================================
 */

/**
 * POST /register - Register new user account
 * Creates a new user account with provided credentials
 */
router.post("/register", wrapHandler(register));

const authenticateInitialTOTP: RequestHandler = (req, res, next) => {
  if (req.cookies?.registration_token) {
    next();
    return;
  }
  authenticateUser(req, res, next);
};

/** Completes QR-based TOTP setup for a new or legacy local account. */
router.post(
  "/verify-initial-totp",
  authenticateInitialTOTP,
  wrapHandler(verifyInitialTOTP)
);

/**
 * POST /verify-login - Verify user login credentials
 * Validates user credentials and initiates login process
 */
router.post("/verify-login", wrapHandler(verifyLogin));

/**
 * POST /verify-totp - Verify TOTP for two-factor authentication
 * Validates TOTP code for users with 2FA enabled
 */
router.post("/verify-totp", wrapHandler(verifyTOTP));

/**
 * POST /logout - Logout authenticated user
 * Requires authentication middleware to access user session
 */
// Logout must remain available when the access token has expired; otherwise
// the stale httpOnly cookies cannot be cleared and the user gets stuck.
router.post("/logout", wrapHandler(logout));

export default router;
