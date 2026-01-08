import React, { useCallback } from 'react';
import { InquiryWithRelations, InquiryTableData } from '../../../shared/types';
import { TranslationFunction } from '../../../shared/types/translations';

export type { InquiryTableData };
import {
    createStatusColumn,
    createDateColumn,
    createNavigationColumn,
    createTextColumn,
    type ResponsiveColumnDef,
    ColumnPriority,
} from '../../utils/columnHelpers';
import { Checkbox } from '../ui/Checkbox';
import { TruncatedText } from '../ui/TruncatedText';
import { formatDateForTable } from '../../utils/localization';
import { createOptimizedColumns } from '../../utils/optimizedColumnHelpers';
import { useMemoizedFilter } from '../../utils/memoizationUtils';

/**
 * Get color classes for inquiry status
 */
const getInquiryStatusColor = (status: string): string => {
    switch (status) {
        case 'OPEN':
            return 'bg-red-100 text-red-800 border-red-200';
        case 'CLOSED':
            return 'bg-green-100 text-green-800 border-green-200';
        case 'ON_HOLD':
            return 'bg-yellow-100 text-yellow-800 border-yellow-200';
        default:
            return 'bg-gray-100 text-gray-800 border-gray-200';
    }
};

/**
 * Hook to create memoized inquiry type filter function
 */
export const useInquiryTypeFilter = () => {
    return useMemoizedFilter(
        () => (row: InquiryTableData, id: string, value: string[]) => {
            if (!value || value.length === 0) return true;
            const inquiryType = row.typeOfInquiry?.toLowerCase() || '';
            return value.some(v => inquiryType.includes(v.toLowerCase()));
        },
        {
            dependencies: [],
            debugName: "inquiry-type-filter",
            enableLogging: process.env.NODE_ENV === "development",
        }
    );
};

/**
 * Hook to create memoized date range filter function for inquiry dates
 */
export const useInquiryDateFilter = () => {
    return useMemoizedFilter(
        () => (row: InquiryTableData, id: string, value: [string, string]) => {
            if (!value || !Array.isArray(value) || value.length !== 2) return true;
            const [startDate, endDate] = value;
            if (!startDate && !endDate) return true;

            const inquiryDate = row.dateOfInquiry;
            if (!inquiryDate) return false;

            const date = new Date(inquiryDate);
            if (isNaN(date.getTime())) return false;

            const start = startDate ? new Date(startDate) : null;
            const end = endDate ? new Date(endDate) : null;

            if (start && date < start) return false;
            if (end && date > end) return false;

            return true;
        },
        {
            dependencies: [],
            debugName: "inquiry-date-filter",
            enableLogging: process.env.NODE_ENV === "development",
        }
    );
};

/**
 * Hook to create memoized date range filter function for resolution dates
 */
export const useResolutionDateFilter = () => {
    return useMemoizedFilter(
        () => (row: InquiryTableData, id: string, value: [string, string]) => {
            if (!value || !Array.isArray(value) || value.length !== 2) return true;
            const [startDate, endDate] = value;
            if (!startDate && !endDate) return true;

            const resolutionDate = row.resolutionDate;
            if (!resolutionDate) return false;

            const date = new Date(resolutionDate);
            if (isNaN(date.getTime())) return false;

            const start = startDate ? new Date(startDate) : null;
            const end = endDate ? new Date(endDate) : null;

            if (start && date < start) return false;
            if (end && date > end) return false;

            return true;
        },
        {
            dependencies: [],
            debugName: "resolution-date-filter",
            enableLogging: process.env.NODE_ENV === "development",
        }
    );
};

/**
 * Hook to create memoized progress status filter function
 */
export const useProgressStatusFilter = () => {
    return useMemoizedFilter(
        () => (row: InquiryTableData, id: string, value: string[]) => {
            if (!value || value.length === 0) return true;
            return value.includes(row.progressStatus);
        },
        {
            dependencies: [],
            debugName: "progress-status-filter",
            enableLogging: process.env.NODE_ENV === "development",
        }
    );
};

/**
 * Create optimized inquiry table column definitions with memoization
 * @param onNavigateToDetail - Function to handle navigation to inquiry detail page
 * @param t - Translation function
 * @param includeCheckbox - Whether to include checkbox column for bulk selection
 * @returns Array of memoized column definitions for inquiry table
 */
