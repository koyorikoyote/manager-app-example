import express from "express";
import { z, ZodError } from "zod";
import { userService } from "../services";
import {
  authenticateToken,
  requireUserManagementAccess,
} from "../middleware/auth";
import {
  ValidationError,
  NotFoundError,
} from "../middleware/errorHandler";

const router = express.Router();

// Zod schemas for request validation
const createUserSchema = z.object({
  username: z.string().min(1, "Username is required"),
  email: z.string().email("Invalid email format"),
  name: z.string().min(1, "Name is required"),
  password: z.string().min(8, "Password must be at least 8 characters long"),
  roleId: z.number().int().positive("Role ID must be a positive integer"),
  isActive: z.boolean().default(true),
  languagePreference: z.enum(["EN", "JA"]).default("EN"),
});

const updateUserSchema = z.object({
  username: z.string().min(1).optional(),
  email: z.string().email().optional(),
  name: z.string().min(1).optional(),
  password: z.string().min(8).optional(),
  roleId: z.number().int().positive().optional(),
  isActive: z.boolean().optional(),
  languagePreference: z.enum(["EN", "JA"]).optional(),
});

const bulkDeleteSchema = z.object({
  userIds: z.array(z.number().int().positive()).min(1, "At least one user ID is required"),
});

// GET /api/user-management - Get all users with roles
router.get("/", authenticateToken, requireUserManagementAccess, async (req, res) => {
  try {
    const users = await userService.getAllUsers();
    
    res.json({
      success: true,
      data: users,
    });
  } catch (error) {
    console.error("Error fetching users for management:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch users",
    });
  }
});

// GET /api/user-management/:id - Get user by ID
router.get("/:id", authenticateToken, requireUserManagementAccess, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = parseInt(id);

    if (isNaN(userId)) {
      throw new ValidationError("Invalid user ID");
    }

    const user = await userService.getUserById(userId);
    
    res.json({
      success: true,
      data: user,
    });
  } catch (error) {
    if (error instanceof ValidationError || error instanceof NotFoundError) {
      throw error;
    }
    console.error("Error fetching user for management:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch user",
    });
  }
});

// POST /api/user-management - Create new user
router.post("/", authenticateToken, requireUserManagementAccess, async (req, res) => {
  try {
    const validatedData = createUserSchema.parse(req.body);
    
    // Prevent self-deletion protection: ensure current user cannot be affected
    if (req.user!.id === validatedData.roleId) {
      throw new ValidationError("Cannot modify your own account through user management");
    }

    const user = await userService.createUser(validatedData);
    
    res.status(201).json({
      success: true,
      data: user,
      message: "User created successfully",
    });
  } catch (error) {
    if (error instanceof ZodError) {
      throw new ValidationError(error.issues.map((e) => e.message).join(", "));
    }
    if (error instanceof ValidationError) {
      throw error;
    }
    console.error("Error creating user:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create user",
    });
  }
});

// PUT /api/user-management/:id - Update user
router.put("/:id", authenticateToken, requireUserManagementAccess, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = parseInt(id);

    if (isNaN(userId)) {
      throw new ValidationError("Invalid user ID");
    }

    // Prevent self-modification through user management
    if (req.user!.id === userId) {
      throw new ValidationError("Cannot modify your own account through user management");
    }

    const validatedData = updateUserSchema.parse(req.body);
    const user = await userService.updateUser(userId, validatedData);
    
    res.json({
      success: true,
      data: user,
      message: "User updated successfully",
    });
  } catch (error) {
    if (error instanceof ZodError) {
      throw new ValidationError(error.issues.map((e) => e.message).join(", "));
    }
    if (error instanceof ValidationError || error instanceof NotFoundError) {
      throw error;
    }
    console.error("Error updating user:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update user",
    });
  }
});

// DELETE /api/user-management/:id - Delete user (soft delete)
router.delete("/:id", authenticateToken, requireUserManagementAccess, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = parseInt(id);

    if (isNaN(userId)) {
      throw new ValidationError("Invalid user ID");
    }

    // Prevent self-deletion
    if (req.user!.id === userId) {
      throw new ValidationError("Cannot delete your own account");
    }

    await userService.deleteUser(userId);
    
    res.json({
      success: true,
      message: "User deleted successfully",
    });
  } catch (error) {
    if (error instanceof ValidationError || error instanceof NotFoundError) {
      throw error;
    }
    console.error("Error deleting user:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete user",
    });
  }
});

// POST /api/user-management/bulk-delete - Bulk delete users
router.post("/bulk-delete", authenticateToken, requireUserManagementAccess, async (req, res) => {
  try {
    const validatedData = bulkDeleteSchema.parse(req.body);
    const { userIds } = validatedData;

    // Prevent self-deletion in bulk operation
    if (userIds.includes(req.user!.id)) {
      throw new ValidationError("Cannot delete your own account in bulk operation");
    }

    await userService.bulkDeleteUsers(userIds);
    
    res.json({
      success: true,
      message: `Successfully deleted ${userIds.length} users`,
    });
  } catch (error) {
    if (error instanceof ZodError) {
      throw new ValidationError(error.issues.map((e) => e.message).join(", "));
    }
    if (error instanceof ValidationError) {
      throw error;
    }
    console.error("Error bulk deleting users:", error);
    res.status(500).json({
      success: false,
      message: "Failed to bulk delete users",
    });
  }
});

export default router;