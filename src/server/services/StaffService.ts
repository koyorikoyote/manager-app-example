import { PrismaClient, Prisma, StaffStatus } from "@prisma/client";
import prisma from "../lib/prisma";

export interface StaffFilters {
  status?: StaffStatus;
  department?: string;
  search?: string;
  userId?: number;
}

export interface StaffCreateData {
  employeeId?: string | null;
  name: string;
  position?: string | null;
  department?: string | null;
  email?: string;
  phone?: string;
  address?: string;
  hireDate?: Date;
  salary?: number;
  status?: StaffStatus;
  userId?: number;
  residenceStatus?: string;
  age?: number;
  nationality?: string;
  userInChargeId?: number;
  companiesId?: number;
}

export interface StaffUpdateData {
  employeeId?: string | null;
  name?: string;
  position?: string | null;
  department?: string | null;
  email?: string;
  phone?: string;
  address?: string;
  hireDate?: Date;
  salary?: number;
  status?: StaffStatus;
  userId?: number;
  residenceStatus?: string;
  age?: number;
  nationality?: string;
  userInChargeId?: number;
  companiesId?: number;
}

export class StaffService {
  private prisma: PrismaClient;

  constructor(prismaClient?: PrismaClient) {
    this.prisma = prismaClient || prisma;
  }

