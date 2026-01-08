/**
 * FilterableDataTable Component - Enhanced DataTable with column filtering capabilities
 * 
 * This component wraps the existing DataTable with ColumnFilterProvider to add
 * intelligent column filtering functionality. It automatically analyzes columns
 * to determine which ones are filterable and provides filter UI components.
 */
import React, { useEffect, useState, useMemo } from 'react';
import { ColumnFilterProvider, useColumnFilters } from '../../contexts/ColumnFilterContext';
import { FilterableColumn } from '../../../shared/types/filtering';
import { type ResponsiveColumnDef } from '../../utils/columnHelpers';
import { type RowSelectionState, type SortingState } from '@tanstack/react-table';

interface FilterableDataTableProps<TData extends Record<string, unknown>> {
    /** Column definitions with responsive configuration */
    columns: ResponsiveColumnDef<TData>[];
    /** Array of data to display in the table */
    data: TData[];
    /** Table name for filter analysis (e.g., 'staff', 'properties') */
    tableName: string;
    /** Enable column filtering functionality */
    enableColumnFiltering?: boolean;
    /** Custom filter analyzer endpoint */
    filterAnalyzerEndpoint?: string;
    /** Loading state indicator */
    loading?: boolean;
    /** Error message to display */
    error?: string | null;
    /** Callback for row selection changes */
    onRowSelectionChange?: (state: RowSelectionState) => void;
    /** Enable row selection functionality */
    enableRowSelection?: boolean;
    /** Row selection mode - single or multiple */
    rowSelectionMode?: 'multiple' | 'single';
    /** Callback for row click events */
    onRowClick?: (row: TData) => void;
    /** Search query for filtering */
    searchQuery?: string;
    /** Custom empty state message */
    emptyStateMessage?: string;
    /** Additional CSS classes */
    className?: string;
    /** Enable responsive column visibility */
    enableResponsive?: boolean;
    /** Show horizontal scroll navigation buttons */
    showScrollButtons?: boolean;
    /** Results summary text to display inline with scroll buttons */
    resultsSummary?: string;
    /** Loading text to display next to results summary */
    loadingText?: string;
    /** Retry callback */
    onRetry?: () => void;
    /** Clear filters callback */
    onClearFilters?: () => void;
    /** Whether there are active filters */
    hasActiveFilters?: boolean;
    /** Total count before filtering */
    totalCount?: number;
    /** External pagination control */
    externalPagination?: {
        pageIndex: number;
        pageSize: number;
        onPaginationChange: (pagination: { pageIndex: number; pageSize: number }) => void;
    };
    /** External sorting control */
    externalSorting?: {
        sorting: SortingState;
        onSortingChange: (sorting: SortingState) => void;
    };
    /** Callback when filters change */
    onFiltersChange?: (filters: Record<string, string[]>) => void;
}

/**
 * FilterableDataTable - Enhanced DataTable with automatic column filtering
 * 
 * This component provides all the functionality of DataTable plus:
 * - Automatic column analysis to determine filterable columns
 * - Filter state management through ColumnFilterProvider
 * - Integration with FilterAnalyzer service
 * - Backward compatibility with existing DataTable usage
 */
export function FilterableDataTable<TData extends Record<string, unknown>>({
    columns,
    data,
    tableName,
    enableColumnFiltering = true,
    filterAnalyzerEndpoint,
    onFiltersChange,
    ...dataTableProps
}: FilterableDataTableProps<TData>) {
    const [filterableColumns, setFilterableColumns] = useState<FilterableColumn[]>([]);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [analysisError, setAnalysisError] = useState<string | null>(null);

    // Convert columns to column definitions for analysis
    const columnDefinitions = useMemo(() => {
        return columns.map(column => ({
            key: column.accessorKey || column.id || '',
            label: typeof column.header === 'string' ? column.header : column.accessorKey || column.id || '',
            dataType: 'string' as const, // Default to string, could be enhanced to detect type
        })).filter(col => col.key); // Filter out columns without keys
    }, [columns]);

    // Analyze columns for filtering capabilities
    useEffect(() => {
        if (!enableColumnFiltering || !tableName || columnDefinitions.length === 0) {
            return;
        }

        const analyzeColumns = async () => {
            setIsAnalyzing(true);
            setAnalysisError(null);

            try {
                const endpoint = filterAnalyzerEndpoint || `/api/filters/${tableName}/analyze`;
                const response = await fetch(endpoint, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ columns: columnDefinitions }),
                });

                if (!response.ok) {
                    throw new Error(`Failed to analyze columns: ${response.statusText}`);
                }

                const analyzedColumns: FilterableColumn[] = await response.json();
                setFilterableColumns(analyzedColumns);
            } catch (error) {
                const errorMessage = error instanceof Error ? error.message : 'Failed to analyze columns';
                setAnalysisError(errorMessage);
                console.error('Column analysis failed:', error);

                // Graceful degradation - continue without filtering
                setFilterableColumns([]);
            } finally {
                setIsAnalyzing(false);
            }
        };

        analyzeColumns();
    }, [tableName, columnDefinitions, enableColumnFiltering, filterAnalyzerEndpoint]);

    // If column filtering is disabled or no table name provided, render basic table
    if (!enableColumnFiltering || !tableName) {
        // Import DataTable dynamically to avoid circular dependency
        const { DataTable } = require('./DataTable');
        return React.createElement(DataTable, {
            columns,
            data,
            enableColumnFiltering: false,
            ...dataTableProps,
        });
    }

    // Render with ColumnFilterProvider
    return (
        <ColumnFilterProvider
            tableName={tableName}
            filterableColumns={filterableColumns}
        >
            <FilterableDataTableContent
                columns={columns}
                data={data}
                isAnalyzing={isAnalyzing}
                analysisError={analysisError}
                onFiltersChange={onFiltersChange}
                tableName={tableName}
                {...dataTableProps}
            />
        </ColumnFilterProvider>
    );
}

