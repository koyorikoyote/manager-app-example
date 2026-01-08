import {
  PrismaClient,
  Prisma,
  InteractionType,
  InteractionStatus,
} from "@prisma/client";
import prisma from "../lib/prisma";

export interface InteractionFilters {
  type?: InteractionType;
  status?: InteractionStatus;
  personInvolvedStaffId?: number;
  userInChargeId?: number;
  createdBy?: number;
  search?: string;
  dateFrom?: Date;
  dateTo?: Date;
}

export interface InteractionCreateData {
  type: InteractionType;
  date: Date;
  description: string;
  status?: InteractionStatus;
  name?: string;
  title?: string;
  personInvolvedStaffId?: number;
  userInChargeId?: number;
  personConcerned?: string;
  location?: string;
  means?: string;
  responseDetails?: string;
  createdBy: number;
}

export interface InteractionUpdateData {
  type?: InteractionType;
  date?: Date;
  description?: string;
  status?: InteractionStatus;
  name?: string;
  title?: string;
  personInvolvedStaffId?: number;
  userInChargeId?: number;
  personConcerned?: string;
  location?: string;
  means?: string;
  responseDetails?: string;
}

export interface InteractionWithDaysPassed {
  id: number;
  type: InteractionType;
  date: Date;
  description: string;
  status: InteractionStatus | null;
  name: string | null;
  title: string | null;
  personInvolvedStaffId: number | null;
  userInChargeId: number | null;
  personConcerned: string | null;
  location: string | null;
  means: string | null;
  responseDetails: string | null;
  createdBy: number;
  createdAt: Date;
  updatedAt: Date;
  daysPassed: number;
  personInvolved: {
    id: number;
    name: string;
    employeeId: string | null;
  } | null;
  userInCharge: {
    id: number;
    name: string;
  } | null;
  creator: {
    id: number;
    name: string;
  };
  // Flattened relationship data
  creatorName?: string;
  personInvolvedName?: string | null;
  userInChargeName?: string | null;
}

export class InteractionService {
  private prisma: PrismaClient;

  constructor(prismaClient?: PrismaClient) {
    this.prisma = prismaClient || prisma;
  }

