import { ComplaintDetailWithRelations, ComplaintTableData } from '../../../shared/types';

export type { ComplaintTableData };
import {
    createStatusColumn,
    createDateColumn,
    createNavigationColumn,
    createTextColumn,
    createNumericColumn,
    type ResponsiveColumnDef,
    ColumnPriority,
} from '../../utils/columnHelpers';
import { formatDateForTable } from '../../utils/localization';

/**
 * Get color classes for complaint status
 */
const getComplaintStatusColor = (status: string): string => {
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
 * Create complaint details table column definitions
 * @param onNavigateToDetail - Function to handle navigation to complaint detail page
 * @param t - Translation function
 * @returns Array of column definitions for complaint details table
 */
export const createComplaintColumns = (
    onNavigateToDetail?: (complaint: ComplaintTableData) => void,
    t?: any
): ResponsiveColumnDef<ComplaintTableData>[] => [
        // Date of Occurrence column (always visible)
        createDateColumn<ComplaintTableData>(
            'dateOfOccurrence',
            t?.('complaintDetails.columns.dateOfOccurrence') || 'Date of Occurrence',
            {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
            },
            ColumnPriority.ESSENTIAL,
            'Date'
        ),

        // Complainer Name column - clickable navigation to detail page (always visible)
        createNavigationColumn<ComplaintTableData>(
            'complainerName',
            t?.('complaintDetails.columns.complainerName') || 'Complainer Name',
            onNavigateToDetail,
            ColumnPriority.ESSENTIAL,
            'Complainer'
        ),

        // Contact Info column (visible on tablet+)
        createTextColumn<ComplaintTableData>(
            'complainerContact',
            t?.('complaintDetails.columns.complainerContact') || 'Contact Info',
            30, // Max length before truncation
            true, // Show tooltip on hover
            ColumnPriority.HIGH,
            'Contact'
        ),

        // Person Involved column (visible on tablet+)
        createTextColumn<ComplaintTableData>(
            'personInvolved',
            t?.('complaintDetails.columns.personInvolved') || 'Person Involved',
            25, // Max length before truncation
            true, // Show tooltip on hover
            ColumnPriority.HIGH,
            'Person'
        ),

        // Progress Status column with colored badges (always visible)
        createStatusColumn<ComplaintTableData>(
            'progressStatus',
            t?.('complaintDetails.columns.progressStatus') || 'Progress Status',
            getComplaintStatusColor,
            ColumnPriority.ESSENTIAL,
            'Status'
        ),

        // Urgency Level column (visible on desktop+)
        createTextColumn<ComplaintTableData>(
            'urgencyLevel',
            t?.('complaintDetails.columns.urgencyLevel') || 'Urgency Level',
            undefined,
            true,
            ColumnPriority.MEDIUM,
            'Urgency'
        ),

        // Complaint Content column with truncation (visible on desktop+)
        createTextColumn<ComplaintTableData>(
            'complaintContent',
            t?.('complaintDetails.columns.complaintContent') || 'Complaint Content',
            50, // Max length before truncation
            true, // Show tooltip on hover
            ColumnPriority.MEDIUM,
            'Content'
        ),

        // Days Passed column with numeric formatting (visible on tablet+)
        createNumericColumn<ComplaintTableData>(
            'daysPassed',
            t?.('complaintDetails.columns.daysPassed') || 'Days Passed',
            (value: number) => `${value} days`,
            ColumnPriority.HIGH,
            'Days'
        ),

        // Responder Name column (visible on desktop+)
        createTextColumn<ComplaintTableData>(
            'responderName',
            t?.('complaintDetails.columns.responderName') || 'Responder Name',
            20, // Max length before truncation
            true, // Show tooltip on hover
            ColumnPriority.MEDIUM,
            'Respondent'
        ),

        // Company Name column (visible on desktop+)
        createTextColumn<ComplaintTableData>(
            'companyName',
            t?.('complaintDetails.columns.companyName') || 'Company Name',
            25, // Max length before truncation
            true, // Show tooltip on hover
            ColumnPriority.MEDIUM,
            'Company'
        ),

        // Recorder Name column (visible on desktop+)
        createTextColumn<ComplaintTableData>(
            'recorderName',
            t?.('complaintDetails.columns.recorderName') || 'Recorder Name',
            20, // Max length before truncation
            true, // Show tooltip on hover
            ColumnPriority.MEDIUM,
            'Recorder'
        ),

        // Resolution Date column (visible on desktop+)
        createDateColumn<ComplaintTableData>(
            'resolutionDate',
            t?.('complaintDetails.columns.resolutionDate') || 'Resolution Date',
            {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
            },
            ColumnPriority.LOW,
            'Resolved'
        ),
    ];

/**
 * Transform ComplaintDetailWithRelations data to ComplaintTableData format
 * @param complaint - ComplaintDetailWithRelations object from API
 * @returns ComplaintTableData object for table display
 */
export const transformComplaintForTable = (complaint: ComplaintDetailWithRelations): ComplaintTableData => {
    // Helper function to safely format dates (Tokyo-aware YYYY/MM/DD)
    const formatDate = (date: Date | string | null): string => {
        if (!date) return '--';
        try {
            const formatted = formatDateForTable(date as Date | string);
            return formatted || '--';
        } catch {
            return '--';
        }
    };

    return {
        id: complaint.id,
        dateOfOccurrence: formatDate(complaint.dateOfOccurrence),
        complainerName: complaint.complainerName,
        complainerContact: complaint.complainerContact,
        personInvolved: complaint.personInvolved,
        progressStatus: complaint.progressStatus,
        urgencyLevel: complaint.urgencyLevel,
        complaintContent: complaint.complaintContent,
        daysPassed: complaint.daysPassed || 0,
        responderName: complaint.responder?.name || '--',
        companyName: complaint.company?.name || '--',
        recorderName: complaint.recorder.name,
        resolutionDate: formatDate(complaint.resolutionDate),
    };
};

/**
 * Transform array of ComplaintDetailWithRelations data for table display
 * @param complaintList - Array of ComplaintDetailWithRelations objects
 * @returns Array of ComplaintTableData objects
 */
export const transformComplaintListForTable = (complaintList: ComplaintDetailWithRelations[]): ComplaintTableData[] =>
    complaintList.map(transformComplaintForTable);
