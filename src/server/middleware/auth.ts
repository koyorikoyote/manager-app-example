import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { User } from "@prisma/client";
import prisma from "../lib/prisma";

// Extend Express Request type to include user
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: User & {
        role: {
          id: number;
          name: string;
          level: number;
          description: string | null;
        };
      };
    }
  }
}

const JWT_SECRET =
  process.env.JWT_SECRET || "your-secret-key-change-in-production";
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "24h";

export interface JWTPayload {
  userId: number;
  username: string;
  role: {
    id: number;
    name: string;
    level: number;
  };
}

export function generateToken(
  user: User & { role: { id: number; name: string; level: number } }
): string {
  const payload: JWTPayload = {
    userId: user.id,
    username: user.username,
    role: user.role,
  };

  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
  } as jwt.SignOptions);
}

export function verifyToken(token: string): JWTPayload {
  return jwt.verify(token, JWT_SECRET) as JWTPayload;
}

export async function authenticateToken(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({
      success: false,
      message: "Access token required",
    });
  }

  try {
    const decoded = verifyToken(token);

    // Fetch the full user from database using Prisma
    const user = await prisma.user.findUnique({
      where: {
        id: decoded.userId,
        isActive: true,
      },
      include: {
        role: true,
      },
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "User not found or inactive",
      });
    }

    req.user = user;
    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      return res.status(403).json({
        success: false,
        message: "Invalid token",
      });
    }
    if (error instanceof jwt.TokenExpiredError) {
      return res.status(403).json({
        success: false,
        message: "Token expired",
      });
    }

    console.error("Authentication error:", error);
    return res.status(500).json({
      success: false,
      message: "Authentication failed",
    });
  }
}

export function requireRole(roleName: string) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    const roleHierarchy: { [key: string]: number } = {
      SUPER_ADMIN: 3,
      ADMIN: 2,
      USER: 1,
    };

    const userRoleLevel = req.user.role.level;
    const requiredRoleLevel = roleHierarchy[roleName];

    if (userRoleLevel < requiredRoleLevel) {
      return res.status(403).json({
        success: false,
        message: "Insufficient permissions",
      });
    }

    next();
  };
}

export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: "Authentication required",
    });
  }

  // Check role level instead of role name for more flexible permission system
  // Level 2 (ADMIN) or higher (SUPER_ADMIN = 3) should have admin access
  if (req.user.role.level < 2) {
    return res.status(403).json({
      success: false,
      message: "Admin access required",
    });
  }

  next();
}

export function requireSuperAdmin(
  req: Request,
  res: Response,
  next: NextFunction
) {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: "Authentication required",
    });
  }

  if (req.user.role.name !== "SUPER_ADMIN") {
    return res.status(403).json({
      success: false,
      message: "Super admin access required",
    });
  }

  next();
}

export function requireUserManagementAccess(
  req: Request,
  res: Response,
  next: NextFunction
) {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: "Authentication required",
    });
  }

  // Only level 3 users (SUPER_ADMIN) can access user management
  if (req.user.role.level < 3) {
    return res.status(403).json({
      success: false,
      message: "User management access requires level 3 permissions",
    });
  }

  next();
}
