import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Users, Search } from "lucide-react";
import { Card, CardContent } from "../ui/Card";
import { Button } from "../ui/Button";
import { MobileAwareButton } from "../ui/MobileAwareButton";
import { BackButton } from "../ui/BackButton";
import { Input } from "../ui/Input";
import { createLazyComponent, preloadComponent } from "../../utils/lazyLoading";
import { ViewModeToggle } from "../ui/ViewModeToggle";
import { CardSkeleton } from "../ui/CardSkeleton";
import { CardsPagination } from "../ui/CardsPagination";
import { ConfirmDialog } from "../ui/Dialog";
import { MobileAwareSearchSection } from "../ui/MobileAwareSearchSection";
import { UserDetailDialog } from "../ui/UserDetailDialog";
import { UserFormDialog } from "../ui/UserFormDialog";
import { useLanguage } from "../../contexts/LanguageContext";
import { useGlassBlue } from '../../hooks/useGlassBlue';
import { useAuth } from "../../contexts/AuthContext";
import { useConfirmDialog } from "../../hooks/useConfirmDialog";
import { useViewMode } from "../../hooks/useViewMode";

import { useUsers } from "../../hooks/useUsers";
import { useInitialDataForRoute } from "../../contexts/SSRDataContext";

import {
  createUserColumns,
  transformUserListForTable,
} from "../tables/userColumns";
import type { UserTableData } from "../../types/user";
import type {
  UserWithRole,
  UserRole,
  CreateUserData,
  UpdateUserData,
} from "../../types/user";
import type { RowSelectionState } from "@tanstack/react-table";

const LazyDataTable = createLazyComponent(
  () => import("../ui/DataTable").then(module => ({ default: module.DataTable })),
  "DataTable"
);
const LazyUserCard = createLazyComponent(
  () => import("../ui/UserCard").then(module => ({ default: module.UserCard })),
  "UserCard"
);

