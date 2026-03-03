import express, { Request, Response, Application } from "express";
import prisma from "./lib/prisma";

// Lazy-load Express app to ensure server can boot even if main app module fails
function getApp(): Application {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires, @typescript-eslint/no-require-imports
    const mod = require("./app");
    return mod.default || mod;
  } catch (err) {
    const fallback = express();
    fallback.use(express.json());

    // Basic health endpoint
    fallback.get("/api/health", (_req: Request, res: Response) => {
      res.json({
        status: "DEGRADED",
        message: "Fallback app in use - main app failed to load",
      });
    });

    // Return 503 for other API routes while main app failed to load
    fallback.use("/api", (_req: Request, res: Response) => {
      res.status(503).json({
        status: "INIT",
        error: "App module failed to load; running fallback server",
      });
    });

    console.error(
      "Failed to load ./app module, starting fallback server:",
      err
    );
    return fallback;
  }
}

// Load environment variables from .env if present
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires, @typescript-eslint/no-require-imports
  require("dotenv").config();
} catch {
  // optional: dotenv not installed or no .env file
}

const PORT =
  Number(process.env.PORT) ||
  (process.env.NODE_ENV === "development" ? 3001 : 3000);

// Initialize Prisma and start server
function startServer() {
  // Start the HTTP server immediately to avoid proxy ECONNREFUSED even if DB is down
  const appInstance = getApp();
  const server = (appInstance as any).listen(PORT, "0.0.0.0", () => {
    console.log(`🚀 Server is running on http://0.0.0.0:${PORT}`);
    console.log(`📊 Environment: ${process.env.NODE_ENV || "development"}`);
    console.log("🔗 Database: MySQL via Prisma ORM");

    if (process.env.NODE_ENV === "development") {
      console.log(`🌐 Server: http://0.0.0.0:${PORT}`);
      console.log(`🔍 Health: http://127.0.0.1:${PORT}/api/health`);
    }
  });

  // Log server-level errors instead of exiting (keep process alive)
  server.on("error", (err: Error) => {
    console.error("HTTP server error:", err);
  });

  // Attempt to connect to the database with retry, without exiting the process
  void connectWithRetry();
}

// Exponential backoff retry for Prisma connection
async function connectWithRetry(attempt = 1): Promise<void> {
  try {
    await prisma.$connect();
    console.log("✅ Connected to MySQL database via Prisma");
  } catch (error) {
    const delay = Math.min(30000, 1000 * Math.pow(2, attempt - 1)); // cap at 30s
    const msg = error instanceof Error ? error.message : String(error);
    console.error(
      `⚠️ Prisma connect failed (attempt ${attempt}). Retrying in ${Math.round(
        delay / 1000
      )}s...`,
      msg
    );
    setTimeout(() => {
      void connectWithRetry(attempt + 1);
    }, delay);
  }
}

// Handle uncaught exceptions
process.on("uncaughtException", async (error) => {
  console.error("Uncaught Exception:", error);
  // Do not exit; keep dev server alive to avoid ECONNREFUSED.
  try {
    await prisma.$disconnect();
  } catch (disconnectError) {
    console.error("Failed to disconnect Prisma:", disconnectError);
  }
});

process.on("unhandledRejection", async (reason, promise) => {
  console.error("Unhandled Rejection at:", promise, "reason:", reason);
  // Do not exit; keep dev server alive to avoid ECONNREFUSED.
  try {
    await prisma.$disconnect();
  } catch (disconnectError) {
    console.error("Failed to disconnect Prisma:", disconnectError);
  }
});

startServer();
