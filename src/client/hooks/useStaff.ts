import { useState, useEffect, useCallback } from "react";
import { Staff } from "../../shared/types";
import { staffService, StaffSearchParams } from "../services/staffService";
import { useToast } from "../contexts/ToastContext";
import { useLanguage } from "../contexts/LanguageContext";
import { useClientSideFiltering } from "../components/search/useClientSideFiltering";
import { PAGE_FILTER_CONFIGS } from "../../shared/utils/clientSideFilter";
import { FilterOption } from "../components/search/DynamicFilterDropdown";

interface UseStaffListOptions {
  initialStaff?: Staff[];
  initialTotal?: number;
  enableClientSideFiltering?: boolean;
}

export interface UseStaffListResult {
  // Core data
  staff: Staff[];
  allStaff?: Staff[];
  total: number;
  filteredTotal?: number;
  loading: boolean;
  error: string | null;
  refetch: () => void;

  // Client-side filtering controls (only available when enableClientSideFiltering is true)
  searchQuery?: string;
  setSearchQuery?: (query: string) => void;
  activeFilters?: Record<string, string[]>;
  setFilter?: (key: string, values: string[]) => void;
  removeFilter?: (key: string, value: string) => void;
  clearAllFilters?: () => void;
  filterOptions?: Record<string, FilterOption[]>;
  activeFiltersDisplay?: {
    key: string;
    label: string;
    value: string;
    displayValue: string;
  }[];
  hasActiveFilters?: boolean;
  clearSearch?: () => void;
}

