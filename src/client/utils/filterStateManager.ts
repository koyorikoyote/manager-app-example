/**
 * Filter State Manager
 *
 * Manages filter state consistency between TanStack Table and our custom filter components.
 * Ensures proper filter validation, state synchronization, and performance optimization.
 */

import { ColumnFiltersState } from "@tanstack/react-table";
import { FilterConfiguration } from "./filterTypeDetection";
import { validateFilterValue } from "./tableFilterFunctions";

export interface FilterStateManager {
  validateAndApplyFilter: (
    columnId: string,
    values: string[],
    filterConfig?: FilterConfiguration
  ) => { isValid: boolean; filterValue: string[] | undefined; error?: string };

  syncFilterState: (
    columnFilters: ColumnFiltersState,
    onFiltersChange?: (filters: Record<string, string[]>) => void
  ) => void;

  clearAllFilters: (
    setColumnFilters: (filters: ColumnFiltersState) => void,
    onFiltersChange?: (filters: Record<string, string[]>) => void
  ) => void;

  getActiveFilterCount: (columnFilters: ColumnFiltersState) => number;
}

/**
 * Validates and formats filter values based on filter type
 */
export function validateAndApplyFilter(
  columnId: string,
  values: string[],
  filterConfig?: FilterConfiguration
): { isValid: boolean; filterValue: string[] | undefined; error?: string } {
  // Empty values are always valid (clears filter)
  if (!values || values.length === 0) {
    return { isValid: true, filterValue: undefined };
  }

  // If no filter config, assume dropdown filter
  const filterType = filterConfig?.filterType || "dropdown";

  // Validate filter values
  const isValid = validateFilterValue(filterType, values);

  if (!isValid) {
    return {
      isValid: false,
      filterValue: undefined,
      error: `Invalid filter values for ${filterType} filter`,
    };
  }

  // Additional validation based on filter type
  switch (filterType) {
    case "dateRange":
      if (values.length === 2) {
        const [startDate, endDate] = values.map((v) => new Date(v));
        if (startDate > endDate) {
          return {
            isValid: false,
            filterValue: undefined,
            error: "Start date must be before end date",
          };
        }
      }
      break;

    case "numericRange":
      if (values.length === 1 && values[0].includes("-")) {
        const [min, max] = values[0].split("-").map((v) => parseFloat(v));
        if (min > max) {
          return {
            isValid: false,
            filterValue: undefined,
            error: "Minimum value must be less than maximum value",
          };
        }
      }
      break;
  }

  return { isValid: true, filterValue: values };
}

/**
 * Synchronizes filter state between TanStack Table and parent component
 */
export function syncFilterState(
  columnFilters: ColumnFiltersState,
  onFiltersChange?: (filters: Record<string, string[]>) => void
): void {
  if (!onFiltersChange) return;

  const filterMap = columnFilters.reduce((acc, filter) => {
    if (
      filter.value &&
      Array.isArray(filter.value) &&
      filter.value.length > 0
    ) {
      acc[filter.id] = filter.value;
    }
    return acc;
  }, {} as Record<string, string[]>);

  onFiltersChange(filterMap);
}

/**
 * Clears all active filters
 */
export function clearAllFilters(
  setColumnFilters: (filters: ColumnFiltersState) => void,
  onFiltersChange?: (filters: Record<string, string[]>) => void
): void {
  setColumnFilters([]);
  onFiltersChange?.({});
}

/**
 * Gets the count of active filters
 */
export function getActiveFilterCount(
  columnFilters: ColumnFiltersState
): number {
  return columnFilters.filter(
    (filter) =>
      filter.value && Array.isArray(filter.value) && filter.value.length > 0
  ).length;
}

/**
 * Formats filter values for display in UI components
 */
export function formatFilterValueForDisplay(
  values: string[],
  filterType: "dropdown" | "dateRange" | "numericRange"
): string {
  if (!values || values.length === 0) {
    return "No filter";
  }

  switch (filterType) {
    case "dropdown":
      if (values.length === 1) {
        return values[0];
      }
      return `${values.length} selected`;

    case "dateRange":
      if (values.length === 1) {
        return `From ${values[0]}`;
      } else if (values.length === 2) {
        return `${values[0]} to ${values[1]}`;
      }
      return "Date range";

    case "numericRange":
      if (values.length === 1 && values[0].includes("-")) {
        const [min, max] = values[0].split("-");
        return `${min} to ${max}`;
      }
      return "Numeric range";

    default:
      return `${values.length} filter(s)`;
  }
}

/**
 * Merges filter configurations with current filter state
 */
export function mergeFilterState(
  currentFilters: ColumnFiltersState,
  newFilter: { columnId: string; values: string[] },
  filterConfigurations: Record<string, FilterConfiguration>
): ColumnFiltersState {
  const { columnId, values } = newFilter;
  const filterConfig = filterConfigurations[columnId];

  // Validate the new filter
  const validation = validateAndApplyFilter(columnId, values, filterConfig);

  if (!validation.isValid) {
    console.warn(`Invalid filter for column ${columnId}:`, validation.error);
    return currentFilters; // Return unchanged state
  }

  // Update the filter state
  const updatedFilters = currentFilters.filter((f) => f.id !== columnId);

  if (validation.filterValue && validation.filterValue.length > 0) {
    updatedFilters.push({
      id: columnId,
      value: validation.filterValue,
    });
  }

  return updatedFilters;
}

/**
 * Creates a filter state manager instance
 */
export function createFilterStateManager(): FilterStateManager {
  return {
    validateAndApplyFilter,
    syncFilterState,
    clearAllFilters,
    getActiveFilterCount,
  };
}

// Export a default instance
export const filterStateManager = createFilterStateManager();
