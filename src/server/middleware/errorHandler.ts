import { Request, Response, NextFunction } from "express";
import { Prisma } from "@prisma/client";
import { toJSTISOString } from "../../shared/utils/jstDateUtils";

export interface ApiError extends Error {
  statusCode?: number;
  code?: string;
}

interface ErrorLogData {
  message: string;
  stack?: string;
  url: string;
  method: string;
  timestamp: string;
  userAgent?: string;
  ip?: string;
  userId?: string;
  requestId?: string;
  errorType: string;
  statusCode: number;
  duration?: number;
}

// Enhanced logging utility for errors
class ErrorLogger {
  private static formatError(
    err: Error | ApiError | Prisma.PrismaClientKnownRequestError,
    req: Request,
    statusCode: number,
    errorType: string
  ): ErrorLogData {
    return {
      message: err.message,
      stack: process.env.NODE_ENV === "development" ? err.stack : undefined,
      url: req.url,
      method: req.method,
      timestamp: toJSTISOString(new Date()),
      userAgent: req.get("User-Agent"),
      ip: req.ip || req.connection.remoteAddress,
      userId: (req as any).user?.id,
      requestId: (req as any).requestId,
      errorType,
      statusCode,
      duration: (req as any).startTime
        ? Date.now() - (req as any).startTime
        : undefined,
    };
  }

  static logError(
    err: Error | ApiError | Prisma.PrismaClientKnownRequestError,
    req: Request,
    statusCode: number,
    errorType: string
  ): void {
    const errorData = this.formatError(err, req, statusCode, errorType);

    // Log based on severity
    if (statusCode >= 500) {
      console.error("Server Error:", errorData);
    } else if (statusCode >= 400) {
      console.warn("Client Error:", errorData);
    } else {
      console.info("Error Info:", errorData);
    }

    // In production, you might want to send to external logging service
    if (process.env.NODE_ENV === "production") {
      // Example: Send to external logging service
      // await sendToLoggingService(errorData);
    }
  }
}

export const errorHandler = (
  err: Error | ApiError | Prisma.PrismaClientKnownRequestError,
  req: Request,
  res: Response,
  _next: NextFunction
) => {
  // Handle Prisma errors
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    ErrorLogger.logError(
      err,
      req,
      getPrismaErrorStatusCode(err.code),
      "PrismaClientKnownRequestError"
    );
    return handlePrismaError(err, res);
  }

  if (err instanceof Prisma.PrismaClientUnknownRequestError) {
    ErrorLogger.logError(err, req, 500, "PrismaClientUnknownRequestError");
    return res.status(500).json({
      success: false,
      message: "Database operation failed",
      error:
        process.env.NODE_ENV === "development"
          ? err.message
          : "Internal server error",
      code: "DATABASE_ERROR",
    });
  }

  if (err instanceof Prisma.PrismaClientRustPanicError) {
    ErrorLogger.logError(err, req, 500, "PrismaClientRustPanicError");
    return res.status(500).json({
      success: false,
      message: "Database connection error",
      error:
        process.env.NODE_ENV === "development"
          ? err.message
          : "Internal server error",
      code: "DATABASE_CONNECTION_ERROR",
    });
  }

  if (err instanceof Prisma.PrismaClientInitializationError) {
    ErrorLogger.logError(err, req, 500, "PrismaClientInitializationError");
    return res.status(500).json({
      success: false,
      message: "Database initialization error",
      error:
        process.env.NODE_ENV === "development"
          ? err.message
          : "Internal server error",
      code: "DATABASE_INIT_ERROR",
    });
  }

  if (err instanceof Prisma.PrismaClientValidationError) {
    ErrorLogger.logError(err, req, 400, "PrismaClientValidationError");
    return res.status(400).json({
      success: false,
      message: "Invalid data provided",
      error:
        process.env.NODE_ENV === "development"
          ? err.message
          : "Validation error",
      code: "VALIDATION_ERROR",
    });
  }

  // Handle custom API errors
  if ("statusCode" in err && err.statusCode) {
    ErrorLogger.logError(err, req, err.statusCode, "CustomApiError");
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
      error: process.env.NODE_ENV === "development" ? err.stack : undefined,
      code: (err as ApiError).code || "API_ERROR",
    });
  }

  // Handle JWT errors
  if (err.name === "JsonWebTokenError") {
    ErrorLogger.logError(err, req, 401, "JsonWebTokenError");
    return res.status(401).json({
      success: false,
      message: "Invalid token",
      error: "Authentication failed",
      code: "INVALID_TOKEN",
    });
  }

  if (err.name === "TokenExpiredError") {
    ErrorLogger.logError(err, req, 401, "TokenExpiredError");
    return res.status(401).json({
      success: false,
      message: "Token expired",
      error: "Authentication failed",
      code: "TOKEN_EXPIRED",
    });
  }

  // Handle network and timeout errors
  if (err.name === "TimeoutError" || err.message.includes("timeout")) {
    ErrorLogger.logError(err, req, 504, "TimeoutError");
    return res.status(504).json({
      success: false,
      message: "Request timeout",
      error: "The operation took too long to complete",
      code: "TIMEOUT_ERROR",
    });
  }

  // Default error response
  ErrorLogger.logError(err, req, 500, "UnknownError");
  res.status(500).json({
    success: false,
    message: "Internal server error",
    error:
      process.env.NODE_ENV === "development"
        ? err.message
        : "Something went wrong",
    code: "INTERNAL_ERROR",
  });
};

