import { useState, useCallback, useMemo } from "react";
import { FilterOption, FilterConfig } from "./DynamicFilterDropdown";
import { ActiveFilter } from "./ActiveFiltersDisplay";

export interface ClientSideFilterState {
  searchQuery: string;
  activeFilters: Record<string, string[]>;
}

export interface UseClientSideFilteringOptions<T> {
  data: T[];
  searchFields: (keyof T)[];
  filterConfigs: FilterConfig[];
  initialState?: Partial<ClientSideFilterState>;
}

export interface UseClientSideFilteringResult<T> {
  // Filtered data
  filteredData: T[];

  // Search state
  searchQuery: string;
  setSearchQuery: (query: string) => void;

  // Filter state
  activeFilters: Record<string, string[]>;
  setFilter: (key: string, values: string[]) => void;
  removeFilter: (key: string, value: string) => void;
  clearAllFilters: () => void;

  // Filter options generated from data
  filterOptions: Record<string, FilterOption[]>;

  // Active filters for display
  activeFiltersDisplay: ActiveFilter[];

  // Counts
  filteredCount: number;
  totalCount: number;

  // Helper functions
  clearSearch: () => void;
  hasActiveFilters: boolean;
}

export function useClientSideFiltering<T>({
  data,
  searchFields,
  filterConfigs,
  initialState = {},
}: UseClientSideFilteringOptions<T>): UseClientSideFilteringResult<T> {
  const [searchQuery, setSearchQuery] = useState(
    initialState.searchQuery || ""
  );
  const [activeFilters, setActiveFilters] = useState<Record<string, string[]>>(
    initialState.activeFilters || {}
  );

  // Generate filter options from current data
  const filterOptions = useMemo(() => {
    const options: Record<string, FilterOption[]> = {};

    filterConfigs.forEach((config) => {
      const values = new Map<string, number>();

      data.forEach((item) => {
        const value = (item as any)[config.field];
        if (value != null && value !== "") {
          const stringValue = String(value);
          values.set(stringValue, (values.get(stringValue) || 0) + 1);
        }
      });

      const sortedOptions = Array.from(values.entries())
        .map(([value, count]) => ({
          value,
          label: value,
          count,
        }))
        .sort((a, b) => {
          if (config.sortBy === "frequency") {
            return b.count - a.count;
          }
          return a.label.localeCompare(b.label);
        });

      options[config.key] = sortedOptions;
    });

    return options;
  }, [data, filterConfigs]);

  // Filter data based on search query and active filters
  const filteredData = useMemo(() => {
    let result = [...data];

    // Apply search filter
    if (searchQuery.trim()) {
      const searchTerm = searchQuery.toLowerCase().trim();
      result = result.filter((item) =>
        searchFields.some((field) => {
          const value = (item as any)[field];
          return (
            value != null && String(value).toLowerCase().includes(searchTerm)
          );
        })
      );
    }

    // Apply dropdown filters
    Object.entries(activeFilters).forEach(([filterKey, values]) => {
      if (values.length > 0) {
        const config = filterConfigs.find((c) => c.key === filterKey);
        if (config) {
          result = result.filter((item) => {
            const itemValue = String((item as any)[config.field] || "");
            return values.includes(itemValue);
          });
        }
      }
    });

    return result;
  }, [data, searchQuery, activeFilters, searchFields, filterConfigs]);

  // Generate active filters for display
  const activeFiltersDisplay = useMemo(() => {
    const filters: ActiveFilter[] = [];

    Object.entries(activeFilters).forEach(([filterKey, values]) => {
      const config = filterConfigs.find((c) => c.key === filterKey);
      if (config && values.length > 0) {
        values.forEach((value) => {
          filters.push({
            key: filterKey,
            label: config.label,
            value,
            displayValue: value,
          });
        });
      }
    });

    return filters;
  }, [activeFilters, filterConfigs]);

  // Filter management functions
  const setFilter = useCallback((key: string, values: string[]) => {
    setActiveFilters((prev) => ({
      ...prev,
      [key]: values,
    }));
  }, []);

  const removeFilter = useCallback((key: string, value: string) => {
    setActiveFilters((prev) => ({
      ...prev,
      [key]: (prev[key] || []).filter((v) => v !== value),
    }));
  }, []);

  const clearAllFilters = useCallback(() => {
    setSearchQuery("");
    setActiveFilters({});
  }, []);

  const clearSearch = useCallback(() => {
    setSearchQuery("");
  }, []);

  // Computed values
  const filteredCount = filteredData.length;
  const totalCount = data.length;
  const hasActiveFilters =
    searchQuery.trim().length > 0 ||
    Object.values(activeFilters).some((values) => values.length > 0);

  return {
    filteredData,
    searchQuery,
    setSearchQuery,
    activeFilters,
    setFilter,
    removeFilter,
    clearAllFilters,
    filterOptions,
    activeFiltersDisplay,
    filteredCount,
    totalCount,
    clearSearch,
    hasActiveFilters,
  };
}
