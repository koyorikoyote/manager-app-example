/**
 * Filter Components - Enhanced datatable filtering components
 *
 * This module exports all the filter components for use in DataTable:
 * - DropdownFilter: Multi-select dropdown with search
 * - DateRangeFilter: Date range picker with validation
 * - NumericRangeFilter: Radio button selection for numeric ranges
 */

export { DropdownFilter } from "./DropdownFilter";
export type { DropdownFilterProps, FilterOption } from "./DropdownFilter";

export { DateRangeFilter } from "./DateRangeFilter";
export type { DateRangeFilterProps } from "./DateRangeFilter";

export { NumericRangeFilter } from "./NumericRangeFilter";
export type {
  NumericRangeFilterProps,
  NumericRange,
} from "./NumericRangeFilter";

// Common filter types
export type FilterType = "dropdown" | "dateRange" | "numericRange";

export interface BaseFilterProps {
  columnId: string;
  columnLabel: string;
  data: Record<string, unknown>[];
  onFilterChange: (values: string[]) => void;
  currentFilter: string[];
  triggerElement: HTMLElement | null;
  onClose: () => void;
}
