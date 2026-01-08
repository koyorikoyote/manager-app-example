import { PrismaClient, Prisma, InquiryStatus } from "@prisma/client";
import prisma from "../lib/prisma";

export interface InquiryFilters {
  status?: InquiryStatus;
  companyId?: number;
  responderId?: number;
  recorderId?: number;
  search?: string;
  dateFrom?: Date;
  dateTo?: Date;
}

export interface InquiryWithRelations {
  id: number;
  dateOfInquiry: Date;
  inquirerName: string;
  inquirerContact: string;
  typeOfInquiry: string;
  inquiryContent: string;
  progressStatus: InquiryStatus;
  resolutionDate: Date | null;
  company: { id: number; name: string } | null;
  responder: { id: number; name: string } | null;
  recorder: { id: number; name: string; employeeId: string | null };
  createdAt: Date;
  updatedAt: Date;
  // Flattened relationship data
  companyName?: string | null;
  responderName?: string | null;
  recorderName?: string;
}

export interface InquiryCreateData {
  dateOfInquiry: Date;
  inquirerName: string;
  inquirerContact: string;
  companyId?: number;
  typeOfInquiry: string;
  inquiryContent: string;
  progressStatus?: InquiryStatus;
  responderId?: number;
  recorderId: number;
  resolutionDate?: Date;
}

export interface InquiryUpdateData {
  dateOfInquiry?: Date;
  inquirerName?: string;
  inquirerContact?: string;
  companyId?: number;
  typeOfInquiry?: string;
  inquiryContent?: string;
  progressStatus?: InquiryStatus;
  responderId?: number;
  recorderId?: number;
  resolutionDate?: Date;
}

export class InquiryService {
  private prisma: PrismaClient;

  constructor(prismaClient?: PrismaClient) {
    this.prisma = prismaClient || prisma;
  }

  /**
   * Transform Prisma result to InquiryWithRelations
   */
  private transformInquiry(inquiry: {
    id: number;
    dateOfInquiry: Date;
    inquirerName: string;
    inquirerContact: string;
    typeOfInquiry: string;
    inquiryContent: string;
    progressStatus: InquiryStatus;
    resolutionDate: Date | null;
    createdAt: Date;
    updatedAt: Date;
    company: { id: number; name: string } | null;
    responder: { id: number; name: string } | null;
    recorder: { id: number; name: string; employeeId: string | null };
  }): InquiryWithRelations {
    return {
      id: inquiry.id,
      dateOfInquiry: inquiry.dateOfInquiry,
      inquirerName: inquiry.inquirerName,
      inquirerContact: inquiry.inquirerContact,
      typeOfInquiry: inquiry.typeOfInquiry,
      inquiryContent: inquiry.inquiryContent,
      progressStatus: inquiry.progressStatus,
      resolutionDate: inquiry.resolutionDate,
      company: inquiry.company
        ? {
            id: inquiry.company.id,
            name: inquiry.company.name,
          }
        : null,
      responder: inquiry.responder
        ? {
            id: inquiry.responder.id,
            name: inquiry.responder.name,
          }
        : null,
      recorder: {
        id: inquiry.recorder.id,
        name: inquiry.recorder.name,
        employeeId: inquiry.recorder.employeeId,
      },
      createdAt: inquiry.createdAt,
      updatedAt: inquiry.updatedAt,
      // Flattened relationship data for easier access
      companyName: inquiry.company?.name,
      responderName: inquiry.responder?.name,
      recorderName: inquiry.recorder.name,
    };
  }

  /**
   * Transform inquiry data to flatten relationship information
   */
  private flattenInquiryRelationships(
    inquiry: InquiryWithRelations
  ): InquiryWithRelations & {
    companyName: string | null;
    responderName: string | null;
    recorderName: string;
  } {
    return {
      ...inquiry,
      companyName: inquiry.company?.name || null,
      responderName: inquiry.responder?.name || null,
      recorderName: inquiry.recorder.name,
    };
  }

