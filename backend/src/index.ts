import compression from "compression";
import cookieParser from "cookie-parser";
import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import helmet from "helmet";
import "source-map-support/register";

// Import routes
import authRoutes from "./routes/auth";
import exerciseRoutes from "./routes/exercises";
import ritualRoutes from "./routes/rituals";

// Import middleware
import { notFoundHandler } from "./middleware/error-handler";

// Import database
import { requestContext, requestIdMiddleware } from "@rituals/shared";
import { closeConnection, testConnection } from "./database/connection";

const originalLog = console.log;

function customConsoleMethod(
  originalMethod: (...args: unknown[]) => void,
  isError: boolean,
  ...args: unknown[]
) {
  const requestId = requestContext.requestId;

  const stack = new Error().stack?.split("\n");
  const callerLine = stack?.[3]; // <-- skip further down
  const locationMatch = callerLine?.match(/\((.*):(\d+):(\d+)\)/);

  let location = "";
  if (locationMatch) {
    const [, file, line, col] = locationMatch;
    location = `${file}:${line}:${col}`;
  } else {
    location = callerLine?.trim() || "";
  }

  const prefixParts = [];
  if (requestId) {
    prefixParts.push(`\x1b[36m[req:${requestId}]\x1b[0m`);
  }
  prefixParts.push(`\x1b[32m[${location}]\x1b[0m`);

  const prefix = prefixParts.join(" ");

  if (isError) {
    originalMethod(`\x1b[31m${prefix}\n`, ...args, "\x1b[0m");
  } else {
    originalMethod(`${prefix}\n`, ...args);
  }
}

// Clear terminal when process restarts in dev mode
if (process.env.NODE_ENV !== "production") {
  process.stdout.write("\x1Bc"); // same as `clear` command
}

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
    userId: string;
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
app.use("/api/exercises", exerciseRoutes);
app.use("/api/rituals", ritualRoutes);

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
