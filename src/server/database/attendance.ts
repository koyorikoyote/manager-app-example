import prisma from '../lib/prisma';
import { AttendanceRecord } from '../../shared/types';

export interface AttendanceFilters {
  staffIds?: number[];
  startDate?: Date;
  endDate?: Date;
  status?: AttendanceRecord['status'][];
}

// Helper function to convert Prisma record to AttendanceRecord
function convertPrismaRecord(record: any): AttendanceRecord {
  return {
    id: record.id.toString(),
    staffId: record.staffId.toString(),
    date: record.date,
    checkInTime: record.checkInTime || undefined,
    checkOutTime: record.checkOutTime || undefined,
    status: record.status.toLowerCase() as AttendanceRecord['status'],
    notes: record.notes || undefined,
    hoursWorked: record.hoursWorked ? parseFloat(record.hoursWorked.toString()) : undefined,
    createdBy: record.createdBy,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
  };
}

export async function getAllAttendanceRecords(): Promise<AttendanceRecord[]> {
  const records = await prisma.attendanceRecord.findMany({
    include: {
      staff: {
        select: {
          id: true,
          name: true,
          employeeId: true,
        },
      },
    },
    orderBy: { date: 'desc' },
  });

  return records.map(convertPrismaRecord);
}

export async function getAttendanceById(id: string): Promise<AttendanceRecord | null> {
  const record = await prisma.attendanceRecord.findUnique({
    where: { id: parseInt(id) },
    include: {
      staff: {
        select: {
          id: true,
          name: true,
          employeeId: true,
        },
      },
    },
  });

  if (!record) return null;

  return convertPrismaRecord(record);
}

export async function getAttendanceByStaffId(
  staffId: string,
  startDate?: Date,
  endDate?: Date
): Promise<AttendanceRecord[]> {
  const where: any = {
    staffId: parseInt(staffId),
  };

  if (startDate) {
    where.date = { ...where.date, gte: startDate };
  }

  if (endDate) {
    where.date = { ...where.date, lte: endDate };
  }

  const records = await prisma.attendanceRecord.findMany({
    where,
    include: {
      staff: {
        select: {
          id: true,
          name: true,
          employeeId: true,
        },
      },
    },
    orderBy: { date: 'desc' },
  });

  return records.map(convertPrismaRecord);
}

export async function searchAttendanceRecords(filters: AttendanceFilters): Promise<AttendanceRecord[]> {
  const where: any = {};

  if (filters.staffIds && filters.staffIds.length > 0) {
    where.staffId = { in: filters.staffIds };
  }

  if (filters.startDate || filters.endDate) {
    where.date = {};
    if (filters.startDate) {
      where.date.gte = filters.startDate;
    }
    if (filters.endDate) {
      where.date.lte = filters.endDate;
    }
  }

  if (filters.status && filters.status.length > 0) {
    where.status = { in: filters.status.map(s => s.toUpperCase()) };
  }

  const records = await prisma.attendanceRecord.findMany({
    where,
    include: {
      staff: {
        select: {
          id: true,
          name: true,
          employeeId: true,
        },
      },
    },
    orderBy: { date: 'desc' },
  });

  return records.map(convertPrismaRecord);
}

export async function createAttendanceRecord(
  recordData: Omit<AttendanceRecord, 'id' | 'createdAt' | 'updatedAt'>
): Promise<AttendanceRecord> {
  // Check if record already exists for this staff and date
  const existingRecord = await prisma.attendanceRecord.findUnique({
    where: {
      staffId_date: {
        staffId: parseInt(recordData.staffId),
        date: recordData.date,
      },
    },
  });

  if (existingRecord) {
    throw new Error('Attendance record already exists for this staff member on this date');
  }

  const record = await prisma.attendanceRecord.create({
    data: {
      staffId: parseInt(recordData.staffId),
      date: recordData.date,
      checkInTime: recordData.checkInTime,
      checkOutTime: recordData.checkOutTime,
      status: recordData.status.toUpperCase() as any,
      notes: recordData.notes,
      hoursWorked: recordData.hoursWorked,
      createdBy: recordData.createdBy,
    },
    include: {
      staff: {
        select: {
          id: true,
          name: true,
          employeeId: true,
        },
      },
    },
  });

  return convertPrismaRecord(record);
}

export async function updateAttendanceRecord(
  id: string,
  recordData: Partial<Omit<AttendanceRecord, 'id' | 'createdAt'>>
): Promise<AttendanceRecord | null> {
  try {
    const updateData: any = {};

    if (recordData.checkInTime !== undefined) updateData.checkInTime = recordData.checkInTime;
    if (recordData.checkOutTime !== undefined) updateData.checkOutTime = recordData.checkOutTime;
    if (recordData.status) updateData.status = recordData.status.toUpperCase();
    if (recordData.notes !== undefined) updateData.notes = recordData.notes;
    if (recordData.hoursWorked !== undefined) updateData.hoursWorked = recordData.hoursWorked;

    const record = await prisma.attendanceRecord.update({
      where: { id: parseInt(id) },
      data: updateData,
      include: {
        staff: {
          select: {
            id: true,
            name: true,
            employeeId: true,
          },
        },
      },
    });

    return convertPrismaRecord(record);
  } catch (error) {
    return null;
  }
}

export async function deleteAttendanceRecord(id: string): Promise<boolean> {
  try {
    await prisma.attendanceRecord.delete({
      where: { id: parseInt(id) },
    });
    return true;
  } catch (error) {
    return false;
  }
}

export async function getAttendanceStatistics(staffId?: string, startDate?: Date, endDate?: Date) {
  const where: any = {};

  if (staffId) {
    where.staffId = parseInt(staffId);
  }

  if (startDate || endDate) {
    where.date = {};
    if (startDate) where.date.gte = startDate;
    if (endDate) where.date.lte = endDate;
  }

  const records = await prisma.attendanceRecord.findMany({
    where,
    select: {
      status: true,
      hoursWorked: true,
    },
  });

  const totalRecords = records.length;
  const statusCounts = records.reduce((acc, record) => {
    const status = record.status.toLowerCase();
    acc[status] = (acc[status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const totalHours = records
    .filter(r => r.hoursWorked)
    .reduce((sum, r) => sum + (r.hoursWorked ? parseFloat(r.hoursWorked.toString()) : 0), 0);

  const averageHours = totalRecords > 0 ? totalHours / totalRecords : 0;

  return {
    totalRecords,
    statusCounts,
    totalHours,
    averageHours,
    presentDays: statusCounts.present || 0,
    absentDays: statusCounts.absent || 0,
    lateDays: statusCounts.late || 0,
    sickDays: statusCounts.sick || 0,
    vacationDays: statusCounts.vacation || 0,
    halfDays: statusCounts['half-day'] || 0,
  };
}