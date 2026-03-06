import { PrismaClient, Prisma, ConditionStatus } from "@prisma/client";
import prisma from "../lib/prisma";

export interface DailyRecordFilters {
  staffId?: number;
  dateFrom?: Date;
  dateTo?: Date;
  conditionStatus?: ConditionStatus;
  search?: string;
}

export interface DailyRecordWithRelations {
  id: number;
  dateOfRecord: Date;
  conditionStatus: ConditionStatus;
  feedbackContent: string;
  contactNumber?: string;
  photo?: string;
  staff: {
    id: number;
    name: string;
    employeeId: string | null;
    phone: string | null;
  };
  createdAt: Date;
  updatedAt: Date;
  // Flattened relationship data
  staffName?: string;
}

export interface DailyRecordCreateData {
  dateOfRecord: Date;
  staffId: number;
  conditionStatus: ConditionStatus;
  feedbackContent: string;
  contactNumber?: string;
  photo?: string;
}

export interface DailyRecordUpdateData {
  dateOfRecord?: Date;
  staffId?: number;
  conditionStatus?: ConditionStatus;
  feedbackContent?: string;
  contactNumber?: string;
  photo?: string | null;
}

export class DailyRecordService {
  private prisma: PrismaClient;

  constructor(prismaClient?: PrismaClient) {
    this.prisma = prismaClient || prisma;
  }

  /**
   * Transform Prisma result to DailyRecordWithRelations
   */
  private transformDailyRecord(dailyRecord: {
    id: number;
    dateOfRecord: Date;
    conditionStatus: ConditionStatus;
    feedbackContent: string;
    contactNumber: string | null;
    photo: string | null;
    createdAt: Date;
    updatedAt: Date;
    staff: {
      id: number;
      name: string;
      employeeId: string | null;
      phone: string | null;
    };
  }): DailyRecordWithRelations {
    return {
      id: dailyRecord.id,
      dateOfRecord: dailyRecord.dateOfRecord,
      conditionStatus: dailyRecord.conditionStatus,
      feedbackContent: dailyRecord.feedbackContent,
      contactNumber: dailyRecord.contactNumber || undefined,
      photo: dailyRecord.photo || undefined,
      staff: {
        id: dailyRecord.staff.id,
        name: dailyRecord.staff.name,
        employeeId: dailyRecord.staff.employeeId,
        phone: dailyRecord.staff.phone,
      },
      createdAt: dailyRecord.createdAt,
      updatedAt: dailyRecord.updatedAt,
      // Flattened relationship data for easier access
      staffName: dailyRecord.staff.name,
    };
  }

  /**
   * Transform daily record data to flatten staff information
   */
  private flattenDailyRecordRelationships(
    record: DailyRecordWithRelations
  ): DailyRecordWithRelations & {
    staffName: string;
  } {
    return {
      ...record,
      staffName: record.staff.name,
    };
  }

  /**
   * Get all daily records with optional filtering
   */
  async getDailyRecords(
    filters?: DailyRecordFilters
  ): Promise<DailyRecordWithRelations[]> {
    const where: Prisma.DailyRecordWhereInput = {};

    if (filters?.staffId) {
      where.staffId = filters.staffId;
    }

    if (filters?.conditionStatus) {
      where.conditionStatus = filters.conditionStatus;
    }

    if (filters?.dateFrom || filters?.dateTo) {
      where.dateOfRecord = {};
      if (filters.dateFrom) {
        where.dateOfRecord.gte = filters.dateFrom;
      }
      if (filters.dateTo) {
        where.dateOfRecord.lte = filters.dateTo;
      }
    }

    if (filters?.search) {
      where.OR = [
        { feedbackContent: { contains: filters.search } },
        { contactNumber: { contains: filters.search } },
        { staff: { name: { contains: filters.search } } },
      ];
    }

    const dailyRecords = await this.prisma.dailyRecord.findMany({
      where,
      include: {
        staff: {
          select: {
            id: true,
            name: true,
            employeeId: true,
            phone: true,
          },
        },
      },
      orderBy: [{ dateOfRecord: "desc" }, { updatedAt: "desc" }, { id: "desc" }],
    });

    return dailyRecords.map((record) => this.transformDailyRecord(record));
  }

  /**
   * Get daily record by ID
   */
  async getDailyRecordById(
    id: number
  ): Promise<DailyRecordWithRelations | null> {
    const dailyRecord = await this.prisma.dailyRecord.findUnique({
      where: { id },
      include: {
        staff: {
          select: {
            id: true,
            name: true,
            employeeId: true,
            phone: true,
            position: true,
            department: true,
            email: true,
          },
        },
      },
    });

    if (!dailyRecord) {
      return null;
    }

    return this.transformDailyRecord(dailyRecord);
  }

  /**
   * Create new daily record
   */
  async createDailyRecord(
    data: DailyRecordCreateData
  ): Promise<DailyRecordWithRelations> {
    const dailyRecord = await this.prisma.dailyRecord.create({
      data: {
        dateOfRecord: data.dateOfRecord,
        staffId: data.staffId,
        conditionStatus: data.conditionStatus,
        feedbackContent: data.feedbackContent,
        contactNumber: data.contactNumber,
        photo: data.photo,
      },
      include: {
        staff: {
          select: {
            id: true,
            name: true,
            employeeId: true,
            phone: true,
          },
        },
      },
    });

    return this.transformDailyRecord(dailyRecord);
  }

