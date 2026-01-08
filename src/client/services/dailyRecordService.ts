import { DailyRecordWithRelations } from "../../shared/types";
import { apiClient } from "./apiClient";
import { formatDateForBackend } from "../utils/dateUtils";

export interface DailyRecordSearchParams {
  search?: string;
  status?: string;
  page?: number;
  limit?: number;
}

export interface DailyRecordListResponse {
  success: boolean;
  data: DailyRecordWithRelations[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface DailyRecordResponse {
  success: boolean;
  data: DailyRecordWithRelations;
  message?: string;
}

export const dailyRecordService = {
  // Get all daily records with optional filtering
  getAll: async (
    params: DailyRecordSearchParams = {}
  ): Promise<DailyRecordListResponse> => {
    const searchParams = new URLSearchParams();

    if (params.search) searchParams.append("search", params.search);
    if (params.status) searchParams.append("status", params.status);
    if (params.page) searchParams.append("page", params.page.toString());
    if (params.limit) searchParams.append("limit", params.limit.toString());

    const result = await apiClient.get<DailyRecordWithRelations[]>(
      `/daily-record?${searchParams}`
    );

    return {
      success: true,
      data: result.data || [],
      pagination: {
        page: result.pagination?.page || 1,
        limit: result.pagination?.limit || 10,
        total: result.pagination?.total || 0,
        pages: result.pagination?.pages || 0,
      },
    };
  },

  // Get daily record by ID
  getById: async (id: string): Promise<DailyRecordWithRelations> => {
    const result = await apiClient.get<DailyRecordWithRelations>(
      `/daily-record/${id}`
    );

    if (!result.data) {
      throw new Error("Daily record not found");
    }

    return result.data;
  },

  // Create daily record
  create: async (
    data: Omit<DailyRecordWithRelations, "id" | "createdAt" | "updatedAt">
  ): Promise<DailyRecordWithRelations> => {
    const payload = {
      ...data,
      dateOfRecord: formatDateForBackend((data as any).dateOfRecord),
    };
    const result = await apiClient.post<DailyRecordWithRelations>(
      "/daily-record",
      payload
    );
    if (!result.data) {
      throw new Error("Failed to create daily record");
    }
    return result.data;
  },

  // Update daily record
  update: async (
    id: number,
    data: Partial<Omit<DailyRecordWithRelations, "id" | "createdAt">>
  ): Promise<DailyRecordWithRelations> => {
    const payload = {
      ...data,
      ...(data.dateOfRecord !== undefined
        ? { dateOfRecord: formatDateForBackend((data as any).dateOfRecord) }
        : {}),
    };
    const result = await apiClient.put<DailyRecordWithRelations>(
      `/daily-record/${id}`,
      payload
    );
    if (!result.data) {
      throw new Error("Failed to update daily record");
    }
    return result.data;
  },

  // Get daily records by staff ID
  getByStaffId: async (
    staffId: number,
    signal?: AbortSignal
  ): Promise<DailyRecordWithRelations[]> => {
    const result = await apiClient.get<DailyRecordWithRelations[]>(
      `/daily-record/staff/${staffId}`,
      { signal }
    );
    return result.data || [];
  },

  // Bulk delete daily records
  bulkDelete: async (ids: number[]): Promise<{ deletedCount: number }> => {
    const result = await apiClient.post<{ deletedCount: number }>(
      "/daily-record/bulk-delete",
      { ids }
    );
    return result.data || { deletedCount: 0 };
  },
};
