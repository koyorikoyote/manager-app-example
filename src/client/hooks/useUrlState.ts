import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";

export interface TableState {
  search?: string;
  filters?: Record<string, string>;
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  viewMode?: "table" | "cards";
}

export interface UseUrlStateOptions {
  defaultState?: Partial<TableState>;
  replaceHistory?: boolean;
}

export interface UseUrlStateReturn {
  state: TableState;
  updateState: (updates: Partial<TableState>) => void;
  resetState: () => void;
  isStateFromUrl: boolean;
}

/**
 * Custom hook for managing table state in URL parameters
 * Provides persistence across page refreshes and browser navigation
 */
export function useUrlState(
  options: UseUrlStateOptions = {}
): UseUrlStateReturn {
  const { defaultState = {}, replaceHistory = true } = options;

  const [searchParams, setSearchParams] = useSearchParams();
  const [isStateFromUrl, setIsStateFromUrl] = useState(false);

  // Parse state from URL parameters
  const parseStateFromUrl = useCallback((): TableState => {
    const state: TableState = { ...defaultState };

    // Parse search query
    const search = searchParams.get("q");
    if (search) {
      state.search = search;
    }

    // Parse filters
    const filters: Record<string, string> = {};
    searchParams.forEach((value, key) => {
      if (key.startsWith("filter_")) {
        const filterKey = key.replace("filter_", "");
        filters[filterKey] = value;
      }
    });
    if (Object.keys(filters).length > 0) {
      state.filters = filters;
    }

    // Parse pagination
    const page = searchParams.get("page");
    if (page) {
      const pageNum = parseInt(page, 10);
      if (pageNum > 0) {
        state.page = pageNum;
      }
    }

    const pageSize = searchParams.get("pageSize");
    if (pageSize) {
      const pageSizeNum = parseInt(pageSize, 10);
      if (pageSizeNum > 0) {
        state.pageSize = pageSizeNum;
      }
    }

    // Parse sorting
    const sortBy = searchParams.get("sortBy");
    if (sortBy) {
      state.sortBy = sortBy;
    }

    const sortOrder = searchParams.get("sortOrder");
    if (sortOrder === "asc" || sortOrder === "desc") {
      state.sortOrder = sortOrder;
    }

    // Parse view mode
    const viewMode = searchParams.get("viewMode");
    if (viewMode === "table" || viewMode === "cards") {
      state.viewMode = viewMode;
    }

    return state;
  }, [searchParams, defaultState]);

  // Initialize state from URL or defaults
  const [state, setState] = useState<TableState>(() => {
    const urlState = parseStateFromUrl();
    const hasUrlParams = searchParams.toString().length > 0;
    setIsStateFromUrl(hasUrlParams);
    return { ...defaultState, ...urlState };
  });

  // Update URL parameters when state changes
  const updateUrlParams = useCallback(
    (newState: TableState) => {
      const params = new URLSearchParams();

      // Add search query
      if (newState.search?.trim()) {
        params.set("q", newState.search.trim());
      }

      // Add filters
      if (newState.filters) {
        Object.entries(newState.filters).forEach(([key, value]) => {
          if (value) {
            params.set(`filter_${key}`, value);
          }
        });
      }

      // Add pagination
      if (newState.page && newState.page > 1) {
        params.set("page", newState.page.toString());
      }

      if (newState.pageSize && newState.pageSize !== defaultState.pageSize) {
        params.set("pageSize", newState.pageSize.toString());
      }

      // Add sorting
      if (newState.sortBy) {
        params.set("sortBy", newState.sortBy);
      }

      if (newState.sortOrder && newState.sortOrder !== "asc") {
        params.set("sortOrder", newState.sortOrder);
      }

      // Add view mode
      if (newState.viewMode && newState.viewMode !== defaultState.viewMode) {
        params.set("viewMode", newState.viewMode);
      }

      setSearchParams(params, { replace: replaceHistory });
    },
    [setSearchParams, replaceHistory, defaultState]
  );

  // Update state and URL
  const updateState = useCallback(
    (updates: Partial<TableState>) => {
      setState((prevState) => {
        const newState = { ...prevState, ...updates };

        // Reset page to 1 when search or filters change (unless page is explicitly being updated)
        if (
          (updates.search !== undefined || updates.filters !== undefined) &&
          updates.page === undefined
        ) {
          newState.page = 1;
        }

        updateUrlParams(newState);
        return newState;
      });
    },
    [updateUrlParams]
  );

  // Reset state to defaults
  const resetState = useCallback(() => {
    setState(defaultState);
    setSearchParams(new URLSearchParams(), { replace: replaceHistory });
    setIsStateFromUrl(false);
  }, [defaultState, setSearchParams, replaceHistory]);

  // Listen for URL changes (browser back/forward)
  useEffect(() => {
    const urlState = parseStateFromUrl();
    const hasUrlParams = searchParams.toString().length > 0;

    setState((prevState) => {
      // Only update if URL state is different from current state
      const stateChanged =
        JSON.stringify(prevState) !==
        JSON.stringify({ ...defaultState, ...urlState });
      if (stateChanged) {
        setIsStateFromUrl(hasUrlParams);
        return { ...defaultState, ...urlState };
      }
      return prevState;
    });
  }, [searchParams, parseStateFromUrl, defaultState]);

  return {
    state,
    updateState,
    resetState,
    isStateFromUrl,
  };
}

/**
 * Helper function to create filter update handlers
 */
export function createFilterUpdater(
  updateState: (updates: Partial<TableState>) => void,
  currentFilters: Record<string, string> = {}
) {
  return (filterKey: string, value: string) => {
    const newFilters = { ...currentFilters };

    if (value) {
      newFilters[filterKey] = value;
    } else {
      delete newFilters[filterKey];
    }

    updateState({ filters: newFilters });
  };
}

/**
 * Helper function to check if any filters are active
 */
export function hasActiveFilters(state: TableState): boolean {
  return !!(
    state.search?.trim() ||
    (state.filters && Object.values(state.filters).some((value) => value))
  );
}

/**
 * Helper function to clear all filters and search
 */
export function clearAllFilters(
  updateState: (updates: Partial<TableState>) => void
) {
  updateState({
    search: "",
    filters: {},
    page: 1,
  });
}
