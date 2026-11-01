import "dotenv/config";
// Core Express and Node.js libraries
import express from "express";

// Authentication and session management
import { setupKeycloakConfig } from "./config/keycloak/keycloak.js";
import session from "express-session";

// Security and middleware libraries
import cors from "cors";
import cookieParser from "cookie-parser";
import helmet from "helmet";

// Database connection utilities
import connectPrisma from "./utils/prisma/connectPrisma.js";

// Application route handlers organized by feature domain
import authRoutes from "./routers/auth/authRoute.js";
import awsRouter from "./routers/aws/awsRoute.js";
import vendorRoutes from "./routers/vendor/vendorRoutes.js";
import hiringManagerRoutes from "./routers/hiring/hiringManagerRoutes.js";

// Initialize Express application
const app = express();

// Ensure local Keycloak traffic bypasses any proxy configured on the host.
const noProxyHosts = new Set(
  (process.env.NO_PROXY || "")
    .split(",")
    .map((host) => host.trim())
    .filter(Boolean)
);
noProxyHosts.add("localhost");
noProxyHosts.add("127.0.0.1");
process.env.NO_PROXY = [...noProxyHosts].join(",");
process.env.no_proxy = process.env.NO_PROXY;

/**
 * Main server initialization function
 * Sets up middleware, database connections, routes, and starts the server
 */
async function startServer() {
  try {
    // Initialize Keycloak authentication and session store
    const { keycloak, memoryStore } = await setupKeycloakConfig();

    // Establish database connections
    await connectPrisma();

    // Security middleware for headers and protection
    app.use(helmet());
    app.use(express.json());
    app.use(cookieParser());

    // Cross-Origin Resource Sharing configuration
    // Allows requests from specified frontend origins during development
    app.use(
      cors({
        // The frontend may be opened as localhost or 127.0.0.1, and Next's
        // dev server can fall back to another port when 5173 is occupied.
        origin: [
          process.env.FRONTEND_URL || "http://localhost:5173",
          "http://127.0.0.1:5173",
          "http://localhost:5174",
          "http://127.0.0.1:5174",
        ],
        credentials: true,
        methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
        allowedHeaders: ["Content-Type", "Authorization", "Cookie"],
        exposedHeaders: ["set-cookie"],
      })
    );

    // Session configuration for Keycloak authentication
    app.use(
      session({
        secret: process.env.SESSION_SECRET || "my-secret",
        resave: false,
        saveUninitialized: true,
        store: memoryStore,
      })
    );

    // Initialize Keycloak middleware for authentication
    app.use(keycloak.middleware());

    // Mount API route handlers with versioned endpoints

    // User authentication and authorization
    app.use("/api/v1/auth", authRoutes);

    // AWS integration
    app.use("/api/v1/aws", awsRouter);

    // Handles vendor-specific routes
    app.use("/api/v1/vendor", vendorRoutes);

    // Hiring manager routes
    app.use("/api/v1/hiring-manager", hiringManagerRoutes);

    // Keep request logs free of headers and bodies, which may contain credentials,
    // session cookies, access tokens, or uploaded candidate data.
    app.use((req, _, next) => {
      console.log(`[Server] ${req.method} ${req.path}`);
      next();
    });

    // Health check endpoint
    app.get("/", (_, res) => {
      res.send("Server Connected!");
    });

    // Global error handling middleware
    // Catches and handles all unhandled errors in the application
    app.use(
      (
        err: Error,
        req: express.Request,
        res: express.Response,
        next: express.NextFunction
      ) => {
        console.error("Global error handler:", err);
        res.status(500).json({
          error: "Internal Server Error",
          message: err.message,
        });
      }
    );

    // Start the server on specified port
    const PORT = process.env.PORT || 5000;

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}...`);
    });
  } catch (error) {
    // Handle server initialization errors
    console.error("Error during server initialization:", error);
    process.exit(1);
  }
}

// Start the server
await startServer();
