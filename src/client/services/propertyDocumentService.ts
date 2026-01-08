import { apiClient } from "./apiClient";
import { toJSTISOString } from "../../shared/utils/jstDateUtils";

export interface ContractRecord {
  id: number;
  title: string;
  type: string;
  status: string;
  startDate: Date;
  endDate: Date | null;
  filePath: string | null;
  relatedEntityId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ContractResponse {
  success: boolean;
  data: ContractRecord[];
  message?: string;
}

export interface DocumentStatistics {
  total: number;
  active: number;
  expired: number;
  terminated: number;
}

export const propertyDocumentService = {
  // Fetch contract documents by property ID
  getContractsByPropertyId: async (
    propertyId: number,
    signal?: AbortSignal
  ): Promise<ContractRecord[]> => {
    const result = await apiClient.get<ContractRecord[]>(
      `/properties/${propertyId}/documents`,
      { signal }
    );

    // Transform dates from strings to Date objects
    const transformedData = (result.data || []).map((contract) => ({
      ...contract,
      startDate: contract.startDate ? new Date(contract.startDate) : new Date(),
      endDate: contract.endDate ? new Date(contract.endDate) : null,
      createdAt: contract.createdAt ? new Date(contract.createdAt) : new Date(),
      updatedAt: contract.updatedAt ? new Date(contract.updatedAt) : new Date(),
    }));

    return transformedData;
  },

  // Get document statistics for a property
  getDocumentStatistics: async (
    propertyId: number
  ): Promise<DocumentStatistics> => {
    // Fetch documents for the property and compute statistics client-side
    const docsResult = await apiClient.get<ContractRecord[]>(
      `/properties/${propertyId}/documents`
    );
    const docs = docsResult.data || [];
    return {
      total: docs.length,
      active: docs.filter((d: any) => d.status === "ACTIVE").length,
      expired: docs.filter((d: any) => d.status === "EXPIRED").length,
      terminated: docs.filter((d: any) => d.status === "TERMINATED").length,
    };
  },

  // Create new property document
  createPropertyDocument: async (data: {
    propertyId: number;
    title: string;
    type: string;
    startDate: Date;
    endDate?: Date;
    filePath?: string;
    relatedEntityId: string;
  }) => {
    // Create document and associate with the property by setting relatedEntityId/type
    // The server's documents API expects relatedEntityId and type (e.g. "PROPERTY")
    const result = await apiClient.post("/documents", {
      title: data.title,
      type: data.type,
      startDate: toJSTISOString(data.startDate),
      endDate: data.endDate ? toJSTISOString(data.endDate) : undefined,
      filePath: data.filePath,
      relatedEntityId: String(data.propertyId),
      status: "ACTIVE",
    });

    return result.data;
  },

  // Update property document
  updatePropertyDocument: async (
    id: number,
    data: {
      title?: string;
      type?: string;
      status?: string;
      startDate?: Date;
      endDate?: Date;
      filePath?: string;
    }
  ) => {
    const updateData: Record<string, unknown> = {};

    if (data.title !== undefined) updateData.title = data.title;
    if (data.type !== undefined) updateData.type = data.type;
    if (data.status !== undefined) updateData.status = data.status;
    if (data.startDate !== undefined)
      updateData.startDate = toJSTISOString(data.startDate);
    if (data.endDate !== undefined)
      updateData.endDate = data.endDate
        ? toJSTISOString(data.endDate)
        : undefined;
    if (data.filePath !== undefined) updateData.filePath = data.filePath;

    const result = await apiClient.put(`/documents/${id}`, updateData);
    return result.data;
  },

  // Delete property document
  deletePropertyDocument: async (id: number) => {
    const result = await apiClient.delete(`/documents/${id}`);
    return result.data;
  },

  // Get documents by status
  getDocumentsByStatus: async (
    propertyId: number,
    status: string
  ): Promise<ContractRecord[]> => {
    const result = await apiClient.get<ContractRecord[]>(
      `/properties/${propertyId}/documents?status=${status}`
    );

    // Transform dates from strings to Date objects
    const transformedData = (result.data || []).map((contract) => ({
      ...contract,
      startDate: contract.startDate ? new Date(contract.startDate) : new Date(),
      endDate: contract.endDate ? new Date(contract.endDate) : null,
      createdAt: contract.createdAt ? new Date(contract.createdAt) : new Date(),
      updatedAt: contract.updatedAt ? new Date(contract.updatedAt) : new Date(),
    }));

    return transformedData;
  },

  // Get expiring documents (within next 30 days)
  getExpiringDocuments: async (
    propertyId: number
  ): Promise<ContractRecord[]> => {
    // Fetch all documents and filter client-side for expiring documents (within next 30 days)
    const result = await apiClient.get<ContractRecord[]>(
      `/properties/${propertyId}/documents`
    );

    const now = new Date();
    const threshold = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    const transformedData = (result.data || [])
      .map((contract) => ({
        ...contract,
        startDate: contract.startDate
          ? new Date(contract.startDate)
          : new Date(),
        endDate: contract.endDate ? new Date(contract.endDate) : null,
        createdAt: contract.createdAt
          ? new Date(contract.createdAt)
          : new Date(),
        updatedAt: contract.updatedAt
          ? new Date(contract.updatedAt)
          : new Date(),
      }))
      .filter((c) => c.endDate && c.endDate >= now && c.endDate <= threshold);

    return transformedData;
  },

  // Get document download URL
  getDocumentDownloadUrl: (filePath: string): string => {
    return `/api/documents/download/${encodeURIComponent(filePath)}`;
  },

  // Check if document file exists
  checkDocumentFileExists: async (filePath: string): Promise<boolean> => {
    try {
      const result = await apiClient.get<any>(
        `/documents/check/${encodeURIComponent(filePath)}`
      );

      // The ApiClient returns an ApiResponse<T> object, not the raw fetch Response.
      // Prefer explicit checks for data/existence. Backend may return:
      // - { success: true, data: { exists: boolean } }
      // - { success: true, data: true } (boolean)
      // In absence of a data field, fall back to the success flag.
      if (result && typeof result === "object") {
        if (result.data !== undefined) {
          if (typeof result.data === "boolean") {
            return result.data;
          }
          if (
            typeof result.data === "object" &&
            result.data !== null &&
            "exists" in result.data
          ) {
            return Boolean((result.data as any).exists);
          }
        }
        return Boolean(result.success);
      }

      return false;
    } catch {
      return false;
    }
  },
};
