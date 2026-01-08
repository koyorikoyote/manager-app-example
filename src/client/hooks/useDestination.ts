import { useState, useEffect, useCallback } from "react";
import { Company } from "../../shared/types";
import { companyService } from "../services/companyService";
import { useToast } from "../contexts/ToastContext";
import { useLanguage } from "../contexts/LanguageContext";
import { useClientSideFiltering } from "../components/search/useClientSideFiltering";
import { PAGE_FILTER_CONFIGS } from "../../shared/utils/clientSideFilter";
import { FilterOption } from "../components/search/DynamicFilterDropdown";

interface GetCompaniesParams {
  search?: string;
  industry?: string;
  status?: string;
  page?: number;
  limit?: number;
}

interface UseDestinationListOptions {
  initialCompanies?: Company[];
  initialTotal?: number;
  enableClientSideFiltering?: boolean;
}

export interface UseDestinationListResult {
  // Core data
  companies: Company[];
  allCompanies?: Company[];
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

export const useDestinationList = (
  params: GetCompaniesParams = {},
  options: UseDestinationListOptions = {}
): UseDestinationListResult => {
  const [allCompanies, setAllCompanies] = useState<Company[]>(
    options.initialCompanies || []
  );
  const [total, setTotal] = useState(options.initialTotal || 0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Get destination filter configuration
  const destinationFilterConfig = PAGE_FILTER_CONFIGS.destinations;

  // Client-side filtering setup
  const clientSideFiltering = useClientSideFiltering<Company>({
    data: allCompanies,
    searchFields: destinationFilterConfig.searchFields as (keyof Company)[],
    filterConfigs: destinationFilterConfig.filterConfigs,
    initialState: {
      searchQuery: params.search || "",
      activeFilters: {
        ...(params.industry && { industry: [params.industry] }),
        ...(params.status && { status: [params.status] }),
      },
    },
  });

  // Determine if we should use client-side filtering
  const enableClientFiltering = options.enableClientSideFiltering === true;

  const fetchCompanies = useCallback(
    async (fetchParams?: GetCompaniesParams) => {
      setLoading(true);
      setError(null);

      try {
        const searchParams = fetchParams || params;

        if (enableClientFiltering) {
          // For client-side filtering, fetch all data without search/filter params
          const result = await companyService.getCompanies({
            page: searchParams.page,
            limit: searchParams.limit,
            // Don't pass search/filter params to server when using client-side filtering
          });
          setAllCompanies(result.companies);
          setTotal(result.total);
        } else {
          // For server-side filtering, use all params
          const result = await companyService.getCompanies(searchParams);
          setAllCompanies(result.companies);
          setTotal(result.total);
        }
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to fetch destinations"
        );
      } finally {
        setLoading(false);
      }
    },
    [params, enableClientFiltering]
  );

  useEffect(() => {
    // Only fetch if we don't have initial data or if params have changed from initial state
    const hasInitialData =
      options.initialCompanies && options.initialCompanies.length > 0;
    const isInitialParams =
      !params.search &&
      !params.industry &&
      !params.status &&
      (!params.page || params.page === 1);

    if (!hasInitialData || !isInitialParams) {
      fetchCompanies();
    }
  }, [
    fetchCompanies,
    options.initialCompanies,
    params.search,
    params.industry,
    params.status,
    params.page,
  ]);

  const refetch = useCallback(() => {
    fetchCompanies();
  }, [fetchCompanies]);

  // Return appropriate data based on filtering mode
  if (enableClientFiltering) {
    return {
      // Client-side filtering results
      companies: clientSideFiltering.filteredData,
      allCompanies,
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
      companies: allCompanies,
      total,
      loading,
      error,
      refetch,
    };
  }
};

export interface UseDestinationResult {
  companies: Company[];
  loading: boolean;
  error: string | null;
  searchCompanies: (params: GetCompaniesParams) => Promise<void>;
  refreshCompanies: () => Promise<void>;
  createCompany: (
    companyData: Omit<Company, "id" | "createdAt" | "updatedAt">
  ) => Promise<Company>;
  updateCompany: (
    id: number,
    companyData: Partial<Omit<Company, "id" | "createdAt">>
  ) => Promise<Company>;
  deleteCompany: (id: number) => Promise<void>;
  // Loading states for specific operations
  isSearching: boolean;
  isRefreshing: boolean;
  isCreating: boolean;
  isUpdating: boolean;
  isDeleting: boolean;
}

interface UseDestinationOptions {
  initialCompanies?: Company[];
  initialSearch?: GetCompaniesParams;
}

export const useDestination = (
  options: UseDestinationOptions = {}
): UseDestinationResult => {
  const [companies, setCompanies] = useState<Company[]>(
    options.initialCompanies || []
  );
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

  const searchCompanies = useCallback(
    async (params: GetCompaniesParams) => {
      setIsSearching(true);
      setLoading(true);
      setError(null);

      try {
        const results = await companyService.getCompanies(params);
        setCompanies(results.companies);
      } catch (err) {
        const errorMessage =
          err instanceof Error
            ? err.message
            : t("common.feedback.operationFailed");
        setError(errorMessage);
        showError(t("destinations.title"), errorMessage);
      } finally {
        setIsSearching(false);
        setLoading(false);
      }
    },
    [showError, t]
  );

  const refreshCompanies = useCallback(async () => {
    setIsRefreshing(true);
    setLoading(true);
    setError(null);

    try {
      const results = await companyService.getCompanies();
      setCompanies(results.companies);
    } catch (err) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : t("common.feedback.operationFailed");
      setError(errorMessage);
      showError(t("destinations.title"), errorMessage);
    } finally {
      setIsRefreshing(false);
      setLoading(false);
    }
  }, [showError, t]);

