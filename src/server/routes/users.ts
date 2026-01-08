import express from "express";
import bcrypt from "bcrypt";
import { Prisma } from "@prisma/client";
import prisma from "../lib/prisma";
import {
  authenticateToken,
  requireAdmin,
  requireSuperAdmin,
} from "../middleware/auth";
import {
  ValidationError,
  NotFoundError,
  ConflictError,
} from "../middleware/errorHandler";

const router = express.Router();

// GET /api/users - Get all users with filtering and pagination
router.get("/", authenticateToken, requireAdmin, async (req, res) => {
  try {
    const {
      search,
      role,
      isActive = "true",
      page = "1",
      limit = "10",
    } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    // Build where clause for filtering
    const where: Prisma.UserWhereInput = {};

    if (role && typeof role === "string" && role !== "ALL") {
      where.role = {
        name: role,
      };
    }

    if (isActive !== "all") {
      where.isActive = isActive === "true";
    }

    if (search && typeof search === "string") {
      where.OR = [
        { name: { contains: search } },
        { email: { contains: search } },
      ];
    }

    // Get total count for pagination
    const total = await prisma.user.count({ where });

    // Get users with pagination (exclude password hash)
    const users = await prisma.user.findMany({
      where,
      select: {
        id: true,
        username: true,
        email: true,
        name: true,
        role: {
          select: {
            id: true,
            name: true,
            level: true,
          },
        },
        isActive: true,
        languagePreference: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            managedProperties: true,
            staffRecords: true,
            systemConfigs: true,
            sessions: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: limitNum,
    });

    res.json({
      success: true,
      data: users,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch users",
    });
  }
});

// GET /api/users/:id - Get user by ID
router.get("/:id", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = parseInt(id);

    if (isNaN(userId)) {
      throw new ValidationError("Invalid user ID");
    }

    // Check if user is requesting their own data or is admin
    if (req.user!.id !== userId && req.user!.role.name === "USER") {
      return res.status(403).json({
        success: false,
        message: "Access denied. You can only view your own profile.",
      });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        username: true,
        email: true,
        name: true,
        role: {
          select: {
            id: true,
            name: true,
            level: true,
          },
        },
        isActive: true,
        languagePreference: true,
        createdAt: true,
        updatedAt: true,
        managedProperties: {
          select: { id: true, name: true, propertyCode: true, status: true },
        },
        staffRecords: {
          select: {
            id: true,
            name: true,
            employeeId: true,
            position: true,
            status: true,
          },
        },
        systemConfigs: {
          select: { id: true, key: true, category: true, isActive: true },
          take: 5,
          orderBy: { updatedAt: "desc" },
        },
        sessions: {
          select: {
            id: true,
            deviceInfo: true,
            createdAt: true,
            expiresAt: true,
          },
          where: { expiresAt: { gt: new Date() } },
          orderBy: { createdAt: "desc" },
          take: 5,
        },
      },
    });

    if (!user) {
      throw new NotFoundError("User not found");
    }

    res.json({
      success: true,
      data: user,
    });
  } catch (error) {
    console.error("Error fetching user:", error);
    if (error instanceof ValidationError || error instanceof NotFoundError) {
      throw error;
    }
    res.status(500).json({
      success: false,
      message: "Failed to fetch user",
    });
  }
});

