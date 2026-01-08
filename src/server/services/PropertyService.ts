import {
  PrismaClient,
  Prisma,
  PropertyStatus,
  PropertyType,
} from "@prisma/client";
import prisma from "../lib/prisma";
import * as path from "path";
import {
  uploadBufferToS3,
  deleteObjectFromS3,
  keyFromUrlOrPath,
} from "../lib/awsS3";
import type { Express } from "express";

export interface PropertyFilters {
  status?: PropertyStatus;
  propertyType?: PropertyType;
  managerId?: number;
  search?: string;
}

export interface PropertyWithOccupants {
  id: number;
  propertyCode: string | null;
  name: string;
  address: string;
  propertyType: PropertyType;
  status: PropertyStatus;
  description?: string | null;
  contractDate?: Date | null;
  createdAt: Date;
  updatedAt: Date;
  occupantCount: number;
  manager?: {
    id: number;
    name: string;
    email: string;
    role: {
      id: number;
      name: string;
      level: number;
    };
  } | null;
  staffAssignments: Array<{
    id: number;
    room: string;
    startDate: Date;
    endDate?: Date | null;
    isActive: boolean;
    rentPriceHigh?: number | null;
    rentPriceLow?: number | null;
    staff: {
      id: number;
      name: string;
      employeeId: string | null;
      position: string | null;
    };
  }>;
}

export interface PropertyCreateData {
  propertyCode: string;
  name: string;
  address: string;
  propertyType: PropertyType;
  managerId?: number;
  status?: PropertyStatus;
  description?: string;
  contractDate?: Date;
}

export interface PropertyUpdateData {
  name?: string;
  address?: string;
  propertyType?: PropertyType;
  managerId?: number;
  status?: PropertyStatus;
  description?: string;
  contractDate?: Date;
  // New header fields
  photo?: string;
  furiganaName?: string;
  establishmentDate?: Date;
  // New property information fields
  postalCode?: string;
  country?: string;
  region?: string;
  prefecture?: string;
  city?: string;
  owner?: string;
  ownerPhone?: string;
  ownerEmail?: string;
  ownerFax?: string;
}

export interface PropertyWithRelatedData {
  id: number;
  propertyCode: string;
  name: string;
  address: string;
  propertyType: PropertyType;
  status: PropertyStatus;
  description?: string | null;
  contractDate?: Date | null;
  // New header fields
  photo?: string | null;
  furiganaName?: string | null;
  establishmentDate?: Date | null;
  // New property information fields
  postalCode?: string | null;
  country?: string | null;
  region?: string | null;
  prefecture?: string | null;
  city?: string | null;
  owner?: string | null;
  ownerPhone?: string | null;
  ownerEmail?: string | null;
  ownerFax?: string | null;
  createdAt: Date;
  updatedAt: Date;
  manager?: {
    id: number;
    name: string;
    email: string;
    role: {
      id: number;
      name: string;
      level: number;
    };
  } | null;
  staffAssignments: Array<{
    id: number;
    room: string;
    startDate: Date;
    endDate?: Date | null;
    isActive: boolean;
    rentPriceHigh?: number | null;
    rentPriceLow?: number | null;
    staff: {
      id: number;
      name: string;
      employeeId: string | null;
      position: string | null;
    };
  }>;
  documents: Array<{
    id: number;
    title: string;
    type: string;
    status: string;
    startDate: Date;
    endDate?: Date | null;
    filePath?: string | null;
  }>;
}

export class PropertyService {
  private prisma: PrismaClient;

  constructor(prismaClient?: PrismaClient) {
    this.prisma = prismaClient || prisma;
  }