  /**
   * Calculate days passed from a given date to current date
   */
  calculateDaysPassed(date: Date): number {
    const today = new Date();
    const targetDate = new Date(date);
    const diffTime = Math.abs(today.getTime() - targetDate.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  /**
   * Transform interaction data to include flattened relationship information
   */
  private transformInteractionWithRelationships(interaction: {
    id: number;
    type: InteractionType;
    date: Date;
    description: string;
    status: InteractionStatus | null;
    name: string | null;
    title: string | null;
    personInvolvedStaffId: number | null;
    userInChargeId: number | null;
    personConcerned: string | null;
    location: string | null;
    means: string | null;
    responseDetails: string | null;
    createdBy: number;
    createdAt: Date;
    updatedAt: Date;
    personInvolved: {
      id: number;
      name: string;
      employeeId: string | null;
    } | null;
    userInCharge: {
      id: number;
      name: string;
    } | null;
    creator: {
      id: number;
      name: string;
    };
  }): InteractionWithDaysPassed {
    return {
      ...interaction,
      daysPassed: this.calculateDaysPassed(interaction.date),
      // Flattened relationship data for easier access
      creatorName: interaction.creator?.name,
      personInvolvedName: interaction.personInvolved?.name,
      userInChargeName: interaction.userInCharge?.name,
    };
  }

  /**
   * Flatten interaction relationships for easier access
   */
  private flattenInteractionRelationships(
    interaction: InteractionWithDaysPassed
  ): InteractionWithDaysPassed & {
    creatorName: string;
    personInvolvedName: string | null;
    userInChargeName: string | null;
  } {
    return {
      ...interaction,
      creatorName: interaction.creator.name,
      personInvolvedName: interaction.personInvolved?.name || null,
      userInChargeName: interaction.userInCharge?.name || null,
    };
  }

  /**
   * Get all interactions with optional filtering and calculated daysPassed
   */
  async getAllInteractions(
    filters?: InteractionFilters
  ): Promise<InteractionWithDaysPassed[]> {
    const where: Prisma.InteractionRecordWhereInput = {};

    if (filters?.type) {
      where.type = filters.type;
    }

    if (filters?.status) {
      where.status = filters.status;
    }

    if (filters?.personInvolvedStaffId) {
      where.personInvolvedStaffId = filters.personInvolvedStaffId;
    }

    if (filters?.createdBy) {
      where.createdBy = filters.createdBy;
    }

    if (filters?.userInChargeId) {
      where.userInChargeId = filters.userInChargeId;
    }

    if (filters?.dateFrom || filters?.dateTo) {
      where.date = {};
      if (filters.dateFrom) {
        where.date.gte = filters.dateFrom;
      }
      if (filters.dateTo) {
        where.date.lte = filters.dateTo;
      }
    }

    if (filters?.search) {
      where.OR = [
        { name: { contains: filters.search } },
        { title: { contains: filters.search } },
        { description: { contains: filters.search } },
        { personConcerned: { contains: filters.search } },
        { personInvolved: { name: { contains: filters.search } } },
        { userInCharge: { name: { contains: filters.search } } },
        { creator: { name: { contains: filters.search } } },
      ];
    }

    const interactions = await this.prisma.interactionRecord.findMany({
      where,
      select: {
        id: true,
        type: true,
        date: true,
        description: true,
        status: true,
        name: true,
        title: true,
        personInvolvedStaffId: true,
        userInChargeId: true,
        personConcerned: true,
        location: true,
        means: true,
        responseDetails: true,
        createdBy: true,
        createdAt: true,
        updatedAt: true,
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
      orderBy: {
        date: "desc",
      },
    });

    // Add calculated daysPassed and flattened relationships to each interaction
    return interactions.map((interaction) =>
      this.transformInteractionWithRelationships(interaction)
    );
  }

  /**
   * Get interaction by ID
   */
  async getInteractionById(
    id: number
  ): Promise<InteractionWithDaysPassed | null> {
    const interaction = await this.prisma.interactionRecord.findUnique({
      where: { id },
      select: {
        id: true,
        type: true,
        date: true,
        description: true,
        status: true,
        name: true,
        title: true,
        personInvolvedStaffId: true,
        userInChargeId: true,
        personConcerned: true,
        location: true,
        means: true,
        responseDetails: true,
        createdBy: true,
        createdAt: true,
        updatedAt: true,
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

    if (!interaction) {
      return null;
    }

    return this.transformInteractionWithRelationships(interaction);
  }

  /**
   * Create new interaction
   */
  async createInteraction(
    data: InteractionCreateData
  ): Promise<InteractionWithDaysPassed> {
    const interaction = await this.prisma.interactionRecord.create({
      data: {
        type: data.type,
        date: data.date,
        description: data.description,
        status: data.status,
        name: data.name,
        title: data.title,
        personInvolvedStaffId: data.personInvolvedStaffId,
        userInChargeId: data.userInChargeId,
        personConcerned: data.personConcerned,
        location: data.location,
        means: data.means as
          | "FACE_TO_FACE"
          | "ONLINE"
          | "PHONE"
          | "EMAIL"
          | undefined,
        responseDetails: data.responseDetails,
        createdBy: data.createdBy,
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

    return this.transformInteractionWithRelationships(interaction);
  }

  /**
   * Update interaction
   */
  async updateInteraction(
    id: number,
    data: InteractionUpdateData
  ): Promise<InteractionWithDaysPassed> {
    const updateData: Prisma.InteractionRecordUpdateInput = {};

    if (data.type !== undefined) updateData.type = data.type;
    if (data.date !== undefined) updateData.date = data.date;
    if (data.description !== undefined)
      updateData.description = data.description;
    if (data.status !== undefined) updateData.status = data.status;
    if (data.name !== undefined) updateData.name = data.name;
    if (data.title !== undefined) updateData.title = data.title;
    if (data.personInvolvedStaffId !== undefined) {
      updateData.personInvolved = data.personInvolvedStaffId
        ? { connect: { id: data.personInvolvedStaffId } }
        : { disconnect: true };
    }
    if (data.userInChargeId !== undefined) {
      updateData.userInCharge = data.userInChargeId
        ? { connect: { id: data.userInChargeId } }
        : { disconnect: true };
    }
    if (data.personConcerned !== undefined) {
      updateData.personConcerned = data.personConcerned;
    }
    if (data.location !== undefined) updateData.location = data.location;
    if (data.means !== undefined)
      updateData.means = data.means as
        | "FACE_TO_FACE"
        | "ONLINE"
        | "PHONE"
        | "EMAIL"
        | undefined;
    if (data.responseDetails !== undefined)
      updateData.responseDetails = data.responseDetails;

    const interaction = await this.prisma.interactionRecord.update({
      where: { id },
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

    return this.transformInteractionWithRelationships(interaction);
  }

  /**
   * Delete interaction
   */
  async deleteInteraction(id: number) {
    return this.prisma.interactionRecord.delete({
      where: { id },
    });
  }

  /**
   * Get interaction statistics
   */
  async getInteractionStatistics() {
    const [total, open, inProgress, resolved] = await Promise.all([
      this.prisma.interactionRecord.count(),
      this.prisma.interactionRecord.count({
        where: { status: InteractionStatus.OPEN },
      }),
      this.prisma.interactionRecord.count({
        where: { status: InteractionStatus.IN_PROGRESS },
      }),
      this.prisma.interactionRecord.count({
        where: { status: InteractionStatus.RESOLVED },
      }),
    ]);

    const byType = await this.prisma.interactionRecord.groupBy({
      by: ["type"],
      _count: {
        id: true,
      },
    });

    return {
      total,
      open,
      inProgress,
      resolved,
      byType: byType.reduce((acc, item) => {
        acc[item.type] = item._count.id;
        return acc;
      }, {} as Record<InteractionType, number>),
    };
  }

  /**
   * Get available staff for dropdown selections
   */
  async getAvailableStaff() {
    return this.prisma.staff.findMany({
      where: {
        status: "ACTIVE",
      },
      select: {
        id: true,
        name: true,
        employeeId: true,
      },
      orderBy: {
        name: "asc",
      },
    });
  }

  /**
   * Get all interactions with comprehensive relationship includes and flattened data
   */
  async getAllWithRelations(): Promise<InteractionWithDaysPassed[]> {
    const interactions = await this.prisma.interactionRecord.findMany({
      select: {
        id: true,
        type: true,
        date: true,
        description: true,
        status: true,
        name: true,
        title: true,
        personInvolvedStaffId: true,
        userInChargeId: true,
        personConcerned: true,
        location: true,
        means: true,
        responseDetails: true,
        createdBy: true,
        createdAt: true,
        updatedAt: true,
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
      orderBy: {
        date: "desc",
      },
    });

    return interactions.map((interaction) =>
      this.transformInteractionWithRelationships(interaction)
    );
  }

  /**
   * Get interaction by ID with comprehensive relationship includes and flattened data
   */
  async getByIdWithRelations(
    id: number
  ): Promise<InteractionWithDaysPassed | null> {
    const interaction = await this.prisma.interactionRecord.findUnique({
      where: { id },
      select: {
        id: true,
        type: true,
        date: true,
        description: true,
        status: true,
        name: true,
        title: true,
        personInvolvedStaffId: true,
        userInChargeId: true,
        personConcerned: true,
        location: true,
        means: true,
        responseDetails: true,
        createdBy: true,
        createdAt: true,
        updatedAt: true,
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

    if (!interaction) {
      return null;
    }

    return this.transformInteractionWithRelationships(interaction);
  }
}

export default new InteractionService();
