import React from 'react';
import {
    createDateColumn,
    createNavigationColumn,
    createTextColumn,
    type ResponsiveColumnDef,
    ColumnPriority,
} from '../../utils/columnHelpers';
import { formatDateForTable } from '../../utils/localization';
import { Checkbox } from '../ui/Checkbox';
import { UserTableData } from '../../types/user';
import { UserWithRole } from '../../types/user';

/**
 * Create user table column definitions
 * @param onNavigateToDetail - Function to handle navigation to user detail page
 * @param includeCheckbox - Whether to include checkbox column for bulk selection
 * @returns Array of column definitions for user table
 */
export const createUserColumns = (
    onNavigateToDetail?: (user: UserTableData) => void,
    includeCheckbox?: boolean
): ResponsiveColumnDef<UserTableData>[] => {
    const columns: ResponsiveColumnDef<UserTableData>[] = [];

    // Add checkbox column if requested
    if (includeCheckbox) {
        columns.push({
            id: "select",
            header: ({ table }) => (
                <Checkbox
                    checked={
                        table.getIsAllPageRowsSelected() ||
                        (table.getIsSomePageRowsSelected() && "indeterminate")
                    }
                    onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
                />
            ),
            cell: ({ row }) => (
                <div onClick={(e) => e.stopPropagation()}>
                    <Checkbox
                        checked={row.getIsSelected()}
                        onCheckedChange={(value) => row.toggleSelected(!!value)}
                    />
                </div>
            ),
            enableSorting: false,
            enableHiding: false,
        });
    }

    columns.push(
        // Username column - clickable navigation to detail page (always visible)
        createNavigationColumn<UserTableData>(
            'username',
            'Username',
            onNavigateToDetail,
            ColumnPriority.ESSENTIAL,
            'User'
        ),

        // Name column (visible on tablet+)
        createTextColumn<UserTableData>(
            'name',
            'Name',
            30, // Max length before truncation
            true, // Show tooltip on hover
            ColumnPriority.HIGH,
            'Name'
        ),

        // Email column (visible on tablet+)
        createTextColumn<UserTableData>(
            'email',
            'Email',
            35, // Max length before truncation
            true, // Show tooltip on hover
            ColumnPriority.HIGH,
            'Email'
        ),

        // Role column with level indicator (always visible)
        {
            accessorKey: 'roleName',
            header: 'Role',
            priority: ColumnPriority.ESSENTIAL,
            mobileHeader: 'Role',
            cell: ({ row }) => {
                const roleName = row.original.roleName as string | undefined;
                const roleLevel = row.original.roleLevel as number | undefined;

                if (!roleName) return <span className="text-neutral-400">--</span>;

                // Get localized role name if available
                const globalWindow = window as typeof window & { __locale_t?: (key: string) => string };
                const localized = globalWindow.__locale_t
                    ? globalWindow.__locale_t(`roles.${roleName.toLowerCase()}`) || roleName
                    : roleName;

                return (
                    <div className="flex flex-col">
                        <span className="font-medium text-neutral-900">{localized}</span>
                        {roleLevel && (
                            <span className="text-xs text-neutral-500">Level {roleLevel}</span>
                        )}
                    </div>
                );
            }
        },

        // Status column with colored badges (always visible)
        {
            accessorKey: 'status',
            header: 'Status',
            priority: ColumnPriority.ESSENTIAL,
            mobileHeader: 'Status',
            cell: ({ row }) => {
                const status = row.original.status as 'Active' | 'Inactive' | undefined;

                if (!status) return <span className="text-neutral-400">--</span>;

                const colorClass = status === 'Active'
                    ? 'bg-green-100 text-green-800 border-green-200'
                    : 'bg-gray-100 text-gray-800 border-gray-200';

                const globalWindow = window as typeof window & { __locale_t?: (key: string) => string };
                const labelMap: Record<string, string> = {
                    'Active': globalWindow.__locale_t ? globalWindow.__locale_t('common.status.active') : 'Active',
                    'Inactive': globalWindow.__locale_t ? globalWindow.__locale_t('common.status.inactive') : 'Inactive',
                };

                const label = labelMap[status] || status;

                return (
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${colorClass}`}>
                        {label}
                    </span>
                );
            },
            filterFn: (row: { getValue: (id: string) => unknown }, id: string, value: string[]) => {
                if (!value || value.length === 0) return true;
                return value.includes(row.getValue(id) as string);
            },
        },

        // Created date column with locale formatting (visible on desktop+)
        createDateColumn<UserTableData>(
            'createdAt',
            'Created',
            {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
            },
            ColumnPriority.MEDIUM,
            'Created'
        ),
    );

    return columns;
};

/**
 * Transform UserWithRole data to UserTableData format
 * @param user - UserWithRole object from API
 * @returns UserTableData object for table display
 */
export const transformUserForTable = (user: UserWithRole): UserTableData => ({
    id: user.id,
    username: user.username,
    name: user.name,
    email: user.email,
    roleName: user.role.name,
    roleLevel: user.role.level,
    status: user.isActive ? 'Active' as const : 'Inactive' as const,
    createdAt: formatDateForTable(user.createdAt),
});

/**
 * Transform array of UserWithRole data for table display
 * @param userList - Array of UserWithRole objects
 * @returns Array of UserTableData objects
 */
export const transformUserListForTable = (userList: UserWithRole[]): UserTableData[] =>
    userList.map(transformUserForTable);


/**
 * Get role level badge color class
 * @param level - Role level number
 * @returns CSS class string for role level badge
 */
export const getRoleLevelColor = (level: number): string => {
    switch (level) {
        case 1:
            return 'bg-blue-100 text-blue-800 border-blue-200';
        case 2:
            return 'bg-green-100 text-green-800 border-green-200';
        case 3:
            return 'bg-purple-100 text-purple-800 border-purple-200';
        default:
            return 'bg-gray-100 text-gray-800 border-gray-200';
    }
};

/**
 * Get user status badge color class
 * @param status - User status ('Active' | 'Inactive')
 * @returns CSS class string for status badge
 */
export const getUserStatusColor = (status: 'Active' | 'Inactive'): string => {
    return status === 'Active'
        ? 'bg-green-100 text-green-800 border-green-200'
        : 'bg-gray-100 text-gray-800 border-gray-200';
};
