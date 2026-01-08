import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import crypto from "crypto";
import prisma from "../lib/prisma";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-in-production";
const ACCESS_EXPIRES_IN = process.env.MOBILE_ACCESS_EXPIRES_IN || "15m";

export interface MobileJWTPayload {
  sub: number;         // mobile user id
  aud: "mobile";
  email: string;
}

/**
 * Generate a short-lived access token for mobile
 */
export function signMobileAccessToken(user: { id: number; email: string }): string {
  const payload: MobileJWTPayload = {
    sub: user.id,
    aud: "mobile",
    email: user.email,
  };
  return jwt.sign(payload, JWT_SECRET, { expiresIn: ACCESS_EXPIRES_IN } as jwt.SignOptions);
}

/**
 * Verify a mobile token. Optionally ignore expiration (for refresh flow)
 */
export function verifyMobileToken(token: string, opts?: { ignoreExpiration?: boolean }): MobileJWTPayload {
  const decoded = jwt.verify(
    token,
    JWT_SECRET,
    { ignoreExpiration: opts?.ignoreExpiration } as jwt.VerifyOptions
  ) as jwt.JwtPayload;

  const aud = (decoded as any)?.aud;
  const sub = (decoded as any)?.sub;
  const email = (decoded as any)?.email;

  if (aud !== "mobile" || typeof sub !== "number" || typeof email !== "string") {
    throw new jwt.JsonWebTokenError("Invalid mobile token payload");
  }

  return { sub, aud: "mobile", email };
}

/**
 * Express middleware to authenticate Bearer token (mobile audience)
 */
export async function authenticateMobile(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ success: false, message: "Access token required" });
  }

  try {
    const decoded = verifyMobileToken(token);
    if (decoded.aud !== "mobile") {
      return res.status(403).json({ success: false, message: "Invalid token audience" });
    }

    const mobileUser = await (prisma as any).mobileUser.findFirst({
      where: { id: decoded.sub, isActive: true },
      select: { id: true, email: true, displayName: true, isActive: true },
    });

    if (!mobileUser) {
      return res.status(401).json({ success: false, message: "Mobile user not found or inactive" });
    }

    (req as any).mobileUser = mobileUser;
    return next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      return res.status(403).json({ success: false, message: "Token expired" });
    }
    return res.status(403).json({ success: false, message: "Invalid token" });
  }
}

/**
 * Helpers for password hashing and secure token generation (for refresh if used later)
 */
export async function hashPassword(plain: string): Promise<string> {
  const rounds = 10;
  return bcrypt.hash(plain, rounds);
}

export async function comparePassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

export function randomToken(bytes = 32): string {
  return crypto.randomBytes(bytes).toString("hex");
}
