import { InquiryWithRelations } from "../../shared/types";
import { apiClient } from "./apiClient";

export interface InquirySearchParams {
  search?: string;
  status?: string;
  page?: number;
  limit?: number;
}

export interface InquiryListResponse {
  success: boolean;
  data: InquiryWithRelations[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface InquiryResponse {
  success: boolean;
  data: InquiryWithRelations;
  message?: string;
}

export const inquiryService = {
  // Get all inquiries with optional filtering
  getAll: async (
    params: InquirySearchParams = {}
  ): Promise<InquiryListResponse> => {
    const searchParams = new URLSearchParams();

    if (params.search) searchParams.append("search", params.search);
    if (params.status) searchParams.append("status", params.status);
    if (params.page) searchParams.append("page", params.page.toString());
    if (params.limit) searchParams.append("limit", params.limit.toString());

    const result = await apiClient.get<InquiryWithRelations[]>(
      `/inquiries?${searchParams}`
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

  // Get inquiry by ID
  getById: async (id: string): Promise<InquiryWithRelations> => {
    const result = await apiClient.get<InquiryWithRelations>(
      `/inquiries/${id}`
    );

    if (!result.data) {
      throw new Error("Inquiry not found");
    }

    return result.data;
  },

  // Create inquiry
  create: async (
    data: Omit<InquiryWithRelations, "id" | "createdAt" | "updatedAt">
  ): Promise<InquiryWithRelations> => {
    const result = await apiClient.post<InquiryWithRelations>(
      "/inquiries",
      data
    );
    if (!result.data) {
      throw new Error("Failed to create inquiry");
    }
    return result.data;
  },

  // Update inquiry
  update: async (
    id: number,
    data: Partial<Omit<InquiryWithRelations, "id" | "createdAt">>
  ): Promise<InquiryWithRelations> => {
    const result = await apiClient.put<InquiryWithRelations>(
      `/inquiries/${id}`,
      data
    );
    if (!result.data) {
      throw new Error("Failed to update inquiry");
    }
    return result.data;
  },

  // Bulk delete inquiries
  bulkDelete: async (ids: number[]): Promise<{ deletedCount: number }> => {
    const result = await apiClient.post<{ deletedCount: number }>(
      "/inquiries/bulk-delete",
      { ids }
    );
    return result.data || { deletedCount: 0 };
  },
};
