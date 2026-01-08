import React from 'react';
import { DailyRecordWithRelations, DailyRecordTableData } from '../../../shared/types';

export type { DailyRecordTableData };
import {
    type ResponsiveColumnDef,
    ColumnPriority,
} from '../../utils/columnHelpers';
import { Checkbox } from '../ui/Checkbox';
import { ConditionBadge } from '../ui/ConditionBadge';
import { TruncatedText } from '../ui/TruncatedText';
import { formatDateForInput } from '../../utils/dateUtils';

/**
 * Create daily record table column definitions
 * @param onNavigateToDetail - Function to handle navigation to daily record detail page
 * @param t - Translation function
 * @param includeCheckbox - Whether to include checkbox column for bulk selection
 * @returns Array of column definitions for daily record table
 */
export const createDailyRecordColumns = (
    onNavigateToDetail?: (dailyRecord: DailyRecordTableData) => void,
    t?: unknown,
    includeCheckbox?: boolean
): ResponsiveColumnDef<DailyRecordTableData>[] => {
    const columns: ResponsiveColumnDef<DailyRecordTableData>[] = [];

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

    // Add the 5 standardized columns as specified in requirements
    columns.push({
        accessorKey: "dateOfRecord",
        header: (t && typeof t === 'function') ? t('dailyRecord.columns.dateOfRecord') : 'Date of Record',
        priority: ColumnPriority.ESSENTIAL,
        mobileHeader: 'Date',
        cell: ({ row }: { row: { original: DailyRecordTableData } }) => {
            const date = row.original.dateOfRecord;
            if (!date) return <span className="text-neutral-400">--</span>;
            return <span>{date}</span>;
        }
    });

    columns.push({
        accessorKey: "staffName",
        header: (t && typeof t === 'function') ? t('dailyRecord.columns.staffName') : 'Staff Name',
        priority: ColumnPriority.ESSENTIAL,
        mobileHeader: 'Staff',
        cell: ({ row }: { row: { original: DailyRecordTableData } }) => (
            <button
                onClick={() => onNavigateToDetail?.(row.original)}
                className="text-blue-600 hover:underline font-medium text-left"
            >
                {row.original.staffName || "--"}
            </button>
        )
    });

    columns.push({
        accessorKey: "conditionStatus",
        header: (t && typeof t === 'function') ? t('dailyRecord.columns.conditionStatus') : 'Condition Status',
        priority: ColumnPriority.HIGH,
        mobileHeader: 'Status',
        cell: ({ row }: { row: { original: DailyRecordTableData } }) => {
            const status = row.original.conditionStatus as 'Excellent' | 'Good' | 'Fair' | 'Poor';
            if (!status) return <span className="text-neutral-400">--</span>;
            return <ConditionBadge condition={status} />;
        }
    });

    columns.push({
        accessorKey: "feedbackContent",
        header: (t && typeof t === 'function') ? t('dailyRecord.columns.feedbackContent') : 'Feedback Content',
        priority: ColumnPriority.HIGH,
        mobileHeader: 'Feedback',
        cell: ({ row }: { row: { original: DailyRecordTableData } }) => {
            const content = row.original.feedbackContent;
            if (!content) return <span className="text-neutral-400">--</span>;
            return <TruncatedText text={content} maxLength={50} />;
        }
    });

    columns.push({
        accessorKey: "contactNumber",
        header: (t && typeof t === 'function') ? t('dailyRecord.columns.contactNumber') : 'Contact Number',
        priority: ColumnPriority.MEDIUM,
        mobileHeader: 'Contact',
        cell: ({ row }: { row: { original: DailyRecordTableData } }) => {
            const contact = row.original.contactNumber;
            return <span>{contact || "--"}</span>;
        }
    });

    return columns;
};

/**
 * Transform DailyRecordWithRelations data to DailyRecordTableData format
 * @param dailyRecord - DailyRecordWithRelations object from API
 * @returns DailyRecordTableData object for table display
 */
export const transformDailyRecordForTable = (dailyRecord: DailyRecordWithRelations): DailyRecordTableData => {
    // Helper function to safely format dates (handles both Date objects and date strings)
    const formatDate = (date: Date | string | null | undefined): string => {
        if (!date) return "";
        const normalized = formatDateForInput(date);
        return normalized ? normalized.replace(/-/g, "/") : "";
    };

    return {
        id: dailyRecord.id,
        dateOfRecord: formatDate(dailyRecord.dateOfRecord),
        staffName: dailyRecord.staff.name,
        conditionStatus: dailyRecord.conditionStatus,
        feedbackContent: dailyRecord.feedbackContent,
        contactNumber: dailyRecord.contactNumber || '--',
    };
};

/**
 * Transform array of DailyRecordWithRelations data for table display
 * @param dailyRecordList - Array of DailyRecordWithRelations objects
 * @returns Array of DailyRecordTableData objects
 */
export const transformDailyRecordListForTable = (dailyRecordList: DailyRecordWithRelations[]): DailyRecordTableData[] =>
    dailyRecordList.map(transformDailyRecordForTable);
