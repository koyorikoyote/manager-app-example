import {
  PrismaClient,
  Prisma,
  DocumentType,
  DocumentStatus,
} from "@prisma/client";
import prisma from "../lib/prisma";

export interface ContractRecord {
  id: number;
  title: string;
  type: DocumentType;
  status: DocumentStatus;
  startDate: Date;
  endDate: Date | null;
  filePath: string | null;
  relatedEntityId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ContractAccordionData {
  id: number;
  title: string;
  subtitle: string;
  details: {
    type: string;
    status: string;
    period: string;
    filePath: string | null;
    hasFile: boolean;
  };
}

export class PropertyDocumentService {
  private prisma: PrismaClient;

  constructor(prismaClient?: PrismaClient) {
    this.prisma = prismaClient || prisma;
  }

  /**
   * Fetch contract documents by property ID
   */
  async getContractsByPropertyId(
    propertyId: number
  ): Promise<ContractRecord[]> {
    const documents = await this.prisma.document.findMany({
      where: {
        propertyId,
      },
      select: {
        id: true,
        title: true,
        type: true,
        status: true,
        startDate: true,
        endDate: true,
        filePath: true,
        relatedEntityId: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: [
        { status: "asc" }, // Active documents first
        { startDate: "desc" },
      ],
    });

    return documents;
  }

  /**
   * Format document status for display
   */
  formatDocumentStatus(status: DocumentStatus): string {
    const statusMap = {
      [DocumentStatus.ACTIVE]: "Active",
      [DocumentStatus.EXPIRED]: "Expired",
      [DocumentStatus.TERMINATED]: "Terminated",
    };
    return statusMap[status] || status;
  }

  /**
   * Format document type for display
   */
  formatDocumentType(type: DocumentType): string {
    const typeMap = {
      [DocumentType.STAFF]: "Staff Document",
      [DocumentType.PROPERTY]: "Property Document",
      [DocumentType.COMPANY]: "Company Document",
    };
    return typeMap[type] || type;
  }

  /**
   * Transform contract data for accordion display
   */
  transformForContractAccordion(
    contracts: ContractRecord[]
  ): ContractAccordionData[] {
    return contracts.map((contract) => {
      const formattedType = this.formatDocumentType(contract.type);
      const formattedStatus = this.formatDocumentStatus(contract.status);
      const period = this.formatContractPeriod(
        contract.startDate,
        contract.endDate
      );
      const hasFile = !!contract.filePath;

      return {
        id: contract.id,
        title: contract.title,
        subtitle: `${formattedType} • ${formattedStatus}`,
        details: {
          type: formattedType,
          status: formattedStatus,
          period,
          filePath: contract.filePath,
          hasFile,
        },
      };
    });
  }

  /**
   * Format contract period for display
   */
  private formatContractPeriod(startDate: Date, endDate: Date | null): string {
    const start = startDate.toLocaleDateString("ja-JP");
    if (!endDate) return `${start} - Ongoing`;
    const end = endDate.toLocaleDateString("ja-JP");
    return `${start} - ${end}`;
  }

  /**
   * Get document statistics for a property
   */
  async getDocumentStatistics(propertyId: number) {
    const [total, active, expired, terminated] = await Promise.all([
      this.prisma.document.count({
        where: { propertyId },
      }),
      this.prisma.document.count({
        where: { propertyId, status: DocumentStatus.ACTIVE },
      }),
      this.prisma.document.count({
        where: { propertyId, status: DocumentStatus.EXPIRED },
      }),
      this.prisma.document.count({
        where: { propertyId, status: DocumentStatus.TERMINATED },
      }),
    ]);

    return {
      total,
      active,
      expired,
      terminated,
    };
  }

  /**
   * Create new property document
   */
  async createPropertyDocument(data: {
    propertyId: number;
    title: string;
    type: DocumentType;
    startDate: Date;
    endDate?: Date;
    filePath?: string;
    relatedEntityId: string;
  }) {
    return this.prisma.document.create({
      data: {
        title: data.title,
        type: data.type,
        startDate: data.startDate,
        endDate: data.endDate,
        filePath: data.filePath,
        relatedEntityId: data.relatedEntityId,
        status: DocumentStatus.ACTIVE,
        propertyId: data.propertyId,
      },
    });
  }

  /**
   * Update property document
   */
  async updatePropertyDocument(
    id: number,
    data: {
      title?: string;
      type?: DocumentType;
      status?: DocumentStatus;
      startDate?: Date;
      endDate?: Date;
      filePath?: string;
    }
  ) {
    const updateData: Prisma.DocumentUpdateInput = {};

    if (data.title !== undefined) updateData.title = data.title;
    if (data.type !== undefined) updateData.type = data.type;
    if (data.status !== undefined) updateData.status = data.status;
    if (data.startDate !== undefined) updateData.startDate = data.startDate;
    if (data.endDate !== undefined) updateData.endDate = data.endDate;
    if (data.filePath !== undefined) updateData.filePath = data.filePath;

    return this.prisma.document.update({
      where: { id },
      data: updateData,
    });
  }

  /**
   * Delete property document
   */
  async deletePropertyDocument(id: number) {
    return this.prisma.document.delete({
      where: { id },
    });
  }

  /**
   * Get documents by status
   */
  async getDocumentsByStatus(propertyId: number, status: DocumentStatus) {
    return this.prisma.document.findMany({
      where: {
        propertyId,
        status,
      },
      orderBy: {
        startDate: "desc",
      },
    });
  }

  /**
   * Get expiring documents (within next 30 days)
   */
  async getExpiringDocuments(propertyId: number) {
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

    return this.prisma.document.findMany({
      where: {
        propertyId,
        status: DocumentStatus.ACTIVE,
        endDate: {
          lte: thirtyDaysFromNow,
          gte: new Date(),
        },
      },
      orderBy: {
        endDate: "asc",
      },
    });
  }

  /**
   * Check if document file exists
   */
  async checkDocumentFileExists(filePath: string): Promise<boolean> {
    if (!filePath) return false;
    try {
      const u = new URL(filePath);
      return u.protocol === "http:" || u.protocol === "https:";
    } catch {
      return false;
    }
  }

  /**
   * Get document download URL
   */
  getDocumentDownloadUrl(filePath: string | null): string | null {
    if (!filePath) return null;
    // If already a URL (S3/CloudFront), return as-is
    try {
      // eslint-disable-next-line no-new
      new URL(filePath);
      return filePath;
    } catch {
      // Legacy local paths fallback
      return `/api/documents/files/${encodeURIComponent(filePath)}`;
    }
  }

  /**
   * Validate document data
   */
  validateDocumentData(data: {
    title?: string;
    startDate?: Date;
    endDate?: Date;
  }): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (data.title && data.title.trim().length === 0) {
      errors.push("Document title cannot be empty");
    }

    if (data.startDate && data.endDate && data.startDate > data.endDate) {
      errors.push("Start date cannot be after end date");
    }

    if (data.endDate && data.endDate < new Date()) {
      // Only warn, don't prevent creation of expired documents
      // This might be intentional for historical records
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }
}

export default new PropertyDocumentService();