export const UserManagement: React.FC = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const isGlassBlue = useGlassBlue();
  const { user: currentUser } = useAuth();
  const {
    dialogState,
    isLoading: isDialogLoading,
    showConfirmDialog,
    hideConfirmDialog,
    handleConfirm,
  } = useConfirmDialog();

  // Dialog states
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [isFormDialogOpen, setIsFormDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserWithRole | null>(null);
  const [editingUser, setEditingUser] = useState<UserWithRole | null>(null);
  const [_availableRoles, _setAvailableRoles] = useState<UserRole[]>([]);

  const [searchTerm, setSearchTerm] = useState<string>("");
  const [selectedRows, setSelectedRows] = useState<RowSelectionState>({});

  // Get initial data from SSR context
  const initialData = useInitialDataForRoute("user-management");

  // Memoize initial users to prevent infinite loops
  const initialUsers = useMemo(() => {
    return initialData?.users || [];
  }, [initialData?.users]);

  // Simple state management for local filtering
  const [data, setData] = useState<UserWithRole[]>([]);
  const [filteredData, setFilteredData] = useState<UserWithRole[]>([]);

  // View mode and pagination for card view
  const { viewMode, setViewMode } = useViewMode("user-management");

  // Preload active view to disable lazy loading for it; keep inactive view lazy
  useEffect(() => {
    if (viewMode === "table") {
      preloadComponent(
        () => import("../ui/DataTable").then(module => ({ default: module.DataTable })),
        "DataTable"
      );
    } else {
      preloadComponent(
        () => import("../ui/UserCard").then(module => ({ default: module.UserCard })),
        "UserCard"
      );
    }
  }, [viewMode]);

  // Use a stable pagination that doesn't cause re-renders
  const [paginationState, setPaginationState] = useState({
    currentPage: 1,
    itemsPerPage: 10,
  });

  const totalPages = Math.ceil(filteredData.length / paginationState.itemsPerPage);
  const startIndex = (paginationState.currentPage - 1) * paginationState.itemsPerPage;
  const endIndex = Math.min(startIndex + paginationState.itemsPerPage, filteredData.length);

  const getPaginatedData = useCallback((data: UserWithRole[]) => {
    return data.slice(startIndex, endIndex);
  }, [startIndex, endIndex]);

  const pagination = {
    currentPage: paginationState.currentPage,
    itemsPerPage: paginationState.itemsPerPage,
    totalPages,
    startIndex,
    endIndex,
    setPage: (page: number) => {
      const clampedPage = Math.max(1, Math.min(page, totalPages));
      setPaginationState(prev => ({ ...prev, currentPage: clampedPage }));
    },
    setItemsPerPage: (itemsPerPage: number) => {
      setPaginationState({ currentPage: 1, itemsPerPage });
    },
    resetToFirstPage: () => {
      setPaginationState(prev => ({ ...prev, currentPage: 1 }));
    },
    getPaginatedData,
  };

  const {
    users,
    loading,
    error,
    refetch,
    createUser,
    updateUser,
    deleteUser,
    bulkDeleteUsers,
    isDeleting,
    isBulkDeleting,
  } = useUsers({
    // Pass initial data to avoid duplicate requests
    initialUsers,
  });

  // Enhanced search filter including translated role labels (EN/JA)
  const filterUsers = useCallback((users: UserWithRole[], query: string) => {
    const term = query.trim().toLowerCase();
    if (!term) return users;

    const translateBoth = (key: string): string[] => {
      if (!key) return [];
      const en = (t as any)(key, { lng: 'en' }) as string;
      const ja = (t as any)(key, { lng: 'ja' }) as string;
      const out: string[] = [];
      if (en && typeof en === 'string' && en !== key) out.push(en.toLowerCase());
      if (ja && typeof ja === 'string' && ja !== key && ja.toLowerCase() !== en?.toLowerCase()) out.push(ja.toLowerCase());
      return out;
    };

    const getRoleLabels = (roleName?: string | null): string[] => {
      if (!roleName) return [];
      const r = String(roleName);
      const upper = r.toUpperCase();
      const lower = r.toLowerCase();
      const labels = new Set<string>();

      // Probe multiple likely namespaces/casings
      const candidates = [
        `userManagement.roles.${upper}`,
        `userManagement.roles.${lower}`,
        `roles.${upper}`,
        `roles.${lower}`,
        `role.${upper}`,
        `role.${lower}`,
        `common.roles.${upper}`,
        `common.roles.${lower}`,
      ];
      for (const k of candidates) {
        for (const v of translateBoth(k)) labels.add(v);
      }

      // Explicit common roles as fallbacks
      switch (upper) {
        case 'ADMIN':
          translateBoth('userManagement.roles.admin').forEach(x => labels.add(x));
          break;
        case 'MANAGER':
          translateBoth('userManagement.roles.manager').forEach(x => labels.add(x));
          break;
        case 'STAFF':
          translateBoth('userManagement.roles.staff').forEach(x => labels.add(x));
          break;
        case 'USER':
          translateBoth('userManagement.roles.user').forEach(x => labels.add(x));
          break;
      }
      return Array.from(labels);
    };

    const includes = (value?: string | number | null): boolean => {
      if (value === null || value === undefined) return false;
      return value.toString().toLowerCase().includes(term);
    };

    return users.filter((user) => {
      return (
        includes(user.name) ||
        includes(user.username) ||
        includes(user.email) ||
        includes(user.role?.name) ||
        // Translated role labels (EN/JA)
        getRoleLabels(user.role?.name).some(v => v.includes(term))
      );
    });
  }, [t]);

  // Update data when users change
  useEffect(() => {
    setData(users);
  }, [users]);

  // Immediate search effect (following DailyRecord pattern)
  useEffect(() => {
    const filtered = filterUsers(data, searchTerm);
    setFilteredData(filtered);
  }, [data, searchTerm, filterUsers]);

  // Handle search input changes (following DailyRecord pattern)
  const handleSearch = (value: string) => {
    setSearchTerm(value);
    // Reset pagination when search changes
    pagination.resetToFirstPage();
  };

  // Handle search confirmation (Enter key or search button)
  const handleSearchConfirm = (value: string) => {
    setSearchTerm(value);
    // Reset pagination when search changes
    pagination.resetToFirstPage();
  };

  // Clear all filters
  const handleClearFilters = useCallback(() => {
    setSearchTerm("");
  }, []);

  // Check if any filters are active
  const filtersActive = useMemo(() => {
    return searchTerm.trim() !== "";
  }, [searchTerm]);

  // Transform data for table
  const tableData = useMemo(() => {
    return transformUserListForTable(filteredData);
  }, [filteredData]);

  // Handle row selection for bulk operations
  const handleRowSelectionChange = useCallback(
    (selection: RowSelectionState) => {
      setSelectedRows(selection);
    },
    []
  );

  // Get selected user IDs for bulk operations
  const selectedUserIds = useMemo(() => {
    return Object.keys(selectedRows)
      .filter((key) => selectedRows[key])
      .map((key) => tableData[parseInt(key)]?.id)
      .filter(Boolean) as number[];
  }, [selectedRows, tableData]);

  // Handle bulk delete
  const handleBulkDelete = useCallback(async () => {
    if (selectedUserIds.length === 0) return;

    // Check if current user is in selection
    const currentUserId = currentUser?.id;
    if (currentUserId && selectedUserIds.includes(currentUserId)) {
      showConfirmDialog({
        title: t("common.actions.delete"),
        message: t("userManagement.confirmations.cannotDeleteSelfMessage"),
        variant: "destructive",
        confirmText: t("common.actions.cancel"),
        cancelText: "",
        onConfirm: async () => {
          // Just close the dialog
        },
      });
      return;
    }

    showConfirmDialog({
      title: t("common.actions.bulkDelete"),
      message: t("userManagement.confirmations.bulkDeleteUsers", {
        count: selectedUserIds.length,
      }),
      variant: "destructive",
      confirmText: t("common.actions.delete"),
      cancelText: t("common.actions.cancel"),
      onConfirm: async () => {
        try {
          await bulkDeleteUsers(selectedUserIds);
          setSelectedRows({});
          // Refresh the data to show updated state
          await refetch();
        } catch (error) {
          console.error("Failed to bulk delete users:", error);
        }
      },
    });
  }, [selectedUserIds, currentUser, showConfirmDialog, t, bulkDeleteUsers, refetch]);

  // Dialog handlers
  const handleOpenDetail = useCallback((user: UserWithRole) => {
    setSelectedUser(user);
    setIsDetailDialogOpen(true);
  }, []);

  const handleCloseDetail = useCallback(() => {
    setIsDetailDialogOpen(false);
    setSelectedUser(null);
  }, []);

  const handleOpenForm = useCallback((user?: UserWithRole) => {
    setEditingUser(user || null);
    setIsFormDialogOpen(true);
  }, []);

  const handleCloseForm = useCallback(() => {
    setIsFormDialogOpen(false);
    setEditingUser(null);
  }, []);

  const handleEdit = useCallback(
    (user: UserWithRole) => {
      handleCloseDetail();
      handleOpenForm(user);
    },
    [handleCloseDetail, handleOpenForm]
  );

  const handleDelete = useCallback(
    async (id: string) => {
      const userToDelete = data.find((u) => u.id === parseInt(id));
      const userName = userToDelete?.name || "this user";

      // Prevent deletion of current user
      if (currentUser && currentUser.id === parseInt(id)) {
        showConfirmDialog({
          title: t("userManagement.confirmations.cannotDeleteSelfTitle"),
          message: t("userManagement.confirmations.cannotDeleteSelfMessage"),
          variant: "destructive",
          confirmText: t("common.actions.cancel"),
          cancelText: "",
          onConfirm: async () => {
            // Just close the dialog
          },
        });
        return;
      }

      showConfirmDialog({
        title: t("common.actions.delete"),
        message: t("userManagement.confirmations.deleteUserWithName", {
          name: userName,
        }),
        variant: "destructive",
        confirmText: t("common.actions.delete"),
        cancelText: t("common.actions.cancel"),
        onConfirm: async () => {
          try {
            await deleteUser(parseInt(id));
            handleCloseDetail();
          } catch (error) {
            console.error("Failed to delete user:", error);
          }
        },
      });
    },
    [t, showConfirmDialog, handleCloseDetail, deleteUser, data, currentUser]
  );

  const handleSubmit = useCallback(
    async (formData: CreateUserData | UpdateUserData) => {
      try {
        if (editingUser) {
          // Update existing user
          await updateUser(editingUser.id, formData as UpdateUserData);
        } else {
          // Create new user
          await createUser(formData as CreateUserData);
        }
        handleCloseForm();
      } catch (error) {
        console.error("Failed to save user:", error);
        // Error handling is done in the useUsers hook
      }
    },
    [editingUser, updateUser, createUser, handleCloseForm]
  );

  const handleTableRowClick = useCallback(
    (userData: UserTableData) => {
      const user = filteredData.find((u) => u.id === userData.id);
      if (user) {
        handleOpenDetail(user);
      }
    },
    [filteredData, handleOpenDetail]
  );

  // Handle card click to open detail dialog
  const handleUserClick = useCallback(
    (user: UserWithRole) => {
      handleOpenDetail(user);
    },
    [handleOpenDetail]
  );

  // Create table columns with navigation handler
  const columns = useMemo(
    () => createUserColumns(handleTableRowClick, true),
    [handleTableRowClick]
  );

  // Show error state
  if (error && !loading && data.length === 0) {
    return (
      <div className="space-y-6 pb-20 md:pb-6">
        <Card>
          <CardContent className="p-12 text-center">
            <Users className="h-12 w-12 text-red-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-secondary-900 mb-2">
              {t("userManagement.messages.loadingError")}
            </h3>
            <p className="text-secondary-600 mb-4">Error: {error}</p>
            <Button onClick={refetch} className="mt-4">
              {t("userManagement.tryAgain")}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-20 md:pb-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <BackButton onBack={() => navigate("/settings")} />
          <h1 className="text-2xl md:text-3xl font-bold text-secondary-900">
            {t("userManagement.title")}
          </h1>
        </div>
      </div>


      {/* Controls with inline Search */}
      <div className="flex items-center gap-2 justify-between">
        <div className="flex items-center space-x-4">
          <ViewModeToggle mode={viewMode} onChange={setViewMode} />
        </div>

        <MobileAwareSearchSection pageName="user-management" className="flex-1">
          <Card className="search-component-spacing">
            <CardContent className="p-2">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-secondary-400" />
                  <Input
                    placeholder={t("userManagement.searchPlaceholder")}
                    value={searchTerm}
                    onChange={(e) => handleSearch(e.target.value)}
                    onKeyDown={(e) =>
                      e.key === "Enter" && handleSearchConfirm(searchTerm)
                    }
                    className="pl-10"
                    size="compact"
                  />
                </div>
                <Button
                  onClick={() => handleSearchConfirm(searchTerm)}
                  size="sm"
                  className={isGlassBlue ? 'glass-blue-search-button' : ''}
                  aria-label={t("userManagement.searchUsers")}
                  disabled={loading}
                >
                  {loading ? (
                    <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full" />
                  ) : (
                    <Search className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </MobileAwareSearchSection>

        <div className="flex items-center gap-2">
          <MobileAwareButton
            variant="delete"
            onClick={handleBulkDelete}
            disabled={selectedUserIds.length === 0 || isBulkDeleting}
            size="sm"
            viewMode={viewMode}
            count={selectedUserIds.length}
            className={
              selectedUserIds.length === 0 || isBulkDeleting ? "opacity-50" : ""
            }
          />
          <MobileAwareButton
            variant="new"
            onClick={() => handleOpenForm()}
            size="sm"
            viewMode={viewMode}
          />
        </div>
      </div>

      {/* User List - Conditional rendering with smooth transitions */}
      <div className="transition-all duration-300 ease-in-out">
        {viewMode === "table" ? (
          <div>
            <LazyDataTable
              columns={columns}
              data={tableData}
              loading={loading}
              error={error}
              onRowClick={handleTableRowClick}
              searchQuery={searchTerm}
              emptyStateMessage={
                filtersActive
                  ? t("userManagement.emptyStates.noSearchResults")
                  : t("userManagement.emptyStates.startByAdding")
              }
              onClearFilters={handleClearFilters}
              hasActiveFilters={filtersActive}
              totalCount={data.length}
              enableColumnFiltering={true}
              tableName="user_management"
              showScrollButtons={true}
              resultsSummary={t("common.pagination.showing", {
                current: filteredData.length,
                total: data.length,
              })}
              loadingText={t("userManagement.loadingUsers")}
              enableRowSelection={true}
              rowSelectionMode="multiple"
              rowSelection={selectedRows}
              onRowSelectionChange={handleRowSelectionChange}
            />
          </div>
        ) : (
          <div>
            {/* Responsive card grid layout */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
              {loading ? (
                Array.from({ length: pagination.itemsPerPage }).map(
                  (_, index) => <CardSkeleton key={index} variant="staff" />
                )
              ) : error ? (
                <div className="col-span-full text-sm text-red-600 bg-red-50 p-3 rounded border border-red-200">
                  {error}
                  <Button onClick={refetch} className="mt-2 ml-2" size="sm">
                    {t("common.actions.retry")}
                  </Button>
                </div>
              ) : filteredData.length === 0 ? (
                <div className="col-span-full text-center py-8 text-muted-foreground">
                  {data.length === 0
                    ? t("userManagement.emptyStates.noUsers")
                    : searchTerm.trim()
                      ? t("userManagement.emptyStates.noSearchResults")
                      : t("userManagement.emptyStates.noUsers")}
                </div>
              ) : (
                pagination
                  .getPaginatedData(filteredData)
                  .map((user: UserWithRole) => (
                    <LazyUserCard
                      key={user.id}
                      user={user}
                      onClick={handleUserClick}
                    />
                  ))
              )}
            </div>

            {/* Cards Pagination */}
            {!loading && !error && filteredData.length > 0 && (
              <div className="mt-6">
                <CardsPagination
                  currentPage={pagination.currentPage}
                  totalItems={filteredData.length}
                  itemsPerPage={pagination.itemsPerPage}
                  onPageChange={pagination.setPage}
                  onItemsPerPageChange={pagination.setItemsPerPage}
                />
              </div>
            )}
          </div>
        )}
      </div>

      {/* Empty State - Only show when no data and not loading */}
      {!loading && data.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <Users className="h-12 w-12 text-secondary-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-secondary-900 mb-2">
              {t("userManagement.emptyStates.noUsers")}
            </h3>
            <p className="text-secondary-600 mb-4">
              {filtersActive
                ? t("userManagement.emptyStates.noSearchResultsDescription")
                : t("userManagement.emptyStates.startByAdding")}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Confirm Dialog */}
      <ConfirmDialog
        isOpen={dialogState.isOpen}
        onClose={hideConfirmDialog}
        onConfirm={handleConfirm}
        title={dialogState.title}
        message={dialogState.message}
        confirmText={dialogState.confirmText}
        cancelText={dialogState.cancelText}
        variant={dialogState.variant}
        isLoading={isDialogLoading || isDeleting || isBulkDeleting}
      />

      {/* User Detail Dialog */}
      <UserDetailDialog
        isOpen={isDetailDialogOpen}
        onClose={handleCloseDetail}
        user={selectedUser}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />

      {/* User Form Dialog */}
      <UserFormDialog
        isOpen={isFormDialogOpen}
        onClose={handleCloseForm}
        user={editingUser}
        onSubmit={handleSubmit}
      />
    </div>
  );
};
