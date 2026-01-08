import { InteractionRecord } from "../../shared/types";
import { formatDateForBackend } from "../utils/dateUtils";
import { apiClient } from "./apiClient";
import { toJSTISOString } from "../../shared/utils/jstDateUtils";

export interface InteractionFilters {
  type?: InteractionRecord["type"];
  personInvolvedStaffId?: string;
  status?: InteractionRecord["status"];
  dateFrom?: Date;
  dateTo?: Date;
  search?: string;
  sortBy?: keyof InteractionRecord;
  sortOrder?: "asc" | "desc";
}

export interface InteractionStats {
  total: number;
  byType: Record<InteractionRecord["type"], number>;
  byStatus: Record<string, number>;
}

export interface CreateInteractionData {
  type: InteractionRecord["type"];
  date: Date | string;
  description: string;
  status?: InteractionRecord["status"];
  createdBy: number;
  name?: string;
  title?: string;
  personInvolvedStaffId?: string;
  userInChargeId?: number;
  personConcerned?: string;
  location?: string;
  means?: InteractionRecord["means"];
  responseDetails?: string;
}

export interface UpdateInteractionData {
  type?: InteractionRecord["type"];
  date?: Date | string;
  description?: string;
  status?: InteractionRecord["status"];
  name?: string;
  title?: string;
  personInvolvedStaffId?: string;
  userInChargeId?: number;
  personConcerned?: string;
  location?: string;
  means?: InteractionRecord["means"];
  responseDetails?: string;
}

class InteractionService {
  private baseUrl = "/api/interactions";

  // Get all interactions (simple method for Sales Assistant pattern)
  async getAllInteractions(signal?: AbortSignal): Promise<InteractionRecord[]> {
    const result = await this.getInteractions(undefined, signal);
    return result.data;
  }

  // Get all interaction records with filtering and sorting
  async getInteractions(
    filters?: InteractionFilters,
    signal?: AbortSignal
  ): Promise<{
    data: InteractionRecord[];
    total: number;
  }> {
    const params = new URLSearchParams();

    if (filters) {
      if (filters.type) params.append("type", filters.type);
      if (filters.personInvolvedStaffId)
        params.append("personInvolvedStaffId", filters.personInvolvedStaffId);
      if (filters.status) params.append("status", filters.status);
      if (filters.dateFrom)
        params.append("dateFrom", toJSTISOString(filters.dateFrom));
      if (filters.dateTo)
        params.append("dateTo", toJSTISOString(filters.dateTo));
      if (filters.sortBy) params.append("sortBy", filters.sortBy);
      if (filters.sortOrder) params.append("sortOrder", filters.sortOrder);
    }

    const endpoint = params.toString()
      ? `/interactions?${params}`
      : "/interactions";
    const result = await apiClient.get<InteractionRecord[]>(endpoint, {
      signal,
    });

    // Handle the response structure from apiClient
    const responseData = result.data || [];

    // Convert date strings back to Date objects
    const interactions = responseData.map((interaction: any) => ({
      ...interaction,
      date: new Date(interaction.date),
      createdAt: new Date(interaction.createdAt),
      updatedAt: new Date(interaction.updatedAt),
    }));

    return {
      data: interactions,
      total: result.pagination?.total || interactions.length,
    };
  }

  // Get interaction statistics
  async getStats(): Promise<InteractionStats> {
    const response = await fetch(`${this.baseUrl}/stats`);

    if (!response.ok) {
      throw new Error("Failed to fetch interaction statistics");
    }

    const result = await response.json();

    if (!result.success) {
      throw new Error(
        result.message || "Failed to fetch interaction statistics"
      );
    }

    return result.data;
  }

  // Get specific interaction record
  async getInteraction(id: string): Promise<InteractionRecord> {
    const response = await fetch(`${this.baseUrl}/${id}`);

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error("Interaction record not found");
      }
      throw new Error("Failed to fetch interaction record");
    }

    const result = await response.json();

    if (!result.success) {
      throw new Error(result.message || "Failed to fetch interaction record");
    }

    // Convert date strings back to Date objects
    return {
      ...result.data,
      date: new Date(result.data.date),
      createdAt: new Date(result.data.createdAt),
      updatedAt: new Date(result.data.updatedAt),
    };
  }

  // Get interaction records for specific staff
  async getStaffInteractions(
    staffId: string,
    signal?: AbortSignal
  ): Promise<{
    data: InteractionRecord[];
    total: number;
  }> {
    const result = await apiClient.get<InteractionRecord[]>(
      `/interactions/staff/${staffId}`,
      { signal }
    );

    // Convert date strings back to Date objects
    const interactions = (result.data || []).map((interaction: any) => ({
      ...interaction,
      date: new Date(interaction.date),
      createdAt: new Date(interaction.createdAt),
      updatedAt: new Date(interaction.updatedAt),
    }));

    return {
      data: interactions,
      total: result.pagination?.total || interactions.length,
    };
  }

  // Create new interaction record
  async createInteraction(
    data: CreateInteractionData
  ): Promise<InteractionRecord> {
    const response = await fetch(this.baseUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        ...data,
        date: formatDateForBackend(data.date) || undefined,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Failed to create interaction record");
    }

    const result = await response.json();

    if (!result.success) {
      throw new Error(result.message || "Failed to create interaction record");
    }

    // Convert date strings back to Date objects
    return {
      ...result.data,
      date: new Date(result.data.date),
      createdAt: new Date(result.data.createdAt),
      updatedAt: new Date(result.data.updatedAt),
    };
  }

  // Update interaction record
  async updateInteraction(
    id: string,
    data: UpdateInteractionData
  ): Promise<InteractionRecord> {
    const updateData = { ...data };
    if (updateData.date) {
      (updateData as any).date =
        formatDateForBackend(updateData.date) || undefined;
    }

    const response = await fetch(`${this.baseUrl}/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(updateData),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Failed to update interaction record");
    }

    const result = await response.json();

    if (!result.success) {
      throw new Error(result.message || "Failed to update interaction record");
    }

    // Convert date strings back to Date objects
    return {
      ...result.data,
      date: new Date(result.data.date),
      createdAt: new Date(result.data.createdAt),
      updatedAt: new Date(result.data.updatedAt),
    };
  }

  // Delete interaction record
  async deleteInteraction(id: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/${id}`, {
      method: "DELETE",
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Failed to delete interaction record");
    }

    const result = await response.json();

    if (!result.success) {
      throw new Error(result.message || "Failed to delete interaction record");
    }
  }

  // Bulk delete interaction records
  async bulkDeleteInteractions(
    ids: string[]
  ): Promise<{ deletedCount: number }> {
    const response = await fetch(`${this.baseUrl}/bulk-delete`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ ids }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(
        error.message || "Failed to bulk delete interaction records"
      );
    }

    const result = await response.json();

    if (!result.success) {
      throw new Error(
        result.message || "Failed to bulk delete interaction records"
      );
    }

    return result.data || { deletedCount: 0 };
  }

  // Get available staff for dropdown selections
  async getAvailableStaff(): Promise<
    Array<{ id: number; name: string; employeeId: string | null }>
  > {
    const response = await fetch(`${this.baseUrl}/available-staff`);

    if (!response.ok) {
      throw new Error("Failed to fetch available staff");
    }

    const result = await response.json();

    if (!result.success) {
      throw new Error(result.message || "Failed to fetch available staff");
    }

    return result.data || [];
  }
}

export const interactionService = new InteractionService();