export const useStaffList = (
  params: StaffSearchParams = {},
  options: UseStaffListOptions = {}
): UseStaffListResult => {
  const [allStaff, setAllStaff] = useState<Staff[]>(options.initialStaff || []);
  const [total, setTotal] = useState(options.initialTotal || 0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Get staff filter configuration
  const staffFilterConfig = PAGE_FILTER_CONFIGS.staff;

  // Client-side filtering setup
  const clientSideFiltering = useClientSideFiltering<Staff>({
    data: allStaff,
    searchFields: staffFilterConfig.searchFields as (keyof Staff)[],
    filterConfigs: staffFilterConfig.filterConfigs,
    initialState: {
      searchQuery: params.search || "",
      activeFilters: {
        ...(params.department && { department: [params.department] }),
        ...(params.status && { status: [params.status] }),
      },
    },
  });

  // Determine if we should use client-side filtering
  const enableClientFiltering = options.enableClientSideFiltering === true;

  const fetchStaff = useCallback(
    async (fetchParams?: StaffSearchParams) => {
      setLoading(true);
      setError(null);

      try {
        const searchParams = fetchParams || params;

        if (enableClientFiltering) {
          // For client-side filtering, fetch all data without search/filter params
          const result = await staffService.searchStaff({
            page: searchParams.page,
            limit: searchParams.limit,
            // Don't pass search/filter params to server when using client-side filtering
          });
          setAllStaff(result.staff);
          setTotal(result.total);
        } else {
          // For server-side filtering, use all params
          const result = await staffService.searchStaff(searchParams);
          setAllStaff(result.staff);
          setTotal(result.total);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to fetch staff");
      } finally {
        setLoading(false);
      }
    },
    [params, enableClientFiltering]
  );

  useEffect(() => {
    // Only fetch if we don't have initial data or if params have changed from initial state
    const hasInitialData =
      options.initialStaff && options.initialStaff.length > 0;
    const isInitialParams =
      !params.search &&
      !params.department &&
      !params.status &&
      (!params.page || params.page === 1);

    if (!hasInitialData || !isInitialParams) {
      fetchStaff();
    }
  }, [
    fetchStaff,
    options.initialStaff,
    params.search,
    params.department,
    params.status,
    params.page,
  ]);

  const refetch = useCallback(() => {
    fetchStaff();
  }, [fetchStaff]);

  // Return appropriate data based on filtering mode
  if (enableClientFiltering) {
    return {
      // Client-side filtering results
      staff: clientSideFiltering.filteredData,
      allStaff,
      total: clientSideFiltering.totalCount,
      filteredTotal: clientSideFiltering.filteredCount,
      loading,
      error,
      refetch,

      // Client-side filtering controls
      searchQuery: clientSideFiltering.searchQuery,
      setSearchQuery: clientSideFiltering.setSearchQuery,
      activeFilters: clientSideFiltering.activeFilters,
      setFilter: clientSideFiltering.setFilter,
      removeFilter: clientSideFiltering.removeFilter,
      clearAllFilters: clientSideFiltering.clearAllFilters,
      filterOptions: clientSideFiltering.filterOptions,
      activeFiltersDisplay: clientSideFiltering.activeFiltersDisplay,
      hasActiveFilters: clientSideFiltering.hasActiveFilters,
      clearSearch: clientSideFiltering.clearSearch,
    };
  } else {
    // Server-side filtering (backward compatibility)
    return {
      staff: allStaff,
      total,
      loading,
      error,
      refetch,
    };
  }
};

export interface UseStaffResult {
  staff: Staff[];
  loading: boolean;
  error: string | null;
  searchStaff: (params: StaffSearchParams) => Promise<void>;
  refreshStaff: () => Promise<void>;
  createStaff: (
    staffData: Omit<Staff, "id" | "createdAt" | "updatedAt">
  ) => Promise<Staff>;
  updateStaff: (
    id: number,
    staffData: Partial<Omit<Staff, "id" | "createdAt">>
  ) => Promise<Staff>;
  deleteStaff: (id: number) => Promise<void>;
  // Loading states for specific operations
  isSearching: boolean;
  isRefreshing: boolean;
  isCreating: boolean;
  isUpdating: boolean;
  isDeleting: boolean;
}

interface UseStaffOptions {
  initialStaff?: Staff[];
  initialSearch?: StaffSearchParams;
}

export const useStaff = (options: UseStaffOptions = {}): UseStaffResult => {
  const [staff, setStaff] = useState<Staff[]>(options.initialStaff || []);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Specific loading states
  const [isSearching, setIsSearching] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const { showSuccess, showError } = useToast();
  const { t } = useLanguage();

  const searchStaff = useCallback(
    async (params: StaffSearchParams) => {
      setIsSearching(true);
      setLoading(true);
      setError(null);

      try {
        const results = await staffService.searchStaff(params);
        setStaff(results.staff);
      } catch (err) {
        const errorMessage =
          err instanceof Error
            ? err.message
            : t("common.feedback.operationFailed");
        setError(errorMessage);
        showError(t("staff.management"), errorMessage);
      } finally {
        setIsSearching(false);
        setLoading(false);
      }
    },
    [showError, t]
  );

  const refreshStaff = useCallback(async () => {
    setIsRefreshing(true);
    setLoading(true);
    setError(null);

    try {
      const results = await staffService.getAllStaff();
      setStaff(results);
      // Removed toast notification to prevent unwanted messages during data refresh
      // showSuccess(t('common.feedback.dataRefreshed'));
    } catch (err) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : t("common.feedback.operationFailed");
      setError(errorMessage);
      showError(t("staff.management"), errorMessage);
    } finally {
      setIsRefreshing(false);
      setLoading(false);
    }
  }, [showError, t]);

  const createStaff = useCallback(
    async (staffData: Omit<Staff, "id" | "createdAt" | "updatedAt">) => {
      setIsCreating(true);
      setLoading(true);
      setError(null);

      try {
        const newStaff = await staffService.createStaff(staffData);
        setStaff((prev) => [...prev, newStaff]);
        showSuccess(
          t("common.feedback.itemCreated"),
          `${staffData.name} has been added to the staff list`
        );
        return newStaff;
      } catch (err) {
        const errorMessage =
          err instanceof Error
            ? err.message
            : t("common.feedback.operationFailed");
        setError(errorMessage);
        showError(t("staff.management"), errorMessage);
        throw err;
      } finally {
        setIsCreating(false);
        setLoading(false);
      }
    },
    [showSuccess, showError, t]
  );

  const updateStaff = useCallback(
    async (id: number, staffData: Partial<Omit<Staff, "id" | "createdAt">>) => {
      setIsUpdating(true);
      setLoading(true);
      setError(null);

      try {
        const updatedStaff = await staffService.updateStaff(id, staffData);
        setStaff((prev) => prev.map((s) => (s.id === id ? updatedStaff : s)));
        showSuccess(
          t("common.feedback.itemUpdated"),
          `${updatedStaff.name} has been updated`
        );
        return updatedStaff;
      } catch (err) {
        const errorMessage =
          err instanceof Error
            ? err.message
            : t("common.feedback.operationFailed");
        setError(errorMessage);
        showError(t("staff.management"), errorMessage);
        throw err;
      } finally {
        setIsUpdating(false);
        setLoading(false);
      }
    },
    [showSuccess, showError, t]
  );

  const deleteStaff = useCallback(
    async (id: number) => {
      setIsDeleting(true);
      setLoading(true);
      setError(null);

      try {
        const staffMember = staff.find((s) => s.id === id);
        await staffService.deleteStaff(id);
        setStaff((prev) => prev.filter((s) => s.id !== id));
        showSuccess(
          t("common.feedback.itemDeleted"),
          staffMember ? `${staffMember.name} has been removed` : undefined
        );
      } catch (err) {
        const errorMessage =
          err instanceof Error
            ? err.message
            : t("common.feedback.operationFailed");
        setError(errorMessage);
        showError(t("staff.management"), errorMessage);
        throw err;
      } finally {
        setIsDeleting(false);
        setLoading(false);
      }
    },
    [staff, showSuccess, showError, t]
  );

  // Initial load
  useEffect(() => {
    // Only fetch if we don't have initial data
    const hasInitialData =
      options.initialStaff && options.initialStaff.length > 0;

    if (!hasInitialData) {
      if (options.initialSearch) {
        searchStaff(options.initialSearch);
      } else {
        refreshStaff();
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    staff,
    loading,
    error,
    searchStaff,
    refreshStaff,
    createStaff,
    updateStaff,
    deleteStaff,
    // Specific loading states
    isSearching,
    isRefreshing,
    isCreating,
    isUpdating,
    isDeleting,
  };
};

export interface UseStaffDetailResult {
  staff: Staff | null;
  loading: boolean;
  error: string | null;
  refreshStaff: () => Promise<void>;
  updateStaff: (
    staffData: Partial<Omit<Staff, "id" | "createdAt">>
  ) => Promise<Staff>;
  deleteStaff: () => Promise<void>;
  // Specific loading states
  isRefreshing: boolean;
  isUpdating: boolean;
  isDeleting: boolean;
}

interface UseStaffDetailOptions {
  initialStaff?: Staff | null;
}

export const useStaffDetail = (
  id: string,
  options: UseStaffDetailOptions = {}
): UseStaffDetailResult => {
  const [staff, setStaff] = useState<Staff | null>(
    options.initialStaff || null
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Specific loading states
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const { showSuccess, showError } = useToast();
  const { t } = useLanguage();

  const refreshStaff = useCallback(async () => {
    if (!id) return;

    setIsRefreshing(true);
    setLoading(true);
    setError(null);

    try {
      const staffMember = await staffService.getStaffById(parseInt(id));
      setStaff(staffMember);
      // Removed toast notification to prevent unwanted messages during data refresh
      // showSuccess(t('common.feedback.dataRefreshed'));
    } catch (err) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : t("common.feedback.operationFailed");
      setError(errorMessage);
      showError(t("staff.details"), errorMessage);
    } finally {
      setIsRefreshing(false);
      setLoading(false);
    }
  }, [id, showError, t]);

  const updateStaff = useCallback(
    async (staffData: Partial<Omit<Staff, "id" | "createdAt">>) => {
      if (!id) throw new Error("No staff ID provided");

      setIsUpdating(true);
      setLoading(true);
      setError(null);

      try {
        const updatedStaff = await staffService.updateStaff(
          parseInt(id),
          staffData
        );
        setStaff(updatedStaff);
        showSuccess(
          t("common.feedback.itemUpdated"),
          `${updatedStaff.name} has been updated`
        );
        return updatedStaff;
      } catch (err) {
        const errorMessage =
          err instanceof Error
            ? err.message
            : t("common.feedback.operationFailed");
        setError(errorMessage);
        showError(t("staff.details"), errorMessage);
        throw err;
      } finally {
        setIsUpdating(false);
        setLoading(false);
      }
    },
    [id, showSuccess, showError, t]
  );

  const deleteStaff = useCallback(async () => {
    if (!id) throw new Error("No staff ID provided");

    setIsDeleting(true);
    setLoading(true);
    setError(null);

    try {
      const staffName = staff?.name;
      await staffService.deleteStaff(parseInt(id));
      setStaff(null);
      showSuccess(
        t("common.feedback.itemDeleted"),
        staffName ? `${staffName} has been removed` : undefined
      );
    } catch (err) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : t("common.feedback.operationFailed");
      setError(errorMessage);
      showError(t("staff.details"), errorMessage);
      throw err;
    } finally {
      setIsDeleting(false);
      setLoading(false);
    }
  }, [id, staff?.name, showSuccess, showError, t]);

  // Initial load
  useEffect(() => {
    // Only fetch if we don't have initial data
    const hasInitialData = options.initialStaff !== undefined;

    if (!hasInitialData) {
      refreshStaff();
    }
  }, [options.initialStaff, refreshStaff]);

  return {
    staff,
    loading,
    error,
    refreshStaff,
    updateStaff,
    deleteStaff,
    // Specific loading states
    isRefreshing,
    isUpdating,
    isDeleting,
  };
};