// POST /api/users - Create new user
router.post("/", authenticateToken, requireAdmin, async (req, res) => {
  try {
    const {
      username,
      email,
      password,
      name,
      role = "USER",
      languagePreference = "EN",
    } = req.body;

    // Validate required fields
    if (!username || !email || !password || !name) {
      throw new ValidationError(
        "Username, email, password, and name are required fields"
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new ValidationError("Invalid email format");
    }

    // Validate password strength
    if (password.length < 8) {
      throw new ValidationError("Password must be at least 8 characters long");
    }

    // Validate role
    const validRoles = ["USER", "ADMIN", "SUPER_ADMIN"];
    if (!validRoles.includes(role)) {
      throw new ValidationError(
        "Invalid role. Must be one of: " + validRoles.join(", ")
      );
    }

    // Get role ID for the specified role
    let roleId: number;
    if (role === "USER") roleId = 1;
    else if (role === "ADMIN") roleId = 2;
    else if (role === "SUPER_ADMIN") roleId = 3;
    else throw new ValidationError("Invalid role");

    // Only super admin can create super admin users
    if (role === "SUPER_ADMIN" && req.user!.role.name !== "SUPER_ADMIN") {
      throw new ValidationError(
        "Only super admin can create super admin users"
      );
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
      data: {
        username,
        email,
        passwordHash,
        name,
        role: { connect: { id: roleId } },
        languagePreference,
        isActive: true,
      },
      select: {
        id: true,
        username: true,
        email: true,
        name: true,
        role: {
          select: {
            id: true,
            name: true,
            level: true,
          },
        },
        isActive: true,
        languagePreference: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    res.status(201).json({
      success: true,
      data: user,
      message: "User created successfully",
    });
  } catch (error) {
    console.error("Error creating user:", error);
    if (error instanceof ValidationError) {
      throw error;
    }
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      throw new ConflictError("Username or email already exists");
    }
    res.status(500).json({
      success: false,
      message: "Failed to create user",
    });
  }
});

// PUT /api/users/:id - Update user
router.put("/:id", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = parseInt(id);

    if (isNaN(userId)) {
      throw new ValidationError("Invalid user ID");
    }

    // Check permissions: users can update their own profile, admins can update any user
    const isOwnProfile = req.user!.id === userId;
    const isAdmin =
      req.user!.role.name === "ADMIN" || req.user!.role.name === "SUPER_ADMIN";

    if (!isOwnProfile && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: "Access denied. You can only update your own profile.",
      });
    }

    const {
      username,
      email,
      name,
      role,
      languagePreference,
      isActive,
      currentPassword,
      newPassword,
    } = req.body;

    // Validate email format if provided
    if (email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        throw new ValidationError("Invalid email format");
      }
    }

    // Role updates require admin privileges
    if (role !== undefined && !isAdmin) {
      throw new ValidationError("Only administrators can change user roles");
    }

    // Only super admin can create/modify super admin users
    if (role === "SUPER_ADMIN" && req.user!.role.name !== "SUPER_ADMIN") {
      throw new ValidationError("Only super admin can assign super admin role");
    }

    // isActive updates require admin privileges
    if (isActive !== undefined && !isAdmin) {
      throw new ValidationError(
        "Only administrators can change user active status"
      );
    }

    // Build update data object
    const updateData: Prisma.UserUpdateInput = {};
    if (username !== undefined) updateData.username = username;
    if (email !== undefined) updateData.email = email;
    if (name !== undefined) updateData.name = name;
    if (role !== undefined) {
      let roleId: number;
      if (role === "USER") roleId = 1;
      else if (role === "ADMIN") roleId = 2;
      else if (role === "SUPER_ADMIN") roleId = 3;
      else throw new ValidationError("Invalid role");
      updateData.role = { connect: { id: roleId } };
    }
    if (languagePreference !== undefined)
      updateData.languagePreference = languagePreference;
    if (isActive !== undefined) updateData.isActive = isActive;

    // Handle password change
    if (newPassword) {
      if (!currentPassword && isOwnProfile) {
        throw new ValidationError(
          "Current password is required to change password"
        );
      }

      // Validate new password strength
      if (newPassword.length < 8) {
        throw new ValidationError(
          "New password must be at least 8 characters long"
        );
      }

      // Verify current password if user is changing their own password
      if (isOwnProfile) {
        const currentUser = await prisma.user.findUnique({
          where: { id: userId },
          select: { passwordHash: true },
        });

        if (!currentUser) {
          throw new NotFoundError("User not found");
        }

        const isValidPassword = await bcrypt.compare(
          currentPassword,
          currentUser.passwordHash
        );
        if (!isValidPassword) {
          throw new ValidationError("Current password is incorrect");
        }
      }

      // Hash new password
      updateData.passwordHash = await bcrypt.hash(newPassword, 12);
    }

    const user = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        username: true,
        email: true,
        name: true,
        role: {
          select: {
            id: true,
            name: true,
            level: true,
          },
        },
        isActive: true,
        languagePreference: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    res.json({
      success: true,
      data: user,
      message: "User updated successfully",
    });
  } catch (error) {
    console.error("Error updating user:", error);
    if (error instanceof ValidationError || error instanceof NotFoundError) {
      throw error;
    }
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2025") {
        throw new NotFoundError("User not found");
      }
      if (error.code === "P2002") {
        throw new ConflictError("Username or email already exists");
      }
    }
    res.status(500).json({
      success: false,
      message: "Failed to update user",
    });
  }
});

