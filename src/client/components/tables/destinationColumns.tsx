import { Company } from '../../../shared/types';
import {
    createStatusColumn,
    createDateColumn,
    createLinkColumn,
    createNavigationColumn,
    createTextColumn,
    statusColorHelpers,
    type ResponsiveColumnDef,
    ColumnPriority,
} from '../../utils/columnHelpers';

/**
 * Destination table data interface for DataTable component
 */
export interface DestinationTableData extends Record<string, unknown> {
    id: number;
    companyId?: string | null;
    name: string;
    industry?: string;
    address: string;
    phone?: string;
    email?: string;
    website?: string;
    status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
    createdAt: Date;
}

/**
 * Create destination table column definitions
 * @param onNavigateToDetail - Function to handle navigation to destination detail page
 * @returns Array of column definitions for destination table
 */
export const createDestinationColumns = (
    onNavigateToDetail?: (destination: DestinationTableData) => void
): ResponsiveColumnDef<DestinationTableData>[] => [
        // Navigation/name column
        createNavigationColumn<DestinationTableData>(
            'name',
            'Name',
            onNavigateToDetail,
            ColumnPriority.ESSENTIAL,
            'Name'
        ),

        // Industry column
        createTextColumn<DestinationTableData>(
            'industry',
            'Industry',
            undefined,
            true,
            ColumnPriority.HIGH,
            'Industry'
        ),

        // Address column
        createTextColumn<DestinationTableData>(
            'address',
            'Address',
            40,
            true,
            ColumnPriority.HIGH,
            'Address'
        ),

        // Phone
        createLinkColumn<DestinationTableData>(
            'phone',
            'Phone',
            'phone',
            ColumnPriority.LOW,
            'Phone'
        ),

        // Email
        createLinkColumn<DestinationTableData>(
            'email',
            'Email',
            'email',
            ColumnPriority.LOW,
            'Email'
        ),

        // Website
        createLinkColumn<DestinationTableData>(
            'website',
            'Website',
            'website',
            ColumnPriority.LOW,
            'Website'
        ),

        // Status
        createStatusColumn<DestinationTableData>(
            'status',
            'Status',
            statusColorHelpers.getCompanyStatusColor,
            ColumnPriority.ESSENTIAL,
            'Status'
        ),

        // Created
        createDateColumn<DestinationTableData>(
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
 * Transform Company data to DestinationTableData format
 * @param company - Company object from API
 * @returns DestinationTableData object for table display
 */
export const transformDestinationForTable = (company: Company): DestinationTableData => ({
    id: company.id,
    companyId: (company as any).companyId ?? null,
    name: company.name,
    industry: company.industry,
    address: company.address,
    phone: company.phone,
    email: company.email,
    website: company.website,
    status: company.status,
    createdAt: company.createdAt,
});

/**
 * Transform array of Company data for table display
 * @param companyList - Array of Company objects
 * @returns Array of DestinationTableData objects
 */
export const transformDestinationListForTable = (companyList: Company[]): DestinationTableData[] =>
    companyList.map(transformDestinationForTable);
