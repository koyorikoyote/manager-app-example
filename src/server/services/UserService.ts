import bcrypt from "bcrypt";
import { Prisma } from "@prisma/client";
import prisma from "../lib/prisma";
import {
  ValidationError,
  NotFoundError,
  ConflictError,
} from "../middleware/errorHandler";

export interface CreateUserData {
  username: string;
  email: string;
  name: string;
  password: string;
  roleId: number;
  isActive: boolean;
  languagePreference: "EN" | "JA";
}

export interface UpdateUserData {
  username?: string;
  email?: string;
  name?: string;
  password?: string;
  roleId?: number;
  isActive?: boolean;
  languagePreference?: "EN" | "JA";
}

// Additional interfaces expected by the services index
export interface UserFilters {
  search?: string;
  role?: string;
  isActive?: boolean;
  page?: number;
  limit?: number;
}

export type UserCreateData = CreateUserData;
export type UserUpdateData = UpdateUserData;

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface AuthResult {
  user: UserWithRole;
  token: string;
}

export interface SessionData {
  userId: number;
  username: string;
  role: {
    id: number;
    name: string;
    level: number;
  };
}

export interface UserWithRole {
  id: number;
  username: string;
  email: string;
  name: string;
  isActive: boolean;
  languagePreference: "EN" | "JA";
  themePreference: string | null;
  createdAt: Date;
  updatedAt: Date;
  roleId: number;
  role: {
    id: number;
    name: string;
    description: string | null;
    level: number;
    isActive: boolean;
  };
}

export class UserService {
  async getAllUsers(): Promise<UserWithRole[]> {
    try {
      const users = await prisma.user.findMany({
        include: {
          role: true,
        },
        orderBy: { createdAt: "desc" },
      });

      return users;
    } catch (error) {
      console.error("Error fetching all users:", error);
      throw new Error("Failed to fetch users");
    }
  }

  async getUserById(id: number): Promise<UserWithRole> {
    try {
      const user = await prisma.user.findUnique({
        where: { id },
        include: {
          role: true,
        },
      });

      if (!user) {
        throw new NotFoundError("User not found");
      }

      return user;
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      console.error("Error fetching user by ID:", error);
      throw new Error("Failed to fetch user");
    }
  }

  async createUser(data: CreateUserData): Promise<UserWithRole> {
    try {
      // Validate required fields
      if (!data.username || !data.email || !data.password || !data.name) {
        throw new ValidationError(
          "Username, email, password, and name are required fields"
        );
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(data.email)) {
        throw new ValidationError("Invalid email format");
      }

      // Validate password strength
      if (data.password.length < 8) {
        throw new ValidationError("Password must be at least 8 characters long");
      }

      // Hash password
      const passwordHash = await bcrypt.hash(data.password, 12);

      const user = await prisma.user.create({
        data: {
          username: data.username,
          email: data.email,
          passwordHash,
          name: data.name,
          roleId: data.roleId,
          isActive: data.isActive,
          languagePreference: data.languagePreference,
        },
        include: {
          role: true,
        },
      });

      return user;
    } catch (error) {
      if (error instanceof ValidationError) {
        throw error;
      }
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002"
      ) {
        throw new ConflictError("Username or email already exists");
      }
      console.error("Error creating user:", error);
      throw new Error("Failed to create user");
    }
  }

  async updateUser(id: number, data: UpdateUserData): Promise<UserWithRole> {
    try {
      // Validate email format if provided
      if (data.email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(data.email)) {
          throw new ValidationError("Invalid email format");
        }
      }

      // Validate password strength if provided
      if (data.password && data.password.length < 8) {
        throw new ValidationError("Password must be at least 8 characters long");
      }

      // Build update data object
      const updateData: Prisma.UserUpdateInput = {};
      if (data.username !== undefined) updateData.username = data.username;
      if (data.email !== undefined) updateData.email = data.email;
      if (data.name !== undefined) updateData.name = data.name;
      if (data.roleId !== undefined) updateData.role = { connect: { id: data.roleId } };
      if (data.languagePreference !== undefined)
        updateData.languagePreference = data.languagePreference;
      if (data.isActive !== undefined) updateData.isActive = data.isActive;

      // Hash password if provided
      if (data.password) {
        updateData.passwordHash = await bcrypt.hash(data.password, 12);
      }

      const user = await prisma.user.update({
        where: { id },
        data: updateData,
        include: {
          role: true,
        },
      });

      return user;
    } catch (error) {
      if (error instanceof ValidationError) {
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
      console.error("Error updating user:", error);
      throw new Error("Failed to update user");
    }
  }

  async deleteUser(id: number): Promise<void> {
    try {
      // First, expire all active sessions for this user
      await prisma.userSession.updateMany({
        where: {
          userId: id,
          expiresAt: { gt: new Date() },
        },
        data: { expiresAt: new Date() },
      });

      // Then hard delete the user record
      await prisma.user.delete({
        where: { id },
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2025"
      ) {
        throw new NotFoundError("User not found");
      }
      console.error("Error deleting user:", error);
      throw new Error("Failed to delete user");
    }
  }

  async bulkDeleteUsers(ids: number[]): Promise<void> {
    try {
      if (!ids || ids.length === 0) {
        throw new ValidationError("User IDs are required for bulk delete");
      }

      // First, expire all active sessions for these users
      await prisma.userSession.updateMany({
        where: {
          userId: { in: ids },
          expiresAt: { gt: new Date() },
        },
        data: { expiresAt: new Date() },
      });

      // Then hard delete the user records
      await prisma.user.deleteMany({
        where: {
          id: { in: ids },
        },
      });
    } catch (error) {
      if (error instanceof ValidationError) {
        throw error;
      }
      console.error("Error bulk deleting users:", error);
      throw new Error("Failed to bulk delete users");
    }
  }
}

export default new UserService();