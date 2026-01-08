import { useState, useEffect, useCallback } from "react";
import { AttendanceRecord } from "../../shared/types";
import {
  attendanceService,
  AttendanceFilters,
  AttendanceStatistics,
} from "../services/attendanceService";
import { toJSTISOString } from "../../shared/utils/jstDateUtils";

export function useAttendance(filters?: AttendanceFilters) {
  const [attendanceRecords, setAttendanceRecords] = useState<
    AttendanceRecord[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Create stable dependencies from filters object
  const staffIds = filters?.staffIds?.join(",") || "";
  const startDate = filters?.startDate ? toJSTISOString(filters.startDate) : "";
  const endDate = filters?.endDate ? toJSTISOString(filters.endDate) : "";
  const status = filters?.status?.join(",") || "";

  const fetchAttendanceRecords = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Reconstruct filters from stable dependencies
      const reconstructedFilters: AttendanceFilters = {};
      if (staffIds) reconstructedFilters.staffIds = staffIds.split(",");
      if (startDate) reconstructedFilters.startDate = new Date(startDate);
      if (endDate) reconstructedFilters.endDate = new Date(endDate);
      if (status)
        reconstructedFilters.status = status.split(
          ","
        ) as AttendanceRecord["status"][];

      const records = await attendanceService.getAllAttendanceRecords(
        Object.keys(reconstructedFilters).length > 0
          ? reconstructedFilters
          : undefined
      );
      setAttendanceRecords(records);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to fetch attendance records"
      );
    } finally {
      setLoading(false);
    }
  }, [staffIds, startDate, endDate, status]);

  useEffect(() => {
    fetchAttendanceRecords();
  }, [fetchAttendanceRecords]);

  const createRecord = useCallback(
    async (
      recordData: Omit<
        AttendanceRecord,
        "id" | "createdAt" | "updatedAt" | "createdBy"
      >
    ) => {
      try {
        const newRecord = await attendanceService.createAttendanceRecord(
          recordData
        );
        setAttendanceRecords((prev) => [newRecord, ...prev]);
        return newRecord;
      } catch (err) {
        throw new Error(
          err instanceof Error
            ? err.message
            : "Failed to create attendance record"
        );
      }
    },
    []
  );

  const updateRecord = useCallback(
    async (
      id: string,
      recordData: Partial<
        Omit<AttendanceRecord, "id" | "createdAt" | "createdBy">
      >
    ) => {
      try {
        const updatedRecord = await attendanceService.updateAttendanceRecord(
          id,
          recordData
        );
        setAttendanceRecords((prev) =>
          prev.map((record) => (record.id === id ? updatedRecord : record))
        );
        return updatedRecord;
      } catch (err) {
        throw new Error(
          err instanceof Error
            ? err.message
            : "Failed to update attendance record"
        );
      }
    },
    []
  );

  const deleteRecord = useCallback(async (id: string) => {
    try {
      await attendanceService.deleteAttendanceRecord(id);
      setAttendanceRecords((prev) => prev.filter((record) => record.id !== id));
    } catch (err) {
      throw new Error(
        err instanceof Error
          ? err.message
          : "Failed to delete attendance record"
      );
    }
  }, []);

  return {
    attendanceRecords,
    loading,
    error,
    refetch: fetchAttendanceRecords,
    createRecord,
    updateRecord,
    deleteRecord,
  };
}

export function useStaffAttendance(
  staffId: string,
  startDate?: Date,
  endDate?: Date
) {
  const [attendanceRecords, setAttendanceRecords] = useState<
    AttendanceRecord[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStaffAttendance = useCallback(async () => {
    if (!staffId) return;

    try {
      setLoading(true);
      setError(null);
      const records = await attendanceService.getAttendanceByStaffId(
        staffId,
        startDate,
        endDate
      );
      setAttendanceRecords(records);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to fetch staff attendance"
      );
    } finally {
      setLoading(false);
    }
  }, [staffId, startDate, endDate]);

  useEffect(() => {
    fetchStaffAttendance();
  }, [fetchStaffAttendance]);

  return {
    attendanceRecords,
    loading,
    error,
    refetch: fetchStaffAttendance,
  };
}

export function useAttendanceStatistics(
  staffId?: string,
  startDate?: Date,
  endDate?: Date
) {
  const [statistics, setStatistics] = useState<AttendanceStatistics | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStatistics = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const stats = await attendanceService.getAttendanceStatistics(
        staffId,
        startDate,
        endDate
      );
      setStatistics(stats);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to fetch attendance statistics"
      );
    } finally {
      setLoading(false);
    }
  }, [staffId, startDate, endDate]);

  useEffect(() => {
    fetchStatistics();
  }, [fetchStatistics]);

  return {
    statistics,
    loading,
    error,
    refetch: fetchStatistics,
  };
}
