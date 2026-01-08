import { useState, useEffect, useCallback } from "react";
import { Property, Document } from "../../shared/types";
import {
  propertyService,
  PropertySearchParams,
} from "../services/propertyService";
import { useClientSideFiltering } from "../components/search/useClientSideFiltering";
import { PAGE_FILTER_CONFIGS } from "../../shared/utils/clientSideFilter";
import { FilterOption } from "../components/search/DynamicFilterDropdown";

interface UsePropertiesOptions {
  initialProperties?: Property[];
  initialTotal?: number;
  enableClientSideFiltering?: boolean;
}

export interface UsePropertiesResult {
  // Core data
  properties: Property[];
  allProperties?: Property[];
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

export const useProperties = (
  params: PropertySearchParams = {},
  options: UsePropertiesOptions = {}
): UsePropertiesResult => {
  const [allProperties, setAllProperties] = useState<Property[]>(
    options.initialProperties || []
  );
  const [total, setTotal] = useState(options.initialTotal || 0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Get property filter configuration
  const propertyFilterConfig = PAGE_FILTER_CONFIGS.properties;

  // Client-side filtering setup
  const clientSideFiltering = useClientSideFiltering<Property>({
    data: allProperties,
    searchFields: propertyFilterConfig.searchFields as (keyof Property)[],
    filterConfigs: propertyFilterConfig.filterConfigs,
    initialState: {
      searchQuery: params.search || "",
      activeFilters: {
        ...(params.type && { propertyType: [params.type] }),
        ...(params.status && { status: [params.status] }),
      },
    },
  });

  // Determine if we should use client-side filtering
  const enableClientFiltering = options.enableClientSideFiltering === true;

  const fetchProperties = useCallback(
    async (fetchParams?: PropertySearchParams) => {
      setLoading(true);
      setError(null);

      try {
        const searchParams = fetchParams || params;

        if (enableClientFiltering) {
          // For client-side filtering, fetch all data without search/filter params
          const result = await propertyService.getAll({
            page: searchParams.page,
            limit: searchParams.limit,
            // Don't pass search/filter params to server when using client-side filtering
          });
          setAllProperties(result.data);
          setTotal(result.pagination.total);
        } else {
          // For server-side filtering, use all params
          const result = await propertyService.getAll(searchParams);
          setAllProperties(result.data);
          setTotal(result.pagination.total);
        }
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to fetch properties"
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
      options.initialProperties && options.initialProperties.length > 0;
    const isInitialParams =
      !params.search &&
      !params.type &&
      !params.status &&
      (!params.page || params.page === 1);

    if (!hasInitialData || !isInitialParams) {
      fetchProperties();
    }
  }, [
    fetchProperties,
    options.initialProperties,
    params.search,
    params.type,
    params.status,
    params.page,
  ]);

  const refetch = useCallback(() => {
    fetchProperties();
  }, [fetchProperties]);

  // Return appropriate data based on filtering mode
  if (enableClientFiltering) {
    return {
      // Client-side filtering results
      properties: clientSideFiltering.filteredData,
      allProperties,
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
      properties: allProperties,
      total,
      loading,
      error,
      refetch,
    };
  }
};

export const useProperty = (id: string | undefined) => {
  const [property, setProperty] = useState<Property | null>(null);
  const [contracts, setContracts] = useState<Document[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchProperty = useCallback(async () => {
    if (!id) return;

    setLoading(true);
    setError(null);

    try {
      const [propertyData, contractsData] = await Promise.all([
        propertyService.getById(id),
        propertyService.getDocuments(id),
      ]);

      setProperty(propertyData);
      setContracts(contractsData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch property");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchProperty();
  }, [id, fetchProperty]);

  const refetch = () => {
    fetchProperty();
  };

  const updateProperty = async (updates: Partial<Property>) => {
    if (!id || !property) return null;

    try {
      const updated = await propertyService.update(id, updates);
      setProperty(updated);
      return updated;
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to update property"
      );
      return null;
    }
  };

  const addDocument = async (documentId: string) => {
    if (!id) return null;

    try {
      const updated = await propertyService.addDocument(id, documentId);
      setProperty(updated);
      // Refetch documents to get the updated list
      const documentsData = await propertyService.getDocuments(id);
      setContracts(documentsData);
      return updated;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add document");
      return null;
    }
  };

  const removeDocument = async (documentId: string) => {
    if (!id) return null;

    try {
      const updated = await propertyService.removeDocument(id, documentId);
      setProperty(updated);
      // Refetch documents to get the updated list
      const documentsData = await propertyService.getDocuments(id);
      setContracts(documentsData);
      return updated;
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to remove document"
      );
      return null;
    }
  };

  return {
    property,
    contracts: contracts, // Keep as contracts for backward compatibility
    loading,
    error,
    refetch,
    updateProperty,
    addDocument,
    removeDocument,
  };
};