  /**
   * Get all properties with optional filtering and occupant count - optimized query
   */
  async getAllProperties(
    filters?: PropertyFilters,
    options?: { limit?: number; offset?: number }
  ): Promise<PropertyWithOccupants[]> {
    const where: Prisma.PropertyWhereInput = {};

    if (filters?.status) {
      where.status = filters.status;
    }

    if (filters?.propertyType) {
      where.propertyType = filters.propertyType;
    }

    if (filters?.managerId) {
      where.managerId = filters.managerId;
    }

    if (filters?.search) {
      where.OR = [
        { name: { contains: filters.search } },
        { propertyCode: { contains: filters.search } },
        { address: { contains: filters.search } },
        { description: { contains: filters.search } },
      ];
    }

    const properties = await this.prisma.property.findMany({
      where,
      include: {
        manager: {
          select: {
            id: true,
            name: true,
            email: true,
            role: {
              select: {
                id: true,
                name: true,
                level: true,
              },
            },
          },
        },
        staffAssignments: {
          select: {
            id: true,
            room: true,
            startDate: true,
            endDate: true,
            isActive: true,
            rentPriceHigh: true,
            rentPriceLow: true,
            staff: {
              select: {
                id: true,
                name: true,
                employeeId: true,
                position: true,
              },
            },
          },
          // Show ALL staff assignments for complete data
          orderBy: [{ isActive: "desc" }, { startDate: "desc" }],
        },
        // Add count for better performance metrics - count ALL assignments
        _count: {
          select: {
            staffAssignments: true, // Count all assignments, not just active
            documents: true,
          },
        },
      },
      orderBy: [
        { status: "asc" }, // Active properties first
        { createdAt: "desc" },
      ],
      // Add pagination support
      take: options?.limit || 100,
      skip: options?.offset || 0,
    });

    // Transform the result to include occupantCount with optimized calculation
    return properties.map((property) => ({
      id: property.id,
      propertyCode: property.propertyCode,
      name: property.name,
      address: property.address,
      propertyType: property.propertyType,
      status: property.status,
      description: property.description,
      contractDate: property.contractDate,
      createdAt: property.createdAt,
      updatedAt: property.updatedAt,
      occupantCount: property.staffAssignments.filter((a) => a.isActive).length, // Count active assignments from loaded data
      manager: property.manager,
      staffAssignments: property.staffAssignments.map((assignment) => ({
        ...assignment,
        rentPriceHigh: assignment.rentPriceHigh
          ? Number(assignment.rentPriceHigh)
          : null,
        rentPriceLow: assignment.rentPriceLow
          ? Number(assignment.rentPriceLow)
          : null,
      })),
    }));
  }

  /**
   * Get property by ID
   */
  async getPropertyById(id: number) {
    return this.prisma.property.findUnique({
      where: { id },
      select: {
        id: true,
        propertyCode: true,
        name: true,
        address: true,
        propertyType: true,
        status: true,
        description: true,
        contractDate: true,
        // New header fields
        photo: true,
        furiganaName: true,
        establishmentDate: true,
        // New property information fields
        postalCode: true,
        country: true,
        region: true,
        prefecture: true,
        city: true,
        owner: true,
        ownerPhone: true,
        ownerEmail: true,
        ownerFax: true,
        createdAt: true,
        updatedAt: true,
        manager: {
          select: {
            id: true,
            name: true,
            email: true,
            role: {
              select: {
                id: true,
                name: true,
                level: true,
              },
            },
          },
        },
        staffAssignments: {
          select: {
            id: true,
            room: true,
            startDate: true,
            endDate: true,
            isActive: true,
            rentPriceHigh: true,
            rentPriceLow: true,
            staff: {
              select: {
                id: true,
                name: true,
                employeeId: true,
                position: true,
                department: true,
                email: true,
                phone: true,
              },
            },
          },
          orderBy: {
            startDate: "desc",
          },
        },
      },
    });
  }

  /**
   * Get property with all related data (staff assignments, documents) - optimized query
   */
  async getPropertyWithRelatedData(
    id: number
  ): Promise<PropertyWithRelatedData | null> {
    const property = await this.prisma.property.findUnique({
      where: { id },
      include: {
        manager: {
          select: {
            id: true,
            name: true,
            email: true,
            role: {
              select: {
                id: true,
                name: true,
                level: true,
              },
            },
          },
        },
        staffAssignments: {
          select: {
            id: true,
            room: true,
            startDate: true,
            endDate: true,
            isActive: true,
            rentPriceHigh: true,
            rentPriceLow: true,
            staff: {
              select: {
                id: true,
                name: true,
                employeeId: true,
                position: true,
                department: true,
                email: true,
                phone: true,
              },
            },
          },
          // Show ALL staff assignments regardless of status
          orderBy: [{ isActive: "desc" }, { startDate: "desc" }],
        },
        documents: {
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
          // Show ALL documents regardless of date or status
          orderBy: [
            { status: "asc" }, // Active documents first
            { startDate: "desc" },
          ],
        },
      },
    });

    if (!property) return null;

    return {
      ...property,
      staffAssignments: property.staffAssignments.map((assignment) => ({
        ...assignment,
        rentPriceHigh: assignment.rentPriceHigh
          ? Number(assignment.rentPriceHigh)
          : null,
        rentPriceLow: assignment.rentPriceLow
          ? Number(assignment.rentPriceLow)
          : null,
      })),
    } as PropertyWithRelatedData;
  }

  /**
   * Get property by property code
   */
  async getPropertyByCode(propertyCode: string) {
    return this.prisma.property.findUnique({
      where: { propertyCode },
      include: {
        manager: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
        staffAssignments: {
          where: {
            isActive: true,
          },
          include: {
            staff: {
              select: {
                id: true,
                name: true,
                employeeId: true,
                position: true,
              },
            },
          },
        },
      },
    });
  }

