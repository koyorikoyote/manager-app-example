import { apiClient } from "./apiClient";
import {
  UserWithRole,
  CreateUserData,
  UpdateUserData,
  BulkDeleteResponse,
} from "../types/user";

const API_BASE = "/user-management";

class UserService {
  /**
   * Get all users with their roles
   */
  async getAllUsers(): Promise<UserWithRole[]> {
    const result = await apiClient.get<UserWithRole[]>(API_BASE);
    return result.data || [];
  }

  /**
   * Get a specific user by ID
   */
  async getUserById(id: number): Promise<UserWithRole> {
    const result = await apiClient.get<UserWithRole>(`${API_BASE}/${id}`);

    if (!result.data) {
      throw new Error("User not found");
    }

    return result.data;
  }

  /**
   * Create a new user
   */
  async createUser(userData: CreateUserData): Promise<UserWithRole> {
    const result = await apiClient.post<UserWithRole>(API_BASE, userData);

    if (!result.data) {
      throw new Error("Failed to create user");
    }

    return result.data;
  }

  /**
   * Update an existing user
   */
  async updateUser(
    id: number,
    userData: UpdateUserData
  ): Promise<UserWithRole> {
    const result = await apiClient.put<UserWithRole>(
      `${API_BASE}/${id}`,
      userData
    );

    if (!result.data) {
      throw new Error("Failed to update user");
    }

    return result.data;
  }

  /**
   * Delete a user (soft delete)
   */
  async deleteUser(id: number): Promise<void> {
    await apiClient.delete<void>(`${API_BASE}/${id}`);
  }

  /**
   * Bulk delete multiple users
   */
  async bulkDeleteUsers(userIds: number[]): Promise<BulkDeleteResponse> {
    const result = await apiClient.post<{
      success: boolean;
      message: string;
      deletedCount?: number;
    }>(`${API_BASE}/bulk-delete`, { userIds });

    // The server returns the response in the data field, but also has success/message at root level
    return {
      success: result.success || (result.data?.success ?? false),
      message: result.message || result.data?.message || "Bulk delete failed",
      deletedCount: result.data?.deletedCount,
    };
  }

  /**
   * Transform user data for table display
   */
  transformUserListForTable(users: UserWithRole[]) {
    return users.map((user) => ({
      id: user.id,
      username: user.username,
      name: user.name,
      email: user.email,
      roleName: user.role.name,
      roleLevel: user.role.level,
      status: user.isActive ? ("Active" as const) : ("Inactive" as const),
      createdAt: new Date(user.createdAt).toLocaleDateString(),
    }));
  }

  /**
   * Get available user roles (helper method for forms)
   */
  async getAvailableRoles() {
    // This would typically be a separate endpoint, but for now we can extract from users
    // In a real implementation, you might want a dedicated /roles endpoint
    const users = await this.getAllUsers();
    const rolesMap = new Map();

    users.forEach((user) => {
      if (!rolesMap.has(user.role.id)) {
        rolesMap.set(user.role.id, user.role);
      }
    });

    return Array.from(rolesMap.values()).filter((role) => role.isActive);
  }
}

export const userService = new UserService();
