import {
  Staff,
  DailyRecord,
  InteractionRecord,
  Document,
  EmploymentType,
} from "../../shared/types";
import { apiClient } from "./apiClient";

const API_BASE = "/staff";

export interface StaffSearchParams {
  search?: string;
  department?: string;
  status?: string;
  page?: number;
  limit?: number;
}

class StaffService {
  async getAllStaff(signal?: AbortSignal): Promise<Staff[]> {
    const result = await apiClient.get<Staff[]>(`${API_BASE}?all=true`, { signal });
    return result.data || [];
  }

  async searchStaff(
    params: StaffSearchParams
  ): Promise<{ staff: Staff[]; total: number }> {
    const searchParams = new URLSearchParams();

    if (params.search) searchParams.append("search", params.search);
    if (params.department) searchParams.append("department", params.department);
    if (params.status) searchParams.append("status", params.status);
    if (params.page) searchParams.append("page", params.page.toString());
    if (params.limit) searchParams.append("limit", params.limit.toString());

    const result = await apiClient.get<Staff[]>(`${API_BASE}?${searchParams}`);

    return {
      staff: result.data || [],
      total: result.pagination?.total || result.data?.length || 0,
    };
  }

  async getStaffById(id: number): Promise<Staff> {
    const result = await apiClient.get<Staff>(`${API_BASE}/${id}`);

    if (!result.data) {
      throw new Error("Staff member not found");
    }

    return result.data;
  }

  async createStaff(
    staffData: Omit<Staff, "id" | "createdAt" | "updatedAt">
  ): Promise<Staff> {
    const result = await apiClient.post<Staff>(API_BASE, staffData);

    if (!result.data) {
      throw new Error("Failed to create staff member");
    }

    return result.data;
  }

  async updateStaff(
    id: number,
    staffData: Partial<Omit<Staff, "id" | "createdAt">>
  ): Promise<Staff> {
    const result = await apiClient.put<Staff>(`${API_BASE}/${id}`, staffData);

    if (!result.data) {
      throw new Error("Failed to update staff member");
    }

    return result.data;
  }

  async deleteStaff(id: number): Promise<void> {
    await apiClient.delete<void>(`${API_BASE}/${id}`);
  }

  async bulkDeleteStaff(ids: number[]): Promise<{ deletedCount: number }> {
    const result = await apiClient.post<{ deletedCount: number }>(
      `${API_BASE}/bulk-delete`,
      { ids }
    );
    return result.data || { deletedCount: 0 };
  }

  async getAvailableCountries(): Promise<string[]> {
    const result = await apiClient.get<string[]>(`${API_BASE}/nationalities`);
    return result.data || [];
  }

  // Keep the old method for backward compatibility
  async getAvailableNationalities(): Promise<string[]> {
    return this.getAvailableCountries();
  }

  async getAvailableUsers(): Promise<Array<{ id: number; name: string }>> {
    const result = await apiClient.get<Array<{ id: number; name: string }>>(
      `${API_BASE}/available-users`
    );
    return result.data || [];
  }