  /**
   * Get all staff members with optional filtering
   */
  async getAllStaff(filters?: StaffFilters) {
    const where: Prisma.StaffWhereInput = {};

    if (filters?.status) {
      where.status = filters.status;
    }

    if (filters?.department) {
      where.department = {
        contains: filters.department,
      };
    }

    if (filters?.userId) {
      where.userId = filters.userId;
    }

    if (filters?.search) {
      where.OR = [
        { name: { contains: filters.search } },
        { employeeId: { contains: filters.search } },
        { email: { contains: filters.search } },
        { position: { contains: filters.search } },
        { residenceStatus: { contains: filters.search } },
        { company: { name: { contains: filters.search } } },
      ];
    }

    return this.prisma.staff.findMany({
      where,
      select: {
        id: true,
        employeeId: true,
        name: true,
        position: true,
        department: true,
        email: true,
        phone: true,
        status: true,
        residenceStatus: true,
        age: true,
        nationality: true,
        createdAt: true,
        updatedAt: true,
        user: {
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
        userInCharge: {
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
        assignments: {
          select: {
            id: true,
            room: true,
            startDate: true,
            endDate: true,
            isActive: true,
            property: {
              select: {
                id: true,
                name: true,
                propertyCode: true,
              },
            },
          },
          // Show ALL assignments regardless of status
          orderBy: [{ isActive: "desc" }, { startDate: "desc" }],
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });
  }

  /**
   * Get staff member by ID
   */
  async getStaffById(id: number) {
    return this.prisma.staff.findUnique({
      where: { id },
      select: {
        id: true,
        employeeId: true,
        name: true,
        position: true,
        department: true,
        email: true,
        phone: true,
        address: true,
        hireDate: true,
        salary: true,
        status: true,
        residenceStatus: true,
        age: true,
        nationality: true,
        createdAt: true,
        updatedAt: true,
        user: {
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
        userInCharge: {
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
        assignments: {
          select: {
            id: true,
            room: true,
            startDate: true,
            endDate: true,
            isActive: true,
            property: {
              select: {
                id: true,
                name: true,
                propertyCode: true,
                address: true,
              },
            },
          },
        },
      },
    });
  }

  /**
   * Get staff member by employee ID
   */
  async getStaffByEmployeeId(employeeId: string) {
    return this.prisma.staff.findUnique({
      where: { employeeId },
      select: {
        id: true,
        employeeId: true,
        name: true,
        position: true,
        department: true,
        email: true,
        phone: true,
        address: true,
        hireDate: true,
        salary: true,
        status: true,
        residenceStatus: true,
        age: true,
        nationality: true,
        createdAt: true,
        updatedAt: true,
        user: {
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
        userInCharge: {
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
        assignments: {
          select: {
            id: true,
            room: true,
            startDate: true,
            endDate: true,
            isActive: true,
            property: {
              select: {
                id: true,
                name: true,
                propertyCode: true,
                address: true,
              },
            },
          },
        },
      },
    });
  }

  /**
   * Create new staff member
   */
  async createStaff(data: StaffCreateData) {
    // Create the staff record first. If caller provided employeeId we'll keep it;
    // otherwise generate employeeId after creating so it matches the actual primary key.
    const created = await this.prisma.staff.create({
      data: {
        employeeId: data.employeeId ?? null,
        name: data.name,
        position: data.position,
        department: data.department,
        email: data.email,
        phone: data.phone,
        address: data.address,
        hireDate: data.hireDate,
        salary: data.salary ? new Prisma.Decimal(data.salary) : null,
        status: data.status || StaffStatus.ACTIVE,
        userId: data.userId,
        residenceStatus: data.residenceStatus,
        age: data.age,
        nationality: data.nationality,
        userInChargeId: data.userInChargeId,
        companiesId: data.companiesId,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
        userInCharge: {
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
      },
    });

    // If no employeeId was provided, set it based on the actual primary key (id).
    if (!data.employeeId) {
      const formatted = `C${String(created.id).padStart(5, "0")}`;
      const updated = await this.prisma.staff.update({
        where: { id: created.id },
        data: { employeeId: formatted },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
            },
          },
          userInCharge: {
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
        },
      });

      return updated;
    }

    return created;
  }

  /**
   * Update staff member
   */
  async updateStaff(id: number, data: StaffUpdateData) {
    const updateData: Prisma.StaffUpdateInput = {};

    if (data.name !== undefined) updateData.name = data.name;
    if (data.position !== undefined) updateData.position = data.position;
    if (data.department !== undefined) updateData.department = data.department;
    if (data.email !== undefined) updateData.email = data.email;
    if (data.phone !== undefined) updateData.phone = data.phone;
    if (data.address !== undefined) updateData.address = data.address;
    if (data.hireDate !== undefined) updateData.hireDate = data.hireDate;
    if (data.salary !== undefined) {
      updateData.salary = data.salary ? new Prisma.Decimal(data.salary) : null;
    }
    if (data.status !== undefined) updateData.status = data.status;
    if (data.userId !== undefined) {
      updateData.user = data.userId
        ? { connect: { id: data.userId } }
        : { disconnect: true };
    }
    if (data.residenceStatus !== undefined)
      updateData.residenceStatus = data.residenceStatus;
    if (data.age !== undefined) updateData.age = data.age;
    if (data.nationality !== undefined)
      updateData.nationality = data.nationality;
    if (data.userInChargeId !== undefined) {
      updateData.userInCharge = data.userInChargeId
        ? { connect: { id: data.userInChargeId } }
        : { disconnect: true };
    }
    if (data.companiesId !== undefined) {
      updateData.company = data.companiesId
        ? { connect: { id: data.companiesId } }
        : { disconnect: true };
    }

    return this.prisma.staff.update({
      where: { id },
      data: updateData,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
        userInCharge: {
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
      },
    });
  }

  /**
   * Soft delete staff member (set status to TERMINATED)
   */
  async deleteStaff(id: number) {
    return this.prisma.staff.update({
      where: { id },
      data: {
        status: StaffStatus.TERMINATED,
      },
    });
  }

  /**
   * Assign staff to property with transaction support
   */
  async assignStaffToProperty(
    staffId: number,
    propertyId: number,
    room: string,
    startDate: Date
  ) {
    return this.prisma.$transaction(async (tx) => {
      // End any existing active assignments for this staff-property combination
      await tx.propertyStaffAssignment.updateMany({
        where: {
          staffId,
          propertyId,
          isActive: true,
        },
        data: {
          isActive: false,
          endDate: new Date(),
        },
      });

      // Create new assignment
      return tx.propertyStaffAssignment.create({
        data: {
          staffId,
          propertyId,
          room,
          startDate,
          isActive: true,
        },
        include: {
          staff: {
            select: {
              id: true,
              name: true,
              employeeId: true,
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
    });
  }

  /**
   * Remove staff assignment from property
   */
  async removeStaffFromProperty(staffId: number, propertyId: number) {
    return this.prisma.propertyStaffAssignment.updateMany({
      where: {
        staffId,
        propertyId,
        isActive: true,
      },
      data: {
        isActive: false,
        endDate: new Date(),
      },
    });
  }

  /**
   * Get staff statistics
   */
  async getStaffStatistics() {
    const [total, active, inactive, terminated, onLeave] = await Promise.all([
      this.prisma.staff.count(),
      this.prisma.staff.count({ where: { status: StaffStatus.ACTIVE } }),
      this.prisma.staff.count({ where: { status: StaffStatus.INACTIVE } }),
      this.prisma.staff.count({ where: { status: StaffStatus.TERMINATED } }),
      this.prisma.staff.count({ where: { status: StaffStatus.ON_LEAVE } }),
    ]);

    return {
      total,
      active,
      inactive,
      terminated,
      onLeave,
    };
  }

  /**
   * Get available users for dropdown selections
   */
  async getAvailableUsers() {
    return this.prisma.user.findMany({
      where: {
        isActive: true,
      },
      select: {
        id: true,
        name: true,
      },
      orderBy: {
        name: "asc",
      },
    });
  }

  /**
   * Get available nationalities for dropdown selections
   */
  async getAvailableNationalities() {
    // Return common nationalities - in a real implementation this might come from a database table
    return [
      "Australia",
      "Bangladesh",
      "Cambodia",
      "China",
      "India",
      "Indonesia",
      "Japan",
      "Laos",
      "Malaysia",
      "Mexico",
      "Myanmar",
      "Nepal",
      "New Zealand",
      "Pakistan",
      "Philippines",
      "Singapore",
      "South Korea",
      "Sri Lanka",
      "Taiwan",
      "Thailand",
      "United Arab Emirates",
      "United Kingdom",
      "United States",
      "Vietnam",
    ];
  }
}

export default new StaffService();
