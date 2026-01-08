import express from "express";
import prisma from "../../lib/prisma";
import {
  signMobileAccessToken,
  verifyMobileToken,
  comparePassword,
} from "../../middleware/authMobile";
import { toJSTISOString } from "../../../shared/utils/jstDateUtils";

const router = express.Router();

/**
 * POST /api/mobile/auth/login
 * Body: { username: string (email), password: string, deviceInfo?: string }
 * Response: { success, data: { token, user, expiresAt } }
 */
router.post("/login", async (req, res) => {
  try {
    const { username, email, password } = req.body || {};
    const emailInput: string | undefined =
      (email as string) || (username as string);

    if (!emailInput || !password) {
      return res.status(400).json({
        success: false,
        error: "Email and password are required",
      });
    }

    const mobileUser = await (prisma as any).mobileUser.findFirst({
      where: {
        isActive: true,
        OR: [{ email: emailInput }, { username: emailInput }],
      },
    });

    if (!mobileUser) {
      return res.status(401).json({
        success: false,
        error: "Invalid credentials",
      });
    }

    const ok = await comparePassword(password, mobileUser.passwordHash);
    if (!ok) {
      return res.status(401).json({
        success: false,
        error: "Invalid credentials",
      });
    }

    // Resolve role from new mobile_user_roles (fallback to User/level 1)
    const roleRec = mobileUser.mobileRoleId
      ? await (prisma as any).mobileUserRole.findUnique({
          where: { id: mobileUser.mobileRoleId },
          select: { name: true, level: true },
        })
      : null;

    const roleName = (roleRec?.name ?? "User").toLowerCase();
    const roleKey =
      roleName === "administrator"
        ? "admin"
        : roleName === "manager"
        ? "supervisor"
        : "user";
    const roleLevel = roleRec?.level ?? 1;

    const token = signMobileAccessToken({
      id: mobileUser.id,
      email: mobileUser.email,
    });

    // Align with dispatch-app/types/api.ts LoginResponse expectations
    const userPayload = {
      id: mobileUser.id,
      username: mobileUser.email,
      name: mobileUser.displayName || mobileUser.email,
      role: roleKey,
      userTypeLevel: roleLevel,
    };

    // 15 minutes default, keep in sync with ACCESS_EXPIRES_IN
    const expiresAt = toJSTISOString(new Date(Date.now() + 15 * 60 * 1000));

    return res.json({
      success: true,
      data: {
        success: true,
        token,
        user: userPayload,
        expiresAt,
      },
    });
  } catch (err: any) {
    console.error("Mobile login error:", err);
    const isDev = process.env.NODE_ENV !== "production";
    const details = isDev
      ? {
          message: err?.message,
          code: err?.code,
          name: err?.name,
          stack: err?.stack,
        }
      : undefined;

    return res.status(500).json({
      success: false,
      error: "Login failed",
      ...(details ? { details } : {}),
    });
  }
});

/**
 * POST /api/mobile/auth/refresh
 * Authorization: Bearer <token> (may be expired)
 * Response: { success, data: { token, user, expiresAt } }
 * Note: Minimal implementation re-issues a short-lived token based on the prior one.
 */
router.post("/refresh", async (req, res) => {
  try {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];
    if (!token) {
      return res
        .status(401)
        .json({ success: false, error: "Access token required" });
    }

    // Allow refresh with expired token
    const decoded = verifyMobileToken(token, { ignoreExpiration: true });

    if (decoded.aud !== "mobile") {
      return res
        .status(403)
        .json({ success: false, error: "Invalid token audience" });
    }

    const mobileUser = await (prisma as any).mobileUser.findFirst({
      where: { id: decoded.sub, isActive: true },
    });

    if (!mobileUser) {
      return res
        .status(401)
        .json({ success: false, error: "User not found or inactive" });
    }

    // Resolve role from new mobile_user_roles (fallback to User/level 1)
    const roleRec = mobileUser.mobileRoleId
      ? await (prisma as any).mobileUserRole.findUnique({
          where: { id: mobileUser.mobileRoleId },
          select: { name: true, level: true },
        })
      : null;

    const roleName = (roleRec?.name ?? "User").toLowerCase();
    const roleKey =
      roleName === "administrator"
        ? "admin"
        : roleName === "manager"
        ? "supervisor"
        : "user";
    const roleLevel = roleRec?.level ?? 1;

    const newToken = signMobileAccessToken({
      id: mobileUser.id,
      email: mobileUser.email,
    });

    const userPayload = {
      id: mobileUser.id,
      username: mobileUser.email,
      name: mobileUser.displayName || mobileUser.email,
      role: roleKey,
      userTypeLevel: roleLevel,
    };

    const expiresAt = toJSTISOString(new Date(Date.now() + 15 * 60 * 1000));

    return res.json({
      success: true,
      data: {
        success: true,
        token: newToken,
        user: userPayload,
        expiresAt,
      },
    });
  } catch (err: any) {
    console.error("Mobile refresh error:", err);
    const isDev = process.env.NODE_ENV !== "production";
    const details = isDev
      ? {
          message: err?.message,
          code: err?.code,
          name: err?.name,
          stack: err?.stack,
        }
      : undefined;

    return res.status(401).json({
      success: false,
      error: "Invalid or expired token",
      ...(details ? { details } : {}),
    });
  }
});

/**
 * POST /api/mobile/auth/logout
 * Body: { token?: string }  // accepted but not required for this minimal implementation
 */
router.post("/logout", async (_req, res) => {
  // Stateless access token logout – client will discard token.
  return res.json({ success: true, message: "Logged out" });
});

/**
 * GET /api/mobile/auth/me
 * Returns current mobile profile based on Bearer token.
 */
router.get("/me", async (req, res) => {
  try {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];
    if (!token) {
      return res
        .status(401)
        .json({ success: false, error: "Access token required" });
    }
    const decoded = verifyMobileToken(token);
    const mobileUser = await (prisma as any).mobileUser.findFirst({
      where: { id: decoded.sub, isActive: true },
      select: {
        id: true,
        email: true,
        displayName: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!mobileUser) {
      return res.status(404).json({ success: false, error: "User not found" });
    }

    return res.json({
      success: true,
      data: mobileUser,
    });
  } catch {
    return res
      .status(401)
      .json({ success: false, error: "Invalid or expired token" });
  }
});

export default router;
