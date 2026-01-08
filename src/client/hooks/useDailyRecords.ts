import { useState, useEffect, useCallback } from "react";
import { DailyRecordWithRelations } from "../../shared/types";
import {
  dailyRecordService,
  DailyRecordSearchParams,
} from "../services/dailyRecordService";

interface UseDailyRecordsOptions {
  initialDailyRecords?: DailyRecordWithRelations[];
  initialTotal?: number;
}

export const useDailyRecords = (
  params: DailyRecordSearchParams = {},
  options: UseDailyRecordsOptions = {}
) => {
  const [dailyRecords, setDailyRecords] = useState<DailyRecordWithRelations[]>(
    options.initialDailyRecords || []
  );
  const [total, setTotal] = useState(options.initialTotal || 0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchDailyRecords = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await dailyRecordService.getAll(params);
      setDailyRecords(result.data);
      setTotal(result.pagination.total);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to fetch daily records"
      );
    } finally {
      setLoading(false);
    }
  }, [params.search, params.status, params.page, params.limit]);

  useEffect(() => {
    // Only fetch if we don't have initial data or if params have changed from initial state
    const hasInitialData =
      options.initialDailyRecords && options.initialDailyRecords.length > 0;
    const isInitialParams =
      !params.search && !params.status && (!params.page || params.page === 1);

    if (!hasInitialData || !isInitialParams) {
      fetchDailyRecords();
    }
  }, [fetchDailyRecords]);

  const refetch = useCallback(() => {
    fetchDailyRecords();
  }, [fetchDailyRecords]);

  return {
    dailyRecords,
    total,
    loading,
    error,
    refetch,
  };
};

export const useDailyRecord = (id: string | undefined) => {
  const [dailyRecord, setDailyRecord] =
    useState<DailyRecordWithRelations | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchDailyRecord = useCallback(async () => {
    if (!id) return;

    setLoading(true);
    setError(null);

    try {
      const data = await dailyRecordService.getById(id);
      setDailyRecord(data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to fetch daily record"
      );
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchDailyRecord();
  }, [id, fetchDailyRecord]);

  const refetch = () => {
    fetchDailyRecord();
  };

  return {
    dailyRecord,
    loading,
    error,
    refetch,
  };
};
