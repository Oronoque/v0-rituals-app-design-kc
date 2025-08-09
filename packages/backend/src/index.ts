import compression from "compression";
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
import { errorHandler, notFoundHandler } from "./middleware/error-handler";

// Import database
import { UserRole } from "@rituals/shared";
import { closeConnection, testConnection } from "./database/connection";
if (process.env.NODE_ENV !== "production") {
  const originalLog = console.log;

  console.log = function (...args) {
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

    // Add a newline before printing
    originalLog.apply(console, [`\x1b[32m[${location}]\x1b[0m`, "\n", ...args]);
  };
}

// Load environment variables
dotenv.config();
console.log("NODE_ENV", process.env.NODE_ENV);
console.log("API_URL", process.env.API_URL);
console.log("FRONTEND_URL", process.env.FRONTEND_URL);

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
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

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

// Global error handler (must be last)
app.use(errorHandler);

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

    // Start HTTP server
    const server = app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📚 API docs: http://localhost:${PORT}/api`);
      console.log(`🔍 Health check: http://localhost:${PORT}/health`);
      console.log(`🌍 Environment: ${process.env.NODE_ENV || "development"}`);
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
