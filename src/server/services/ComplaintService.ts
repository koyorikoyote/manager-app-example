import {
  PrismaClient,
  Prisma,
  ComplaintStatus,
  UrgencyLevel,
} from "@prisma/client";
import prisma from "../lib/prisma";
import { calculateDaysPassed } from "../../shared/utils/formatting";

export interface ComplaintFilters {
  status?: ComplaintStatus;
  companyId?: number;
  responderId?: number;
  recorderId?: number;
  search?: string;
  dateFrom?: Date;
  dateTo?: Date;
  urgencyLevel?: UrgencyLevel;
}

export interface ComplaintDetailWithRelations {
  id: number;
  dateOfOccurrence: Date;
  complainerName: string;
  complainerContact: string;
  personInvolved: string | null;
  progressStatus: ComplaintStatus;
  urgencyLevel: UrgencyLevel;
  complaintContent: string;
  resolutionDate: Date | null;
  daysPassed: number;
  responder: { id: number; name: string } | null;
  company: { id: number; name: string } | null;
  recorder: { id: number; name: string; employeeId: string | null };
  createdAt: Date;
  updatedAt: Date;
  // Flattened relationship data
  responderName?: string | null;
  companyName?: string | null;
  recorderName?: string;
}

export interface ComplaintCreateData {
  dateOfOccurrence: Date;
  complainerName: string;
  complainerContact: string;
  personInvolved: string;
  progressStatus?: ComplaintStatus;
  urgencyLevel: UrgencyLevel;
  complaintContent: string;
  responderId?: number;
  companyId?: number;
  recorderId: number;
  resolutionDate?: Date;
}

export interface ComplaintUpdateData {
  dateOfOccurrence?: Date;
  complainerName?: string;
  complainerContact?: string;
  personInvolved?: string;
  progressStatus?: ComplaintStatus;
  urgencyLevel?: UrgencyLevel;
  complaintContent?: string;
  responderId?: number;
  companyId?: number;
  recorderId?: number;
  resolutionDate?: Date;
}

export class ComplaintService {
  private prisma: PrismaClient;

  constructor(prismaClient?: PrismaClient) {
    this.prisma = prismaClient || prisma;
  }

  /**
   * Transform Prisma result to ComplaintDetailWithRelations
   */
  private transformComplaintDetail(complaint: {
    id: number;
    dateOfOccurrence: Date;
    complainerName: string;
    complainerContact: string;
    personInvolved: string | null;
    progressStatus: ComplaintStatus;
    urgencyLevel: UrgencyLevel;
    complaintContent: string;
    resolutionDate: Date | null;
    createdAt: Date;
    updatedAt: Date;
    responder: { id: number; name: string } | null;
    company: { id: number; name: string } | null;
    recorder: { id: number; name: string; employeeId: string | null };
  }): ComplaintDetailWithRelations {
    return {
      id: complaint.id,
      dateOfOccurrence: complaint.dateOfOccurrence,
      complainerName: complaint.complainerName,
      complainerContact: complaint.complainerContact,
      personInvolved: complaint.personInvolved,
      progressStatus: complaint.progressStatus,
      urgencyLevel: complaint.urgencyLevel,
      complaintContent: complaint.complaintContent,
      resolutionDate: complaint.resolutionDate,
      daysPassed: calculateDaysPassed(complaint.dateOfOccurrence),
      responder: complaint.responder
        ? {
            id: complaint.responder.id,
            name: complaint.responder.name,
          }
        : null,
      company: complaint.company
        ? {
            id: complaint.company.id,
            name: complaint.company.name,
          }
        : null,
      recorder: {
        id: complaint.recorder.id,
        name: complaint.recorder.name,
        employeeId: complaint.recorder.employeeId,
      },
      createdAt: complaint.createdAt,
      updatedAt: complaint.updatedAt,
      // Flattened relationship data for easier access
      responderName: complaint.responder?.name,
      companyName: complaint.company?.name,
      recorderName: complaint.recorder.name,
    };
  }

  /**
   * Transform complaint data to flatten relationship information
   */
  private flattenComplaintRelationships(
    complaint: ComplaintDetailWithRelations
  ): ComplaintDetailWithRelations & {
    responderName: string | null;
    companyName: string | null;
    recorderName: string;
  } {
    return {
      ...complaint,
      responderName: complaint.responder?.name || null,
      companyName: complaint.company?.name || null,
      recorderName: complaint.recorder.name,
    };
  }

