import prisma from "../lib/prisma";
import { Document } from "../../shared/types";
import type { Document as PrismaDocument } from "@prisma/client";

// Convert Prisma Document to legacy format
function convertPrismaDocumentToLegacy(
  prismaDocument: PrismaDocument
): Document {
  return {
    id: prismaDocument.id,
    title: prismaDocument.title,
    type: prismaDocument.type as Document["type"],
    relatedEntityId: prismaDocument.relatedEntityId,
    filePath: prismaDocument.filePath,
    status: prismaDocument.status as Document["status"],
    startDate: prismaDocument.startDate,
    endDate: prismaDocument.endDate,
    staffId: prismaDocument.staffId,
    createdAt: prismaDocument.createdAt,
    updatedAt: prismaDocument.updatedAt,
  };
}

export const documentsDb = {
  // Get all documents with optional filtering and pagination
  getAll: async (
    params: {
      search?: string;
      type?: string;
      status?: string;
      page?: number;
      limit?: number;
    } = {}
  ): Promise<{ documents: Document[]; total: number }> => {
    const { search, type, status, page = 1, limit = 10 } = params;
    const offset = (page - 1) * limit;

    const where: Record<string, unknown> = {};

    if (search) {
      where.OR = [
        { title: { contains: search } },
        { relatedEntityId: { contains: search } },
      ];
    }

    if (type) {
      where.type = type;
    }

    if (status) {
      where.status = status;
    }

    const [documents, total] = await Promise.all([
      prisma.document.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: offset,
        take: limit,
      }),
      prisma.document.count({ where }),
    ]);

    return {
      documents: documents.map(convertPrismaDocumentToLegacy),
      total,
    };
  },

  // Get document by ID
  getById: async (id: string): Promise<Document | null> => {
    const document = await prisma.document.findUnique({
      where: { id: parseInt(id) },
    });

    if (!document) return null;

    return convertPrismaDocumentToLegacy(document);
  },

  // Create new document
  create: async (
    documentData: Omit<Document, "id" | "createdAt" | "updatedAt">
  ): Promise<Document> => {
    const document = await prisma.document.create({
      data: {
        title: documentData.title,
        type: documentData.type as "STAFF" | "PROPERTY" | "COMPANY",
        relatedEntityId: documentData.relatedEntityId,
        filePath: documentData.filePath,
        status: documentData.status as "ACTIVE" | "EXPIRED" | "TERMINATED",
        startDate: documentData.startDate,
        endDate: documentData.endDate,
      },
    });

    return convertPrismaDocumentToLegacy(document);
  },

  // Update document
  update: async (
    id: string,
    updates: Partial<Document>
  ): Promise<Document | null> => {
    try {
      const updateData: Record<string, unknown> = {};

      if (updates.title) updateData.title = updates.title;
      if (updates.type) updateData.type = updates.type;
      if (updates.relatedEntityId)
        updateData.relatedEntityId = updates.relatedEntityId;
      if (updates.filePath !== undefined)
        updateData.filePath = updates.filePath;
      if (updates.status) updateData.status = updates.status;
      if (updates.startDate) updateData.startDate = updates.startDate;
      if (updates.endDate !== undefined) updateData.endDate = updates.endDate;

      const document = await prisma.document.update({
        where: { id: parseInt(id) },
        data: updateData,
      });

      return convertPrismaDocumentToLegacy(document);
    } catch {
      return null;
    }
  },

  // Delete document
  delete: async (id: string): Promise<boolean> => {
    try {
      await prisma.document.delete({
        where: { id: parseInt(id) },
      });
      return true;
    } catch {
      return false;
    }
  },

  // Get documents by staff ID
  getByStaffId: async (staffId: string): Promise<Document[]> => {
    const documents = await prisma.document.findMany({
      where: { staffId: parseInt(staffId) },
      orderBy: { createdAt: "desc" },
    });

    return documents.map(convertPrismaDocumentToLegacy);
  },
};
