import { Staff } from '../../../shared/types';
import {
    createDateColumn,
    createLinkColumn,
    createNavigationColumn,
    createTextColumn,
    statusColorHelpers,
    type ResponsiveColumnDef,
    ColumnPriority,
} from '../../utils/columnHelpers';

/**
 * Staff table data interface for DataTable component
 */
export interface StaffTableData extends Record<string, unknown> {
    id: number;
    name: string;
    employeeId: string | null;
    position: string | null;
    department: string | null;
    status: 'ACTIVE' | 'INACTIVE' | 'TERMINATED' | 'ON_LEAVE';
    email?: string;
    phone?: string;
    hireDate?: Date;
    address?: string;
}

/**
 * Create staff table column definitions
 * @param onNavigateToDetail - Function to handle navigation to staff detail page
 * @returns Array of column definitions for staff table
 */
export const createStaffColumns = (
    onNavigateToDetail?: (staff: StaffTableData) => void
): ResponsiveColumnDef<StaffTableData>[] => [
        // Name column - clickable navigation to detail page (always visible)
        createNavigationColumn<StaffTableData>(
            'name',
            'Name',
            onNavigateToDetail,
            ColumnPriority.ESSENTIAL,
            'Name'
        ),

        // Employee ID column (visible on tablet+)
        createTextColumn<StaffTableData>(
            'employeeId',
            'ID',
            undefined,
            true,
            ColumnPriority.HIGH,
            'ID'
        ),

        // Position column (visible on tablet+)
        createTextColumn<StaffTableData>(
            'position',
            'Position',
            undefined,
            true,
            ColumnPriority.HIGH,
            'Role'
        ),

        // Department column (visible on desktop+)
        createTextColumn<StaffTableData>(
            'department',
            'Department',
            undefined,
            true,
            ColumnPriority.MEDIUM,
            'Dept'
        ),

        // Status column with colored badges (always visible) — render localized labels
        {
            accessorKey: 'status',
            header: 'Status',
            priority: ColumnPriority.ESSENTIAL,
            // Render localized staff status label inside colored badge
            cell: ({ row }) => {
                const status = row.original.status as string | undefined;
                const colorClass = statusColorHelpers.getStaffStatusColor(status || '');
                // Use t if available via global window (fallback to raw value)
                // We avoid importing useLanguage here to keep this helper plain; components pass localized header elsewhere.
                const labelMap: Record<string, string> = {
                    'ACTIVE': 'Active',
                    'INACTIVE': 'Inactive',
                    'TERMINATED': 'Terminated',
                    'ON_LEAVE': 'On Leave',
                };
                // Guard indexing: only access labelMap when status is defined and present in map
                const localizedLabel = (status && (window as any)?.__locale_t)
                    ? (window as any).__locale_t('staff.status.' + status)
                    : undefined;
                const fallbackLabel = status && status in labelMap ? labelMap[status as keyof typeof labelMap] : undefined;
                const label = localizedLabel || fallbackLabel || status || '--';
                return (
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${colorClass}`}>
                        {label}
                    </span>
                );
            }
        },

        // Email column - clickable mailto link (visible on desktop+)
        createLinkColumn<StaffTableData>(
            'email',
            'Email',
            'email',
            ColumnPriority.LOW,
            'Email'
        ),

        // Phone column - clickable tel link (visible on desktop+)
        createLinkColumn<StaffTableData>(
            'phone',
            'Phone',
            'phone',
            ColumnPriority.LOW,
            'Phone'
        ),

        // Hire Date column with locale formatting (visible on desktop+)
        createDateColumn<StaffTableData>(
            'hireDate',
            'Hire Date',
            {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
            },
            ColumnPriority.MEDIUM,
            'Hired'
        ),

        // Address column with truncation (visible on large desktop+)
        createTextColumn<StaffTableData>(
            'address',
            'Address',
            50, // Max length before truncation
            true, // Show tooltip on hover
            ColumnPriority.LOW,
            'Address'
        ),
    ];

/**
 * Transform Staff data to StaffTableData format
 * @param staff - Staff object from API
 * @returns StaffTableData object for table display
 */
export const transformStaffForTable = (staff: Staff): StaffTableData => ({
    id: staff.id,
    name: staff.name,
    employeeId: staff.employeeId ?? null,
    position: staff.position ?? null,
    department: staff.department ?? null,
    status: staff.status,
    email: staff.email ?? undefined,
    phone: staff.phone ?? undefined,
    hireDate: staff.hireDate ?? undefined,
    address: staff.address ?? undefined,
});

/**
 * Transform array of Staff data for table display
 * @param staffList - Array of Staff objects
 * @returns Array of StaffTableData objects
 */
export const transformStaffListForTable = (staffList: Staff[]): StaffTableData[] =>
    staffList.map(transformStaffForTable);