// DELETE /api/users/:id - Soft delete user (set isActive to false)
router.delete(
  "/:id",
  authenticateToken,
  requireSuperAdmin,
  async (req, res) => {
    try {
      const { id } = req.params;
      const userId = parseInt(id);

      if (isNaN(userId)) {
        throw new ValidationError("Invalid user ID");
      }

      // Prevent self-deletion
      if (req.user!.id === userId) {
        throw new ValidationError("You cannot delete your own account");
      }

      // Also expire all active sessions for this user
      await prisma.userSession.updateMany({
        where: {
          userId,
          expiresAt: { gt: new Date() },
        },
        data: { expiresAt: new Date() },
      });

      res.json({
        success: true,
        message: "User deactivated successfully",
      });
    } catch (error) {
      console.error("Error deactivating user:", error);
      if (error instanceof ValidationError) {
        throw error;
      }
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2025"
      ) {
        throw new NotFoundError("User not found");
      }
      res.status(500).json({
        success: false,
        message: "Failed to deactivate user",
      });
    }
  }
);

// POST /api/users/:id/activate - Reactivate user
router.post(
  "/:id/activate",
  authenticateToken,
  requireAdmin,
  async (req, res) => {
    try {
      const { id } = req.params;
      const userId = parseInt(id);

      if (isNaN(userId)) {
        throw new ValidationError("Invalid user ID");
      }

      const user = await prisma.user.update({
        where: { id: userId },
        data: { isActive: true },
        select: {
          id: true,
          username: true,
          name: true,
          isActive: true,
        },
      });

      res.json({
        success: true,
        data: user,
        message: "User activated successfully",
      });
    } catch (error) {
      console.error("Error activating user:", error);
      if (error instanceof ValidationError) {
        throw error;
      }
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2025"
      ) {
        throw new NotFoundError("User not found");
      }
      res.status(500).json({
        success: false,
        message: "Failed to activate user",
      });
    }
  }
);

// GET /api/users/:id/sessions - Get user sessions
router.get("/:id/sessions", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = parseInt(id);

    if (isNaN(userId)) {
      throw new ValidationError("Invalid user ID");
    }

    // Check permissions: users can view their own sessions, admins can view any user's sessions
    const isOwnProfile = req.user!.id === userId;
    const isAdmin =
      req.user!.role.name === "ADMIN" || req.user!.role.name === "SUPER_ADMIN";

    if (!isOwnProfile && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: "Access denied. You can only view your own sessions.",
      });
    }

    const sessions = await prisma.userSession.findMany({
      where: { userId },
      select: {
        id: true,
        deviceInfo: true,
        ipAddress: true,
        createdAt: true,
        expiresAt: true,
      },
      orderBy: { createdAt: "desc" },
    });

    res.json({
      success: true,
      data: sessions,
    });
  } catch (error) {
    console.error("Error fetching user sessions:", error);
    if (error instanceof ValidationError) {
      throw error;
    }
    res.status(500).json({
      success: false,
      message: "Failed to fetch user sessions",
    });
  }
});