  // Photo upload functionality
  async uploadPhoto(
    staffId: number,
    file: File
  ): Promise<{ photoUrl: string }> {
    const formData = new FormData();
    formData.append("photo", file);

    // Get auth token from localStorage
    const token = localStorage.getItem("authToken");

    const response = await fetch(`/api${API_BASE}/${staffId}/photo`, {
      method: "POST",
      headers: {
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: formData,
    });

    if (!response.ok) {
      throw new Error("Failed to upload photo");
    }

    const result = await response.json();
    return result.data;
  }

  // Delete staff photo (remove DB reference and file on server)
  async deletePhoto(staffId: number): Promise<void> {
    const token = localStorage.getItem("authToken");

    const response = await fetch(`/api${API_BASE}/${staffId}/photo`, {
      method: "DELETE",
      headers: {
        ...(token && { Authorization: `Bearer ${token}` }),
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const text = await response.text().catch(() => null);
      throw new Error(`Failed to delete photo${text ? `: ${text}` : ""}`);
    }
  }

  // Fetch daily records for a staff member
  async getDailyRecords(staffId: number): Promise<DailyRecord[]> {
    const result = await apiClient.get<DailyRecord[]>(
      `${API_BASE}/${staffId}/daily-records`
    );
    return result.data || [];
  }

  // Fetch interaction records for a staff member
  async getInteractionRecords(staffId: number): Promise<InteractionRecord[]> {
    const result = await apiClient.get<InteractionRecord[]>(
      `${API_BASE}/${staffId}/interactions`
    );
    return result.data || [];
  }

  // Fetch documents for a staff member
  async getDocuments(staffId: number): Promise<Document[]> {
    const result = await apiClient.get<Document[]>(
      `${API_BASE}/${staffId}/documents`
    );
    return result.data || [];
  }

  // Helper method to process ordered array fields for display
  processOrderedArrayFields(staff: Staff): {
    education: Array<{ name?: string; type?: string }>;
    workHistory: Array<{
      name?: string;
      dateStart?: Date;
      dateEnd?: Date;
      countryLocation?: string;
      cityLocation?: string;
      position?: string;
      employmentType?: string;
      description?: string;
    }>;
  } {
    const education: Array<{ name?: string; type?: string }> = [];
    const workHistory: Array<{
      name?: string;
      dateStart?: Date;
      dateEnd?: Date;
      countryLocation?: string;
      cityLocation?: string;
      position?: string;
      employmentType?: string;
      description?: string;
    }> = [];

    // Process education arrays
    if (staff.educationName && Array.isArray(staff.educationName)) {
      const maxLength = Math.max(
        staff.educationName.length,
        staff.educationType?.length || 0
      );

      for (let i = 0; i < maxLength; i++) {
        education.push({
          name: staff.educationName[i] || undefined,
          type: staff.educationType?.[i] || undefined,
        });
      }
    }

    // Process work history arrays
    if (staff.workHistoryName && Array.isArray(staff.workHistoryName)) {
      const maxLength = Math.max(
        staff.workHistoryName.length,
        staff.workHistoryDateStart?.length || 0,
        staff.workHistoryDateEnd?.length || 0,
        staff.workHistoryCountryLocation?.length || 0,
        staff.workHistoryCityLocation?.length || 0,
        staff.workHistoryPosition?.length || 0,
        staff.workHistoryEmploymentType?.length || 0,
        staff.workHistoryDescription?.length || 0
      );

      for (let i = 0; i < maxLength; i++) {
        workHistory.push({
          name: staff.workHistoryName[i] || undefined,
          dateStart: staff.workHistoryDateStart?.[i] || undefined,
          dateEnd: staff.workHistoryDateEnd?.[i] || undefined,
          countryLocation: staff.workHistoryCountryLocation?.[i] || undefined,
          cityLocation: staff.workHistoryCityLocation?.[i] || undefined,
          position: staff.workHistoryPosition?.[i] || undefined,
          employmentType: staff.workHistoryEmploymentType?.[i] || undefined,
          description: staff.workHistoryDescription?.[i] || undefined,
        });
      }
    }

    return { education, workHistory };
  }

  // Helper method to prepare ordered array fields for API submission
  prepareOrderedArrayFields(
    education: Array<{ name?: string; type?: string }>,
    workHistory: Array<{
      name?: string;
      dateStart?: Date;
      dateEnd?: Date;
      countryLocation?: string;
      cityLocation?: string;
      position?: string;
      employmentType?: string;
      description?: string;
    }>
  ): Partial<Staff> {
    const result: Partial<Staff> = {};

    // Prepare education arrays
    if (education.length > 0) {
      result.educationName = education
        .map((e) => e.name)
        .filter(Boolean) as string[];
      result.educationType = education
        .map((e) => e.type)
        .filter(Boolean) as any[];
    }

    // Prepare work history arrays
    if (workHistory.length > 0) {
      result.workHistoryName = workHistory
        .map((w) => w.name)
        .filter(Boolean) as string[];
      result.workHistoryDateStart = workHistory
        .map((w) => w.dateStart)
        .filter(Boolean) as Date[];
      result.workHistoryDateEnd = workHistory
        .map((w) => w.dateEnd)
        .filter(Boolean) as Date[];
      result.workHistoryCountryLocation = workHistory
        .map((w) => w.countryLocation)
        .filter(Boolean) as string[];
      result.workHistoryCityLocation = workHistory
        .map((w) => w.cityLocation)
        .filter(Boolean) as string[];
      result.workHistoryPosition = workHistory
        .map((w) => w.position)
        .filter(Boolean) as string[];
      result.workHistoryEmploymentType = workHistory
        .map((w) => w.employmentType)
        .filter(Boolean) as EmploymentType[];
      result.workHistoryDescription = workHistory
        .map((w) => w.description)
        .filter(Boolean) as string[];
    }

    return result;
  }
}

export const staffService = new StaffService();
