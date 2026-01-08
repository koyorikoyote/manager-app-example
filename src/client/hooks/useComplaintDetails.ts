import { useState, useEffect, useCallback } from "react";
import { ComplaintDetailWithRelations } from "../../shared/types";
import {
  complaintService,
  ComplaintSearchParams,
} from "../services/complaintService";

interface UseComplaintDetailsOptions {
  initialComplaintDetails?: ComplaintDetailWithRelations[];
  initialTotal?: number;
}

export const useComplaintDetails = (
  params: ComplaintSearchParams = {},
  options: UseComplaintDetailsOptions = {}
) => {
  const [complaintDetails, setComplaintDetails] = useState<
    ComplaintDetailWithRelations[]
  >(options.initialComplaintDetails || []);
  const [total, setTotal] = useState(options.initialTotal || 0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchComplaintDetails = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await complaintService.getAll(params);
      setComplaintDetails(result.data);
      setTotal(result.pagination.total);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to fetch complaint details"
      );
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.search, params.status, params.page, params.limit]);

  useEffect(() => {
    // Only fetch if we don't have initial data or if params have changed from initial state
    const hasInitialData =
      options.initialComplaintDetails &&
      options.initialComplaintDetails.length > 0;
    const isInitialParams =
      !params.search && !params.status && (!params.page || params.page === 1);

    if (!hasInitialData || !isInitialParams) {
      fetchComplaintDetails();
    }
  }, [
    fetchComplaintDetails,
    options.initialComplaintDetails,
    params.search,
    params.status,
    params.page,
  ]);

  const refetch = useCallback(() => {
    fetchComplaintDetails();
  }, [fetchComplaintDetails]);

  return {
    complaintDetails,
    total,
    loading,
    error,
    refetch,
  };
};

export const useComplaintDetail = (id: string | undefined) => {
  const [complaintDetail, setComplaintDetail] =
    useState<ComplaintDetailWithRelations | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchComplaintDetail = useCallback(async () => {
    if (!id) return;

    setLoading(true);
    setError(null);

    try {
      const data = await complaintService.getById(id);
      setComplaintDetail(data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to fetch complaint detail"
      );
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchComplaintDetail();
  }, [id, fetchComplaintDetail]);

  const refetch = () => {
    fetchComplaintDetail();
  };

  return {
    complaintDetail,
    loading,
    error,
    refetch,
  };
};
