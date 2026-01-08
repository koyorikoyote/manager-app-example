import express from "express";
import bcrypt from "bcrypt";
import { Prisma } from "@prisma/client";
import prisma from "../lib/prisma";
import { authenticateToken, requireAdmin } from "../middleware/auth";
import { ValidationError, NotFoundError } from "../middleware/errorHandler";

const router = express.Router();

// GET /api/mobile-users - Get all mobile users
router.get("/", authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { search, isActive = "true", page = "1", limit = "100" } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    const where: Prisma.MobileUserWhereInput = {};

    if (isActive !== "all") {
      where.isActive = isActive === "true";
    }

    if (search && typeof search === "string") {
      where.OR = [
        { username: { contains: search } },
        { email: { contains: search } },
        { displayName: { contains: search } },
      ];
    }

    const total = await prisma.mobileUser.count({ where });

    const mobileUsers = await prisma.mobileUser.findMany({
      where,
      select: {
        id: true,
        username: true,
        email: true,
        displayName: true,
        phone: true,
        isActive: true,
        mobileRoleId: true,
        staffId: true,
        userId: true,
        createdAt: true,
        updatedAt: true,
        mobileRole: {
          select: {
            id: true,
            name: true,
            level: true,
          },
        },
        staff: {
          select: {
            id: true,
            name: true,
            employeeId: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: limitNum,
    });

    res.json({
      success: true,
      data: mobileUsers,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    console.error("Error fetching mobile users:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch mobile users",
    });
  }
});

// GET /api/mobile-users/:id - Get mobile user by ID
router.get("/:id", authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = parseInt(id);

    if (isNaN(userId)) {
      throw new ValidationError("Invalid mobile user ID");
    }

    const mobileUser = await prisma.mobileUser.findUnique({
      where: { id: userId },
      select: {
        id: true,
        username: true,
        email: true,
        displayName: true,
        phone: true,
        isActive: true,
        mobileRoleId: true,
        staffId: true,
        userId: true,
        createdAt: true,
        updatedAt: true,
        mobileRole: {
          select: {
            id: true,
            name: true,
            level: true,
          },
        },
        staff: {
          select: {
            id: true,
            name: true,
            employeeId: true,
            position: true,
            department: true,
          },
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (!mobileUser) {
      throw new NotFoundError("Mobile user not found");
    }

    res.json({
      success: true,
      data: mobileUser,
    });
  } catch (error) {
    console.error("Error fetching mobile user:", error);
    if (error instanceof ValidationError || error instanceof NotFoundError) {
      throw error;
    }
    res.status(500).json({
      success: false,
      message: "Failed to fetch mobile user",
    });
  }
});

// POST /api/mobile-users - Create new mobile user
router.post("/", authenticateToken, requireAdmin, async (req, res) => {
  try {
    const {
      username,
      email,
      password,
      displayName,
      phone,
      mobileRoleId,
      staffId,
      userId,
      isActive = true,
    } = req.body;

    if (!username || !email || !password) {
      throw new ValidationError("Username, email, and password are required");
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new ValidationError("Invalid email format");
    }

    if (password.length < 8) {
      throw new ValidationError("Password must be at least 8 characters long");
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const mobileUser = await prisma.mobileUser.create({
      data: {
        username,
        email,
        passwordHash,
        displayName,
        phone,
        mobileRoleId,
        staffId,
        userId,
        isActive,
      },
      select: {
        id: true,
        username: true,
        email: true,
        displayName: true,
        phone: true,
        isActive: true,
        mobileRoleId: true,
        staffId: true,
        userId: true,
        createdAt: true,
        updatedAt: true,
        mobileRole: {
          select: {
            id: true,
            name: true,
            level: true,
          },
        },
        staff: {
          select: {
            id: true,
            name: true,
            employeeId: true,
          },
        },
      },
    });

    res.status(201).json({
      success: true,
      data: mobileUser,
      message: "Mobile user created successfully",
    });
  } catch (error) {
    console.error("Error creating mobile user:", error);
    if (error instanceof ValidationError) {
      throw error;
    }
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      res.status(409).json({
        success: false,
        message: "Username or email already exists",
      });
      return;
    }
    res.status(500).json({
      success: false,
      message: "Failed to create mobile user",
    });
  }
});

// PUT /api/mobile-users/:id - Update mobile user
router.put("/:id", authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = parseInt(id);

    if (isNaN(userId)) {
      throw new ValidationError("Invalid mobile user ID");
    }

    const {
      username,
      email,
      displayName,
      phone,
      mobileRoleId,
      staffId,
      isActive,
      newPassword,
    } = req.body;

    if (email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        throw new ValidationError("Invalid email format");
      }
    }

    const updateData: Prisma.MobileUserUpdateInput = {};
    if (username !== undefined) updateData.username = username;
    if (email !== undefined) updateData.email = email;
    if (displayName !== undefined) updateData.displayName = displayName;
    if (phone !== undefined) updateData.phone = phone;
    if (mobileRoleId !== undefined) {
      updateData.mobileRole = mobileRoleId
        ? { connect: { id: mobileRoleId } }
        : { disconnect: true };
    }
    if (staffId !== undefined) {
      updateData.staff = staffId
        ? { connect: { id: staffId } }
        : { disconnect: true };
    }
    if (isActive !== undefined) updateData.isActive = isActive;

    if (newPassword) {
      if (newPassword.length < 8) {
        throw new ValidationError(
          "New password must be at least 8 characters long"
        );
      }

      updateData.passwordHash = await bcrypt.hash(newPassword, 12);
    }

    const mobileUser = await prisma.mobileUser.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        username: true,
        email: true,
        displayName: true,
        phone: true,
        isActive: true,
        mobileRoleId: true,
        staffId: true,
        userId: true,
        createdAt: true,
        updatedAt: true,
        mobileRole: {
          select: {
            id: true,
            name: true,
            level: true,
          },
        },
        staff: {
          select: {
            id: true,
            name: true,
            employeeId: true,
          },
        },
      },
    });

    res.json({
      success: true,
      data: mobileUser,
      message: "Mobile user updated successfully",
    });
  } catch (error) {
    console.error("Error updating mobile user:", error);
    if (error instanceof ValidationError || error instanceof NotFoundError) {
      throw error;
    }
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2025") {
        throw new NotFoundError("Mobile user not found");
      }
      if (error.code === "P2002") {
        res.status(409).json({
          success: false,
          message: "Username or email already exists",
        });
        return;
      }
    }
    res.status(500).json({
      success: false,
      message: "Failed to update mobile user",
    });
  }
});

