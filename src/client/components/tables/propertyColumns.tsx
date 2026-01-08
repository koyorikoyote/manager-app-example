import { Property } from '../../../shared/types';
import {
    createStatusColumn,
    createDateColumn,
    createNavigationColumn,
    createTextColumn,
    createCountColumn,
    statusColorHelpers,
    type ResponsiveColumnDef,
    ColumnPriority,
} from '../../utils/columnHelpers';

/**
 * Property table data interface for DataTable component
 */
export interface PropertyTableData extends Record<string, unknown> {
    id: number;
    name: string;
    address: string;
    type: string;
    status: 'ACTIVE' | 'INACTIVE' | 'UNDER_CONSTRUCTION' | 'SOLD';
    documentIds?: string[];
    createdAt: Date;
}

/**
 * Create property table column definitions
 * @param onNavigateToDetail - Function to handle navigation to property detail page
 * @returns Array of column definitions for property table
 */
export const createPropertyColumns = (
    onNavigateToDetail?: (property: PropertyTableData) => void
): ResponsiveColumnDef<PropertyTableData>[] => [
        // Name column - clickable navigation to detail page (always visible)
        createNavigationColumn<PropertyTableData>(
            'name',
            'Name',
            onNavigateToDetail,
            ColumnPriority.ESSENTIAL,
            'Name'
        ),

        // Address column with truncation for long addresses (visible on tablet+)
        createTextColumn<PropertyTableData>(
            'address',
            'Address',
            40, // Max length before truncation
            true, // Show tooltip on hover
            ColumnPriority.HIGH,
            'Address'
        ),

        // Type column (visible on tablet+) — render localized industry/type label when available
        {
            accessorKey: 'type',
            header: 'Type',
            priority: ColumnPriority.HIGH,
            cell: ({ row }) => {
                const type = row.original.type as string | undefined;
                if (!type) return <span>--</span>;
                // Prefer runtime locale function if available
                const localized = (window as any).__locale_t
                    ? (window as any).__locale_t(`properties.${type}`) || (window as any).__locale_t(`properties.${type.toLowerCase()}`) || type
                    : type;
                return <span>{localized}</span>;
            }
        },

        // Status column with colored badges (always visible) — render localized labels
        {
            accessorKey: 'status',
            header: 'Status',
            priority: ColumnPriority.ESSENTIAL,
            cell: ({ row }) => {
                const status = row.original.status as string | undefined;
                const colorClass = statusColorHelpers.getPropertyStatusColor(status || '');
                const labelMap: Record<string, string> = {
                    'ACTIVE': (window as any).__locale_t ? (window as any).__locale_t('properties.active') : 'Active',
                    'INACTIVE': (window as any).__locale_t ? (window as any).__locale_t('properties.inactive') : 'Inactive',
                    'UNDER_CONSTRUCTION': (window as any).__locale_t ? (window as any).__locale_t('properties.underConstruction') : 'Under Construction',
                    'SOLD': (window as any).__locale_t ? (window as any).__locale_t('properties.sold') : 'Sold',
                };
                const label = status ? (labelMap[status] || status) : '--';
                return (
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${colorClass}`}>
                        {label}
                    </span>
                );
            }
        },

        // Document count column (visible on desktop+)
        createCountColumn<PropertyTableData>(
            'documentIds',
            'Documents',
            'document',
            'documents',
            ColumnPriority.MEDIUM,
            'Docs'
        ),

        // Created date column with locale formatting (visible on desktop+)
        createDateColumn<PropertyTableData>(
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
    ];

/**
 * Transform Property data to PropertyTableData format
 * @param property - Property object from API
 * @returns PropertyTableData object for table display
 */
export const transformPropertyForTable = (property: Property): PropertyTableData => ({
    id: property.id,
    name: property.name,
    address: property.address,
    type: property.propertyType || property.type || 'Unknown',
    status: property.status,
    documentIds: property.documentIds || [],
    createdAt: property.createdAt,
});

/**
 * Transform array of Property data for table display
 * @param propertyList - Array of Property objects
 * @returns Array of PropertyTableData objects
 */
export const transformPropertyListForTable = (propertyList: Property[]): PropertyTableData[] =>
    propertyList.map(transformPropertyForTable);
