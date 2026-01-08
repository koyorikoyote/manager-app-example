import { ComplaintDetailWithRelations } from "../../shared/types";
import { apiClient } from "./apiClient";

export interface ComplaintSearchParams {
  search?: string;
  status?: string;
  page?: number;
  limit?: number;
}

export interface ComplaintListResponse {
  success: boolean;
  data: ComplaintDetailWithRelations[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface ComplaintResponse {
  success: boolean;
  data: ComplaintDetailWithRelations;
  message?: string;
}

export const complaintService = {
  // Get all complaint details with optional filtering
  getAll: async (
    params: ComplaintSearchParams = {}
  ): Promise<ComplaintListResponse> => {
    const searchParams = new URLSearchParams();

    if (params.search) searchParams.append("search", params.search);
    if (params.status) searchParams.append("status", params.status);
    if (params.page) searchParams.append("page", params.page.toString());
    if (params.limit) searchParams.append("limit", params.limit.toString());

    const result = await apiClient.get<ComplaintDetailWithRelations[]>(
      `/complaint-details?${searchParams}`
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

  // Get complaint detail by ID
  getById: async (id: string): Promise<ComplaintDetailWithRelations> => {
    const result = await apiClient.get<ComplaintDetailWithRelations>(
      `/complaint-details/${id}`
    );

    if (!result.data) {
      throw new Error("Complaint detail not found");
    }

    return result.data;
  },

  // Create complaint
  create: async (
    data: Omit<ComplaintDetailWithRelations, "id" | "createdAt" | "updatedAt">
  ): Promise<ComplaintDetailWithRelations> => {
    const result = await apiClient.post<ComplaintDetailWithRelations>(
      "/complaint-details",
      data
    );
    if (!result.data) {
      throw new Error("Failed to create complaint");
    }
    return result.data;
  },

  // Update complaint
  update: async (
    id: number,
    data: Partial<Omit<ComplaintDetailWithRelations, "id" | "createdAt">>
  ): Promise<ComplaintDetailWithRelations> => {
    const result = await apiClient.put<ComplaintDetailWithRelations>(
      `/complaint-details/${id}`,
      data
    );
    if (!result.data) {
      throw new Error("Failed to update complaint");
    }
    return result.data;
  },

  // Bulk delete complaint details
  bulkDelete: async (ids: number[]): Promise<{ deletedCount: number }> => {
    const result = await apiClient.post<{ deletedCount: number }>(
      "/complaint-details/bulk-delete",
      { ids }
    );
    return result.data || { deletedCount: 0 };
  },

  // Get high-priority complaints (urgency_level='High')
  getHighPriorityComplaints: async (): Promise<ComplaintListResponse> => {
    const result = await apiClient.get<ComplaintDetailWithRelations[]>(
      "/complaint-details?urgencyLevel=High"
    );

    return {
      success: true,
      data: result.data || [],
      pagination: {
        page: result.pagination?.page || 1,
        limit: result.pagination?.limit || 100,
        total: result.pagination?.total || 0,
        pages: result.pagination?.pages || 0,
      },
    };
  },
};