// DELETE /api/mobile-users/:id - Delete mobile user
router.delete("/:id", authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = parseInt(id);

    if (isNaN(userId)) {
      throw new ValidationError("Invalid mobile user ID");
    }

    await prisma.mobileUser.delete({
      where: { id: userId },
    });

    res.json({
      success: true,
      message: "Mobile user deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting mobile user:", error);
    if (error instanceof ValidationError) {
      throw error;
    }
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2025"
    ) {
      throw new NotFoundError("Mobile user not found");
    }
    res.status(500).json({
      success: false,
      message: "Failed to delete mobile user",
    });
  }
});

// POST /api/mobile-users/bulk-delete - Bulk delete mobile users
router.post(
  "/bulk-delete",
  authenticateToken,
  requireAdmin,
  async (req, res) => {
    try {
      const { ids } = req.body;

      if (!Array.isArray(ids) || ids.length === 0) {
        throw new ValidationError("Invalid or empty IDs array");
      }

      const result = await prisma.mobileUser.deleteMany({
        where: {
          id: {
            in: ids,
          },
        },
      });

      res.json({
        success: true,
        message: `${result.count} mobile users deleted successfully`,
        count: result.count,
      });
    } catch (error) {
      console.error("Error bulk deleting mobile users:", error);
      if (error instanceof ValidationError) {
        throw error;
      }
      res.status(500).json({
        success: false,
        message: "Failed to delete mobile users",
      });
    }
  }
);

// GET /api/mobile-users/roles/list - Get all mobile user roles
router.get("/roles/list", authenticateToken, requireAdmin, async (req, res) => {
  try {
    const roles = await prisma.mobileUserRole.findMany({
      select: {
        id: true,
        name: true,
        level: true,
      },
      orderBy: { level: "asc" },
    });

    res.json({
      success: true,
      data: roles,
    });
  } catch (error) {
    console.error("Error fetching mobile user roles:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch mobile user roles",
    });
  }
});

export default router;
