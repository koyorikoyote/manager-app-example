import { Property, Document } from "../../shared/types";
import { apiClient } from "./apiClient";

export interface PropertySearchParams {
  search?: string;
  type?: string;
  status?: string;
  page?: number;
  limit?: number;
}

export interface PropertyListResponse {
  success: boolean;
  data: Property[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface PropertyResponse {
  success: boolean;
  data: Property;
  message?: string;
}

export interface PropertyDocumentsResponse {
  success: boolean;
  data: Document[];
}

export const propertyService = {
  // Get all properties (simple method for Sales Assistant pattern)
  getAllProperties: async (signal?: AbortSignal): Promise<Property[]> => {
    const result = await apiClient.get<Property[]>("/properties", { signal });
    return result.data || [];
  },

  // Get all properties with optional filtering
  getAll: async (
    params: PropertySearchParams = {},
    signal?: AbortSignal
  ): Promise<PropertyListResponse> => {
    const searchParams = new URLSearchParams();

    if (params.search) searchParams.append("search", params.search);
    if (params.type) searchParams.append("type", params.type);
    if (params.status) searchParams.append("status", params.status);
    if (params.page) searchParams.append("page", params.page.toString());
    if (params.limit) searchParams.append("limit", params.limit.toString());

    const result = await apiClient.get<Property[]>(
      `/properties?${searchParams}`,
      { signal }
    );

    // Calculate occupant count from staffAssignments
    const dataWithOccupantCount = (result.data || []).map((property) => ({
      ...property,
      occupantCount:
        property.staffAssignments?.filter((assignment) => assignment.isActive)
          .length || 0,
    }));

    return {
      success: true,
      data: dataWithOccupantCount,
      pagination: {
        page: result.pagination?.page || 1,
        limit: result.pagination?.limit || 10,
        total: result.pagination?.total || 0,
        pages: result.pagination?.pages || 0,
      },
    };
  },

  // Get property by ID
  getById: async (id: string): Promise<Property> => {
    const result = await apiClient.get<Property>(`/properties/${id}`);

    if (!result.data) {
      throw new Error("Property not found");
    }

    return result.data;
  },

  // Get documents associated with property
  getDocuments: async (id: string): Promise<Document[]> => {
    const result = await apiClient.get<Document[]>(
      `/properties/${id}/documents`
    );

    return result.data || [];
  },

  // Create new property
  create: async (
    propertyData: Omit<Property, "id" | "createdAt" | "updatedAt">
  ): Promise<Property> => {
    const result = await apiClient.post<Property>("/properties", propertyData);

    if (!result.data) {
      throw new Error("Failed to create property");
    }

    return result.data;
  },

  // Update property
  update: async (id: string, updates: Partial<Property>): Promise<Property> => {
    const result = await apiClient.put<Property>(`/properties/${id}`, updates);

    if (!result.data) {
      throw new Error("Failed to update property");
    }

    return result.data;
  },

  // Delete property
  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/properties/${id}`);
  },

  // Bulk delete properties
  bulkDelete: async (ids: number[]): Promise<{ deletedCount: number }> => {
    const result = await apiClient.post<{ deletedCount: number }>(
      "/properties/bulk-delete",
      { ids }
    );
    return result.data || { deletedCount: 0 };
  },

  // Associate document with property
  addDocument: async (
    propertyId: string,
    documentId: string
  ): Promise<Property> => {
    const result = await apiClient.post<Property>(
      `/properties/${propertyId}/documents/${documentId}`
    );

    if (!result.data) {
      throw new Error("Failed to associate document with property");
    }

    return result.data;
  },

  // Remove document association from property
  removeDocument: async (
    propertyId: string,
    documentId: string
  ): Promise<Property> => {
    const result = await apiClient.delete<Property>(
      `/properties/${propertyId}/documents/${documentId}`
    );

    if (!result.data) {
      throw new Error("Failed to remove document from property");
    }

    return result.data;
  },

  // Upload property photo
  uploadPhoto: async (
    propertyId: string,
    photoUrl: string
  ): Promise<Property> => {
    const result = await apiClient.post<Property>(
      `/properties/${propertyId}/photo`,
      { photoUrl }
    );

    if (!result.data) {
      throw new Error("Failed to upload property photo");
    }

    return result.data;
  },
};