  /**
   * Create new property
   */
  async createProperty(data: PropertyCreateData) {
    return this.prisma.property.create({
      data: {
        propertyCode: data.propertyCode,
        name: data.name,
        address: data.address,
        propertyType: data.propertyType,
        managerId: data.managerId,
        status: data.status || PropertyStatus.ACTIVE,
        description: data.description,
        contractDate: data.contractDate,
      },
      include: {
        manager: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
      },
    });
  }

  /**
   * Update property
   */
  async updateProperty(id: number, data: PropertyUpdateData) {
    const updateData: Prisma.PropertyUpdateInput = {};

    if (data.name !== undefined) updateData.name = data.name;
    if (data.address !== undefined) updateData.address = data.address;
    if (data.propertyType !== undefined)
      updateData.propertyType = data.propertyType;
    if (data.managerId !== undefined) {
      updateData.manager = data.managerId
        ? { connect: { id: data.managerId } }
        : { disconnect: true };
    }
    if (data.status !== undefined) updateData.status = data.status;
    if (data.description !== undefined)
      updateData.description = data.description;
    if (data.contractDate !== undefined)
      updateData.contractDate = data.contractDate;

    // New header fields
    if (data.photo !== undefined) updateData.photo = data.photo;
    if (data.furiganaName !== undefined)
      updateData.furiganaName = data.furiganaName;
    if (data.establishmentDate !== undefined)
      updateData.establishmentDate = data.establishmentDate;

    // New property information fields
    if (data.postalCode !== undefined) updateData.postalCode = data.postalCode;
    if (data.country !== undefined) updateData.country = data.country;
    if (data.region !== undefined) updateData.region = data.region;
    if (data.prefecture !== undefined) updateData.prefecture = data.prefecture;
    if (data.city !== undefined) updateData.city = data.city;
    if (data.owner !== undefined) updateData.owner = data.owner;
    if (data.ownerPhone !== undefined) updateData.ownerPhone = data.ownerPhone;
    if (data.ownerEmail !== undefined) updateData.ownerEmail = data.ownerEmail;
    if (data.ownerFax !== undefined) updateData.ownerFax = data.ownerFax;

    return this.prisma.property.update({
      where: { id },
      data: updateData,
      include: {
        manager: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
      },
    });
  }

  /**
   * Soft delete property (set status to INACTIVE)
   */
  async deleteProperty(id: number) {
    return this.prisma.$transaction(async (tx) => {
      // End all active staff assignments for this property
      await tx.propertyStaffAssignment.updateMany({
        where: {
          propertyId: id,
          isActive: true,
        },
        data: {
          isActive: false,
          endDate: new Date(),
        },
      });

      // Update property status to INACTIVE
      return tx.property.update({
        where: { id },
        data: {
          status: PropertyStatus.INACTIVE,
        },
      });
    });
  }

  /**
   * Get properties managed by a specific user
   */
  async getPropertiesByManager(managerId: number) {
    return this.prisma.property.findMany({
      where: {
        managerId,
        status: {
          not: PropertyStatus.INACTIVE,
        },
      },
      include: {
        staffAssignments: {
          where: {
            isActive: true,
          },
          include: {
            staff: {
              select: {
                id: true,
                name: true,
                employeeId: true,
                position: true,
              },
            },
          },
        },
      },
      orderBy: {
        name: "asc",
      },
    });
  }

  /**
   * Get staff assignments for a property
   */
  async getPropertyStaffAssignments(
    propertyId: number,
    includeInactive = false
  ) {
    const where: Prisma.PropertyStaffAssignmentWhereInput = {
      propertyId,
    };

    if (!includeInactive) {
      where.isActive = true;
    }

    return this.prisma.propertyStaffAssignment.findMany({
      where,
      include: {
        staff: {
          select: {
            id: true,
            name: true,
            employeeId: true,
            position: true,
            department: true,
            email: true,
            phone: true,
            status: true,
          },
        },
      },
      orderBy: {
        startDate: "desc",
      },
    });
  }

  /**
   * Transfer property management to another user
   */
  async transferPropertyManagement(propertyId: number, newManagerId: number) {
    return this.prisma.property.update({
      where: { id: propertyId },
      data: {
        managerId: newManagerId,
      },
      include: {
        manager: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
      },
    });
  }

