import prisma from "../lib/prisma";
import { Prisma } from "@prisma/client";
import { InteractionRecord } from "../../shared/types";
import { calculateDaysPassed } from "../../shared/utils/formatting";

// Convert Prisma InteractionRecord to legacy format
function convertPrismaInteractionToLegacy(
  prismaInteraction: any
): InteractionRecord {
  // Calculate days passed from date to current date using utility function
  const daysPassed = prismaInteraction.date
    ? calculateDaysPassed(prismaInteraction.date)
    : 0;

  return {
    id: prismaInteraction.id.toString(),
    type: prismaInteraction.type.toLowerCase() as InteractionRecord["type"],
    date: prismaInteraction.date,
    description: prismaInteraction.description,
    status:
      prismaInteraction.status?.toLowerCase() as InteractionRecord["status"],
    name: prismaInteraction.name,
    title: prismaInteraction.title,
    personInvolvedStaffId: prismaInteraction.personInvolvedStaffId?.toString(),
    userInChargeId: prismaInteraction.userInChargeId?.toString(),
    personConcerned: prismaInteraction.personConcerned,
    location: prismaInteraction.location,
    // Normalize means into internal enum key values (accept both DB-mapped strings and enum keys)
    means: (() => {
      const m = prismaInteraction.means as string | undefined | null;
      if (!m) return undefined;
      const map: Record<string, string> = {
        // DB-mapped strings -> internal keys
        "Face-to-face": "FACE_TO_FACE",
        Online: "ONLINE",
        Phone: "PHONE",
        Email: "EMAIL",
        // Already-internal keys (be tolerant)
        FACE_TO_FACE: "FACE_TO_FACE",
        ONLINE: "ONLINE",
        PHONE: "PHONE",
        EMAIL: "EMAIL",
      };
      return (map[m] as any) || m;
    })(),
    responseDetails: prismaInteraction.responseDetails,
    personInvolved: prismaInteraction.personInvolved
      ? {
          id: prismaInteraction.personInvolved.id,
          name: prismaInteraction.personInvolved.name,
          employeeId: prismaInteraction.personInvolved.employeeId,
        }
      : undefined,
    userInCharge: prismaInteraction.userInCharge
      ? {
          id: prismaInteraction.userInCharge.id,
          name: prismaInteraction.userInCharge.name,
        }
      : undefined,
    creator: prismaInteraction.creator
      ? {
          id: prismaInteraction.creator.id,
          name: prismaInteraction.creator.name,
        }
      : undefined,
    daysPassed,
    createdBy: prismaInteraction.createdBy,
    createdAt: prismaInteraction.createdAt,
    updatedAt: prismaInteraction.updatedAt,
  };
}

