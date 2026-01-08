// Client-side filter engine utility for immediate data filtering
// Based on the Sales Assistant Companies page pattern

export interface FilterConfig {
  key: string;
  label: string;
  field: string;
  type: "select" | "multiselect";
  sortBy?: "alphabetical" | "frequency";
}

export interface FilterState {
  searchQuery: string;
  activeFilters: Record<string, string>;
  filterOptions: Record<string, string[]>;
}

export interface ClientSideDataState<T> {
  allData: T[];
  filteredData: T[];
  filterState: FilterState;
  loading: boolean;
  error: string | null;
}

// Field-specific search configurations for each data type
export const STAFF_SEARCH_FIELDS = [
  "name",
  "email",
  "phone",
  "department",
  "position",
  "employeeId",
] as const;

export const PROPERTY_SEARCH_FIELDS = [
  "name",
  "address",
  "propertyType",
  "status",
  "propertyCode",
  "type", // Legacy field for backward compatibility
] as const;

export const DESTINATION_SEARCH_FIELDS = [
  "name",
  "industry",
  "status",
  "address",
] as const;

export const INTERACTION_SEARCH_FIELDS = [
  "description",
  "type",
  "status",
  "createdBy",
] as const;

// Page-specific filter configurations
export const PAGE_FILTER_CONFIGS: Record<
  string,
  { searchFields: readonly string[]; filterConfigs: FilterConfig[] }
> = {
  staff: {
    searchFields: STAFF_SEARCH_FIELDS,
    filterConfigs: [
      {
        key: "department",
        label: "Department",
        field: "department",
        type: "select",
        sortBy: "alphabetical",
      },
      {
        key: "status",
        label: "Status",
        field: "status",
        type: "select",
        sortBy: "alphabetical",
      },
      {
        key: "position",
        label: "Position",
        field: "position",
        type: "select",
        sortBy: "frequency",
      },
    ],
  },
  properties: {
    searchFields: PROPERTY_SEARCH_FIELDS,
    filterConfigs: [
      {
        key: "propertyType",
        label: "Type",
        field: "propertyType",
        type: "select",
        sortBy: "alphabetical",
      },
      {
        key: "status",
        label: "Status",
        field: "status",
        type: "select",
        sortBy: "alphabetical",
      },
    ],
  },
  destinations: {
    searchFields: DESTINATION_SEARCH_FIELDS,
    filterConfigs: [
      {
        key: "industry",
        label: "Industry",
        field: "industry",
        type: "select",
        sortBy: "alphabetical",
      },
      {
        key: "status",
        label: "Status",
        field: "status",
        type: "select",
        sortBy: "alphabetical",
      },
    ],
  },
  interactions: {
    searchFields: INTERACTION_SEARCH_FIELDS,
    filterConfigs: [
      {
        key: "type",
        label: "Type",
        field: "type",
        type: "select",
        sortBy: "alphabetical",
      },
      {
        key: "status",
        label: "Status",
        field: "status",
        type: "select",
        sortBy: "alphabetical",
      },
    ],
  },
};

/**
 * Core filter engine class for client-side data filtering
 */
export class FilterEngine<T extends Record<string, unknown>> {
  /**
   * Search across multiple fields in the dataset
   */
  searchFilter(data: T[], query: string, searchFields: readonly string[]): T[] {
    if (!query.trim()) {
      return data;
    }

    const searchTerm = query.toLowerCase().trim();

    return data.filter((item) => {
      return searchFields.some((field) => {
        const value = this.getNestedValue(item, field);
        if (value == null) return false;

        // Handle different data types
        const stringValue =
          typeof value === "string"
            ? value
            : typeof value === "number"
            ? value.toString()
            : String(value);

        return stringValue.toLowerCase().includes(searchTerm);
      });
    });
  }

  /**
   * Apply dropdown filters to the dataset
   */
  dropdownFilter(data: T[], filters: Record<string, string>): T[] {
    if (!filters || Object.keys(filters).length === 0) {
      return data;
    }

    return data.filter((item) => {
      return Object.entries(filters).every(([key, value]) => {
        if (!value || value === "") return true;

        const itemValue = this.getNestedValue(item, key);
        if (itemValue == null) return false;

        // Handle exact match for dropdown filters
        return String(itemValue) === value;
      });
    });
  }

