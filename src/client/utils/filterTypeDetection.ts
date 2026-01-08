/**
 * Filter Type Detection Utilities
 *
 * Provides logic to automatically detect the appropriate filter type
 * for columns based on column metadata and data types.
 */

export type FilterType = "dropdown" | "dateRange" | "numericRange";

export interface ColumnMetadata {
  key: string;
  label: string;
  dataType: "string" | "number" | "date" | "enum";
  hasMultipleValues?: boolean;
  optionCount?: number;
}

export interface FilterConfiguration {
  columnKey: string;
  columnLabel: string;
  filterType: FilterType;
  dataType: string;
  options?: Array<{ value: string; label: string; count?: number }>;
  ranges?: Array<{ label: string; min: number; max: number; count?: number }>;
}

/**
 * Determines the appropriate filter type based on column metadata
 */
export function getFilterType(
  columnId: string,
  dataType: string,
  optionCount?: number
): FilterType {
  const columnIdLower = columnId.toLowerCase();

  // Date columns - check for date-related column names or date data type
  if (
    dataType === "date" ||
    columnIdLower.includes("date") ||
    columnIdLower.includes("time") ||
    columnIdLower.includes("created") ||
    columnIdLower.includes("updated") ||
    columnIdLower.includes("hire") ||
    columnIdLower.includes("contract") ||
    columnIdLower.includes("occurrence") ||
    columnIdLower.includes("inquiry") ||
    columnIdLower.includes("resolution") ||
    columnIdLower.includes("record")
  ) {
    return "dateRange";
  }

  // Numeric range columns - specific numeric columns that benefit from range filtering
  if (
    dataType === "number" &&
    (columnIdLower.includes("age") ||
      columnIdLower.includes("salary") ||
      columnIdLower.includes("wage") ||
      columnIdLower.includes("vacancy") ||
      columnIdLower.includes("vacancies") ||
      columnIdLower.includes("hiring") ||
      columnIdLower.includes("occupant") ||
      columnIdLower.includes("days") ||
      columnIdLower.includes("passed") ||
      columnIdLower.includes("count") ||
      columnIdLower.includes("number"))
  ) {
    return "numericRange";
  }

  // Dropdown for categorical data (string/enum types or numeric with few options)
  if (
    dataType === "string" ||
    dataType === "enum" ||
    (dataType === "number" && optionCount && optionCount <= 20) ||
    columnIdLower.includes("status") ||
    columnIdLower.includes("type") ||
    columnIdLower.includes("category") ||
    columnIdLower.includes("department") ||
    columnIdLower.includes("position") ||
    columnIdLower.includes("role") ||
    columnIdLower.includes("level") ||
    columnIdLower.includes("priority") ||
    columnIdLower.includes("condition") ||
    columnIdLower.includes("nationality") ||
    columnIdLower.includes("residence") ||
    columnIdLower.includes("experience") ||
    columnIdLower.includes("progress") ||
    columnIdLower.includes("urgency") ||
    columnIdLower.includes("responder") ||
    columnIdLower.includes("user") ||
    columnIdLower.includes("charge") ||
    columnIdLower.includes("inquiry")
  ) {
    return "dropdown";
  }

  // Default to dropdown for most cases
  return "dropdown";
}

/**
 * Analyzes column data to determine filter configuration
 */
export function analyzeColumnForFiltering(
  columnId: string,
  columnLabel: string,
  data: Record<string, unknown>[],
  dataType?: string
): FilterConfiguration | null {
  // Get unique values and analyze data type if not provided
  const values = new Set<unknown>();
  let inferredDataType = dataType || "string";
  let hasNumbers = false;
  let hasDates = false;

  data.forEach((row) => {
    const value = row[columnId];
    if (value != null && value !== "") {
      values.add(value);

      // Infer data type if not provided
      if (!dataType) {
        if (typeof value === "number") {
          hasNumbers = true;
        } else if (value instanceof Date) {
          hasDates = true;
        } else if (typeof value === "string") {
          // Check if string looks like a date
          const dateValue = new Date(value);
          if (
            !isNaN(dateValue.getTime()) &&
            value.match(/^\d{4}-\d{2}-\d{2}/)
          ) {
            hasDates = true;
          }
          // Check if string looks like a number
          const numValue = parseFloat(value);
          if (!isNaN(numValue) && value.trim() === numValue.toString()) {
            hasNumbers = true;
          }
        }
      }
    }
  });

  // Infer data type if not provided
  if (!dataType) {
    if (hasDates) {
      inferredDataType = "date";
    } else if (hasNumbers && !hasDates) {
      inferredDataType = "number";
    } else {
      inferredDataType = "string";
    }
  }

  const uniqueValueCount = values.size;

  // Skip columns with no data or only one unique value (unless it's a status-like column)
  if (
    uniqueValueCount === 0 ||
    (uniqueValueCount === 1 && !columnId.toLowerCase().includes("status"))
  ) {
    return null;
  }

  const filterType = getFilterType(
    columnId,
    inferredDataType,
    uniqueValueCount
  );

  return {
    columnKey: columnId,
    columnLabel,
    filterType,
    dataType: inferredDataType,
  };
}

/**
 * Batch analyze multiple columns for filtering
 */
export function analyzeColumnsForFiltering(
  columns: Array<{ key: string; label: string; dataType?: string }>,
  data: Record<string, unknown>[]
): FilterConfiguration[] {
  const configurations: FilterConfiguration[] = [];

  columns.forEach((column) => {
    const config = analyzeColumnForFiltering(
      column.key,
      column.label,
      data,
      column.dataType
    );

    if (config) {
      configurations.push(config);
    }
  });
  return configurations;
}

/**
 * Check if a column should be filterable based on common patterns
 */
export function isColumnFilterable(
  columnId: string,
  dataType: string,
  uniqueValueCount: number
): boolean {
  const columnIdLower = columnId.toLowerCase();

  // Always filterable columns
  const alwaysFilterable = [
    "status",
    "type",
    "category",
    "department",
    "position",
    "role",
    "level",
    "priority",
    "condition",
    "nationality",
    "residence",
    "experience",
    "progress",
    "urgency",
    "responder",
    "user",
  ];

  if (alwaysFilterable.some((pattern) => columnIdLower.includes(pattern))) {
    return true;
  }

  // Date columns are always filterable
  if (dataType === "date" || columnIdLower.includes("date")) {
    return true;
  }

  // Numeric columns with reasonable range
  if (
    dataType === "number" &&
    uniqueValueCount > 1 &&
    uniqueValueCount <= 1000
  ) {
    return true;
  }

  // String/enum columns with reasonable number of options
  if (
    (dataType === "string" || dataType === "enum") &&
    uniqueValueCount > 1 &&
    uniqueValueCount <= 50
  ) {
    return true;
  }

  return false;
}
