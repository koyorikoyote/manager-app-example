/**
 * useEnhancedFilters Hook
 *
 * Custom hook that integrates the enhanced filtering system with the ColumnFilterContext.
 * Provides formatted data for the EnhancedActiveFiltersDisplay component.
 */
import { useMemo } from "react";
import { useColumnFilters } from "../contexts/ColumnFilterContext";
import {
  convertToActiveFilters,
  hasActiveFilters,
  getTotalFilterCount,
} from "../utils/filterHelpers";
import { ActiveFilter } from "../../shared/types/filtering";

export interface UseEnhancedFiltersReturn {
  /** Active filters formatted for display */
  activeFilters: ActiveFilter[];
  /** Whether any filters are currently active */
  hasFilters: boolean;
  /** Total number of filter values applied */
  totalFilterCount: number;
  /** Remove a specific filter value */
  removeFilter: (columnKey: string, value?: string) => void;
  /** Clear all active filters */
  clearAllFilters: () => void;
  /** Loading state */
  isLoading: boolean;
  /** Error state */
  error: string | null;
}

/**
 * Hook for enhanced filtering functionality
 *
 * Integrates with ColumnFilterContext to provide:
 * - Formatted active filters for display
 * - Filter management actions
 * - Loading and error states
 * - Filter analytics
 */
export function useEnhancedFilters(): UseEnhancedFiltersReturn {
  const { state, actions } = useColumnFilters();

  // Convert filter state to display format
  const activeFilters = useMemo(() => {
    return convertToActiveFilters(state.activeFilters, state.filterableColumns);
  }, [state.activeFilters, state.filterableColumns]);

  // Check if any filters are active
  const hasFilters = useMemo(() => {
    return hasActiveFilters(state.activeFilters);
  }, [state.activeFilters]);

  // Get total filter count
  const totalFilterCount = useMemo(() => {
    return getTotalFilterCount(state.activeFilters);
  }, [state.activeFilters]);

  return {
    activeFilters,
    hasFilters,
    totalFilterCount,
    removeFilter: actions.removeFilter,
    clearAllFilters: actions.clearAllFilters,
    isLoading: state.isLoading,
    error: state.error,
  };
}

/**
 * Hook for filter analytics and monitoring
 */
export function useFilterAnalytics() {
  const { state } = useColumnFilters();

  return useMemo(() => {
    const activeFilters = convertToActiveFilters(
      state.activeFilters,
      state.filterableColumns
    );

    return {
      totalFilters: activeFilters.reduce(
        (sum, filter) => sum + filter.values.length,
        0
      ),
      columnsFiltered: activeFilters.length,
      filterableColumnsCount: state.filterableColumns.length,
      filterUtilization:
        state.filterableColumns.length > 0
          ? activeFilters.length / state.filterableColumns.length
          : 0,
      filtersByColumn: activeFilters.reduce((acc, filter) => {
        acc[filter.columnKey] = filter.values.length;
        return acc;
      }, {} as Record<string, number>),
    };
  }, [state.activeFilters, state.filterableColumns]);
}
