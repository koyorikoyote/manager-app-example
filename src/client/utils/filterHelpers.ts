/**
 * Filter Helper Utilities
 *
 * Utility functions for converting between different filter formats
 * and integrating the enhanced filtering system with existing components.
 */
import { ActiveFilter, FilterableColumn } from "../../shared/types/filtering";

/**
 * Convert column filter state to ActiveFilter format for display
 */
export function convertToActiveFilters(
  activeFilters: Record<string, string[] | undefined>,
  filterableColumns: FilterableColumn[]
): ActiveFilter[] {
  const result: ActiveFilter[] = [];

  Object.entries(activeFilters).forEach(([columnKey, values]) => {
    if (!values || values.length === 0) return;

    const column = filterableColumns.find((col) => col.key === columnKey);
    if (!column) return;

    result.push({
      columnKey,
      columnLabel: column.label,
      values,
      displayValues: values, // For now, use values as display values
    });
  });

  return result;
}

/**
 * Get filter summary text for accessibility
 */
export function getFilterSummaryText(
  activeFilters: ActiveFilter[],
  filteredCount: number,
  totalCount: number
): string {
  if (activeFilters.length === 0) {
    return `Showing all ${totalCount} results`;
  }

  const filterCount = activeFilters.reduce(
    (sum, filter) => sum + filter.values.length,
    0
  );
  const columnCount = activeFilters.length;

  return `${filterCount} filters applied across ${columnCount} columns. Showing ${filteredCount} of ${totalCount} results.`;
}

/**
 * Check if filters are applied
 */
export function hasActiveFilters(
  activeFilters: Record<string, string[] | undefined>
): boolean {
  return Object.values(activeFilters).some(
    (values) => values && values.length > 0
  );
}

/**
 * Get total filter count
 */
export function getTotalFilterCount(
  activeFilters: Record<string, string[] | undefined>
): number {
  return Object.values(activeFilters).reduce((sum, values) => {
    return sum + (values ? values.length : 0);
  }, 0);
}

/**
 * Format filter display value
 */
export function formatFilterDisplayValue(
  value: string,
  dataType: string
): string {
  switch (dataType) {
    case "date":
      try {
        return new Date(value).toLocaleDateString();
      } catch {
        return value;
      }
    case "number":
      try {
        return Number(value).toLocaleString();
      } catch {
        return value;
      }
    default:
      return value;
  }
}

/**
 * Generate filter analytics for performance monitoring
 */
export function getFilterAnalytics(activeFilters: ActiveFilter[]) {
  return {
    totalFilters: activeFilters.reduce(
      (sum, filter) => sum + filter.values.length,
      0
    ),
    columnsFiltered: activeFilters.length,
    filtersByColumn: activeFilters.reduce((acc, filter) => {
      acc[filter.columnKey] = filter.values.length;
      return acc;
    }, {} as Record<string, number>),
  };
}
