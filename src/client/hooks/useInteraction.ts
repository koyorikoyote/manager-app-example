import { useState, useEffect, useCallback } from "react";
import { InteractionRecord } from "../../shared/types";
import {
  interactionService,
  InteractionFilters,
} from "../services/interactionService";
import { useToast } from "../contexts/ToastContext";
import { useLanguage } from "../contexts/LanguageContext";
import { useClientSideFiltering } from "../components/search/useClientSideFiltering";
import { PAGE_FILTER_CONFIGS } from "../../shared/utils/clientSideFilter";
import { FilterOption } from "../components/search/DynamicFilterDropdown";

interface UseInteractionListOptions {
  initialInteractions?: InteractionRecord[];
  initialTotal?: number;
  enableClientSideFiltering?: boolean;
}

export interface UseInteractionListResult {
  // Core data
  interactions: InteractionRecord[];
  allInteractions?: InteractionRecord[];
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

export const useInteractionList = (
  params: InteractionFilters = {},
  options: UseInteractionListOptions = {}
): UseInteractionListResult => {
  const [allInteractions, setAllInteractions] = useState<InteractionRecord[]>(
    options.initialInteractions || []
  );
  const [total, setTotal] = useState(options.initialTotal || 0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Get interaction filter configuration
  const interactionFilterConfig = PAGE_FILTER_CONFIGS.interactions;

  // Client-side filtering setup
  const clientSideFiltering = useClientSideFiltering<InteractionRecord>({
    data: allInteractions,
    searchFields:
      interactionFilterConfig.searchFields as (keyof InteractionRecord)[],
    filterConfigs: interactionFilterConfig.filterConfigs,
    initialState: {
      searchQuery: params.search || "",
      activeFilters: {
        ...(params.type && { type: [params.type] }),
        ...(params.status && { status: [params.status] }),
      },
    },
  });

  // Determine if we should use client-side filtering
  const enableClientFiltering = options.enableClientSideFiltering === true;

  const fetchInteractions = useCallback(
    async (fetchParams?: InteractionFilters) => {
      setLoading(true);
      setError(null);

      try {
        const searchParams = fetchParams || params;

        if (enableClientFiltering) {
          // For client-side filtering, fetch all data without search/filter params
          const result = await interactionService.getInteractions({
            sortBy: searchParams.sortBy,
            sortOrder: searchParams.sortOrder,
            // Don't pass search/filter params to server when using client-side filtering
          });
          setAllInteractions(result.data);
          setTotal(result.total);
        } else {
          // For server-side filtering, use all params
          const result = await interactionService.getInteractions(searchParams);
          setAllInteractions(result.data);
          setTotal(result.total);
        }
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to fetch interactions"
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
      options.initialInteractions && options.initialInteractions.length > 0;
    const isInitialParams =
      !params.search &&
      !params.type &&
      !params.status &&
      !params.dateFrom &&
      !params.dateTo;

    if (!hasInitialData || !isInitialParams) {
      fetchInteractions();
    }
  }, [
    fetchInteractions,
    options.initialInteractions,
    params.search,
    params.type,
    params.status,
    params.dateFrom,
    params.dateTo,
  ]);

  const refetch = useCallback(() => {
    fetchInteractions();
  }, [fetchInteractions]);

  // Return appropriate data based on filtering mode
  if (enableClientFiltering) {
    return {
      // Client-side filtering results
      interactions: clientSideFiltering.filteredData,
      allInteractions,
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
      interactions: allInteractions,
      total,
      loading,
      error,
      refetch,
    };
  }
};

export interface UseInteractionResult {
  interactions: InteractionRecord[];
  loading: boolean;
  error: string | null;
  searchInteractions: (params: InteractionFilters) => Promise<void>;
  refreshInteractions: () => Promise<void>;
  createInteraction: (
    interactionData: Omit<InteractionRecord, "id" | "createdAt" | "updatedAt">
  ) => Promise<InteractionRecord>;
  updateInteraction: (
    id: string,
    interactionData: Partial<Omit<InteractionRecord, "id" | "createdAt">>
  ) => Promise<InteractionRecord>;
  deleteInteraction: (id: string) => Promise<void>;
  // Loading states for specific operations
  isSearching: boolean;
  isRefreshing: boolean;
  isCreating: boolean;
  isUpdating: boolean;
  isDeleting: boolean;
}

interface UseInteractionOptions {
  initialInteractions?: InteractionRecord[];
  initialSearch?: InteractionFilters;
}

export const useInteraction = (
  options: UseInteractionOptions = {}
): UseInteractionResult => {
  const [interactions, setInteractions] = useState<InteractionRecord[]>(
    options.initialInteractions || []
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

  const searchInteractions = useCallback(
    async (params: InteractionFilters) => {
      setIsSearching(true);
      setLoading(true);
      setError(null);

      try {
        const results = await interactionService.getInteractions(params);
        setInteractions(results.data);
      } catch (err) {
        const errorMessage =
          err instanceof Error
            ? err.message
            : t("common.feedback.operationFailed");
        setError(errorMessage);
        showError(t("interactions.management"), errorMessage);
      } finally {
        setIsSearching(false);
        setLoading(false);
      }
    },
    [showError, t]
  );

  const refreshInteractions = useCallback(async () => {
    setIsRefreshing(true);
    setLoading(true);
    setError(null);

    try {
      const results = await interactionService.getInteractions();
      setInteractions(results.data);
    } catch (err) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : t("common.feedback.operationFailed");
      setError(errorMessage);
      showError(t("interactions.management"), errorMessage);
    } finally {
      setIsRefreshing(false);
      setLoading(false);
    }
  }, [showError, t]);

  const createInteraction = useCallback(
    async (
      interactionData: Omit<InteractionRecord, "id" | "createdAt" | "updatedAt">
    ) => {
      setIsCreating(true);
      setLoading(true);
      setError(null);

      try {
        const newInteraction = await interactionService.createInteraction({
          type: interactionData.type,
          personInvolvedStaffId:
            interactionData.personInvolvedStaffId != null
              ? String(interactionData.personInvolvedStaffId)
              : undefined,
          date: interactionData.date,
          description: interactionData.description,
          status: interactionData.status,
          createdBy: interactionData.createdBy,
          name: interactionData.name,
          title: interactionData.title,
          userInChargeId: interactionData.userInChargeId,
          personConcerned: interactionData.personConcerned,
        });
        setInteractions((prev) => [...prev, newInteraction]);
        showSuccess(
          t("common.feedback.itemCreated"),
          `Interaction has been added`
        );
        return newInteraction;
      } catch (err) {
        const errorMessage =
          err instanceof Error
            ? err.message
            : t("common.feedback.operationFailed");
        setError(errorMessage);
        showError(t("interactions.management"), errorMessage);
        throw err;
      } finally {
        setIsCreating(false);
        setLoading(false);
      }
    },
    [showSuccess, showError, t]
  );

  const updateInteraction = useCallback(
    async (
      id: string,
      interactionData: Partial<Omit<InteractionRecord, "id" | "createdAt">>
    ) => {
      setIsUpdating(true);
      setLoading(true);
      setError(null);

      try {
        const payloadForUpdate = {
          ...(interactionData as Record<string, unknown>),
          personInvolvedStaffId:
            interactionData.personInvolvedStaffId != null
              ? String(interactionData.personInvolvedStaffId)
              : undefined,
        };
        const updatedInteraction = await interactionService.updateInteraction(
          id,
          payloadForUpdate as any
        );
        setInteractions((prev) =>
          prev.map((i) => (String(i.id) === String(id) ? updatedInteraction : i))
        );
        showSuccess(
          t("common.feedback.itemUpdated"),
          `Interaction has been updated`
        );
        return updatedInteraction;
      } catch (err) {
        const errorMessage =
          err instanceof Error
            ? err.message
            : t("common.feedback.operationFailed");
        setError(errorMessage);
        showError(t("interactions.management"), errorMessage);
        throw err;
      } finally {
        setIsUpdating(false);
        setLoading(false);
      }
    },
    [showSuccess, showError, t]
  );

  const deleteInteraction = useCallback(
    async (id: string) => {
      setIsDeleting(true);
      setLoading(true);
      setError(null);

      try {
        await interactionService.deleteInteraction(id);
        setInteractions((prev) => prev.filter((i) => String(i.id) !== String(id)));
        showSuccess(
          t("common.feedback.itemDeleted"),
          `Interaction has been removed`
        );
      } catch (err) {
        const errorMessage =
          err instanceof Error
            ? err.message
            : t("common.feedback.operationFailed");
        setError(errorMessage);
        showError(t("interactions.management"), errorMessage);
        throw err;
      } finally {
        setIsDeleting(false);
        setLoading(false);
      }
    },
    [showSuccess, showError, t]
  );

  // Initial load
  useEffect(() => {
    // Only fetch if we don't have initial data
    const hasInitialData =
      options.initialInteractions && options.initialInteractions.length > 0;

    if (!hasInitialData) {
      if (options.initialSearch) {
        searchInteractions(options.initialSearch);
      } else {
        refreshInteractions();
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    interactions,
    loading,
    error,
    searchInteractions,
    refreshInteractions,
    createInteraction,
    updateInteraction,
    deleteInteraction,
    // Specific loading states
    isSearching,
    isRefreshing,
    isCreating,
    isUpdating,
    isDeleting,
  };
};