  /**
   * Update daily record
   */
  async updateDailyRecord(
    id: number,
    data: DailyRecordUpdateData
  ): Promise<DailyRecordWithRelations> {
    const updateData: Prisma.DailyRecordUpdateInput = {};

    if (data.dateOfRecord !== undefined)
      updateData.dateOfRecord = data.dateOfRecord;
    if (data.conditionStatus !== undefined)
      updateData.conditionStatus = data.conditionStatus;
    if (data.feedbackContent !== undefined)
      updateData.feedbackContent = data.feedbackContent;
    if (data.contactNumber !== undefined)
      updateData.contactNumber = data.contactNumber;
    if (data.photo !== undefined) {
      // Handle photo deletion - if photo is explicitly set to null, clean up old file
      if (data.photo === null) {
        try {
          const existing = await this.prisma.dailyRecord.findUnique({
            where: { id },
            select: { photo: true },
          });
          if (existing && existing.photo) {
            const fs = await import("fs");
            const path = await import("path");
            const existingPath = path.join(
              process.cwd(),
              existing.photo.replace(/^\//, "")
            );
            if (fs.existsSync(existingPath)) {
              fs.unlinkSync(existingPath);
            }
          }
        } catch (err) {
          console.warn(
            "Error while attempting to delete existing daily record photo:",
            err
          );
        }
      }
      updateData.photo = data.photo;
    }
    if (data.staffId !== undefined) {
      updateData.staff = { connect: { id: data.staffId } };
    }

    const dailyRecord = await this.prisma.dailyRecord.update({
      where: { id },
      data: updateData,
      include: {
        staff: {
          select: {
            id: true,
            name: true,
            employeeId: true,
            phone: true,
          },
        },
      },
    });

    return this.transformDailyRecord(dailyRecord);
  }

  /**
   * Delete daily record
   */
  async deleteDailyRecord(id: number): Promise<void> {
    // Get the record first to check if it has a photo
    const record = await this.prisma.dailyRecord.findUnique({
      where: { id },
      select: { photo: true },
    });

    // Delete the record
    await this.prisma.dailyRecord.delete({
      where: { id },
    });

    // Clean up photo file if it exists
    if (record?.photo) {
      try {
        const fs = await import("fs");
        const path = await import("path");
        const photoPath = path.join(
          process.cwd(),
          record.photo.replace(/^\//, "")
        );
        if (fs.existsSync(photoPath)) {
          fs.unlinkSync(photoPath);
        }
      } catch (error) {
        console.warn("Failed to delete photo file:", error);
      }
    }
  }

  /**
   * Bulk delete daily records
   */
  async bulkDeleteDailyRecords(ids: number[]): Promise<number> {
    // Get records with photos first
    const recordsWithPhotos = await this.prisma.dailyRecord.findMany({
      where: {
        id: { in: ids },
        photo: { not: null },
      },
      select: { photo: true },
    });

    // Delete the records
    const result = await this.prisma.dailyRecord.deleteMany({
      where: {
        id: {
          in: ids,
        },
      },
    });

    // Clean up photo files
    if (recordsWithPhotos.length > 0) {
      try {
        const fs = await import("fs");
        const path = await import("path");

        for (const record of recordsWithPhotos) {
          if (record.photo) {
            const photoPath = path.join(
              process.cwd(),
              record.photo.replace(/^\//, "")
            );
            if (fs.existsSync(photoPath)) {
              fs.unlinkSync(photoPath);
            }
          }
        }
      } catch (error) {
        console.warn("Failed to delete photo files during bulk delete:", error);
      }
    }

    return result.count;
  }

  /**
   * Get daily records by staff
   */
  async getDailyRecordsByStaff(
    staffId: number
  ): Promise<DailyRecordWithRelations[]> {
    return this.getDailyRecords({ staffId });
  }

  /**
   * Get daily records by date range
   */
  async getDailyRecordsByDateRange(
    dateFrom: Date,
    dateTo: Date
  ): Promise<DailyRecordWithRelations[]> {
    return this.getDailyRecords({ dateFrom, dateTo });
  }

  /**
   * Get daily record statistics
   */
  async getDailyRecordStatistics() {
    const total = await this.prisma.dailyRecord.count();

    const byConditionStatus = await this.prisma.dailyRecord.groupBy({
      by: ["conditionStatus"],
      _count: {
        id: true,
      },
    });

    const byStaff = await this.prisma.dailyRecord.groupBy({
      by: ["staffId"],
      _count: {
        id: true,
      },
    });

    return {
      total,
      byConditionStatus: byConditionStatus.reduce((acc, item) => {
        acc[item.conditionStatus] = item._count.id;
        return acc;
      }, {} as Record<string, number>),
      byStaff: byStaff.reduce((acc, item) => {
        acc[item.staffId] = item._count.id;
        return acc;
      }, {} as Record<number, number>),
    };
  }

  /**
   * Get all daily records with comprehensive staff relationship includes and flattened data
   */
  async getAllWithRelations(): Promise<DailyRecordWithRelations[]> {
    const dailyRecords = await this.prisma.dailyRecord.findMany({
      include: {
        staff: {
          select: {
            id: true,
            name: true,
            employeeId: true,
            phone: true,
          },
        },
      },
      orderBy: [{ dateOfRecord: "desc" }, { updatedAt: "desc" }, { id: "desc" }],
    });

    return dailyRecords.map((record) => this.transformDailyRecord(record));
  }

  /**
   * Get daily record by ID with comprehensive staff relationship includes and flattened data
   */
  async getByIdWithRelations(
    id: number
  ): Promise<DailyRecordWithRelations | null> {
    const dailyRecord = await this.prisma.dailyRecord.findUnique({
      where: { id },
      include: {
        staff: {
          select: {
            id: true,
            name: true,
            employeeId: true,
            phone: true,
          },
        },
      },
    });

    if (!dailyRecord) {
      return null;
    }

    return this.transformDailyRecord(dailyRecord);
  }
}

export default new DailyRecordService();
