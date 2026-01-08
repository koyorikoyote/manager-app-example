/**
 * Table Filter Functions for TanStack Table Integration
 *
 * Custom filter functions that handle different filter types
 * (dropdown, date range, numeric range) and integrate with TanStack Table.
 */

import { Row, FilterFn, FilterMeta } from "@tanstack/react-table";

type Named = { name: string };

function hasNameProp(value: unknown): value is Named {
  return (
    typeof value === "object" &&
    value !== null &&
    "name" in value &&
    typeof (value as Record<string, unknown>).name === "string"
  );
}

/**
 * Dropdown filter function for multi-select categorical filtering
 */
export const dropdownFilter: FilterFn<unknown> = (
  row: Row<unknown>,
  columnId: string,
  filterValue: string[],
  _addMeta: (meta: FilterMeta) => void
): boolean => {
  if (!filterValue || !Array.isArray(filterValue) || filterValue.length === 0) {
    return true; // No filter applied, show all rows
  }

  let cellValue = row.getValue(columnId);

  // Handle nested properties for specific columns
  if (cellValue == null) {
    const rowData = row.original as Record<string, unknown>;

    // Handle userInCharge.name (used in StaffList, DestinationList, InteractionRecords)
    if (columnId === "userInCharge" && hasNameProp(rowData.userInCharge)) {
      cellValue = rowData.userInCharge.name;
    }
    // Handle company.name for destinationName
    else if (columnId === "destinationName" && hasNameProp(rowData.company)) {
      cellValue = rowData.company.name;
    }
    // Handle responder.name for responderName (InquiriesNotifications)
    else if (columnId === "responderName" && hasNameProp(rowData.responder)) {
      cellValue = rowData.responder.name;
    }
    // Handle recorder.name for recorderName (InquiriesNotifications)
    else if (columnId === "recorderName" && hasNameProp(rowData.recorder)) {
      cellValue = rowData.recorder.name;
    }
    // Handle company.name for companyName (InquiriesNotifications)
    else if (columnId === "companyName" && hasNameProp(rowData.company)) {
      cellValue = rowData.company.name;
    }

    if (cellValue == null) {
      return false; // Null/undefined values don't match any filter
    }
  }

  const stringValue = String(cellValue);
  return filterValue.includes(stringValue);
};

/**
 * Date range filter function for filtering dates within a range
 */
export const dateRangeFilter: FilterFn<unknown> = (
  row: Row<unknown>,
  columnId: string,
  filterValue: string[],
  _addMeta: (meta: FilterMeta) => void
): boolean => {
  if (!filterValue || !Array.isArray(filterValue) || filterValue.length === 0) {
    return true; // No filter applied, show all rows
  }

  const cellValue = row.getValue(columnId);
  if (cellValue == null) {
    return false; // Null/undefined values don't match date filters
  }

  // Convert cell value to Date
  let cellDate: Date;
  if (cellValue instanceof Date) {
    cellDate = cellValue;
  } else if (typeof cellValue === "string") {
    cellDate = new Date(cellValue);
    if (isNaN(cellDate.getTime())) {
      return false; // Invalid date
    }
  } else {
    return false; // Not a valid date type
  }

  // Normalize to start of day for comparison
  cellDate.setHours(0, 0, 0, 0);

  const [startDateStr, endDateStr] = filterValue;

  // Check start date constraint
  if (startDateStr) {
    const startDate = new Date(startDateStr);
    startDate.setHours(0, 0, 0, 0);
    if (cellDate < startDate) {
      return false;
    }
  }

  // Check end date constraint
  if (endDateStr) {
    const endDate = new Date(endDateStr);
    endDate.setHours(23, 59, 59, 999); // End of day
    if (cellDate > endDate) {
      return false;
    }
  }

  return true;
};

/**
 * Numeric range filter function for filtering numbers within a range
 */
export const numericRangeFilter: FilterFn<unknown> = (
  row: Row<unknown>,
  columnId: string,
  filterValue: string[],
  _addMeta: (meta: FilterMeta) => void
): boolean => {
  if (!filterValue || !Array.isArray(filterValue) || filterValue.length === 0) {
    return true; // No filter applied, show all rows
  }

  const cellValue = row.getValue(columnId);
  if (cellValue == null) {
    return false; // Null/undefined values don't match numeric filters
  }

  // Convert cell value to number
  let cellNumber: number;
  if (typeof cellValue === "number") {
    cellNumber = cellValue;
  } else if (typeof cellValue === "string") {
    cellNumber = parseFloat(cellValue);
    if (isNaN(cellNumber)) {
      return false; // Not a valid number
    }
  } else {
    return false; // Not a valid numeric type
  }

  // Parse range from filter value (format: "min-max")
  const rangeStr = filterValue[0];
  if (!rangeStr || !rangeStr.includes("-")) {
    return true; // Invalid range format, show all
  }

  const [minStr, maxStr] = rangeStr.split("-");
  const min = parseFloat(minStr);
  const max = parseFloat(maxStr);

  if (isNaN(min) || isNaN(max)) {
    return true; // Invalid range values, show all
  }

  return cellNumber >= min && cellNumber <= max;
};