  /**
   * Get all complaint details with optional filtering
   */
  async getComplaintDetails(
    filters?: ComplaintFilters
  ): Promise<ComplaintDetailWithRelations[]> {
    const where: Prisma.ComplaintDetailWhereInput = {};

    if (filters?.status) {
      where.progressStatus = filters.status;
    }

    if (filters?.companyId) {
      where.companyId = filters.companyId;
    }

    if (filters?.responderId) {
      where.responderId = filters.responderId;
    }

    if (filters?.recorderId) {
      where.recorderId = filters.recorderId;
    }

    if (filters?.urgencyLevel) {
      where.urgencyLevel = filters.urgencyLevel;
    }

    if (filters?.dateFrom || filters?.dateTo) {
      where.dateOfOccurrence = {};
      if (filters.dateFrom) {
        where.dateOfOccurrence.gte = filters.dateFrom;
      }
      if (filters.dateTo) {
        where.dateOfOccurrence.lte = filters.dateTo;
      }
    }

    if (filters?.search) {
      where.OR = [
        { complainerName: { contains: filters.search } },
        { complainerContact: { contains: filters.search } },
        { personInvolved: { contains: filters.search } },
        { complaintContent: { contains: filters.search } },
        { company: { name: { contains: filters.search } } },
        { responder: { name: { contains: filters.search } } },
      ];
    }

    const complaints = await this.prisma.complaintDetail.findMany({
      where,
      select: {
        id: true,
        dateOfOccurrence: true,
        complainerName: true,
        complainerContact: true,
        personInvolved: true,
        progressStatus: true,
        urgencyLevel: true,
        complaintContent: true,
        resolutionDate: true,
        createdAt: true,
        updatedAt: true,
        responder: {
          select: {
            id: true,
            name: true,
          },
        },
        company: {
          select: {
            id: true,
            name: true,
          },
        },
        recorder: {
          select: {
            id: true,
            name: true,
            employeeId: true,
          },
        },
      },
      orderBy: {
        dateOfOccurrence: "desc",
      },
    });

    return complaints.map((complaint) =>
      this.transformComplaintDetail(complaint)
    );
  }

  /**
   * Get complaint detail by ID
   */
  async getComplaintDetailById(
    id: number
  ): Promise<ComplaintDetailWithRelations | null> {
    const complaint = await this.prisma.complaintDetail.findUnique({
      where: { id },
      select: {
        id: true,
        dateOfOccurrence: true,
        complainerName: true,
        complainerContact: true,
        personInvolved: true,
        progressStatus: true,
        urgencyLevel: true,
        complaintContent: true,
        resolutionDate: true,
        createdAt: true,
        updatedAt: true,
        responder: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        company: {
          select: {
            id: true,
            name: true,
            address: true,
            phone: true,
            email: true,
          },
        },
        recorder: {
          select: {
            id: true,
            name: true,
            employeeId: true,
            position: true,
            department: true,
          },
        },
      },
    });

    if (!complaint) {
      return null;
    }

    return this.transformComplaintDetail(complaint);
  }

  /**
   * Create new complaint detail
   */
  async createComplaintDetail(
    data: ComplaintCreateData
  ): Promise<ComplaintDetailWithRelations> {
    const complaint = await this.prisma.complaintDetail.create({
      data: {
        dateOfOccurrence: data.dateOfOccurrence,
        complainerName: data.complainerName,
        complainerContact: data.complainerContact,
        personInvolved: data.personInvolved,
        progressStatus: data.progressStatus || ComplaintStatus.OPEN,
        urgencyLevel: data.urgencyLevel,
        complaintContent: data.complaintContent,
        responderId: data.responderId,
        companyId: data.companyId,
        recorderId: data.recorderId,
        resolutionDate: data.resolutionDate,
      },
      include: {
        responder: {
          select: {
            id: true,
            name: true,
          },
        },
        company: {
          select: {
            id: true,
            name: true,
          },
        },
        recorder: {
          select: {
            id: true,
            name: true,
            employeeId: true,
          },
        },
      },
    });

    return this.transformComplaintDetail(complaint);
  }

  /**
   * Update complaint detail
   */
  async updateComplaintDetail(
    id: number,
    data: ComplaintUpdateData
  ): Promise<ComplaintDetailWithRelations> {
    const updateData: Prisma.ComplaintDetailUpdateInput = {};

    if (data.dateOfOccurrence !== undefined)
      updateData.dateOfOccurrence = data.dateOfOccurrence;
    if (data.complainerName !== undefined)
      updateData.complainerName = data.complainerName;
    if (data.complainerContact !== undefined)
      updateData.complainerContact = data.complainerContact;
    if (data.personInvolved !== undefined)
      updateData.personInvolved = data.personInvolved;
    if (data.progressStatus !== undefined)
      updateData.progressStatus = data.progressStatus;
    if (data.urgencyLevel !== undefined)
      updateData.urgencyLevel = data.urgencyLevel;
    if (data.complaintContent !== undefined)
      updateData.complaintContent = data.complaintContent;
    if (data.responderId !== undefined) {
      updateData.responder = data.responderId
        ? { connect: { id: data.responderId } }
        : { disconnect: true };
    }
    if (data.companyId !== undefined) {
      updateData.company = data.companyId
        ? { connect: { id: data.companyId } }
        : { disconnect: true };
    }
    if (data.recorderId !== undefined) {
      updateData.recorder = { connect: { id: data.recorderId } };
    }
    if (data.resolutionDate !== undefined)
      updateData.resolutionDate = data.resolutionDate;

    const complaint = await this.prisma.complaintDetail.update({
      where: { id },
      data: updateData,
      include: {
        responder: {
          select: {
            id: true,
            name: true,
          },
        },
        company: {
          select: {
            id: true,
            name: true,
          },
        },
        recorder: {
          select: {
            id: true,
            name: true,
            employeeId: true,
          },
        },
      },
    });

    return this.transformComplaintDetail(complaint);
  }

