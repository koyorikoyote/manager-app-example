import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Smartphone, Search } from "lucide-react";
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
import { MobileUserDetailDialog } from "../ui/MobileUserDetailDialog";
import { MobileUserFormDialog } from "../ui/MobileUserFormDialog";
import { useLanguage } from "../../contexts/LanguageContext";
import { useGlassBlue } from '../../hooks/useGlassBlue';
import { useAuth } from "../../contexts/AuthContext";
import { useConfirmDialog } from "../../hooks/useConfirmDialog";
import { useViewMode } from "../../hooks/useViewMode";
import { useToast } from "../../contexts/ToastContext";
import type { RowSelectionState } from "@tanstack/react-table";

const LazyDataTable = createLazyComponent(
    () => import("../ui/DataTable").then(module => ({ default: module.DataTable })),
    "DataTable"
);

interface MobileUserRole {
    id: number;
    name: string;
    level: number;
}

interface Staff {
    id: number;
    name: string;
    employeeId: string | null;
}

interface MobileUser {
    id: number;
    username: string;
    email: string;
    displayName: string | null;
    phone: string | null;
    isActive: boolean;
    mobileRoleId: number | null;
    staffId: number | null;
    userId: number | null;
    createdAt: string;
    updatedAt: string;
    mobileRole: MobileUserRole | null;
    staff: Staff | null;
}

interface MobileUserTableData {
    id: number;
    username: string;
    email: string;
    displayName: string;
    phone: string;
    role: string;
    staff: string;
    isActive: string;
}

