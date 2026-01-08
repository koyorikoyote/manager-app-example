import { Router, Request, Response } from "express";
import bcrypt from "bcrypt";
import crypto from "crypto";
import prisma from "../lib/prisma";
import { generateToken, authenticateToken } from "../middleware/auth";
import { validateRequest, authSchemas } from "../middleware/validation";

const router = Router();

// Login endpoint
router.post(
  "/login",
  validateRequest({ body: authSchemas.login }),
  async (req: Request, res: Response) => {
    try {
      const { id, password } = req.body;

      // Find user by username using Prisma
      const user = await prisma.user.findFirst({
        where: {
          OR: [{ username: id }, { email: id }],
          isActive: true,
        },
        include: {
          role: true,
        },
      });

      if (!user) {
        return res.status(401).json({
          success: false,
          message: "Invalid credentials",
        });
      }

      // Validate password
      const isValidPassword = await bcrypt.compare(password, user.passwordHash);
      if (!isValidPassword) {
        return res.status(401).json({
          success: false,
          message: "Invalid credentials",
        });
      }

      // Generate JWT token
      const token = generateToken(user);

      // Create user session record with SHA-256 hash (deterministic)
      const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
      await prisma.userSession.create({
        data: {
          userId: user.id,
          tokenHash,
          deviceInfo: req.headers["user-agent"] || null,
          ipAddress: req.ip || req.connection.remoteAddress || null,
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
        },
      });

      // Return user data without password
      const { passwordHash, ...userWithoutPassword } = user;

      res.json({
        success: true,
        message: "Login successful",
        token,
        user: userWithoutPassword,
      });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  }
);

// Token verification endpoint
router.get(
  "/verify",
  authenticateToken,
  async (req: Request, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: "User not found",
        });
      }

      // Return user data without password (user is already fetched in middleware)
      const { passwordHash, ...userWithoutPassword } = req.user;
      res.json({
        success: true,
        user: userWithoutPassword,
      });
    } catch (error) {
      console.error("Token verification error:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  }
);

// Logout endpoint
router.post(
  "/logout",
  authenticateToken,
  async (req: Request, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: "User not found",
        });
      }

      // Get token from header
      const authHeader = req.headers["authorization"];
      const token = authHeader && authHeader.split(" ")[1];

      if (token) {
        // Remove user session from database using SHA-256 hash
        const tokenHash = crypto
          .createHash("sha256")
          .update(token)
          .digest("hex");
        await prisma.userSession.deleteMany({
          where: {
            userId: req.user.id,
            tokenHash: tokenHash,
          },
        });
      }

      res.json({
        success: true,
        message: "Logout successful",
      });
    } catch (error) {
      console.error("Logout error:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  }
);

// Get current user profile
router.get(
  "/profile",
  authenticateToken,
  async (req: Request, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: "User not found",
        });
      }

      // Return user data without password
      const { passwordHash, ...userWithoutPassword } = req.user;
      res.json({
        success: true,
        user: userWithoutPassword,
      });
    } catch (error) {
      console.error("Profile fetch error:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  }
);

export default router;