  /**
   * Delete complaint detail (soft delete by setting status to CLOSED)
   */
  async deleteComplaintDetail(
    id: number
  ): Promise<ComplaintDetailWithRelations> {
    const complaint = await this.prisma.complaintDetail.update({
      where: { id },
      data: {
        progressStatus: ComplaintStatus.CLOSED,
        resolutionDate: new Date(),
      },
      include: {
        responder: {
          select: {
            id: true,
            name: true,
          },
        },
        company: {
          select: {
            id: true,
            name: true,
          },
        },
        recorder: {
          select: {
            id: true,
            name: true,
            employeeId: true,
          },
        },
      },
    });

    return this.transformComplaintDetail(complaint);
  }

  /**
   * Bulk delete complaint details (hard delete from database)
   */
  async bulkDeleteComplaintDetails(ids: number[]): Promise<number> {
    const result = await this.prisma.complaintDetail.deleteMany({
      where: {
        id: {
          in: ids,
        },
      },
    });
    return result.count;
  }

  /**
   * Get complaint statistics
   */
  async getComplaintStatistics() {
    const [total, open, closed, onHold] = await Promise.all([
      this.prisma.complaintDetail.count(),
      this.prisma.complaintDetail.count({
        where: { progressStatus: ComplaintStatus.OPEN },
      }),
      this.prisma.complaintDetail.count({
        where: { progressStatus: ComplaintStatus.CLOSED },
      }),
      this.prisma.complaintDetail.count({
        where: { progressStatus: ComplaintStatus.ON_HOLD },
      }),
    ]);

    const byUrgency = await this.prisma.complaintDetail.groupBy({
      by: ["urgencyLevel"],
      _count: {
        id: true,
      },
    });

    return {
      total,
      open,
      closed,
      onHold,
      byUrgency: byUrgency.reduce((acc, item) => {
        acc[item.urgencyLevel] = item._count.id;
        return acc;
      }, {} as Record<string, number>),
    };
  }

  /**
   * Get complaints by company
   */
  async getComplaintsByCompany(
    companyId: number
  ): Promise<ComplaintDetailWithRelations[]> {
    return this.getComplaintDetails({ companyId });
  }

  /**
   * Get complaints by responder
   */
  async getComplaintsByResponder(
    responderId: number
  ): Promise<ComplaintDetailWithRelations[]> {
    return this.getComplaintDetails({ responderId });
  }

  /**
   * Get complaints by recorder
   */
  async getComplaintsByRecorder(
    recorderId: number
  ): Promise<ComplaintDetailWithRelations[]> {
    return this.getComplaintDetails({ recorderId });
  }

  /**
   * Get all complaints with comprehensive relationship includes and flattened data
   */
  async getAllWithRelations(): Promise<ComplaintDetailWithRelations[]> {
    const complaints = await this.prisma.complaintDetail.findMany({
      select: {
        id: true,
        dateOfOccurrence: true,
        complainerName: true,
        complainerContact: true,
        personInvolved: true,
        progressStatus: true,
        urgencyLevel: true,
        complaintContent: true,
        resolutionDate: true,
        createdAt: true,
        updatedAt: true,
        responder: {
          select: {
            id: true,
            name: true,
          },
        },
        company: {
          select: {
            id: true,
            name: true,
          },
        },
        recorder: {
          select: {
            id: true,
            name: true,
            employeeId: true,
          },
        },
      },
      orderBy: {
        dateOfOccurrence: "desc",
      },
    });

    return complaints.map((complaint) =>
      this.transformComplaintDetail(complaint)
    );
  }

  /**
   * Get complaint by ID with comprehensive relationship includes and flattened data
   */
  async getByIdWithRelations(
    id: number
  ): Promise<ComplaintDetailWithRelations | null> {
    const complaint = await this.prisma.complaintDetail.findUnique({
      where: { id },
      select: {
        id: true,
        dateOfOccurrence: true,
        complainerName: true,
        complainerContact: true,
        personInvolved: true,
        progressStatus: true,
        urgencyLevel: true,
        complaintContent: true,
        resolutionDate: true,
        createdAt: true,
        updatedAt: true,
        responder: {
          select: {
            id: true,
            name: true,
          },
        },
        company: {
          select: {
            id: true,
            name: true,
          },
        },
        recorder: {
          select: {
            id: true,
            name: true,
            employeeId: true,
          },
        },
      },
    });

    if (!complaint) {
      return null;
    }

    return this.transformComplaintDetail(complaint);
  }
}

export default new ComplaintService();