export const useInquiryColumns = (
    onNavigateToDetail?: (inquiry: InquiryTableData) => void,
    t?: TranslationFunction,
    includeCheckbox?: boolean
): ResponsiveColumnDef<InquiryTableData>[] => {
    // Memoized filter functions
    const inquiryTypeFilter = useInquiryTypeFilter();
    const inquiryDateFilter = useInquiryDateFilter();
    const resolutionDateFilter = useResolutionDateFilter();
    const progressStatusFilter = useProgressStatusFilter();

    // Memoized status color function
    const getInquiryStatusColor = useCallback((status: string): string => {
        switch (status) {
            case 'OPEN':
                return 'bg-red-100 text-red-800 border-red-200';
            case 'CLOSED':
                return 'bg-green-100 text-green-800 border-green-200';
            case 'ON_HOLD':
                return 'bg-yellow-100 text-yellow-800 border-yellow-200';
            default:
                return 'bg-gray-100 text-gray-800 border-gray-200';
        }
    }, []);

    // Memoized status color function
    const getInquiryTypeColor = useCallback((status: string): string => {
        switch (status) {
            case 'General':
                return 'bg-blue-100 text-blue-800 border-blue-200';
            case 'Technical':
                return 'bg-purple-100 text-purple-800 border-purple-200';
            case 'Billing':
                return 'bg-orange-100 text-orange-800 border-orange-200';
            case 'Support':
                return 'bg-green-100 text-green-800 border-green-200';
            case 'Complaint':
                return 'bg-red-100 text-red-800 border-red-200';
            default:
                return 'bg-gray-100 text-gray-800 border-gray-200';
        }
    }, []);

    return createOptimizedColumns(
        () => {
            const columns: ResponsiveColumnDef<InquiryTableData>[] = [];

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

            // Add the 10 standardized columns as specified in requirements
            columns.push(
                // 1. Date of Inquiry column (always visible) with optimized filtering
                {
                    ...createDateColumn<InquiryTableData>(
                        'dateOfInquiry',
                        t ? t('inquiriesNotifications.columns.dateOfInquiry') : 'Date of Inquiry',
                        {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                        },
                        ColumnPriority.ESSENTIAL,
                        'Date'
                    ),
                    filterFn: inquiryDateFilter,
                },

                // 2. Inquirer Name column - clickable navigation to detail page (always visible)
                createNavigationColumn<InquiryTableData>(
                    'inquirerName',
                    t ? t('inquiriesNotifications.columns.inquirerName') : 'Inquirer Name',
                    onNavigateToDetail,
                    ColumnPriority.ESSENTIAL,
                    'Inquirer'
                ),

                // 3. Contact Info column (visible on tablet+)
                createTextColumn<InquiryTableData>(
                    'inquirerContact',
                    t ? t('inquiriesNotifications.columns.contactInfo') : 'Contact Info',
                    30, // Max length before truncation
                    true, // Show tooltip on hover
                    ColumnPriority.HIGH,
                    'Contact'
                ),

                // 4. Company Name column (visible on tablet+)
                createTextColumn<InquiryTableData>(
                    'companyName',
                    t ? t('inquiriesNotifications.columns.companyName') : 'Company Name',
                    25, // Max length before truncation
                    true, // Show tooltip on hover
                    ColumnPriority.HIGH,
                    'Company'
                ),

                // 5. Type of Inquiry column (visible on desktop+) with optimized filtering
                {
                    accessorKey: 'typeOfInquiry',
                    header: t ? t('inquiriesNotifications.columns.typeOfInquiry') : 'Type of Inquiry',
                    priority: ColumnPriority.MEDIUM,
                    // Render localized label inside colored badge
                    cell: ({ row }) => {
                        const typeOfInquiry = row.original.typeOfInquiry as string | undefined;
                        const colorClass = getInquiryTypeColor(typeOfInquiry || '');
                        const label = t
                            ? typeOfInquiry === 'General'
                                ? t('inquiriesNotifications.types.General')
                                : typeOfInquiry === 'Technical'
                                    ? t('inquiriesNotifications.types.Technical')
                                    : typeOfInquiry === 'Billing'
                                        ? t('inquiriesNotifications.types.Billing')
                                        : typeOfInquiry === 'Support'
                                            ? t('inquiriesNotifications.types.Support')
                                            : typeOfInquiry === 'Complaint'
                                                ? t('inquiriesNotifications.types.Complaint')
                                                : typeOfInquiry
                            : typeOfInquiry;
                        return (
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${colorClass}`}>
                                {label || '--'}
                            </span>
                        );
                    },
                    filterFn: inquiryTypeFilter,
                },

                // 6. Inquiry Content column with truncation (visible on desktop+)
                {
                    accessorKey: 'inquiryContent',
                    header: t ? t('inquiriesNotifications.columns.inquiryContent') : 'Inquiry Content',
                    priority: ColumnPriority.MEDIUM,
                    mobileHeader: 'Content',
                    cell: ({ row }) => (
                        <TruncatedText text={row.original.inquiryContent} maxLength={30} />
                    ),
                },

                // 7. Progress Status column with colored badges (always visible) with optimized filtering
                {
                    accessorKey: 'progressStatus',
                    header: t ? t('inquiriesNotifications.columns.progressStatus') : 'Progress Status',
                    priority: ColumnPriority.ESSENTIAL,
                    // Render localized label inside colored badge
                    cell: ({ row }) => {
                        const status = row.original.progressStatus as string | undefined;
                        const colorClass = getInquiryStatusColor(status || '');
                        const label = t
                            ? status === 'OPEN'
                                ? t('inquiriesNotifications.progressStatus.OPEN')
                                : status === 'CLOSED'
                                    ? t('inquiriesNotifications.progressStatus.CLOSED')
                                    : status === 'ON_HOLD'
                                        ? t('inquiriesNotifications.progressStatus.ON_HOLD')
                                        : status
                            : status;
                        return (
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${colorClass}`}>
                                {label || '--'}
                            </span>
                        );
                    },
                    filterFn: progressStatusFilter,
                },

                // 8. Responder Name column (visible on desktop+)
                createTextColumn<InquiryTableData>(
                    'responderName',
                    t ? t('inquiriesNotifications.columns.responderName') : 'Responder Name',
                    20, // Max length before truncation
                    true, // Show tooltip on hover
                    ColumnPriority.MEDIUM,
                    'Responder'
                ),

                // 9. Resolution Date column (visible on desktop+) with optimized filtering
                {
                    ...createDateColumn<InquiryTableData>(
                        'resolutionDate',
                        t ? t('inquiriesNotifications.columns.resolutionDate') : 'Resolution Date',
                        {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                        },
                        ColumnPriority.LOW,
                        'Resolved'
                    ),
                    filterFn: resolutionDateFilter,
                },
            );

            return columns;
        },
        [onNavigateToDetail, t, includeCheckbox, inquiryTypeFilter, inquiryDateFilter, resolutionDateFilter, progressStatusFilter, getInquiryStatusColor],
        {
            debugName: "inquiry-columns",
            enableLogging: process.env.NODE_ENV === "development",
        }
    );
};