export const MobileUserManagement: React.FC = () => {
    const { t } = useLanguage();
    const navigate = useNavigate();
    const isGlassBlue = useGlassBlue();
    const { user: _currentUser } = useAuth();
    const { showSuccess, showError } = useToast();
    const {
        dialogState,
        isLoading: isDialogLoading,
        showConfirmDialog,
        hideConfirmDialog,
        handleConfirm,
    } = useConfirmDialog();

    const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
    const [isFormDialogOpen, setIsFormDialogOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState<MobileUser | null>(null);
    const [editingUser, setEditingUser] = useState<MobileUser | null>(null);

    const [data, setData] = useState<MobileUser[]>([]);
    const [filteredData, setFilteredData] = useState<MobileUser[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState<string>("");
    const [selectedRows, setSelectedRows] = useState<RowSelectionState>({});
    const [isDeleting, setIsDeleting] = useState(false);
    const [isBulkDeleting, setIsBulkDeleting] = useState(false);

    const { viewMode, setViewMode } = useViewMode("mobile-user-management");

    const [paginationState, setPaginationState] = useState({
        currentPage: 1,
        itemsPerPage: 10,
    });

    const totalPages = Math.ceil(filteredData.length / paginationState.itemsPerPage);
    const startIndex = (paginationState.currentPage - 1) * paginationState.itemsPerPage;
    const endIndex = Math.min(startIndex + paginationState.itemsPerPage, filteredData.length);

    const getPaginatedData = useCallback((data: MobileUser[]) => {
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

    useEffect(() => {
        if (viewMode === "table") {
            preloadComponent(
                () => import("../ui/DataTable").then(module => ({ default: module.DataTable })),
                "DataTable"
            );
        }
    }, [viewMode]);

    const loadMobileUsers = useCallback(async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('authToken');
            const response = await fetch('/api/mobile-users', {
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });
            if (response.ok) {
                const result = await response.json();
                setData(result.data || []);
                setError(null);
            } else {
                throw new Error('Failed to load mobile users');
            }
        } catch (err) {
            console.error('Error loading mobile users:', err);
            setError(err instanceof Error ? err.message : 'Unknown error');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadMobileUsers();
    }, [loadMobileUsers]);

    const filterUsers = useCallback((users: MobileUser[], query: string) => {
        const term = query.trim().toLowerCase();
        if (!term) return users;

        return users.filter((user) => {
            return (
                user.username?.toLowerCase().includes(term) ||
                user.email?.toLowerCase().includes(term) ||
                user.displayName?.toLowerCase().includes(term) ||
                user.phone?.toLowerCase().includes(term) ||
                user.mobileRole?.name?.toLowerCase().includes(term) ||
                user.staff?.name?.toLowerCase().includes(term)
            );
        });
    }, []);

    useEffect(() => {
        const filtered = filterUsers(data, searchTerm);
        setFilteredData(filtered);
    }, [data, searchTerm, filterUsers]);

    const handleSearch = (value: string) => {
        setSearchTerm(value);
        pagination.resetToFirstPage();
    };

    const handleSearchConfirm = (value: string) => {
        setSearchTerm(value);
        pagination.resetToFirstPage();
    };

    const handleClearFilters = useCallback(() => {
        setSearchTerm("");
    }, []);

    const filtersActive = useMemo(() => {
        return searchTerm.trim() !== "";
    }, [searchTerm]);

    const transformUserListForTable = useCallback((users: MobileUser[]): MobileUserTableData[] => {
        return users.map(user => ({
            id: user.id,
            username: user.username,
            email: user.email,
            displayName: user.displayName || '-',
            phone: user.phone || '-',
            role: user.mobileRole?.name || '-',
            staff: user.staff?.name || '-',
            isActive: user.isActive ? t('common.status.active') : t('common.status.inactive'),
        }));
    }, [t]);

    const tableData = useMemo(() => {
        return transformUserListForTable(filteredData);
    }, [filteredData, transformUserListForTable]);

    const createMobileUserColumns = useCallback((_onRowClick: (data: MobileUserTableData) => void, includeCheckbox = false) => {
        const columns: Array<Record<string, unknown>> = [];

        // Add checkbox column if requested
        if (includeCheckbox) {
            columns.push({
                id: "select",
                header: ({ table }: { table: { getIsAllPageRowsSelected: () => boolean; getIsSomePageRowsSelected: () => boolean; toggleAllPageRowsSelected: (value: boolean) => void } }) => (
                    <input
                        type="checkbox"
                        checked={table.getIsAllPageRowsSelected()}
                        ref={(input) => {
                            if (input) {
                                input.indeterminate = !table.getIsAllPageRowsSelected() && table.getIsSomePageRowsSelected();
                            }
                        }}
                        onChange={(e) => table.toggleAllPageRowsSelected(!!e.target.checked)}
                        className="rounded border-secondary-300 text-primary-600 focus:ring-primary-500"
                    />
                ),
                cell: ({ row }: { row: { getIsSelected: () => boolean; toggleSelected: (value: boolean) => void } }) => (
                    <div onClick={(e: React.MouseEvent) => e.stopPropagation()}>
                        <input
                            type="checkbox"
                            checked={row.getIsSelected()}
                            onChange={(e) => row.toggleSelected(!!e.target.checked)}
                            className="rounded border-secondary-300 text-primary-600 focus:ring-primary-500"
                        />
                    </div>
                ),
                enableSorting: false,
                enableHiding: false,
            });
        }

        columns.push(
            {
                accessorKey: "username",
                header: t('mobileUserManagement.fields.username'),
            },
            {
                accessorKey: "email",
                header: t('mobileUserManagement.fields.email'),
            },
            {
                accessorKey: "displayName",
                header: t('mobileUserManagement.fields.displayName'),
            },
            {
                accessorKey: "role",
                header: t('mobileUserManagement.fields.role'),
            },
            {
                accessorKey: "staff",
                header: t('mobileUserManagement.fields.staff'),
            },
            {
                accessorKey: "isActive",
                header: t('mobileUserManagement.fields.status'),
            }
        );

        return columns;
    }, [t]);

    const handleRowSelectionChange = useCallback(
        (selection: RowSelectionState) => {
            setSelectedRows(selection);
        },
        []
    );

    const selectedUserIds = useMemo(() => {
        return Object.keys(selectedRows)
            .filter((key) => selectedRows[key])
            .map((key) => tableData[parseInt(key)]?.id)
            .filter(Boolean) as number[];
    }, [selectedRows, tableData]);

    const handleOpenDetail = useCallback((user: MobileUser) => {
        setSelectedUser(user);
        setIsDetailDialogOpen(true);
    }, []);

    const handleCloseDetail = useCallback(() => {
        setIsDetailDialogOpen(false);
        setSelectedUser(null);
    }, []);

    const handleOpenForm = useCallback((user?: MobileUser) => {
        setEditingUser(user || null);
        setIsFormDialogOpen(true);
    }, []);

    const handleCloseForm = useCallback(() => {
        setIsFormDialogOpen(false);
        setEditingUser(null);
    }, []);

    const handleEdit = useCallback(
        (user: MobileUser) => {
            handleCloseDetail();
            handleOpenForm(user);
        },
        [handleCloseDetail, handleOpenForm]
    );

    const handleDelete = useCallback(
        async (id: string) => {
            const userToDelete = data.find((u) => u.id === parseInt(id));
            const userName = userToDelete?.username || "this user";

            showConfirmDialog({
                title: t("common.actions.delete"),
                message: t("mobileUserManagement.confirmations.deleteUserWithName", {
                    name: userName,
                }),
                variant: "destructive",
                confirmText: t("common.actions.delete"),
                cancelText: t("common.actions.cancel"),
                onConfirm: async () => {
                    try {
                        setIsDeleting(true);
                        const token = localStorage.getItem('authToken');
                        const response = await fetch(`/api/mobile-users/${id}`, {
                            method: 'DELETE',
                            headers: {
                                'Authorization': `Bearer ${token}`,
                            },
                        });

                        if (response.ok) {
                            showSuccess(t("mobileUserManagement.messages.userDeleted"));
                            await loadMobileUsers();
                            handleCloseDetail();
                        } else {
                            throw new Error('Failed to delete user');
                        }
                    } catch (error) {
                        console.error("Failed to delete mobile user:", error);
                        showError(t("mobileUserManagement.messages.deleteUserError"));
                    } finally {
                        setIsDeleting(false);
                    }
                },
            });
        },
        [t, showConfirmDialog, showSuccess, showError, loadMobileUsers, handleCloseDetail, data]
    );

    const handleBulkDelete = useCallback(async () => {
        if (selectedUserIds.length === 0) return;

        showConfirmDialog({
            title: t("common.actions.bulkDelete"),
            message: t("mobileUserManagement.confirmations.bulkDeleteUsers", {
                count: selectedUserIds.length,
            }),
            variant: "destructive",
            confirmText: t("common.actions.delete"),
            cancelText: t("common.actions.cancel"),
            onConfirm: async () => {
                try {
                    setIsBulkDeleting(true);
                    const token = localStorage.getItem('authToken');
                    const response = await fetch('/api/mobile-users/bulk-delete', {
                        method: 'POST',
                        headers: {
                            'Authorization': `Bearer ${token}`,
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({ ids: selectedUserIds }),
                    });

                    if (response.ok) {
                        showSuccess(t("mobileUserManagement.messages.usersDeleted", {
                            count: selectedUserIds.length,
                        }));
                        setSelectedRows({});
                        await loadMobileUsers();
                    } else {
                        throw new Error('Failed to bulk delete users');
                    }
                } catch (error) {
                    console.error("Failed to bulk delete mobile users:", error);
                    showError(t("mobileUserManagement.messages.bulkDeleteError"));
                } finally {
                    setIsBulkDeleting(false);
                }
            },
        });
    }, [selectedUserIds, showConfirmDialog, t, showSuccess, showError, loadMobileUsers]);

    const handleSubmit = useCallback(
        async (formData: Record<string, unknown>) => {
            try {
                const token = localStorage.getItem('authToken');
                const url = editingUser
                    ? `/api/mobile-users/${editingUser.id}`
                    : '/api/mobile-users';
                const method = editingUser ? 'PUT' : 'POST';

                const response = await fetch(url, {
                    method,
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(formData),
                });

                if (response.ok) {
                    showSuccess(
                        editingUser
                            ? t("mobileUserManagement.messages.userUpdated")
                            : t("mobileUserManagement.messages.userCreated")
                    );
                    await loadMobileUsers();
                    handleCloseForm();
                } else {
                    const result = await response.json();
                    throw new Error(result.message || 'Failed to save user');
                }
            } catch (error) {
                console.error("Failed to save mobile user:", error);
                showError(
                    editingUser
                        ? t("mobileUserManagement.messages.updateUserError")
                        : t("mobileUserManagement.messages.createUserError")
                );
                throw error;
            }
        },
        [editingUser, showSuccess, showError, t, loadMobileUsers, handleCloseForm]
    );

    const handleTableRowClick = useCallback(
        (userData: MobileUserTableData) => {
            const user = filteredData.find((u) => u.id === userData.id);
            if (user) {
                handleOpenDetail(user);
            }
        },
        [filteredData, handleOpenDetail]
    );

    const handleUserClick = useCallback(
        (user: MobileUser) => {
            handleOpenDetail(user);
        },
        [handleOpenDetail]
    );

    const columns = useMemo(
        () => createMobileUserColumns(handleTableRowClick, true),
        [handleTableRowClick, createMobileUserColumns]
    );

    if (error && !loading && data.length === 0) {
        return (
            <div className="space-y-6 pb-20 md:pb-6">
                <Card>
                    <CardContent className="p-12 text-center">
                        <Smartphone className="h-12 w-12 text-red-400 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-secondary-900 mb-2">
                            {t("mobileUserManagement.messages.loadingError")}
                        </h3>
                        <p className="text-secondary-600 mb-4">Error: {error}</p>
                        <Button onClick={loadMobileUsers} className="mt-4">
                            {t("mobileUserManagement.tryAgain")}
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="space-y-6 pb-20 md:pb-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                    <BackButton onBack={() => navigate("/settings")} />
                    <h1 className="text-2xl md:text-3xl font-bold text-secondary-900">
                        {t("mobileUserManagement.title")}
                    </h1>
                </div>
            </div>

            <div className="flex items-center gap-2 justify-between">
                <div className="flex items-center space-x-4">
                    <ViewModeToggle mode={viewMode} onChange={setViewMode} />
                </div>

                <MobileAwareSearchSection pageName="mobile-user-management" className="flex-1">
                    <Card className="search-component-spacing">
                        <CardContent className="p-2">
                            <div className="flex gap-2">
                                <div className="relative flex-1">
                                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-secondary-400" />
                                    <Input
                                        placeholder={t("mobileUserManagement.searchPlaceholder")}
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
                                    ? t("mobileUserManagement.emptyStates.noSearchResults")
                                    : t("mobileUserManagement.emptyStates.startByAdding")
                            }
                            onClearFilters={handleClearFilters}
                            hasActiveFilters={filtersActive}
                            totalCount={data.length}
                            enableColumnFiltering={true}
                            tableName="mobile_user_management"
                            showScrollButtons={true}
                            resultsSummary={t("common.pagination.showing", {
                                current: filteredData.length,
                                total: data.length,
                            })}
                            loadingText={t("mobileUserManagement.loadingUsers")}
                            enableRowSelection={true}
                            rowSelectionMode="multiple"
                            rowSelection={selectedRows}
                            onRowSelectionChange={handleRowSelectionChange}
                        />
                    </div>
                ) : (
                    <div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
                            {loading ? (
                                Array.from({ length: pagination.itemsPerPage }).map(
                                    (_, index) => <CardSkeleton key={index} variant="staff" />
                                )
                            ) : error ? (
                                <div className="col-span-full text-sm text-red-600 bg-red-50 p-3 rounded border border-red-200">
                                    {error}
                                    <Button onClick={loadMobileUsers} className="mt-2 ml-2" size="sm">
                                        {t("common.actions.retry")}
                                    </Button>
                                </div>
                            ) : filteredData.length === 0 ? (
                                <div className="col-span-full text-center py-8 text-muted-foreground">
                                    {data.length === 0
                                        ? t("mobileUserManagement.emptyStates.noUsers")
                                        : searchTerm.trim()
                                            ? t("mobileUserManagement.emptyStates.noSearchResults")
                                            : t("mobileUserManagement.emptyStates.noUsers")}
                                </div>
                            ) : (
                                pagination
                                    .getPaginatedData(filteredData)
                                    .map((user: MobileUser) => (
                                        <Card key={user.id} className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => handleUserClick(user)}>
                                            <CardContent className="p-4">
                                                <div className="flex items-start justify-between mb-2">
                                                    <div className="flex-1">
                                                        <h3 className="font-semibold text-secondary-900">{user.username}</h3>
                                                        <p className="text-sm text-secondary-600">{user.email}</p>
                                                    </div>
                                                    <div className={`px-2 py-1 rounded text-xs ${user.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                                        {user.isActive ? t('common.status.active') : t('common.status.inactive')}
                                                    </div>
                                                </div>
                                                {user.displayName && (
                                                    <p className="text-sm text-secondary-700 mb-1">{user.displayName}</p>
                                                )}
                                                {user.mobileRole && (
                                                    <p className="text-sm text-secondary-600 mb-1">
                                                        <span className="font-medium">{t('mobileUserManagement.fields.role')}:</span> {user.mobileRole.name}
                                                    </p>
                                                )}
                                                {user.staff && (
                                                    <p className="text-sm text-secondary-600">
                                                        <span className="font-medium">{t('mobileUserManagement.fields.staff')}:</span> {user.staff.name}
                                                    </p>
                                                )}
                                            </CardContent>
                                        </Card>
                                    ))
                            )}
                        </div>

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

            {!loading && data.length === 0 && (
                <Card>
                    <CardContent className="p-12 text-center">
                        <Smartphone className="h-12 w-12 text-secondary-400 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-secondary-900 mb-2">
                            {t("mobileUserManagement.emptyStates.noUsers")}
                        </h3>
                        <p className="text-secondary-600 mb-4">
                            {filtersActive
                                ? t("mobileUserManagement.emptyStates.noSearchResultsDescription")
                                : t("mobileUserManagement.emptyStates.startByAdding")}
                        </p>
                    </CardContent>
                </Card>
            )}

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

            <MobileUserDetailDialog
                isOpen={isDetailDialogOpen}
                onClose={handleCloseDetail}
                user={selectedUser}
                onEdit={handleEdit}
                onDelete={handleDelete}
            />

            <MobileUserFormDialog
                isOpen={isFormDialogOpen}
                onClose={handleCloseForm}
                user={editingUser}
                onSubmit={handleSubmit}
            />
        </div>
    );
};