  /**
   * Generate filter options from dataset
   */
  generateFilterOptions(
    data: T[],
    filterConfigs: FilterConfig[]
  ): Record<string, string[]> {
    const options: Record<string, string[]> = {};

    filterConfigs.forEach((config) => {
      const values = data
        .map((item) => this.getNestedValue(item, config.field))
        .filter((value) => value != null && value !== "")
        .map((value) => String(value));

      // Remove duplicates and sort
      const uniqueValues = Array.from(new Set(values));

      if (config.sortBy === "frequency") {
        // Sort by frequency of occurrence
        const frequency = uniqueValues.reduce((acc, value) => {
          acc[value] = values.filter((v) => v === value).length;
          return acc;
        }, {} as Record<string, number>);

        uniqueValues.sort((a, b) => frequency[b] - frequency[a]);
      } else {
        // Default alphabetical sort
        uniqueValues.sort((a, b) => a.localeCompare(b));
      }

      options[config.key] = uniqueValues;
    });

    return options;
  }

  /**
   * Apply all filters (search + dropdown) to the dataset
   */
  applyAllFilters(
    data: T[],
    searchQuery: string,
    filters: Record<string, string>,
    searchFields: readonly string[]
  ): T[] {
    // First apply search filter
    let filteredData = this.searchFilter(data, searchQuery, searchFields);

    // Then apply dropdown filters
    filteredData = this.dropdownFilter(filteredData, filters);

    return filteredData;
  }

  /**
   * Get nested value from object using dot notation or direct property access
   */
  private getNestedValue(obj: Record<string, unknown>, path: string): unknown {
    if (!path) return undefined;

    // Handle direct property access
    if (path.indexOf(".") === -1) {
      return obj[path];
    }

    // Handle nested property access
    return path.split(".").reduce((current: unknown, key: string) => {
      return current &&
        typeof current === "object" &&
        current !== null &&
        key in current
        ? (current as Record<string, unknown>)[key]
        : undefined;
    }, obj);
  }
}

/**
 * Create a filter engine instance for a specific data type
 */
export function createFilterEngine<
  T extends Record<string, unknown>
>(): FilterEngine<T> {
  return new FilterEngine<T>();
}

/**
 * Utility function to get filter configuration for a specific page
 */
export function getPageFilterConfig(
  pageType: string
): { searchFields: readonly string[]; filterConfigs: FilterConfig[] } | null {
  return PAGE_FILTER_CONFIGS[pageType] || null;
}

/**
 * Utility function to create initial filter state
 */
export function createInitialFilterState(): FilterState {
  return {
    searchQuery: "",
    activeFilters: {},
    filterOptions: {},
  };
}

/**
 * Utility function to check if any filters are active
 */
export function hasActiveFilters(filterState: FilterState): boolean {
  const hasSearch = filterState.searchQuery.trim() !== "";
  const hasFilters = Object.values(filterState.activeFilters).some(
    (value) => value !== ""
  );
  return hasSearch || hasFilters;
}

/**
 * Utility function to clear all filters
 */
export function clearAllFilters(): FilterState {
  return createInitialFilterState();
}

/**
 * Error handling for client-side filtering operations
 */
export function handleFilterError<T>(error: Error, fallbackData: T[]): T[] {
  console.error("Client-side filtering error:", error);
  // Return unfiltered data as fallback
  return fallbackData;
}

/**
 * Validate filter state to prevent corruption
 */
export function validateFilterState(filterState: FilterState): FilterState {
  try {
    return {
      searchQuery:
        typeof filterState.searchQuery === "string"
          ? filterState.searchQuery
          : "",
      activeFilters:
        filterState.activeFilters &&
        typeof filterState.activeFilters === "object"
          ? filterState.activeFilters
          : {},
      filterOptions:
        filterState.filterOptions &&
        typeof filterState.filterOptions === "object"
          ? filterState.filterOptions
          : {},
    };
  } catch (error) {
    console.error("Filter state validation error:", error);
    return createInitialFilterState();
  }
}