export const interactionDatabase: {
  getAll: (filters?: {
    type?: InteractionRecord["type"];
    personInvolvedStaffId?: string;
    status?: InteractionRecord["status"];
    dateFrom?: Date;
    dateTo?: Date;
  }) => Promise<InteractionRecord[]>;
  getById: (id: string) => Promise<InteractionRecord | undefined>;
  getByPersonInvolvedStaffId: (
    personInvolvedStaffId: string
  ) => Promise<InteractionRecord[]>;
  create: (
    recordData: Omit<InteractionRecord, "id" | "createdAt" | "updatedAt">
  ) => Promise<InteractionRecord>;
  update: (
    id: string,
    updates: Partial<Omit<InteractionRecord, "id" | "createdAt">>
  ) => Promise<InteractionRecord | null>;
  delete: (id: string) => Promise<boolean>;
  getSorted: (
    sortBy?: keyof InteractionRecord,
    sortOrder?: "asc" | "desc",
    filters?: {
      type?: InteractionRecord["type"];
      personInvolvedStaffId?: string;
      status?: InteractionRecord["status"];
      dateFrom?: Date;
      dateTo?: Date;
    }
  ) => Promise<InteractionRecord[]>;
  getStats: () => Promise<{
    total: number;
    byType: Record<InteractionRecord["type"], number>;
    byStatus: Record<string, number>;
  }>;
} = {
  // Get all interaction records with optional filtering
  getAll: async (filters?: {
    type?: InteractionRecord["type"];
    personInvolvedStaffId?: string;
    status?: InteractionRecord["status"];
    dateFrom?: Date;
    dateTo?: Date;
  }): Promise<InteractionRecord[]> => {
    const where: any = {};

    if (filters) {
      if (filters.type) {
        where.type = filters.type.toUpperCase();
      }
      if (filters.personInvolvedStaffId) {
        where.personInvolvedStaffId = parseInt(filters.personInvolvedStaffId);
      }
      if (filters.status) {
        where.status = filters.status.toUpperCase();
      }
      if (filters.dateFrom || filters.dateTo) {
        where.date = {};
        if (filters.dateFrom) {
          where.date.gte = filters.dateFrom;
        }
        if (filters.dateTo) {
          where.date.lte = filters.dateTo;
        }
      }
    }

    const records = await prisma.interactionRecord.findMany({
      where,
      include: {
        personInvolved: {
          select: {
            id: true,
            name: true,
            employeeId: true,
          },
        },
        userInCharge: {
          select: {
            id: true,
            name: true,
          },
        },
        creator: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: { date: "desc" },
    });

    return records.map(convertPrismaInteractionToLegacy);
  },

  // Get interaction record by ID
  getById: async (id: string): Promise<InteractionRecord | undefined> => {
    const record = await prisma.interactionRecord.findUnique({
      where: { id: parseInt(id) },
      include: {
        personInvolved: {
          select: {
            id: true,
            name: true,
            employeeId: true,
          },
        },
        userInCharge: {
          select: {
            id: true,
            name: true,
          },
        },
        creator: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!record) return undefined;

    return convertPrismaInteractionToLegacy(record);
  },

  // Get interaction records by person involved staff ID
  getByPersonInvolvedStaffId: async (
    personInvolvedStaffId: string
  ): Promise<InteractionRecord[]> => {
    const records = await prisma.interactionRecord.findMany({
      where: { personInvolvedStaffId: parseInt(personInvolvedStaffId) },
      include: {
        personInvolved: {
          select: {
            id: true,
            name: true,
            employeeId: true,
          },
        },
        userInCharge: {
          select: {
            id: true,
            name: true,
          },
        },
        creator: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: { date: "desc" },
    });

    return records.map(convertPrismaInteractionToLegacy);
  },

  // Create new interaction record
  create: async (
    recordData: Omit<InteractionRecord, "id" | "createdAt" | "updatedAt">
  ): Promise<InteractionRecord> => {
    const record = await prisma.interactionRecord.create({
      data: {
        type: recordData.type.toUpperCase() as any,
        date: recordData.date,
        description: recordData.description,
        status: recordData.status?.toUpperCase() as any,
        name: recordData.name || null,
        title: recordData.title || null,
        personInvolvedStaffId: recordData.personInvolvedStaffId
          ? parseInt(recordData.personInvolvedStaffId.toString())
          : null,
        userInChargeId: recordData.userInChargeId
          ? parseInt(recordData.userInChargeId.toString())
          : null,
        personConcerned: recordData.personConcerned || null,
        location: recordData.location || null,
        means: (recordData.means as any) || null,
        responseDetails: recordData.responseDetails || null,
        createdBy: recordData.createdBy,
      },
      include: {
        personInvolved: {
          select: {
            id: true,
            name: true,
            employeeId: true,
          },
        },
        userInCharge: {
          select: {
            id: true,
            name: true,
          },
        },
        creator: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return convertPrismaInteractionToLegacy(record);
  },

  // Update existing interaction record
  update: async (
    id: string,
    updates: Partial<Omit<InteractionRecord, "id" | "createdAt">>
  ): Promise<InteractionRecord | null> => {
    try {
      const updateData: any = {};

      if (updates.type) updateData.type = updates.type.toUpperCase();
      if (updates.date) updateData.date = updates.date;
      if (updates.description) updateData.description = updates.description;
      if (updates.status) updateData.status = updates.status.toUpperCase();
      if (updates.name !== undefined) updateData.name = updates.name;
      if (updates.title !== undefined) updateData.title = updates.title;
      if (updates.personInvolvedStaffId !== undefined) {
        updateData.personInvolvedStaffId = updates.personInvolvedStaffId
          ? parseInt(updates.personInvolvedStaffId.toString())
          : null;
      }
      if (updates.userInChargeId !== undefined) {
        updateData.userInChargeId = updates.userInChargeId
          ? parseInt(updates.userInChargeId.toString())
          : null;
      }
      if (updates.personConcerned !== undefined) {
        updateData.personConcerned = updates.personConcerned;
      }
      if (updates.location !== undefined) {
        updateData.location = updates.location;
      }
      if (updates.means !== undefined) {
        updateData.means = updates.means as any;
      }
      if (updates.responseDetails !== undefined) {
        updateData.responseDetails = updates.responseDetails;
      }

      const record = await prisma.interactionRecord.update({
        where: { id: parseInt(id) },
        data: updateData,
        include: {
          personInvolved: {
            select: {
              id: true,
              name: true,
              employeeId: true,
            },
          },
          userInCharge: {
            select: {
              id: true,
              name: true,
            },
          },
          creator: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });

      return convertPrismaInteractionToLegacy(record);
    } catch {
      return null;
    }
  },

  // Delete interaction record
  delete: async (id: string): Promise<boolean> => {
    try {
      await prisma.interactionRecord.delete({
        where: { id: parseInt(id) },
      });
      return true;
    } catch {
      return false;
    }
  },

  // Get interaction records with sorting
  getSorted: async (
    sortBy: keyof InteractionRecord = "date",
    sortOrder: "asc" | "desc" = "desc",
    filters?: {
      type?: InteractionRecord["type"];
      personInvolvedStaffId?: string;
      status?: InteractionRecord["status"];
      dateFrom?: Date;
      dateTo?: Date;
    }
  ): Promise<InteractionRecord[]> => {
    const where: Prisma.InteractionRecordWhereInput = {};

    if (filters) {
      if (filters.type) {
        where.type = filters.type.toUpperCase() as any;
      }
      if (filters.personInvolvedStaffId) {
        where.personInvolvedStaffId = parseInt(filters.personInvolvedStaffId);
      }
      if (filters.status) {
        where.status = filters.status.toUpperCase() as any;
      }
      if (filters.dateFrom || filters.dateTo) {
        where.date = {};
        if (filters.dateFrom) {
          where.date.gte = filters.dateFrom;
        }
        if (filters.dateTo) {
          where.date.lte = filters.dateTo;
        }
      }
    }

    // Map sortBy to Prisma field names
    let orderByField = sortBy;
    if (sortBy === "personInvolvedStaffId") {
      orderByField = "personInvolvedStaffId";
    }

    const records = await prisma.interactionRecord.findMany({
      where,
      include: {
        personInvolved: {
          select: {
            id: true,
            name: true,
            employeeId: true,
          },
        },
        userInCharge: {
          select: {
            id: true,
            name: true,
          },
        },
        creator: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: { [orderByField]: sortOrder },
    });

    return records.map(convertPrismaInteractionToLegacy);
  },

  // Get interaction statistics
  getStats: async (): Promise<{
    total: number;
    byType: Record<InteractionRecord["type"], number>;
    byStatus: Record<string, number>;
  }> => {
    const records = await prisma.interactionRecord.findMany({
      select: {
        type: true,
        status: true,
      },
    });

    const stats = {
      total: records.length,
      byType: {
        DISCUSSION: 0,
        INTERVIEW: 0,
        CONSULTATION: 0,
        OTHER: 0,
      } as Record<InteractionRecord["type"], number>,
      byStatus: {} as Record<string, number>,
    };

    records.forEach((record) => {
      const type = record.type.toLowerCase() as InteractionRecord["type"];
      stats.byType[type]++;

      if (record.status) {
        const status = record.status.toLowerCase();
        stats.byStatus[status] = (stats.byStatus[status] || 0) + 1;
      }
    });

    return stats;
  },
};