  /**
   * Get property statistics
   */
  async getPropertyStatistics() {
    const [total, active, inactive, underConstruction, sold] =
      await Promise.all([
        this.prisma.property.count(),
        this.prisma.property.count({
          where: { status: PropertyStatus.ACTIVE },
        }),
        this.prisma.property.count({
          where: { status: PropertyStatus.INACTIVE },
        }),
        this.prisma.property.count({
          where: { status: PropertyStatus.UNDER_CONSTRUCTION },
        }),
        this.prisma.property.count({ where: { status: PropertyStatus.SOLD } }),
      ]);

    const byType = await this.prisma.property.groupBy({
      by: ["propertyType"],
      _count: {
        id: true,
      },
    });

    return {
      total,
      active,
      inactive,
      underConstruction,
      sold,
      byType: byType.reduce((acc, item) => {
        acc[item.propertyType] = item._count.id;
        return acc;
      }, {} as Record<PropertyType, number>),
    };
  }

  /**
   * Search properties with advanced filtering
   */
  async searchProperties(
    query: string,
    filters?: {
      propertyType?: PropertyType[];
      status?: PropertyStatus[];
      managerId?: number;
    }
  ) {
    const where: Prisma.PropertyWhereInput = {
      OR: [
        { name: { contains: query } },
        { propertyCode: { contains: query } },
        { address: { contains: query } },
        { description: { contains: query } },
      ],
    };

    if (filters?.propertyType && filters.propertyType.length > 0) {
      where.propertyType = { in: filters.propertyType };
    }

    if (filters?.status && filters.status.length > 0) {
      where.status = { in: filters.status };
    }

    if (filters?.managerId) {
      where.managerId = filters.managerId;
    }

    return this.prisma.property.findMany({
      where,
      include: {
        manager: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        staffAssignments: {
          where: {
            isActive: true,
          },
          include: {
            staff: {
              select: {
                id: true,
                name: true,
                employeeId: true,
                position: true,
              },
            },
          },
        },
      },
      orderBy: {
        name: "asc",
      },
    });
  }

  /**
   * Upload property photo (S3)
   */
  async uploadPropertyPhoto(
    propertyId: number,
    file: Express.Multer.File
  ): Promise<string> {
    // Delete old photo from S3 if it exists
    const existing = await this.prisma.property.findUnique({
      where: { id: propertyId },
      select: { photo: true },
    });
    if (existing?.photo) {
      const oldKey = keyFromUrlOrPath(existing.photo);
      await deleteObjectFromS3(oldKey).catch(() => {});
    }

    // Upload new photo to S3
    const fileExtension = path.extname(file.originalname) || "";
    const key = `uploads/property-photos/property-${propertyId}-${Date.now()}${fileExtension}`;
    const photoUrl = await uploadBufferToS3({
      key,
      buffer: file.buffer,
      contentType: file.mimetype || "application/octet-stream",
    });

    // Update property record
    await this.prisma.property.update({
      where: { id: propertyId },
      data: { photo: photoUrl },
    });

    return photoUrl;
  }

  /**
   * Validate property fields
   */
  validatePropertyData(data: Partial<PropertyUpdateData>): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    // Validate email format
    if (data.ownerEmail && data.ownerEmail.trim() !== "") {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(data.ownerEmail)) {
        errors.push("Owner email format is invalid");
      }
    }

    // Validate phone format (basic validation)
    if (data.ownerPhone && data.ownerPhone.trim() !== "") {
      const phoneRegex = /^[\d\-+()\s]+$/;
      if (!phoneRegex.test(data.ownerPhone)) {
        errors.push("Owner phone format is invalid");
      }
    }

    // Validate postal code format (Japanese postal code)
    if (data.postalCode && data.postalCode.trim() !== "") {
      const postalCodeRegex = /^\d{3}-?\d{4}$/;
      if (!postalCodeRegex.test(data.postalCode)) {
        errors.push(
          "Postal code format is invalid (expected: 123-4567 or 1234567)"
        );
      }
    }

    // Validate establishment date is not in the future
    if (data.establishmentDate && data.establishmentDate > new Date()) {
      errors.push("Establishment date cannot be in the future");
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Format postal code with Japanese symbol
   */
  formatPostalCode(postalCode: string | null): string | null {
    if (!postalCode) return null;

    // Remove existing symbols and format
    const cleaned = postalCode.replace(/[^\d]/g, "");
    if (cleaned.length === 7) {
      return `〒${cleaned.slice(0, 3)}-${cleaned.slice(3)}`;
    }
    return postalCode;
  }

  /**
   * Transform property data for display
   */
  transformPropertyForDisplay(property: any) {
    return {
      ...property,
      formattedPostalCode: this.formatPostalCode(property.postalCode),
      managerName: property.manager?.name || "未設定",
    };
  }
}

export default new PropertyService();
