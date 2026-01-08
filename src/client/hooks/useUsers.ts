import { useState, useEffect, useCallback } from "react";
import { userService } from "../services/userService";
import { useToast } from "../contexts/ToastContext";
import { useLanguage } from "../contexts/LanguageContext";
import { useSSRData } from "../contexts/SSRDataContext";
import {
  UserWithRole,
  CreateUserData,
  UpdateUserData,
  UseUsersOptions,
  UseUsersResult,
} from "../types/user";

export const useUsers = (options: UseUsersOptions = {}): UseUsersResult => {
  const [users, setUsers] = useState<UserWithRole[]>(options.initialUsers || []);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Specific loading states for different operations
  const [isCreating, setIsCreating] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);

  const { showSuccess, showError } = useToast();
  const { t } = useLanguage();
  const { getInitialData } = useSSRData();

  /**
   * Fetch all users from the API
   */
  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const fetchedUsers = await userService.getAllUsers();
      setUsers(fetchedUsers);
    } catch (err) {
      const errorMessage = err instanceof Error 
        ? err.message 
        : t("common.feedback.operationFailed");
      setError(errorMessage);
      showError(t("userManagement.title"), errorMessage);
    } finally {
      setLoading(false);
    }
  }, [showError, t]);

  /**
   * Create a new user
   */
  const createUser = useCallback(
    async (userData: CreateUserData): Promise<UserWithRole> => {
      setIsCreating(true);
      setError(null);

      try {
        const newUser = await userService.createUser(userData);
        setUsers(prev => [...prev, newUser]);
        showSuccess(
          t("common.feedback.itemCreated"),
          `${userData.name} has been added to the user list`
        );
        return newUser;
      } catch (err) {
        const errorMessage = err instanceof Error 
          ? err.message 
          : t("common.feedback.operationFailed");
        setError(errorMessage);
        showError(t("userManagement.title"), errorMessage);
        throw err;
      } finally {
        setIsCreating(false);
      }
    },
    [showSuccess, showError, t]
  );

  /**
   * Update an existing user
   */
  const updateUser = useCallback(
    async (id: number, userData: UpdateUserData): Promise<UserWithRole> => {
      setIsUpdating(true);
      setError(null);

      try {
        const updatedUser = await userService.updateUser(id, userData);
        setUsers(prev => prev.map(user => user.id === id ? updatedUser : user));
        showSuccess(
          t("common.feedback.itemUpdated"),
          `${updatedUser.name} has been updated`
        );
        return updatedUser;
      } catch (err) {
        const errorMessage = err instanceof Error 
          ? err.message 
          : t("common.feedback.operationFailed");
        setError(errorMessage);
        showError(t("userManagement.title"), errorMessage);
        throw err;
      } finally {
        setIsUpdating(false);
      }
    },
    [showSuccess, showError, t]
  );

  /**
   * Delete a single user
   */
  const deleteUser = useCallback(
    async (id: number): Promise<void> => {
      setIsDeleting(true);
      setError(null);

      try {
        await userService.deleteUser(id);
        setUsers(prev => {
          const userToDelete = prev.find(user => user.id === id);
          const filteredUsers = prev.filter(user => user.id !== id);
          
          // Show success message with user name if found
          if (userToDelete) {
            showSuccess(
              t("common.feedback.itemDeleted"),
              `${userToDelete.name} has been removed`
            );
          } else {
            showSuccess(t("common.feedback.itemDeleted"));
          }
          
          return filteredUsers;
        });
      } catch (err) {
        const errorMessage = err instanceof Error 
          ? err.message 
          : t("common.feedback.operationFailed");
        setError(errorMessage);
        showError(t("userManagement.title"), errorMessage);
        throw err;
      } finally {
        setIsDeleting(false);
      }
    },
    [showSuccess, showError, t]
  );

  /**
   * Bulk delete multiple users
   */
  const bulkDeleteUsers = useCallback(
    async (ids: number[]): Promise<void> => {
      setIsBulkDeleting(true);
      setError(null);

      try {
        const result = await userService.bulkDeleteUsers(ids);
        setUsers(prev => prev.filter(user => !ids.includes(user.id)));
        showSuccess(
          t("common.feedback.itemsDeleted"),
          result.message || `Successfully deleted ${ids.length} users`
        );
      } catch (err) {
        const errorMessage = err instanceof Error 
          ? err.message 
          : t("common.feedback.operationFailed");
        setError(errorMessage);
        showError(t("userManagement.title"), errorMessage);
        throw err;
      } finally {
        setIsBulkDeleting(false);
      }
    },
    [showSuccess, showError, t]
  );

  // Initial data loading
  useEffect(() => {
    // Check if we have initial data from options or SSR
    const hasInitialData = options.initialUsers && options.initialUsers.length > 0;
    const ssrData = getInitialData();
    const ssrUsers = (ssrData as { users?: UserWithRole[] })?.users;
    const hasSSRData = ssrUsers && ssrUsers.length > 0;

    if (hasSSRData && !hasInitialData) {
      // Use SSR data if available and no initial data provided
      setUsers(ssrUsers);
    } else if (!hasInitialData && !hasSSRData) {
      // Fetch data if no initial data or SSR data available
      refetch();
    }
  }, [options.initialUsers, refetch, getInitialData]);

  return {
    // Core data
    users,
    loading,
    error,
    refetch,

    // CRUD operations
    createUser,
    updateUser,
    deleteUser,
    bulkDeleteUsers,

    // Loading states for specific operations
    isCreating,
    isUpdating,
    isDeleting,
    isBulkDeleting,
  };
};