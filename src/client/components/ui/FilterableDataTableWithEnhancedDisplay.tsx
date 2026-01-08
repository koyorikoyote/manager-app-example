/**
 * FilterableDataTableWithEnhancedDisplay Component
 * 
 * Complete integration of FilterableDataTable with EnhancedActiveFiltersDisplay.
 * This component demonstrates the full enhanced filtering functionality.
 */
import React from 'react';
import { FilterableDataTable } from './FilterableDataTable';
import { EnhancedActiveFiltersDisplay } from './EnhancedActiveFiltersDisplay';
import { ColumnFilterProvider } from '../../contexts/ColumnFilterContext';
import { useEnhancedFilters } from '../../hooks/useEnhancedFilters';

interface FilterableDataTableWithEnhancedDisplayProps<TData extends Record<string, unknown>> {
    /** Column definitions with responsive configuration */
    columns: any[];
    /** Array of data to display in the table */
    data: TData[];
    /** Table name for filter analysis */
    tableName: string;
    /** Total count before filtering */
    totalCount?: number;
    /** Whether to show the enhanced active filters display */
    showEnhancedFilters?: boolean;
}

/**
 * Internal component that has access to the filter context
 */
function EnhancedFilterDisplay<TData extends Record<string, unknown>>({
    data,
    totalCount,
    showEnhancedFilters = true,
}: {
    data: TData[];
    totalCount?: number;
    showEnhancedFilters?: boolean;
}) {
    const filterState = useEnhancedFilters();

    // Apply filters to data (basic client-side filtering)
    const filteredData = React.useMemo(() => {
        if (!filterState.hasFilters) {
            return data;
        }

        return data.filter(row => {
            return filterState.activeFilters.every(filter => {
                const columnValue = String(row[filter.columnKey] || '').toLowerCase();
                return filter.values.some(filterValue =>
                    columnValue.includes(filterValue.toLowerCase())
                );
            });
        });
    }, [data, filterState.activeFilters, filterState.hasFilters]);

    const filteredCount = filteredData.length;
    const actualTotalCount = totalCount || data.length;

    if (!showEnhancedFilters) {
        return null;
    }

    return (
        <EnhancedActiveFiltersDisplay
            activeFilters={filterState.activeFilters}
            filteredCount={filteredCount}
            totalCount={actualTotalCount}
            onRemoveFilter={filterState.removeFilter}
            onClearAllFilters={filterState.clearAllFilters}
            showResultsCount={true}
            isLoading={filterState.isLoading}
        />
    );
}

/**
 * FilterableDataTableWithEnhancedDisplay - Complete filtering solution
 * 
 * Combines FilterableDataTable with EnhancedActiveFiltersDisplay to provide:
 * - Automatic column analysis and filtering
 * - Enhanced active filters display with grouping
 * - Individual filter value removal
 * - Results count and bulk operations
 * - Mobile-optimized interface
 * - Comprehensive accessibility support
 */
export function FilterableDataTableWithEnhancedDisplay<TData extends Record<string, unknown>>({
    showEnhancedFilters = true,
    ...props
}: FilterableDataTableWithEnhancedDisplayProps<TData>) {
    // If enhanced filters are disabled, use the standard FilterableDataTable
    if (!showEnhancedFilters) {
        return <FilterableDataTable {...props} />;
    }

    // Wrap with ColumnFilterProvider if not already wrapped
    return (
        <ColumnFilterProvider
            tableName={props.tableName}
            filterableColumns={[]} // Will be populated by FilterableDataTable
        >
            <div className="space-y-4">
                {/* Enhanced Active Filters Display */}
                <EnhancedFilterDisplay
                    data={props.data}
                    totalCount={props.totalCount}
                    showEnhancedFilters={showEnhancedFilters}
                />

                {/* Filterable Data Table */}
                <FilterableDataTable {...props} />
            </div>
        </ColumnFilterProvider>
    );
}

export type { FilterableDataTableWithEnhancedDisplayProps };