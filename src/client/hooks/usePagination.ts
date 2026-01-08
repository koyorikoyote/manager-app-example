/**
 * usePagination Hook
 *
 * Custom hook for managing pagination state in Cards view mode.
 * Provides state management and utility functions for pagination controls.
 */
import { useState, useMemo, useCallback } from "react";
import { ITEMS_PER_PAGE_OPTIONS } from "../components/ui/CardsPagination";

/** Pagination state and controls */
interface PaginationState {
  /** Current page number (1-based) */
  currentPage: number;
  /** Items per page */
  itemsPerPage: number;
  /** Total number of pages */
  totalPages: number;
  /** Start index for current page (0-based) */
  startIndex: number;
  /** End index for current page (0-based) */
  endIndex: number;
  /** Change to specific page */
  setPage: (page: number) => void;
  /** Change items per page */
  setItemsPerPage: (itemsPerPage: number) => void;
  /** Reset to first page */
  resetToFirstPage: () => void;
  /** Get paginated data slice */
  getPaginatedData: <T>(data: T[]) => T[];
}

/** Options for pagination hook */
interface UsePaginationOptions {
  /** Initial items per page (default: 10) */
  initialItemsPerPage?: number;
  /** Total number of items */
  totalItems: number;
}

/**
 * Custom hook for managing pagination state
 *
 * @param options - Pagination options
 * @returns Pagination state and controls
 */
export const usePagination = ({
  initialItemsPerPage = ITEMS_PER_PAGE_OPTIONS[0],
  totalItems,
}: UsePaginationOptions): PaginationState => {
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPageState] = useState(initialItemsPerPage);

  // Calculate derived values
  const totalPages = useMemo(() => {
    return Math.ceil(totalItems / itemsPerPage);
  }, [totalItems, itemsPerPage]);

  const startIndex = useMemo(() => {
    return (currentPage - 1) * itemsPerPage;
  }, [currentPage, itemsPerPage]);

  const endIndex = useMemo(() => {
    return Math.min(startIndex + itemsPerPage, totalItems);
  }, [startIndex, itemsPerPage, totalItems]);

  // Page change handler
  const setPage = useCallback(
    (page: number) => {
      const clampedPage = Math.max(1, Math.min(page, totalPages));
      setCurrentPage(clampedPage);
    },
    [totalPages]
  );

  // Items per page change handler
  const setItemsPerPage = useCallback((newItemsPerPage: number) => {
    setItemsPerPageState(newItemsPerPage);
    // Reset to first page when changing items per page
    setCurrentPage(1);
  }, []);

  // Reset to first page
  const resetToFirstPage = useCallback(() => {
    setCurrentPage(1);
  }, []);

  // Get paginated data slice
  const getPaginatedData = useCallback(
    <T>(data: T[]): T[] => {
      return data.slice(startIndex, endIndex);
    },
    [startIndex, endIndex]
  );

  return {
    currentPage,
    itemsPerPage,
    totalPages,
    startIndex,
    endIndex,
    setPage,
    setItemsPerPage,
    resetToFirstPage,
    getPaginatedData,
  };
};