// Internal component that has access to the filter context
interface FilterableDataTableContentProps<TData extends Record<string, unknown>>
    extends Omit<FilterableDataTableProps<TData>, 'tableName' | 'enableColumnFiltering' | 'filterAnalyzerEndpoint'> {
    isAnalyzing: boolean;
    analysisError: string | null;
}

function FilterableDataTableContent<TData extends Record<string, unknown>>({
    columns,
    data,
    isAnalyzing,
    analysisError,
    onFiltersChange,
    loading,
    error,
    totalCount,
    externalPagination,
    searchQuery,
    tableName,
    ...dataTableProps
}: FilterableDataTableContentProps<TData> & { tableName: string }) {
    // Get filter context (will be available since we're inside ColumnFilterProvider)
    const filterState = useColumnFilters();

    // Apply filters to data (client-side filtering)
    const filteredData = React.useMemo(() => {
        let result = data;

        // Apply column filters
        const activeFilters = filterState.state.activeFilters;
        Object.entries(activeFilters).forEach(([columnKey, values]) => {
            if (values && values.length > 0) {
                result = result.filter((row: Record<string, unknown>) => {
                    const cellValue = row[columnKey];
                    if (cellValue == null) return false;
                    return values.includes(String(cellValue));
                });
            }
        });

        // Apply search query if provided
        if (searchQuery && searchQuery.trim()) {
            const searchTerm = searchQuery.toLowerCase();
            result = result.filter((row: Record<string, unknown>) => {
                return Object.values(row).some(value =>
                    value != null && String(value).toLowerCase().includes(searchTerm)
                );
            });
        }

        return result;
    }, [data, filterState.state.activeFilters, searchQuery]);

    // Enhanced loading/error states
    const enhancedLoading = loading || isAnalyzing || filterState.state.isLoading;
    const enhancedError = error || analysisError || filterState.state.error;

    // Calculate counts
    const actualTotalCount = totalCount || data.length;
    const hasActiveFilters = Object.keys(filterState.state.activeFilters).some(
        key => {
            const values = filterState.state.activeFilters[key];
            return values && values.length > 0;
        }
    );

    // Reset pagination when filters change
    React.useEffect(() => {
        if (externalPagination && hasActiveFilters) {
            externalPagination.onPaginationChange({
                pageIndex: 0,
                pageSize: externalPagination.pageSize
            });
        }
    }, [filterState.state.activeFilters, externalPagination, hasActiveFilters]);

    // Notify parent of filter changes
    React.useEffect(() => {
        if (onFiltersChange) {
            // Filter out undefined values before passing to parent
            const cleanFilters: Record<string, string[]> = {};
            Object.entries(filterState.state.activeFilters).forEach(([key, values]) => {
                if (values && values.length > 0) {
                    cleanFilters[key] = values;
                }
            });
            onFiltersChange(cleanFilters);
        }
    }, [filterState.state.activeFilters, onFiltersChange]);

    return (
        <div className="space-y-4">
            {/* Active Filters Display */}
            {hasActiveFilters && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <div className="flex items-center justify-between text-sm">
                        <span className="text-blue-700 font-medium">
                            {Object.keys(filterState.state.activeFilters).length} filter{Object.keys(filterState.state.activeFilters).length !== 1 ? 's' : ''} applied
                        </span>
                        <button
                            onClick={filterState.actions.clearAllFilters}
                            className="text-blue-600 hover:text-blue-800 underline"
                        >
                            Clear All
                        </button>
                    </div>
                </div>
            )}

            {/* Data Table */}
            {React.createElement(require('./DataTable').DataTable, {
                columns,
                data: filteredData,
                loading: enhancedLoading,
                error: enhancedError,
                totalCount: actualTotalCount,
                hasActiveFilters,
                onClearFilters: filterState.actions.clearAllFilters,
                enableColumnFiltering: false, // Prevent recursive filtering
                ...dataTableProps,
            })}
        </div>
    );
}