// DELETE /api/users/:id/sessions - Revoke all user sessions
router.delete("/:id/sessions", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = parseInt(id);

    if (isNaN(userId)) {
      throw new ValidationError("Invalid user ID");
    }

    // Check permissions: users can revoke their own sessions, admins can revoke any user's sessions
    const isOwnProfile = req.user!.id === userId;
    const isAdmin =
      req.user!.role.name === "ADMIN" || req.user!.role.name === "SUPER_ADMIN";

    if (!isOwnProfile && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: "Access denied. You can only revoke your own sessions.",
      });
    }

    // Expire all active sessions for this user
    await prisma.userSession.updateMany({
      where: {
        userId,
        expiresAt: { gt: new Date() },
      },
      data: { expiresAt: new Date() },
    });

    res.json({
      success: true,
      message: "All user sessions revoked successfully",
    });
  } catch (error) {
    console.error("Error revoking user sessions:", error);
    if (error instanceof ValidationError) {
      throw error;
    }
    res.status(500).json({
      success: false,
      message: "Failed to revoke user sessions",
    });
  }
});

// GET /api/users/me/theme - Get current user's theme preference
router.get("/me/theme", authenticateToken, async (req, res) => {
  try {
    const userId = req.user!.id;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        themePreference: true,
      },
    });

    if (!user) {
      throw new NotFoundError("User not found");
    }

    res.json({
      success: true,
      data: {
        themePreference: user.themePreference || "glass-blue",
      },
    });
  } catch (error) {
    console.error("Error fetching user theme preference:", error);
    if (error instanceof NotFoundError) {
      throw error;
    }
    res.status(500).json({
      success: false,
      message: "Failed to fetch theme preference",
    });
  }
});

// PUT /api/users/me/theme - Update current user's theme preference
router.put("/me/theme", authenticateToken, async (req, res) => {
  try {
    const userId = req.user!.id;
    const { themePreference } = req.body;

    // Validate theme preference
    if (!themePreference || typeof themePreference !== "string") {
      throw new ValidationError(
        "Theme preference is required and must be a string"
      );
    }

    // Validate against available themes
    const validThemes = [
      "light-beige",
      "light-blue",
      "light-silver",
      "glass-blue",
    ];
    if (!validThemes.includes(themePreference)) {
      throw new ValidationError(
        `Invalid theme preference. Must be one of: ${validThemes.join(", ")}`
      );
    }

    const user = await prisma.user.update({
      where: { id: userId },
      data: { themePreference },
      select: {
        id: true,
        themePreference: true,
      },
    });

    res.json({
      success: true,
      data: {
        themePreference: user.themePreference,
      },
      message: "Theme preference updated successfully",
    });
  } catch (error) {
    console.error("Error updating user theme preference:", error);
    if (error instanceof ValidationError) {
      throw error;
    }
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2025"
    ) {
      throw new NotFoundError("User not found");
    }
    res.status(500).json({
      success: false,
      message: "Failed to update theme preference",
    });
  }
});

/**
 * GET /api/users/me/language - Get current user's language preference
 */
router.get("/me/language", authenticateToken, async (req, res) => {
  try {
    const userId = req.user!.id;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        languagePreference: true,
      },
    });

    if (!user) {
      throw new NotFoundError("User not found");
    }

    res.json({
      success: true,
      data: {
        languagePreference: user.languagePreference || "EN",
      },
    });
  } catch (error) {
    console.error("Error fetching user language preference:", error);
    if (error instanceof NotFoundError) {
      throw error;
    }
    res.status(500).json({
      success: false,
      message: "Failed to fetch language preference",
    });
  }
});

/**
 * PUT /api/users/me/language - Update current user's language preference
 */
router.put("/me/language", authenticateToken, async (req, res) => {
  try {
    const userId = req.user!.id;
    const { languagePreference } = req.body as {
      languagePreference?: "EN" | "JA";
    };

    if (languagePreference !== "EN" && languagePreference !== "JA") {
      throw new ValidationError("Language preference must be 'EN' or 'JA'");
    }

    const user = await prisma.user.update({
      where: { id: userId },
      data: { languagePreference },
      select: {
        id: true,
        languagePreference: true,
      },
    });

    res.json({
      success: true,
      data: {
        languagePreference: user.languagePreference,
      },
      message: "Language preference updated successfully",
    });
  } catch (error) {
    console.error("Error updating user language preference:", error);
    if (error instanceof ValidationError) {
      throw error;
    }
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2025"
    ) {
      throw new NotFoundError("User not found");
    }
    res.status(500).json({
      success: false,
      message: "Failed to update language preference",
    });
  }
});

export default router;
