import { useState, useEffect, useCallback } from "react";
import { InquiryWithRelations } from "../../shared/types";
import {
  inquiryService,
  InquirySearchParams,
} from "../services/inquiryService";

interface UseInquiriesOptions {
  initialInquiries?: InquiryWithRelations[];
  initialTotal?: number;
}

export const useInquiries = (
  params: InquirySearchParams = {},
  options: UseInquiriesOptions = {}
) => {
  const [inquiries, setInquiries] = useState<InquiryWithRelations[]>(
    options.initialInquiries || []
  );
  const [total, setTotal] = useState(options.initialTotal || 0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchInquiries = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await inquiryService.getAll(params);
      setInquiries(result.data);
      setTotal(result.pagination.total);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to fetch inquiries"
      );
    } finally {
      setLoading(false);
    }
  }, [params.search, params.status, params.page, params.limit]);

  useEffect(() => {
    // Only fetch if we don't have initial data or if params have changed from initial state
    const hasInitialData =
      options.initialInquiries && options.initialInquiries.length > 0;
    const isInitialParams =
      !params.search && !params.status && (!params.page || params.page === 1);

    if (!hasInitialData || !isInitialParams) {
      fetchInquiries();
    }
  }, [fetchInquiries]);

  const refetch = useCallback(() => {
    fetchInquiries();
  }, [fetchInquiries]);

  return {
    inquiries,
    total,
    loading,
    error,
    refetch,
  };
};

export const useInquiry = (id: string | undefined) => {
  const [inquiry, setInquiry] = useState<InquiryWithRelations | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchInquiry = useCallback(async () => {
    if (!id) return;

    setLoading(true);
    setError(null);

    try {
      const data = await inquiryService.getById(id);
      setInquiry(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch inquiry");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchInquiry();
  }, [id, fetchInquiry]);

  const refetch = () => {
    fetchInquiry();
  };

  return {
    inquiry,
    loading,
    error,
    refetch,
  };
};