  const createCompany = useCallback(
    async (companyData: Omit<Company, "id" | "createdAt" | "updatedAt">) => {
      setIsCreating(true);
      setLoading(true);
      setError(null);

      try {
        const newCompany = await companyService.createCompany(companyData);
        setCompanies((prev) => [...prev, newCompany]);
        showSuccess(
          t("common.feedback.itemCreated"),
          `${companyData.name} has been added to the destinations list`
        );
        return newCompany;
      } catch (err) {
        const errorMessage =
          err instanceof Error
            ? err.message
            : t("common.feedback.operationFailed");
        setError(errorMessage);
        showError(t("destinations.title"), errorMessage);
        throw err;
      } finally {
        setIsCreating(false);
        setLoading(false);
      }
    },
    [showSuccess, showError, t]
  );

  const updateCompany = useCallback(
    async (
      id: number,
      companyData: Partial<Omit<Company, "id" | "createdAt">>
    ) => {
      setIsUpdating(true);
      setLoading(true);
      setError(null);

      try {
        const updatedCompany = await companyService.updateCompany(
          id,
          companyData
        );
        setCompanies((prev) =>
          prev.map((c) => (c.id === id ? updatedCompany : c))
        );
        showSuccess(
          t("common.feedback.itemUpdated"),
          `${updatedCompany.name} has been updated`
        );
        return updatedCompany;
      } catch (err) {
        const errorMessage =
          err instanceof Error
            ? err.message
            : t("common.feedback.operationFailed");
        setError(errorMessage);
        showError(t("destinations.title"), errorMessage);
        throw err;
      } finally {
        setIsUpdating(false);
        setLoading(false);
      }
    },
    [showSuccess, showError, t]
  );

  const deleteCompany = useCallback(
    async (id: number) => {
      setIsDeleting(true);
      setLoading(true);
      setError(null);

      try {
        const company = companies.find((c) => c.id === id);
        await companyService.deleteCompany(id);
        setCompanies((prev) => prev.filter((c) => c.id !== id));
        showSuccess(
          t("common.feedback.itemDeleted"),
          company ? `${company.name} has been removed` : undefined
        );
      } catch (err) {
        const errorMessage =
          err instanceof Error
            ? err.message
            : t("common.feedback.operationFailed");
        setError(errorMessage);
        showError(t("destinations.title"), errorMessage);
        throw err;
      } finally {
        setIsDeleting(false);
        setLoading(false);
      }
    },
    [companies, showSuccess, showError, t]
  );