/**
 * Legacy function for backward compatibility - now uses the optimized hook
 * @deprecated Use useInquiryColumns hook instead for better performance
 */
export const createInquiryColumns = (
    onNavigateToDetail?: (inquiry: InquiryTableData) => void,
    t?: TranslationFunction,
    includeCheckbox?: boolean
): ResponsiveColumnDef<InquiryTableData>[] => {
    // This is a fallback implementation for backward compatibility
    // In practice, components should use the useInquiryColumns hook
    const columns: ResponsiveColumnDef<InquiryTableData>[] = [];

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

    // Add the 10 standardized columns as specified in requirements
    columns.push(
        // 1. Date of Inquiry column (always visible)
        createDateColumn<InquiryTableData>(
            'dateOfInquiry',
            t ? t('inquiriesNotifications.columns.dateOfInquiry') : 'Date of Inquiry',
            {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
            },
            ColumnPriority.ESSENTIAL,
            'Date'
        ),

        // 2. Inquirer Name column - clickable navigation to detail page (always visible)
        createNavigationColumn<InquiryTableData>(
            'inquirerName',
            t ? t('inquiriesNotifications.columns.inquirerName') : 'Inquirer Name',
            onNavigateToDetail,
            ColumnPriority.ESSENTIAL,
            'Inquirer'
        ),

        // 3. Contact Info column (visible on tablet+)
        createTextColumn<InquiryTableData>(
            'inquirerContact',
            t ? t('inquiriesNotifications.columns.contactInfo') : 'Contact Info',
            30, // Max length before truncation
            true, // Show tooltip on hover
            ColumnPriority.HIGH,
            'Contact'
        ),

        // 4. Company Name column (visible on tablet+)
        createTextColumn<InquiryTableData>(
            'companyName',
            t ? t('inquiriesNotifications.columns.companyName') : 'Company Name',
            25, // Max length before truncation
            true, // Show tooltip on hover
            ColumnPriority.HIGH,
            'Company'
        ),

        // 5. Type of Inquiry column (visible on desktop+)
        createTextColumn<InquiryTableData>(
            'typeOfInquiry',
            t ? t('inquiriesNotifications.columns.typeOfInquiry') : 'Type of Inquiry',
            20, // Max length before truncation
            true, // Show tooltip on hover
            ColumnPriority.MEDIUM,
            'Type'
        ),

        // 6. Inquiry Content column with truncation (visible on desktop+)
        {
            accessorKey: 'inquiryContent',
            header: t ? t('inquiriesNotifications.columns.inquiryContent') : 'Inquiry Content',
            priority: ColumnPriority.MEDIUM,
            mobileHeader: 'Content',
            cell: ({ row }) => (
                <TruncatedText text={row.original.inquiryContent} maxLength={50} />
            ),
        },

        // 7. Progress Status column with colored badges (always visible)
        createStatusColumn<InquiryTableData>(
            'progressStatus',
            t ? t('inquiriesNotifications.columns.progressStatus') : 'Progress Status',
            getInquiryStatusColor,
            ColumnPriority.ESSENTIAL,
            'Status'
        ),

        // 8. Responder Name column (visible on desktop+)
        createTextColumn<InquiryTableData>(
            'responderName',
            t ? t('inquiriesNotifications.columns.responderName') : 'Responder Name',
            20, // Max length before truncation
            true, // Show tooltip on hover
            ColumnPriority.MEDIUM,
            'Responder'
        ),

        // 9. Resolution Date column (visible on desktop+)
        createDateColumn<InquiryTableData>(
            'resolutionDate',
            t ? t('inquiriesNotifications.columns.resolutionDate') : 'Resolution Date',
            {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
            },
            ColumnPriority.LOW,
            'Resolved'
        ),
    );

    return columns;
};

