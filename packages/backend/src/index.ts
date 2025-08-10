import compression from "compression";
import cookieParser from "cookie-parser";
import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import helmet from "helmet";
import "source-map-support/register";

// Import routes
import authRoutes from "./routes/auth";
import dailyRitualRoutes from "./routes/daily-rituals";
import ritualRoutes from "./routes/rituals";

// Import middleware
import { notFoundHandler } from "./middleware/error-handler";

// Import database
import { requestContext, requestIdMiddleware, UserRole } from "@rituals/shared";
import { closeConnection, testConnection } from "./database/connection";

const originalLog = console.log;

function customConsoleMethod(
  originalMethod: (...args: unknown[]) => void,
  isError: boolean,
  ...args: unknown[]
) {
  // Get request ID from AsyncLocalStorage
  const requestId = requestContext.requestId;

  // Get file location from stack trace
  const stack = new Error().stack;
  const callerLine = stack?.split("\n")[2];
  const locationMatch = callerLine?.match(/\((.*):(\d+):(\d+)\)/);

  let location = "";
  if (locationMatch) {
    const [, file, line, col] = locationMatch;
    location = `${file}:${line}:${col}`;
  } else {
    location = callerLine?.trim() || "";
  }

  // Build prefix with colors
  const prefixParts = [];
  if (requestId) {
    prefixParts.push(`\x1b[36m[req:${requestId}]\x1b[0m`); // Cyan
  }
  prefixParts.push(`\x1b[32m[${location}]\x1b[0m`); // Green

  const prefix = prefixParts.join(" ");

  // Wrap the whole output in red if it's an error
  if (isError) {
    originalMethod(`\x1b[31m${prefix}\n`, ...args, "\x1b[0m");
  } else {
    originalMethod(`${prefix}\n`, ...args);
  }
}

// Patch console methods
console.log = function (...args) {
  customConsoleMethod(originalLog, false, ...args);
};

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.API_PORT || 3001;

// Extend Express Request type to include user
declare module "express-serve-static-core" {
  interface Request {
    userId?: string;
    role?: UserRole;
    email?: string;
  }
}

// Middleware
app.use(helmet()); // Security headers
app.use(compression()); // Gzip compression
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    credentials: true,
  })
);
app.use(cookieParser());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use(requestIdMiddleware);
// Health check endpoint
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "OK",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// API routes
app.use("/api/auth", authRoutes);
app.use("/api/rituals", ritualRoutes);
app.use("/api/daily-rituals", dailyRitualRoutes);

// 404 handler for undefined routes
app.use(notFoundHandler);

// Graceful shutdown
const gracefulShutdown = async (signal: string) => {
  console.log(`\n${signal} received. Starting graceful shutdown...`);

  try {
    // Close database connection
    await closeConnection();

    console.log("✅ Graceful shutdown completed");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error during shutdown:", error);
    process.exit(1);
  }
};

// Handle shutdown signals
process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => gracefulShutdown("SIGINT"));

// Start server
async function startServer() {
  try {
    // Test database connection
    const isDbConnected = await testConnection();
    if (!isDbConnected) {
      console.error("❌ Failed to connect to database. Exiting...");
      process.exit(1);
    }

    const API_URL = process.env.API_URL || `http://localhost:${PORT}`;
    // Start HTTP server
    const server = app.listen(PORT, () => {
      console.log(`🔍 Health check: ${API_URL}/health`);
      console.log(`🌍 Environment: ${process.env.NODE_ENV}`);
      console.log("API_URL", process.env.API_URL);
      console.log("NEXT_PUBLIC_API_URL", process.env.NEXT_PUBLIC_API_URL);
      console.log("FRONTEND_URL", process.env.FRONTEND_URL);
    });

    // Handle server errors
    server.on("error", (error: Error) => {
      console.error("❌ Server error:", error);
      process.exit(1);
    });
  } catch (error) {
    console.error("❌ Failed to start server:", error);
    process.exit(1);
  }
}

// Start the application
startServer();
