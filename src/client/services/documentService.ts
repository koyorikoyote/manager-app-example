import { Document } from "../../shared/types";
import { apiClient } from "./apiClient";

export const documentService = {
  // Get all documents with optional search and filtering
  async getDocuments(params?: {
    search?: string;
    type?: string;
    status?: string;
    page?: number;
    limit?: number;
  }): Promise<{ documents: Document[]; total: number }> {
    const searchParams = new URLSearchParams();

    if (params?.search) searchParams.append("search", params.search);
    if (params?.type) searchParams.append("type", params.type);
    if (params?.status) searchParams.append("status", params.status);
    if (params?.page) searchParams.append("page", params.page.toString());
    if (params?.limit) searchParams.append("limit", params.limit.toString());

    const result = await apiClient.get<Document[]>(
      `/documents?${searchParams}`
    );

    return {
      documents: result.data || [],
      total: result.pagination?.total || result.data?.length || 0,
    };
  },

  // Get a single document by ID
  async getDocument(id: string): Promise<Document> {
    const result = await apiClient.get<Document>(`/documents/${id}`);

    if (!result.data) {
      throw new Error("Document not found");
    }

    return result.data;
  },

  // Get documents by staff ID
  async getStaffDocuments(staffId: string, signal?: AbortSignal): Promise<{ data: Document[] }> {
    const result = await apiClient.get<Document[]>(
      `/documents/staff/${staffId}`,
      { signal }
    );

    return {
      data: result.data || [],
    };
  },

  // Create a new document
  async createDocument(
    documentData: Omit<Document, "id" | "createdAt" | "updatedAt">
  ): Promise<Document> {
    const result = await apiClient.post<Document>("/documents", documentData);

    if (!result.data) {
      throw new Error("Failed to create document");
    }

    return result.data;
  },

  // Update an existing document
  async updateDocument(
    id: string,
    documentData: Partial<Document>
  ): Promise<Document> {
    const result = await apiClient.put<Document>(
      `/documents/${id}`,
      documentData
    );

    if (!result.data) {
      throw new Error("Failed to update document");
    }

    return result.data;
  },

  // Delete a document
  async deleteDocument(id: string): Promise<void> {
    await apiClient.delete(`/documents/${id}`);
  },

  // Upload a document file
  async uploadDocument(
    documentId: string,
    file: File
  ): Promise<{ filePath: string }> {
    const formData = new FormData();
    formData.append("document", file);
    formData.append("documentId", documentId);

    // Get auth token for file upload
    const token = localStorage.getItem("authToken");

    const response = await fetch(`/api/documents/${documentId}/upload`, {
      method: "POST",
      headers: {
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: formData,
    });

    if (!response.ok) {
      throw new Error("Failed to upload document");
    }

    const result = await response.json();
    if (!result.success) {
      throw new Error(result.message || "Failed to upload document");
    }

    return { filePath: result.data.filePath };
  },

  // Get document URL for viewing/downloading
  getDocumentUrl(filePath: string): string {
    return `/api/documents/files/${encodeURIComponent(filePath)}`;
  },

  // Download a document file
  async downloadDocument(filePath: string, filename?: string): Promise<void> {
    const token = localStorage.getItem("authToken");

    const response = await fetch(this.getDocumentUrl(filePath), {
      headers: {
        ...(token && { Authorization: `Bearer ${token}` }),
      },
    });

    if (!response.ok) {
      throw new Error("Failed to download document");
    }

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename || filePath.split("/").pop() || "document.pdf";
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  },
};