  // Initial load
  useEffect(() => {
    // Only fetch if we don't have initial data
    const hasInitialData =
      options.initialCompanies && options.initialCompanies.length > 0;

    if (!hasInitialData) {
      if (options.initialSearch) {
        searchCompanies(options.initialSearch);
      } else {
        refreshCompanies();
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    companies,
    loading,
    error,
    searchCompanies,
    refreshCompanies,
    createCompany,
    updateCompany,
    deleteCompany,
    // Specific loading states
    isSearching,
    isRefreshing,
    isCreating,
    isUpdating,
    isDeleting,
  };
};

export interface UseDestinationDetailResult {
  company: Company | null;
  loading: boolean;
  error: string | null;
  refreshCompany: () => Promise<void>;
  updateCompany: (
    companyData: Partial<Omit<Company, "id" | "createdAt">>
  ) => Promise<Company>;
  deleteCompany: () => Promise<void>;
  // Specific loading states
  isRefreshing: boolean;
  isUpdating: boolean;
  isDeleting: boolean;
}

interface UseDestinationDetailOptions {
  initialCompany?: Company | null;
}

export const useDestinationDetail = (
  id: string,
  options: UseDestinationDetailOptions = {}
): UseDestinationDetailResult => {
  const [company, setCompany] = useState<Company | null>(
    options.initialCompany || null
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Specific loading states
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const { showSuccess, showError } = useToast();
  const { t } = useLanguage();

  const refreshCompany = useCallback(async () => {
    if (!id) return;

    setIsRefreshing(true);
    setLoading(true);
    setError(null);

    try {
      const companyData = await companyService.getCompany(parseInt(id));
      setCompany(companyData);
    } catch (err) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : t("common.feedback.operationFailed");
      setError(errorMessage);
      showError(t("destinations.title"), errorMessage);
    } finally {
      setIsRefreshing(false);
      setLoading(false);
    }
  }, [id, showError, t]);

  const updateCompany = useCallback(
    async (companyData: Partial<Omit<Company, "id" | "createdAt">>) => {
      if (!id) throw new Error("No company ID provided");

      setIsUpdating(true);
      setLoading(true);
      setError(null);

      try {
        const updatedCompany = await companyService.updateCompany(
          parseInt(id),
          companyData
        );
        setCompany(updatedCompany);
        showSuccess(
          t("common.feedback.itemUpdated"),
          `${updatedCompany.name} has been updated`
        );
        return updatedCompany;
      } catch (err) {
        const errorMessage =
          err instanceof Error
            ? err.message
            : t("common.feedback.operationFailed");
        setError(errorMessage);
        showError(t("destinations.title"), errorMessage);
        throw err;
      } finally {
        setIsUpdating(false);
        setLoading(false);
      }
    },
    [id, showSuccess, showError, t]
  );

  const deleteCompany = useCallback(async () => {
    if (!id) throw new Error("No company ID provided");

    setIsDeleting(true);
    setLoading(true);
    setError(null);

    try {
      const companyName = company?.name;
      await companyService.deleteCompany(parseInt(id));
      setCompany(null);
      showSuccess(
        t("common.feedback.itemDeleted"),
        companyName ? `${companyName} has been removed` : undefined
      );
    } catch (err) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : t("common.feedback.operationFailed");
      setError(errorMessage);
      showError(t("destinations.title"), errorMessage);
      throw err;
    } finally {
      setIsDeleting(false);
      setLoading(false);
    }
  }, [id, company?.name, showSuccess, showError, t]);

  // Initial load
  useEffect(() => {
    // Only fetch if we don't have initial data
    const hasInitialData = options.initialCompany !== undefined;

    if (!hasInitialData) {
      refreshCompany();
    }
  }, [options.initialCompany, refreshCompany]);

  return {
    company,
    loading,
    error,
    refreshCompany,
    updateCompany,
    deleteCompany,
    // Specific loading states
    isRefreshing,
    isUpdating,
    isDeleting,
  };
};