  /**
   * Get all inquiries with optional filtering
   */
  async getInquiries(
    filters?: InquiryFilters
  ): Promise<InquiryWithRelations[]> {
    const where: Prisma.InquiryWhereInput = {};

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

    if (filters?.dateFrom || filters?.dateTo) {
      where.dateOfInquiry = {};
      if (filters.dateFrom) {
        where.dateOfInquiry.gte = filters.dateFrom;
      }
      if (filters.dateTo) {
        where.dateOfInquiry.lte = filters.dateTo;
      }
    }

    if (filters?.search) {
      where.OR = [
        { inquirerName: { contains: filters.search } },
        { inquirerContact: { contains: filters.search } },
        { typeOfInquiry: { contains: filters.search } },
        { inquiryContent: { contains: filters.search } },
        { company: { name: { contains: filters.search } } },
        { responder: { name: { contains: filters.search } } },
        { recorder: { name: { contains: filters.search } } },
      ];
    }

    const inquiries = await this.prisma.inquiry.findMany({
      where,
      select: {
        id: true,
        dateOfInquiry: true,
        inquirerName: true,
        inquirerContact: true,
        typeOfInquiry: true,
        inquiryContent: true,
        progressStatus: true,
        resolutionDate: true,
        createdAt: true,
        updatedAt: true,
        company: {
          select: {
            id: true,
            name: true,
          },
        },
        responder: {
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
        dateOfInquiry: "desc",
      },
    });

    return inquiries.map((inquiry) => this.transformInquiry(inquiry));
  }

  /**
   * Get inquiry by ID
   */
  async getInquiryById(id: number): Promise<InquiryWithRelations | null> {
    const inquiry = await this.prisma.inquiry.findUnique({
      where: { id },
      select: {
        id: true,
        dateOfInquiry: true,
        inquirerName: true,
        inquirerContact: true,
        typeOfInquiry: true,
        inquiryContent: true,
        progressStatus: true,
        resolutionDate: true,
        createdAt: true,
        updatedAt: true,
        company: {
          select: {
            id: true,
            name: true,
            address: true,
            phone: true,
            email: true,
          },
        },
        responder: {
          select: {
            id: true,
            name: true,
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

    if (!inquiry) {
      return null;
    }

    return this.transformInquiry(inquiry);
  }

  /**
   * Create new inquiry
   */
  async createInquiry(data: InquiryCreateData): Promise<InquiryWithRelations> {
    const inquiry = await this.prisma.inquiry.create({
      data: {
        dateOfInquiry: data.dateOfInquiry,
        inquirerName: data.inquirerName,
        inquirerContact: data.inquirerContact,
        companyId: data.companyId,
        typeOfInquiry: data.typeOfInquiry,
        inquiryContent: data.inquiryContent,
        progressStatus: data.progressStatus || InquiryStatus.OPEN,
        responderId: data.responderId,
        recorderId: data.recorderId,
        resolutionDate: data.resolutionDate,
      },
      include: {
        company: {
          select: {
            id: true,
            name: true,
          },
        },
        responder: {
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

    return this.transformInquiry(inquiry);
  }

  /**
   * Update inquiry
   */
  async updateInquiry(
    id: number,
    data: InquiryUpdateData
  ): Promise<InquiryWithRelations> {
    const updateData: Prisma.InquiryUpdateInput = {};

    if (data.dateOfInquiry !== undefined)
      updateData.dateOfInquiry = data.dateOfInquiry;
    if (data.inquirerName !== undefined)
      updateData.inquirerName = data.inquirerName;
    if (data.inquirerContact !== undefined)
      updateData.inquirerContact = data.inquirerContact;
    if (data.typeOfInquiry !== undefined)
      updateData.typeOfInquiry = data.typeOfInquiry;
    if (data.inquiryContent !== undefined)
      updateData.inquiryContent = data.inquiryContent;
    if (data.progressStatus !== undefined)
      updateData.progressStatus = data.progressStatus;
    if (data.resolutionDate !== undefined)
      updateData.resolutionDate = data.resolutionDate;
    if (data.companyId !== undefined) {
      updateData.company = data.companyId
        ? { connect: { id: data.companyId } }
        : { disconnect: true };
    }
    if (data.responderId !== undefined) {
      updateData.responder = data.responderId
        ? { connect: { id: data.responderId } }
        : { disconnect: true };
    }
    if (data.recorderId !== undefined) {
      updateData.recorder = { connect: { id: data.recorderId } };
    }

    const inquiry = await this.prisma.inquiry.update({
      where: { id },
      data: updateData,
      include: {
        company: {
          select: {
            id: true,
            name: true,
          },
        },
        responder: {
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

    return this.transformInquiry(inquiry);
  }

  /**
   * Delete inquiry (soft delete by setting status to CLOSED)
   */
  async deleteInquiry(id: number): Promise<InquiryWithRelations> {
    const inquiry = await this.prisma.inquiry.update({
      where: { id },
      data: {
        progressStatus: InquiryStatus.CLOSED,
        resolutionDate: new Date(),
      },
      include: {
        company: {
          select: {
            id: true,
            name: true,
          },
        },
        responder: {
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

    return this.transformInquiry(inquiry);
  }

  /**
   * Bulk delete inquiries (hard delete from database)
   */
  async bulkDeleteInquiries(ids: number[]): Promise<number> {
    const result = await this.prisma.inquiry.deleteMany({
      where: {
        id: {
          in: ids,
        },
      },
    });
    return result.count;
  }

  /**
   * Get inquiry statistics
   */
  async getInquiryStatistics() {
    const [total, open, closed, onHold] = await Promise.all([
      this.prisma.inquiry.count(),
      this.prisma.inquiry.count({
        where: { progressStatus: InquiryStatus.OPEN },
      }),
      this.prisma.inquiry.count({
        where: { progressStatus: InquiryStatus.CLOSED },
      }),
      this.prisma.inquiry.count({
        where: { progressStatus: InquiryStatus.ON_HOLD },
      }),
    ]);

    const byType = await this.prisma.inquiry.groupBy({
      by: ["typeOfInquiry"],
      _count: {
        id: true,
      },
    });

    return {
      total,
      open,
      closed,
      onHold,
      byType: byType.reduce((acc, item) => {
        acc[item.typeOfInquiry] = item._count.id;
        return acc;
      }, {} as Record<string, number>),
    };
  }

  /**
   * Get inquiries by company
   */
  async getInquiriesByCompany(
    companyId: number
  ): Promise<InquiryWithRelations[]> {
    return this.getInquiries({ companyId });
  }

  /**
   * Get inquiries by responder
   */
  async getInquiriesByResponder(
    responderId: number
  ): Promise<InquiryWithRelations[]> {
    return this.getInquiries({ responderId });
  }

  /**
   * Get inquiries by recorder
   */
  async getInquiriesByRecorder(
    recorderId: number
  ): Promise<InquiryWithRelations[]> {
    return this.getInquiries({ recorderId });
  }

  /**
   * Get all inquiries with comprehensive relationship includes and flattened data
   */
  async getAllWithRelations(): Promise<InquiryWithRelations[]> {
    const inquiries = await this.prisma.inquiry.findMany({
      select: {
        id: true,
        dateOfInquiry: true,
        inquirerName: true,
        inquirerContact: true,
        typeOfInquiry: true,
        inquiryContent: true,
        progressStatus: true,
        resolutionDate: true,
        createdAt: true,
        updatedAt: true,
        company: {
          select: {
            id: true,
            name: true,
          },
        },
        responder: {
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
        dateOfInquiry: "desc",
      },
    });

    return inquiries.map((inquiry) => this.transformInquiry(inquiry));
  }

  /**
   * Get inquiry by ID with comprehensive relationship includes and flattened data
   */
  async getByIdWithRelations(id: number): Promise<InquiryWithRelations | null> {
    const inquiry = await this.prisma.inquiry.findUnique({
      where: { id },
      select: {
        id: true,
        dateOfInquiry: true,
        inquirerName: true,
        inquirerContact: true,
        typeOfInquiry: true,
        inquiryContent: true,
        progressStatus: true,
        resolutionDate: true,
        createdAt: true,
        updatedAt: true,
        company: {
          select: {
            id: true,
            name: true,
          },
        },
        responder: {
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

    if (!inquiry) {
      return null;
    }

    return this.transformInquiry(inquiry);
  }
}

export default new InquiryService();