/**
 * Transform InquiryWithRelations data to InquiryTableData format
 * Handles nullable relationships properly as per requirements
 * @param inquiry - InquiryWithRelations object from API
 * @returns InquiryTableData object for table display
 */
export const transformInquiryForTable = (inquiry: InquiryWithRelations): InquiryTableData => {
    // Helper function to safely format dates (handles both Date objects and date strings)
    const formatDate = (date: Date | string | null): string => {
        if (!date) return '';
        // Pass the date directly to formatDateForTable - it handles both strings and Date objects
        // and will extract the date part from strings without timezone conversion
        return formatDateForTable(date);
    };

    return {
        id: inquiry.id,
        dateOfInquiry: formatDate(inquiry.dateOfInquiry),
        inquirerName: inquiry.inquirerName,
        inquirerContact: inquiry.inquirerContact || '--', // Handle nullable contact field
        companyName: inquiry.company?.name || '--', // Handle nullable company relationship
        typeOfInquiry: inquiry.typeOfInquiry,
        inquiryContent: inquiry.inquiryContent,
        progressStatus: inquiry.progressStatus,
        responderName: inquiry.responder?.name || '--', // Handle nullable responder relationship
        recorderName: inquiry.recorder?.name || '--', // Handle potential null recorder
        resolutionDate: formatDate(inquiry.resolutionDate),
    };
};

/**
 * Transform array of InquiryWithRelations data for table display
 * @param inquiryList - Array of InquiryWithRelations objects
 * @returns Array of InquiryTableData objects
 */
export const transformInquiryListForTable = (inquiryList: InquiryWithRelations[]): InquiryTableData[] =>
    inquiryList.map(transformInquiryForTable);