/**
 * Combined filter function that automatically detects filter type
 * and applies the appropriate filtering logic
 */
export const enhancedFilter: FilterFn<unknown> = (
  row: Row<unknown>,
  columnId: string,
  filterValue: string[],
  addMeta: (meta: FilterMeta) => void
): boolean => {
  if (!filterValue || !Array.isArray(filterValue) || filterValue.length === 0) {
    return true;
  }

  // Detect filter type based on filter value format
  if (
    filterValue.length === 2 &&
    filterValue.every((val) => val && val.match(/^\d{4}-\d{2}-\d{2}$/))
  ) {
    // Date range format (YYYY-MM-DD)
    return dateRangeFilter(row, columnId, filterValue, addMeta);
  } else if (
    filterValue.length === 1 &&
    filterValue[0].includes("-") &&
    filterValue[0].match(/^\d+(\.\d+)?-\d+(\.\d+)?$/)
  ) {
    // Numeric range format (number-number)
    return numericRangeFilter(row, columnId, filterValue, addMeta);
  } else {
    // Default to dropdown filter (now handles nested properties)
    return dropdownFilter(row, columnId, filterValue, addMeta);
  }
};

/**
 * Global filter function for search across all columns
 */
export const globalFilter: FilterFn<unknown> = (
  row: Row<unknown>,
  columnId: string,
  filterValue: string,
  _addMeta: (meta: FilterMeta) => void
): boolean => {
  if (!filterValue || typeof filterValue !== "string") {
    return true;
  }

  const searchTerm = filterValue.toLowerCase();

  // Search across all visible columns
  const searchableValues = Object.values(
    row.original as Record<string, unknown>
  )
    .filter((value) => value != null)
    .map((value) => String(value).toLowerCase());

  return searchableValues.some((value) => value.includes(searchTerm));
};

/**
 * Get the appropriate filter function for a column based on its configuration
 */
export function getFilterFunction(
  filterType: "dropdown" | "dateRange" | "numericRange" | "auto" = "auto"
): FilterFn<unknown> {
  switch (filterType) {
    case "dropdown":
      return dropdownFilter;
    case "dateRange":
      return dateRangeFilter;
    case "numericRange":
      return numericRangeFilter;
    case "auto":
    default:
      return enhancedFilter;
  }
}

/**
 * Utility to combine multiple filters with AND logic
 */
export function combineFilters(
  filters: Array<{
    columnId: string;
    filterFn: FilterFn<unknown>;
    filterValue: unknown;
  }>
): FilterFn<unknown> {
  return (
    row: Row<unknown>,
    columnId: string,
    filterValue: unknown,
    addMeta: (meta: FilterMeta) => void
  ): boolean => {
    // Apply all filters - all must pass (AND logic)
    return filters.every((filter) => {
      if (filter.columnId === columnId) {
        return filter.filterFn(row, columnId, filterValue, addMeta);
      } else {
        return filter.filterFn(
          row,
          filter.columnId,
          filter.filterValue,
          addMeta
        );
      }
    });
  };
}

/**
 * Utility to validate filter values before applying
 */
export function validateFilterValue(
  filterType: "dropdown" | "dateRange" | "numericRange",
  filterValue: unknown
): boolean {
  if (
    !filterValue ||
    (Array.isArray(filterValue) && filterValue.length === 0)
  ) {
    return true; // Empty filters are valid (no filtering)
  }

  if (!Array.isArray(filterValue)) {
    return false; // All our filters expect array values
  }

  switch (filterType) {
    case "dropdown":
      return filterValue.every((val) => typeof val === "string");

    case "dateRange":
      return (
        filterValue.length <= 2 &&
        filterValue.every((val) => {
          if (typeof val !== "string") return false;
          const date = new Date(val);
          return !isNaN(date.getTime());
        })
      );

    case "numericRange":
      return (
        filterValue.length === 1 &&
        typeof filterValue[0] === "string" &&
        filterValue[0].includes("-") &&
        filterValue[0].split("-").every((part) => !isNaN(parseFloat(part)))
      );

    default:
      return false;
  }
}
