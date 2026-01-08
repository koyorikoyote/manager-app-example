import { PrismaClient } from "@prisma/client";
import prisma from "../lib/prisma";
import { cleanupOrphanedPhotos } from "../utils/photoFileManager";

export class PhotoCleanupService {
  private prisma: PrismaClient;

  constructor(prismaClient?: PrismaClient) {
    this.prisma = prismaClient || prisma;
  }

  /**
   * Get all valid daily record photo paths from database
   */
  async getValidDailyRecordPhotos(): Promise<string[]> {
    const records = await this.prisma.dailyRecord.findMany({
      where: {
        photo: {
          not: null,
        },
      },
      select: {
        photo: true,
      },
    });

    return records
      .map((record) => record.photo)
      .filter((photo): photo is string => photo !== null);
  }

  /**
   * Get all valid staff photo paths from database
   */
  async getValidStaffPhotos(): Promise<string[]> {
    const staff = await this.prisma.staff.findMany({
      where: {
        photo: {
          not: null,
        },
      },
      select: {
        photo: true,
      },
    });

    return staff
      .map((member) => member.photo)
      .filter((photo): photo is string => photo !== null);
  }

  /**
   * Clean up orphaned daily record photos
   */
  async cleanupDailyRecordPhotos(): Promise<{
    deleted: string[];
    errors: string[];
  }> {
    const validPhotos = await this.getValidDailyRecordPhotos();
    return cleanupOrphanedPhotos("daily-records", validPhotos);
  }

  /**
   * Clean up orphaned staff photos
   */
  async cleanupStaffPhotos(): Promise<{ deleted: string[]; errors: string[] }> {
    const validPhotos = await this.getValidStaffPhotos();
    return cleanupOrphanedPhotos("staff-photos", validPhotos);
  }

  /**
   * Clean up all orphaned photos
   */
  async cleanupAllOrphanedPhotos(): Promise<{
    dailyRecords: { deleted: string[]; errors: string[] };
    staff: { deleted: string[]; errors: string[] };
    summary: {
      totalDeleted: number;
      totalErrors: number;
    };
  }> {
    const [dailyRecordsResult, staffResult] = await Promise.all([
      this.cleanupDailyRecordPhotos(),
      this.cleanupStaffPhotos(),
    ]);

    return {
      dailyRecords: dailyRecordsResult,
      staff: staffResult,
      summary: {
        totalDeleted:
          dailyRecordsResult.deleted.length + staffResult.deleted.length,
        totalErrors:
          dailyRecordsResult.errors.length + staffResult.errors.length,
      },
    };
  }

  /**
   * Get photo cleanup statistics
   */
  async getPhotoStatistics(): Promise<{
    dailyRecords: {
      totalInDatabase: number;
      totalWithPhotos: number;
    };
    staff: {
      totalInDatabase: number;
      totalWithPhotos: number;
    };
  }> {
    const [
      totalDailyRecords,
      dailyRecordsWithPhotos,
      totalStaff,
      staffWithPhotos,
    ] = await Promise.all([
      this.prisma.dailyRecord.count(),
      this.prisma.dailyRecord.count({
        where: { photo: { not: null } },
      }),
      this.prisma.staff.count(),
      this.prisma.staff.count({
        where: { photo: { not: null } },
      }),
    ]);

    return {
      dailyRecords: {
        totalInDatabase: totalDailyRecords,
        totalWithPhotos: dailyRecordsWithPhotos,
      },
      staff: {
        totalInDatabase: totalStaff,
        totalWithPhotos: staffWithPhotos,
      },
    };
  }

  /**
   * Verify photo file integrity
   */
  async verifyPhotoIntegrity(): Promise<{
    dailyRecords: {
      valid: string[];
      missing: string[];
      invalid: string[];
    };
    staff: {
      valid: string[];
      missing: string[];
      invalid: string[];
    };
  }> {
    const [dailyRecordPhotos, staffPhotos] = await Promise.all([
      this.getValidDailyRecordPhotos(),
      this.getValidStaffPhotos(),
    ]);

    const { getPhotoInfo } = await import("../utils/photoFileManager");

    // Check daily record photos
    const dailyRecordResults = {
      valid: [] as string[],
      missing: [] as string[],
      invalid: [] as string[],
    };

    for (const photoPath of dailyRecordPhotos) {
      try {
        const info = await getPhotoInfo(photoPath);
        if (info.exists) {
          dailyRecordResults.valid.push(photoPath);
        } else {
          dailyRecordResults.missing.push(photoPath);
        }
      } catch {
        dailyRecordResults.invalid.push(photoPath);
      }
    }

    // Check staff photos
    const staffResults = {
      valid: [] as string[],
      missing: [] as string[],
      invalid: [] as string[],
    };

    for (const photoPath of staffPhotos) {
      try {
        const info = await getPhotoInfo(photoPath);
        if (info.exists) {
          staffResults.valid.push(photoPath);
        } else {
          staffResults.missing.push(photoPath);
        }
      } catch {
        staffResults.invalid.push(photoPath);
      }
    }

    return {
      dailyRecords: dailyRecordResults,
      staff: staffResults,
    };
  }

  /**
   * Clean up missing photo references from database
   */
  async cleanupMissingPhotoReferences(): Promise<{
    dailyRecordsUpdated: number;
    staffUpdated: number;
  }> {
    const integrity = await this.verifyPhotoIntegrity();

    // Update daily records with missing photos
    const dailyRecordsResult = await this.prisma.dailyRecord.updateMany({
      where: {
        photo: {
          in: [
            ...integrity.dailyRecords.missing,
            ...integrity.dailyRecords.invalid,
          ],
        },
      },
      data: {
        photo: null,
      },
    });

    // Update staff with missing photos
    const staffResult = await this.prisma.staff.updateMany({
      where: {
        photo: {
          in: [...integrity.staff.missing, ...integrity.staff.invalid],
        },
      },
      data: {
        photo: null,
      },
    });

    return {
      dailyRecordsUpdated: dailyRecordsResult.count,
      staffUpdated: staffResult.count,
    };
  }
}

export default new PhotoCleanupService();
