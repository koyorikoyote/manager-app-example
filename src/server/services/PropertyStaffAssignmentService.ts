import { PrismaClient, Prisma } from "@prisma/client";
import prisma from "../lib/prisma";
import { TOKYO_TZ } from "../../shared/utils/timezone";
import { toJSTISOString } from "../../shared/utils/jstDateUtils";

export interface TenantRecord {
  id: number;
  room: string;
  staffNames: string[];
  staffIds: number[];
  rentPriceHigh: number | null;
  rentPriceLow: number | null;
  startDate: Date;
  endDate: Date | null;
  isActive: boolean;
  staff: Array<{
    id: number;
    name: string;
    employeeId: string | null;
    position: string | null;
    department: string | null;
    email?: string | null;
    phone?: string | null;
  }>;
}

export interface AccordionDisplayData {
  id: number;
  title: string;
  subtitle: string;
  details: {
    room: string;
    staffNames: string;
    rentPriceRange: string;
    period: string;
    status: string;
  };
}

export class PropertyStaffAssignmentService {
  private prisma: PrismaClient;

  constructor(prismaClient?: PrismaClient) {
    this.prisma = prismaClient || prisma;
  }

  /**
   * Fetch tenant records by property ID
   */
  async getTenantsByPropertyId(
    propertyId: number,
    includeInactive = false
  ): Promise<TenantRecord[]> {
    const where: Prisma.PropertyStaffAssignmentWhereInput = {
      propertyId,
    };

    if (!includeInactive) {
      where.isActive = true;
    }

    const assignments = await this.prisma.propertyStaffAssignment.findMany({
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
          },
        },
      },
      orderBy: [{ isActive: "desc" }, { startDate: "desc" }],
    });

    // Group assignments by room and combine staff
    const roomGroups = new Map<string, any[]>();

    assignments.forEach((assignment) => {
      const key = `${assignment.room}-${toJSTISOString(assignment.startDate)}-${
        assignment.endDate ? toJSTISOString(assignment.endDate) : "ongoing"
      }`;
      if (!roomGroups.has(key)) {
        roomGroups.set(key, []);
      }
      roomGroups.get(key)!.push(assignment);
    });

    return Array.from(roomGroups.values()).map((group) => {
      const firstAssignment = group[0];
      const allStaff = group.map((a) => a.staff);

      return {
        id: firstAssignment.id,
        room: firstAssignment.room,
        staffNames: allStaff.map((s) => s.name),
        staffIds: allStaff.map((s) => s.id),
        rentPriceHigh: firstAssignment.rentPriceHigh
          ? Number(firstAssignment.rentPriceHigh)
          : null,
        rentPriceLow: firstAssignment.rentPriceLow
          ? Number(firstAssignment.rentPriceLow)
          : null,
        startDate: firstAssignment.startDate,
        endDate: firstAssignment.endDate,
        isActive: firstAssignment.isActive,
        staff: allStaff,
      };
    });
  }

  /**
   * Resolve staff names for tenant display
   */
  async resolveStaffNames(staffIds: number[]): Promise<string[]> {
    const staff = await this.prisma.staff.findMany({
      where: {
        id: { in: staffIds },
      },
      select: {
        id: true,
        name: true,
      },
      orderBy: {
        name: "asc",
      },
    });

    return staff.map((s) => s.name);
  }

  /**
   * Transform tenant data for accordion display format
   */
  transformForAccordionDisplay(
    tenants: TenantRecord[]
  ): AccordionDisplayData[] {
    return tenants.map((tenant) => {
      const staffNamesStr = tenant.staffNames.join(", ");
      const rentPriceRange = this.formatRentPriceRange(
        tenant.rentPriceHigh,
        tenant.rentPriceLow
      );
      const period = this.formatPeriod(tenant.startDate, tenant.endDate);
      const status = tenant.isActive ? "Active" : "Inactive";

      return {
        id: tenant.id,
        title: `Room ${tenant.room}`,
        subtitle: staffNamesStr,
        details: {
          room: tenant.room,
          staffNames: staffNamesStr,
          rentPriceRange,
          period,
          status,
        },
      };
    });
  }

  /**
   * Format rent price range for display
   */
  private formatRentPriceRange(
    high: number | null,
    low: number | null
  ): string {
    if (!high && !low) return "未指定 / Not specified";
    if (high && low && high !== low) {
      return `¥${low.toLocaleString()} - ¥${high.toLocaleString()}`;
    }
    if (high) return `¥${high.toLocaleString()}`;
    if (low) return `¥${low.toLocaleString()}`;
    return "未指定 / Not specified";
  }

  /**
   * Format period for display
   */
  private formatPeriod(startDate: Date, endDate: Date | null): string {
    const start = startDate.toLocaleDateString("ja-JP", { timeZone: TOKYO_TZ });
    if (!endDate) return `${start} - Present`;
    const end = endDate.toLocaleDateString("ja-JP", { timeZone: TOKYO_TZ });
    return `${start} - ${end}`;
  }

  /**
   * Get active tenants count for a property
   */
  async getActiveTenantCount(propertyId: number): Promise<number> {
    return this.prisma.propertyStaffAssignment.count({
      where: {
        propertyId,
        isActive: true,
      },
    });
  }

  /**
   * Get tenant assignment history for a property
   */
  async getTenantHistory(propertyId: number): Promise<TenantRecord[]> {
    return this.getTenantsByPropertyId(propertyId, true);
  }

  /**
   * Create new tenant assignment
   */
  async createTenantAssignment(data: {
    propertyId: number;
    staffId: number;
    room: string;
    startDate: Date;
    endDate?: Date;
    rentPriceHigh?: number;
    rentPriceLow?: number;
  }) {
    return this.prisma.propertyStaffAssignment.create({
      data: {
        propertyId: data.propertyId,
        staffId: data.staffId,
        room: data.room,
        startDate: data.startDate,
        endDate: data.endDate,
        rentPriceHigh: data.rentPriceHigh
          ? new Prisma.Decimal(data.rentPriceHigh)
          : null,
        rentPriceLow: data.rentPriceLow
          ? new Prisma.Decimal(data.rentPriceLow)
          : null,
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
        property: {
          select: {
            id: true,
            name: true,
            propertyCode: true,
          },
        },
      },
    });
  }

  /**
   * Update tenant assignment
   */
  async updateTenantAssignment(
    id: number,
    data: {
      room?: string;
      startDate?: Date;
      endDate?: Date;
      rentPriceHigh?: number;
      rentPriceLow?: number;
      isActive?: boolean;
    }
  ) {
    const updateData: Prisma.PropertyStaffAssignmentUpdateInput = {};

    if (data.room !== undefined) updateData.room = data.room;
    if (data.startDate !== undefined) updateData.startDate = data.startDate;
    if (data.endDate !== undefined) updateData.endDate = data.endDate;
    if (data.rentPriceHigh !== undefined) {
      updateData.rentPriceHigh = data.rentPriceHigh
        ? new Prisma.Decimal(data.rentPriceHigh)
        : null;
    }
    if (data.rentPriceLow !== undefined) {
      updateData.rentPriceLow = data.rentPriceLow
        ? new Prisma.Decimal(data.rentPriceLow)
        : null;
    }
    if (data.isActive !== undefined) updateData.isActive = data.isActive;

    return this.prisma.propertyStaffAssignment.update({
      where: { id },
      data: updateData,
      include: {
        staff: {
          select: {
            id: true,
            name: true,
            employeeId: true,
            position: true,
          },
        },
        property: {
          select: {
            id: true,
            name: true,
            propertyCode: true,
          },
        },
      },
    });
  }

  /**
   * End tenant assignment
   */
  async endTenantAssignment(id: number, endDate?: Date) {
    return this.prisma.propertyStaffAssignment.update({
      where: { id },
      data: {
        isActive: false,
        endDate: endDate || new Date(),
      },
    });
  }
}

export default new PropertyStaffAssignmentService();
