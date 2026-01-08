// User management specific types for client-side operations

import { User } from "../../shared/types";

// Define UserWithRole type that matches existing component expectations
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

// Define UserRole type that matches existing component expectations
export interface UserRole {
  id: number;
  name: string;
  description: string | null;
  level: number;
  isActive: boolean;
}

// Create user data interface for form submissions
export interface CreateUserData {
  username: string;
  email: string;
  name: string;
  password: string;
  roleId: number;
  isActive: boolean;
  languagePreference: "EN" | "JA";
}

// Update user data interface for form submissions
export interface UpdateUserData {
  username?: string;
  email?: string;
  name?: string;
  password?: string;
  roleId?: number;
  isActive?: boolean;
  languagePreference?: "EN" | "JA";
}

// Table display data interface for DataTable component
export interface UserTableData extends Record<string, unknown> {
  id: number;
  username: string;
  name: string;
  email: string;
  roleName: string;
  roleLevel: number;
  status: 'Active' | 'Inactive';
  createdAt: string;
}

// Error handling types for user management operations
export interface UserManagementError {
  type: 'validation' | 'network' | 'permission' | 'server';
  message: string;
  field?: string;
  retryable: boolean;
}

// State management types for useUsers hook
export interface UserManagementState {
  users: UserWithRole[];
  filteredUsers: UserWithRole[];
  searchTerm: string;
  selectedRows: Record<string, boolean>;
  selectedUser: UserWithRole | null;
  editingUser: UserWithRole | null;
  isDetailDialogOpen: boolean;
  isFormDialogOpen: boolean;
  availableRoles: UserRole[];
  loading: boolean;
  error: string | null;
}

// User role interface (re-exported from shared types for convenience)
export interface UserRole {
  id: number;
  name: string;
  description: string | null;
  level: number;
  isActive: boolean;
}

// Hook options and result interfaces
export interface UseUsersOptions {
  initialUsers?: UserWithRole[];
  enableSearch?: boolean;
  enableFiltering?: boolean;
}

export interface UseUsersResult {
  // Core data
  users: UserWithRole[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;

  // CRUD operations
  createUser: (data: CreateUserData) => Promise<UserWithRole>;
  updateUser: (id: number, data: UpdateUserData) => Promise<UserWithRole>;
  deleteUser: (id: number) => Promise<void>;
  bulkDeleteUsers: (ids: number[]) => Promise<void>;

  // Loading states for specific operations
  isCreating: boolean;
  isUpdating: boolean;
  isDeleting: boolean;
  isBulkDeleting: boolean;
}

// Service response types
export interface UserServiceResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface BulkDeleteResponse {
  success: boolean;
  message: string;
  deletedCount?: number;
}