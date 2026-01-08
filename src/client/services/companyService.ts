import { Company } from "../../shared/types";
import { apiClient } from "./apiClient";

interface GetCompaniesParams {
  search?: string;
  industry?: string;
  status?: string;
  page?: number;
  limit?: number;
}

interface GetCompaniesResponse {
  companies: Company[];
  total: number;
}

class CompanyService {
  // Get all companies (simple method for Sales Assistant pattern)
  async getAllCompanies(signal?: AbortSignal): Promise<Company[]> {
    const result = await this.getCompanies({ limit: 100 }, signal); // Fetch up to 100 companies to avoid pagination issues
    return result.companies;
  }

  async getCompanies(
    params: GetCompaniesParams = {},
    signal?: AbortSignal
  ): Promise<GetCompaniesResponse> {
    const searchParams = new URLSearchParams();

    if (params.search) searchParams.append("search", params.search);
    if (params.industry) searchParams.append("industry", params.industry);
    if (params.status) searchParams.append("status", params.status);
    if (params.page) searchParams.append("page", params.page.toString());
    if (params.limit) searchParams.append("limit", params.limit.toString());

    const endpoint = `/companies${
      searchParams.toString() ? `?${searchParams.toString()}` : ""
    }`;

    const response = await apiClient.get<GetCompaniesResponse>(endpoint, { signal });
    // Backend returns data directly for list endpoint (no wrapper)
    return response as unknown as GetCompaniesResponse;
  }

  async getCompany(id: number): Promise<Company> {
    const response = await apiClient.get<Company>(`/companies/${id}`);
    // Backend returns { success: true, data: Company }, apiClient wraps this in ApiResponse
    // So we need to access the backend's data field from the response
    if (response && typeof response === "object" && "data" in response) {
      return (response as any).data;
    }
    return response as unknown as Company;
  }

  async createCompany(
    company: Omit<Company, "id" | "createdAt" | "updatedAt">
  ): Promise<Company> {
    const response = await apiClient.post<Company>("/companies", company);
    // Backend returns { success: true, data: Company }, apiClient wraps this in ApiResponse
    if (response && typeof response === "object" && "data" in response) {
      return (response as any).data;
    }
    return response as unknown as Company;
  }

  async updateCompany(id: number, company: Partial<Company>): Promise<Company> {
    const response = await apiClient.put<Company>(`/companies/${id}`, company);
    // Backend returns { success: true, data: Company }, apiClient wraps this in ApiResponse
    if (response && typeof response === "object" && "data" in response) {
      return (response as any).data;
    }
    return response as unknown as Company;
  }

  async deleteCompany(id: number): Promise<void> {
    await apiClient.delete(`/companies/${id}`);
  }

  async bulkDeleteCompanies(ids: number[]): Promise<{ deletedCount: number }> {
    const response = await apiClient.post<{ deletedCount: number }>(
      "/companies/bulk-delete",
      { ids }
    );
    return response.data || { deletedCount: 0 };
  }

  // Photo upload functionality
  async uploadPhoto(
    companyId: number,
    file: File
  ): Promise<{ photoUrl: string }> {
    const formData = new FormData();
    formData.append("photo", file);

    // Get auth token from localStorage
    const token = localStorage.getItem("authToken");

    const response = await fetch(`/api/companies/${companyId}/photo`, {
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

  // Fetch interaction records for a company
  async getInteractionRecords(companyId: number, signal?: AbortSignal) {
    const response = await apiClient.get<any[]>(
      `/companies/${companyId}/interactions`,
      { signal }
    );
    // Backend returns { success: true, data: any[] }, apiClient wraps this in ApiResponse
    if (response && typeof response === "object" && "data" in response) {
      return (response as any).data || [];
    }
    return (response as unknown as any[]) || [];
  }

  // Fetch documents for a company
  async getDocuments(companyId: number, signal?: AbortSignal) {
    const response = await apiClient.get<any[]>(
      `/companies/${companyId}/documents`,
      { signal }
    );
    // Backend returns { success: true, data: any[] }, apiClient wraps this in ApiResponse
    if (response && typeof response === "object" && "data" in response) {
      return (response as any).data || [];
    }
    return (response as unknown as any[]) || [];
  }

  // Fetch users for dropdown selections (id, name only)
  async getUsersForDropdown(): Promise<Array<{ id: number; name: string }>> {
    const response = await apiClient.get<Array<{ id: number; name: string }>>(
      `/companies/users-dropdown`
    );
    // Backend returns { success: true, data: User[] }, apiClient wraps this in ApiResponse
    if (response && typeof response === "object" && "data" in response) {
      return (response as any).data || [];
    }
    return (response as unknown as Array<{ id: number; name: string }>) || [];
  }
}

export const companyService = new CompanyService();