// Helper function to get status code for Prisma errors
function getPrismaErrorStatusCode(code: string): number {
  switch (code) {
    case "P2002":
      return 409; // Unique constraint violation
    case "P2025":
      return 404; // Record not found
    case "P2003":
      return 400; // Foreign key constraint violation
    case "P2014":
      return 400; // Required relation violation
    case "P2021":
      return 500; // Table does not exist
    case "P2022":
      return 500; // Column does not exist
    case "P1001":
      return 503; // Cannot reach database server
    case "P1002":
      return 504; // Database server timeout
    case "P1008":
      return 504; // Operation timeout
    case "P1017":
      return 503; // Connection closed
    default:
      return 500;
  }
}

function handlePrismaError(
  err: Prisma.PrismaClientKnownRequestError,
  res: Response
) {
  switch (err.code) {
    case "P2002": {
      // Unique constraint violation
      const target = err.meta?.target as string[] | undefined;
      const field = target ? target[0] : "field";
      return res.status(409).json({
        success: false,
        message: `A record with this ${field} already exists`,
        error: "Duplicate entry",
        code: "DUPLICATE_ENTRY",
        field: field,
      });
    }

    case "P2025":
      // Record not found
      return res.status(404).json({
        success: false,
        message: "Record not found",
        error: "The requested resource does not exist",
        code: "RECORD_NOT_FOUND",
      });

    case "P2003":
      // Foreign key constraint violation
      return res.status(400).json({
        success: false,
        message: "Cannot delete record due to related data",
        error: "Foreign key constraint violation",
        code: "FOREIGN_KEY_VIOLATION",
      });

    case "P2014":
      // Required relation violation
      return res.status(400).json({
        success: false,
        message: "Invalid relation data provided",
        error: "Required relation missing",
        code: "REQUIRED_RELATION_MISSING",
      });

    case "P2021":
      // Table does not exist
      return res.status(500).json({
        success: false,
        message: "Database schema error",
        error: "Table does not exist",
        code: "TABLE_NOT_FOUND",
      });

    case "P2022":
      // Column does not exist
      return res.status(500).json({
        success: false,
        message: "Database schema error",
        error: "Column does not exist",
        code: "COLUMN_NOT_FOUND",
      });

    case "P1001":
      // Cannot reach database server
      return res.status(503).json({
        success: false,
        message: "Database connection failed",
        error: "Service temporarily unavailable",
        code: "DATABASE_UNREACHABLE",
      });

    case "P1002":
      // Database server timeout
      return res.status(504).json({
        success: false,
        message: "Database operation timeout",
        error: "Request timeout",
        code: "DATABASE_TIMEOUT",
      });

    case "P1008":
      // Operation timeout
      return res.status(504).json({
        success: false,
        message: "Database operation timeout",
        error: "Request timeout",
        code: "OPERATION_TIMEOUT",
      });

    case "P1017":
      // Connection closed
      return res.status(503).json({
        success: false,
        message: "Database connection lost",
        error: "Service temporarily unavailable",
        code: "CONNECTION_CLOSED",
      });

    default:
      // Unknown Prisma error
      return res.status(500).json({
        success: false,
        message: "Database operation failed",
        error:
          process.env.NODE_ENV === "development"
            ? err.message
            : "Internal server error",
        code: "UNKNOWN_DATABASE_ERROR",
        prismaCode: err.code,
      });
  }
}

// Custom error classes
export class ValidationError extends Error {
  statusCode = 400;

  constructor(message: string) {
    super(message);
    this.name = "ValidationError";
  }
}

export class NotFoundError extends Error {
  statusCode = 404;

  constructor(message: string = "Resource not found") {
    super(message);
    this.name = "NotFoundError";
  }
}

export class UnauthorizedError extends Error {
  statusCode = 401;

  constructor(message: string = "Unauthorized") {
    super(message);
    this.name = "UnauthorizedError";
  }
}

export class ForbiddenError extends Error {
  statusCode = 403;

  constructor(message: string = "Forbidden") {
    super(message);
    this.name = "ForbiddenError";
  }
}

export class ConflictError extends Error {
  statusCode = 409;

  constructor(message: string = "Conflict") {
    super(message);
    this.name = "ConflictError";
  }
}
