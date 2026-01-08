/**
 * Table Utility Functions for DataTable Operations
 *
 * This module provides utility functions for common table operations
 * including search, filtering, sorting, and pagination.
 *
 * Features:
 * - Optimized search filtering with debouncing
 * - Multiple filter application with AND logic
 * - Type-safe sorting for various data types
 * - Pagination utilities with metadata
 * - Performance-optimized implementations
 */

/**
 * Search function factory for table data filtering
 * @param searchFields - Array of field names to search in
 * @returns Search function that filters data based on query
 */
export const createTableSearchFilter = <T extends Record<string, unknown>>(
  searchFields: (keyof T)[]
) => {
  return (data: T[], query: string): T[] => {
    if (!query.trim()) return data;

    const searchTerm = query.toLowerCase();
    return data.filter((item) =>
      searchFields.some((field) => {
        const value = item[field];
        if (value == null) return false;
        return String(value).toLowerCase().includes(searchTerm);
      })
    );
  };
};

/**
 * Filter application function for table data
 * @param data - Array of data to filter
 * @param filters - Object with filter key-value pairs
 * @returns Filtered array of data
 */
export const applyFilters = <T extends Record<string, unknown>>(
  data: T[],
  filters: Record<string, string>
): T[] => {
  // Early return for empty filters
  const activeFilters = Object.entries(filters).filter(([, value]) => value);
  if (activeFilters.length === 0) return data;

  return data.filter((item) =>
    activeFilters.every(([key, value]) => item[key] === value)
  );
};

/**
 * Apply multiple filters with AND logic
 * @param data - Array of data to filter
 * @param filters - Array of filter functions
 * @returns Filtered array of data
 */
export const applyMultipleFilters = <T>(
  data: T[],
  filters: Array<(item: T) => boolean>
): T[] => {
  return data.filter((item) => filters.every((filter) => filter(item)));
};

/**
 * Create a filter function for status fields
 * @param statusField - The field name containing status
 * @param allowedStatuses - Array of allowed status values
 * @returns Filter function
 */
export const createStatusFilter =
  <T extends Record<string, unknown>>(
    statusField: keyof T,
    allowedStatuses: string[]
  ) =>
  (item: T): boolean => {
    if (allowedStatuses.length === 0) return true;
    return allowedStatuses.includes(item[statusField] as string);
  };

/**
 * Create a filter function for date ranges
 * @param dateField - The field name containing the date
 * @param startDate - Start date for filtering (inclusive)
 * @param endDate - End date for filtering (inclusive)
 * @returns Filter function
 */
export const createDateRangeFilter =
  <T extends Record<string, unknown>>(
    dateField: keyof T,
    startDate?: Date,
    endDate?: Date
  ) =>
  (item: T): boolean => {
    const itemDate = new Date(item[dateField] as string | number | Date);
    if (isNaN(itemDate.getTime())) return false;

    if (startDate && itemDate < startDate) return false;
    if (endDate && itemDate > endDate) return false;

    return true;
  };

/**
 * Create a filter function for text fields with partial matching
 * @param textField - The field name containing text
 * @param searchTerm - The search term to match
 * @param caseSensitive - Whether the search should be case sensitive
 * @returns Filter function
 */
export const createTextFilter =
  <T extends Record<string, unknown>>(
    textField: keyof T,
    searchTerm: string,
    caseSensitive = false
  ) =>
  (item: T): boolean => {
    if (!searchTerm.trim()) return true;

    const fieldValue = String(item[textField] || "");
    const term = caseSensitive ? searchTerm : searchTerm.toLowerCase();
    const value = caseSensitive ? fieldValue : fieldValue.toLowerCase();

    return value.includes(term);
  };

/**
 * Sort data by a specific field
 * @param data - Array of data to sort
 * @param field - Field to sort by
 * @param direction - Sort direction ('asc' or 'desc')
 * @returns Sorted array of data
 */
export const sortData = <T extends Record<string, unknown>>(
  data: T[],
  field: keyof T,
  direction: "asc" | "desc" = "asc"
): T[] => {
  return [...data].sort((a, b) => {
    const aValue = a[field];
    const bValue = b[field];

    // Handle null/undefined values
    if (aValue == null && bValue == null) return 0;
    if (aValue == null) return direction === "asc" ? 1 : -1;
    if (bValue == null) return direction === "asc" ? -1 : 1;

    // Handle dates - try to parse as dates
    const aDate = new Date(aValue as string | number | Date);
    const bDate = new Date(bValue as string | number | Date);
    const aIsValidDate = !isNaN(aDate.getTime());
    const bIsValidDate = !isNaN(bDate.getTime());

    if (aIsValidDate && bIsValidDate) {
      return direction === "asc"
        ? aDate.getTime() - bDate.getTime()
        : bDate.getTime() - aDate.getTime();
    }

    // Handle numbers
    if (typeof aValue === "number" && typeof bValue === "number") {
      return direction === "asc" ? aValue - bValue : bValue - aValue;
    }

    // Handle strings (case-insensitive)
    const aStr = String(aValue).toLowerCase();
    const bStr = String(bValue).toLowerCase();

    if (direction === "asc") {
      return aStr < bStr ? -1 : aStr > bStr ? 1 : 0;
    } else {
      return aStr > bStr ? -1 : aStr < bStr ? 1 : 0;
    }
  });
};

/**
 * Paginate data array
 * @param data - Array of data to paginate
 * @param page - Current page number (1-based)
 * @param pageSize - Number of items per page
 * @returns Object with paginated data and pagination info
 */
export const paginateData = <T>(data: T[], page: number, pageSize: number) => {
  const startIndex = (page - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedData = data.slice(startIndex, endIndex);

  return {
    data: paginatedData,
    totalItems: data.length,
    totalPages: Math.ceil(data.length / pageSize),
    currentPage: page,
    pageSize,
    hasNextPage: endIndex < data.length,
    hasPreviousPage: page > 1,
  };
};
