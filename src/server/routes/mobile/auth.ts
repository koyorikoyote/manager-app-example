import express from "express";
import crypto from "crypto";
import prisma from "../../lib/prisma";
import {
  signMobileAccessToken,
  verifyMobileToken,
  comparePassword,
  authenticateMobile,
  hashPassword,
} from "../../middleware/authMobile";
import { toJSTISOString } from "../../../shared/utils/jstDateUtils";

const router = express.Router();

/**
 * POST /api/mobile/auth/login
 * Body: { username: string (email), password: string, deviceInfo?: string }
 * Response: { success, data: { token, refreshToken, user, expiresAt } }
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

    const mobileUser = await prisma.mobileUser.findFirst({
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
      ? await prisma.mobileUserRole.findUnique({
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

    // Generate a secure refresh token (7 days expiry)
    const refreshTokenPlain = crypto.randomBytes(40).toString("hex");
    const refreshTokenHash = crypto
      .createHash("sha256")
      .update(refreshTokenPlain)
      .digest("hex");

    const refreshExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    await prisma.mobileRefreshToken.create({
      data: {
        userId: mobileUser.id,
        tokenHash: refreshTokenHash,
        deviceId: req.body.deviceInfo || null,
        userAgent: req.headers["user-agent"] || null,
        ip: req.ip || req.connection.remoteAddress || null,
        expiresAt: refreshExpiresAt,
      },
    });

    return res.json({
      success: true,
      data: {
        success: true,
        token,
        refreshToken: refreshTokenPlain,
        user: userPayload,
        expiresAt,
      },
    });
  } catch (err: unknown) {
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
 * Body: { refreshToken: string }
 * Response: { success, data: { token, refreshToken, user, expiresAt } }
 */
router.post("/refresh", async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res
        .status(401)
        .json({ success: false, error: "Refresh token required" });
    }

    const tokenHash = crypto
      .createHash("sha256")
      .update(refreshToken)
      .digest("hex");

    const storedToken = await prisma.mobileRefreshToken.findFirst({
      where: {
        tokenHash,
        revokedAt: null,
      },
      include: {
        user: true,
      },
    });

    if (!storedToken) {
      return res
        .status(401)
        .json({ success: false, error: "Invalid refresh token" });
    }

    if (new Date() > storedToken.expiresAt) {
      // Clean up expired token
      await prisma.mobileRefreshToken.delete({
        where: { id: storedToken.id },
      });
      return res
        .status(401)
        .json({ success: false, error: "Refresh token expired" });
    }

    const mobileUser = storedToken.user;

    if (!mobileUser || !mobileUser.isActive) {
      return res
        .status(401)
        .json({ success: false, error: "User not found or inactive" });
    }

    // Resolve role from new mobile_user_roles (fallback to User/level 1)
    const roleRec = mobileUser.mobileRoleId
      ? await prisma.mobileUserRole.findUnique({
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

    // Rotate the refresh token: Delete old, create new
    await prisma.mobileRefreshToken.delete({
      where: { id: storedToken.id },
    });

    const newRefreshTokenPlain = crypto.randomBytes(40).toString("hex");
    const newRefreshTokenHash = crypto
      .createHash("sha256")
      .update(newRefreshTokenPlain)
      .digest("hex");

    const refreshExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    await prisma.mobileRefreshToken.create({
      data: {
        userId: mobileUser.id,
        tokenHash: newRefreshTokenHash,
        deviceId: req.body.deviceInfo || storedToken.deviceId,
        userAgent: req.headers["user-agent"] || storedToken.userAgent,
        ip: req.ip || req.connection.remoteAddress || storedToken.ip,
        expiresAt: refreshExpiresAt,
      },
    });

    return res.json({
      success: true,
      data: {
        success: true,
        token: newToken,
        refreshToken: newRefreshTokenPlain,
        user: userPayload,
        expiresAt,
      },
    });
  } catch (err: unknown) {
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
 * POST /api/mobile/auth/change-password
 * Body: { currentPassword: string, newPassword: string }
 */
router.post("/change-password", authenticateMobile, async (req, res) => {
  try {
    const mobileUser = (req as express.Request & { mobileUser: { id: number } }).mobileUser;
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ success: false, error: "Missing required fields" });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ success: false, error: "New password must be at least 6 characters" });
    }

    // Find full user record to verify current password
    const userRecord = await prisma.mobileUser.findUnique({
      where: { id: mobileUser.id },
    });

    if (!userRecord) {
      return res.status(404).json({ success: false, error: "User not found" });
    }

    const isMatch = await comparePassword(currentPassword, userRecord.passwordHash);
    if (!isMatch) {
      return res.status(400).json({ success: false, error: "Incorrect current password" });
    }

    // Update password
    const hashedNewPassword = await hashPassword(newPassword);
    await prisma.mobileUser.update({
      where: { id: mobileUser.id },
      data: { passwordHash: hashedNewPassword },
    });

    return res.json({ success: true, message: "Password updated successfully" });
  } catch (error) {
    console.error("Change password error:", error);
    return res.status(500).json({ success: false, error: "Failed to change password" });
  }
});

/**
 * POST /api/mobile/auth/logout
 * Body: { refreshToken?: string }
 */
router.post("/logout", async (req, res) => {
  const { refreshToken } = req.body;
  if (refreshToken) {
    try {
      const tokenHash = crypto
        .createHash("sha256")
        .update(refreshToken)
        .digest("hex");

      await prisma.mobileRefreshToken.deleteMany({
        where: { tokenHash },
      });
    } catch (e) {
      console.error("Failed to invalidate refresh token during logout", e);
    }
  }

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
    const mobileUser = await prisma.mobileUser.findFirst({
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
