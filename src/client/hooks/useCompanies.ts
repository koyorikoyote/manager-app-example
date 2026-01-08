import { useState, useEffect, useCallback } from "react";
import { Company } from "../../shared/types";
import { companyService } from "../services/companyService";

interface UseCompaniesParams {
  search?: string;
  industry?: string;
  status?: string;
  page?: number;
  limit?: number;
}

interface UseCompaniesOptions {
  initialCompanies?: Company[];
  initialTotal?: number;
}

interface UseCompaniesReturn {
  companies: Company[];
  total: number;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export const useCompanies = (
  params: UseCompaniesParams = {},
  options: UseCompaniesOptions = {}
): UseCompaniesReturn => {
  const [companies, setCompanies] = useState<Company[]>(
    options.initialCompanies || []
  );
  const [total, setTotal] = useState(options.initialTotal || 0);
  const [loading, setLoading] = useState(!options.initialCompanies);
  const [error, setError] = useState<string | null>(null);

  const fetchCompanies = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await companyService.getCompanies(params);
      setCompanies(response.companies);
      setTotal(response.total);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to fetch companies"
      );
      console.error("Error fetching companies:", err);
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    params.search,
    params.industry,
    params.status,
    params.page,
    params.limit,
  ]);

  useEffect(() => {
    // Only fetch if we don't have initial data or if params changed
    if (
      !options.initialCompanies ||
      Object.keys(params).some((key) => params[key as keyof UseCompaniesParams])
    ) {
      fetchCompanies();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    fetchCompanies,
    options.initialCompanies,
    params.search,
    params.industry,
    params.status,
    params.page,
    params.limit,
  ]);

  const refetch = useCallback(() => {
    fetchCompanies();
  }, [fetchCompanies]);

  return {
    companies,
    total,
    loading,
    error,
    refetch,
  };
};
