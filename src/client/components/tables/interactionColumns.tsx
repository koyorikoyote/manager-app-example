import * as React from "react";
import { InteractionRecord } from '../../../shared/types';
import {
    createStatusColumn,
    createDateColumn,
    createTextColumn,
    statusColorHelpers,
    type ResponsiveColumnDef,
    ColumnPriority,
} from '../../utils/columnHelpers';
import { cn } from '../../utils/cn';

/**
 * Interaction table data interface for DataTable component
 */
export interface InteractionTableData extends Record<string, unknown> {
    id: string;
    description: string;
    type: 'discussion' | 'interview' | 'consultation' | 'other';
    status: 'open' | 'in-progress' | 'resolved';
    date: Date;
    createdBy: string;
    updatedAt: Date;
}

/**
 * Create interaction table column definitions
 * @returns Array of column definitions for interaction table
 */
export const createInteractionColumns = (): ResponsiveColumnDef<InteractionTableData>[] => [
    // Description column with truncation and hover tooltip (always visible)
    createTextColumn<InteractionTableData>(
        'description',
        'Description',
        60, // Max length before truncation
        true, // Show full text on hover
        ColumnPriority.ESSENTIAL,
        'Description'
    ),

    // Type column with colored badges (visible on tablet+)
    {
        accessorKey: 'type',
        header: 'Type',
        priority: ColumnPriority.HIGH,
        mobileHeader: 'Type',
        cell: ({ row }: { row: { original: InteractionTableData } }) => {
            const type = row.original.type;
            if (!type) {
                return React.createElement(
                    "span",
                    { className: "text-neutral-400" },
                    "--"
                );
            }

            const typeColors = statusColorHelpers.getInteractionTypeColor(type);
            const displayType = type.charAt(0).toUpperCase() + type.slice(1);

            return React.createElement(
                "span",
                {
                    className: cn(
                        "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium",
                        typeColors
                    ),
                },
                displayType
            );
        },
        filterFn: (row: any, id: string, value: any) => {
            if (!value || value.length === 0) return true;
            return value.includes(row.getValue(id));
        },
    } as ResponsiveColumnDef<InteractionTableData>,

    // Status column with colored badges (always visible)
    createStatusColumn<InteractionTableData>(
        'status',
        'Status',
        statusColorHelpers.getInteractionStatusColor,
        ColumnPriority.ESSENTIAL,
        'Status'
    ),

    // Date column with locale formatting (visible on tablet+)
    createDateColumn<InteractionTableData>(
        'date',
        'Date',
        {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        },
        ColumnPriority.HIGH,
        'Date'
    ),

    // Created By column (visible on desktop+)
    createTextColumn<InteractionTableData>(
        'createdBy',
        'Created By',
        undefined,
        true,
        ColumnPriority.MEDIUM,
        'By'
    ),

    // Updated At column with date and time formatting (visible on desktop+)
    createDateColumn<InteractionTableData>(
        'updatedAt',
        'Updated',
        {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        },
        ColumnPriority.LOW,
        'Updated'
    ),
];

/**
 * Transform InteractionRecord data to InteractionTableData format
 * @param interaction - InteractionRecord object from API
 * @returns InteractionTableData object for table display
 */
export const transformInteractionForTable = (interaction: InteractionRecord): InteractionTableData => ({
    id: String(interaction.id),
    description: interaction.description,
    // Normalize type to the lowercase keys expected by the table ('discussion','interview','consultation','other')
    type: interaction.type ? String(interaction.type).toLowerCase() as any : (interaction.type as any),
    // Normalize status to the lowercase / dash format expected by the table ('open','in-progress','resolved')
    status: interaction.status ? String(interaction.status).toLowerCase().replace('_', '-') as any : 'open',
    date: interaction.date,
    createdBy: interaction.createdBy?.toString() || '',
    updatedAt: interaction.updatedAt,
});

/**
 * Transform array of InteractionRecord data for table display
 * @param interactionList - Array of InteractionRecord objects
 * @returns Array of InteractionTableData objects
 */
export const transformInteractionListForTable = (interactionList: InteractionRecord[]): InteractionTableData[] =>
    interactionList.map(transformInteractionForTable);
