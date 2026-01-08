import { AttendanceRecord } from "../../shared/types";

import { toJSTISOString } from "../../shared/utils/jstDateUtils";

const API_BASE = "/api/attendance";

export interface AttendanceFilters {
  staffIds?: string[];
  startDate?: Date;
  endDate?: Date;
  status?: AttendanceRecord["status"][];
}

export interface AttendanceStatistics {
  totalRecords: number;
  statusCounts: Record<string, number>;
  totalHours: number;
  averageHours: number;
  presentDays: number;
  absentDays: number;
  lateDays: number;
  sickDays: number;
  vacationDays: number;
  halfDays: number;
}

interface AttendanceResponse {
  success: boolean;
  data: AttendanceRecord[];
}

interface SingleAttendanceResponse {
  success: boolean;
  data: AttendanceRecord;
}

interface AttendanceRecordData {
  id: string;
  staffId: string;
  date: string;
  checkInTime?: string;
  checkOutTime?: string;
  status: AttendanceRecord["status"];
  notes?: string;
  hoursWorked?: number;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
}

class AttendanceService {
  private async request<T>(url: string, options?: RequestInit): Promise<T> {
    const token = localStorage.getItem("authToken");
    const response = await fetch(url, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        Authorization: token ? `Bearer ${token}` : "",
        ...options?.headers,
      },
    });

    if (!response.ok) {
      const error = await response
        .json()
        .catch(() => ({ error: "Network error" }));
      throw new Error(error.error || `HTTP ${response.status}`);
    }

    return response.json();
  }

  private convertRecordData(
    record: AttendanceRecordData | AttendanceRecord
  ): AttendanceRecord {
    // If it's already an AttendanceRecord with Date objects, return as is
    if (record.date instanceof Date) {
      return record as AttendanceRecord;
    }

    // Otherwise convert from raw data format
    const rawRecord = record as AttendanceRecordData;
    return {
      ...rawRecord,
      date: new Date(rawRecord.date),
      checkInTime: rawRecord.checkInTime
        ? new Date(rawRecord.checkInTime)
        : undefined,
      checkOutTime: rawRecord.checkOutTime
        ? new Date(rawRecord.checkOutTime)
        : undefined,
      createdAt: new Date(rawRecord.createdAt),
      updatedAt: new Date(rawRecord.updatedAt),
    };
  }

  async getAllAttendanceRecords(
    filters?: AttendanceFilters
  ): Promise<AttendanceRecord[]> {
    const params = new URLSearchParams();

    if (filters?.staffIds?.length) {
      filters.staffIds.forEach((id) => params.append("staffIds", id));
    }

    if (filters?.startDate) {
      params.append("startDate", toJSTISOString(filters.startDate));
    }

    if (filters?.endDate) {
      params.append("endDate", toJSTISOString(filters.endDate));
    }

    if (filters?.status?.length) {
      filters.status.forEach((status) => params.append("status", status));
    }

    const url = params.toString() ? `${API_BASE}?${params}` : API_BASE;
    const result = await this.request<AttendanceRecord[] | AttendanceResponse>(
      url
    );

    // Handle both direct array response and wrapped response
    const data = Array.isArray(result) ? result : result.data || [];

    return data.map((record) => this.convertRecordData(record));
  }

  async getAttendanceByStaffId(
    staffId: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<AttendanceRecord[]> {
    const params = new URLSearchParams();

    if (startDate) {
      params.append("startDate", toJSTISOString(startDate));
    }

    if (endDate) {
      params.append("endDate", toJSTISOString(endDate));
    }

    const url = params.toString()
      ? `${API_BASE}/staff/${staffId}?${params}`
      : `${API_BASE}/staff/${staffId}`;

    const result = await this.request<AttendanceRecord[] | AttendanceResponse>(
      url
    );

    // Handle both direct array response and wrapped response
    const data = Array.isArray(result) ? result : result.data || [];

    return data.map((record) => this.convertRecordData(record));
  }

  async getAttendanceById(id: string): Promise<AttendanceRecord> {
    const result = await this.request<
      AttendanceRecord | SingleAttendanceResponse
    >(`${API_BASE}/${id}`);

    // Handle both direct response and wrapped response
    const data = "data" in result ? result.data : result;

    return this.convertRecordData(data);
  }

  async getAttendanceStatistics(
    staffId?: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<AttendanceStatistics> {
    const params = new URLSearchParams();

    if (staffId) {
      params.append("staffId", staffId);
    }

    if (startDate) {
      params.append("startDate", toJSTISOString(startDate));
    }

    if (endDate) {
      params.append("endDate", toJSTISOString(endDate));
    }

    const url = params.toString()
      ? `${API_BASE}/statistics?${params}`
      : `${API_BASE}/statistics`;

    const result = await this.request<{
      success: boolean;
      data: AttendanceStatistics;
    }>(`${url}`);

    if (!result.success) {
      throw new Error("Failed to fetch attendance statistics");
    }

    return result.data;
  }

  async createAttendanceRecord(
    recordData: Omit<
      AttendanceRecord,
      "id" | "createdAt" | "updatedAt" | "createdBy"
    >
  ): Promise<AttendanceRecord> {
    const result = await this.request<{
      success: boolean;
      data: AttendanceRecordData;
      message?: string;
    }>(`${API_BASE}`, {
      method: "POST",
      body: JSON.stringify({
        ...recordData,
        date: toJSTISOString(recordData.date),
        checkInTime: recordData.checkInTime
          ? toJSTISOString(recordData.checkInTime)
          : undefined,
        checkOutTime: recordData.checkOutTime
          ? toJSTISOString(recordData.checkOutTime)
          : undefined,
      }),
    });

    if (!result.success) {
      throw new Error(result.message || "Failed to create attendance record");
    }

    return this.convertRecordData(result.data);
  }

  async updateAttendanceRecord(
    id: string,
    recordData: Partial<
      Omit<AttendanceRecord, "id" | "createdAt" | "createdBy">
    >
  ): Promise<AttendanceRecord> {
    const updatePayload: Record<string, unknown> = { ...recordData };

    if (recordData.date) {
      updatePayload.date = toJSTISOString(recordData.date);
    }

    if (recordData.checkInTime) {
      updatePayload.checkInTime = toJSTISOString(recordData.checkInTime);
    }

    if (recordData.checkOutTime) {
      updatePayload.checkOutTime = toJSTISOString(recordData.checkOutTime);
    }

    const result = await this.request<{
      success: boolean;
      data: AttendanceRecordData;
      message?: string;
    }>(`${API_BASE}/${id}`, {
      method: "PUT",
      body: JSON.stringify(updatePayload),
    });

    if (!result.success) {
      throw new Error(result.message || "Failed to update attendance record");
    }

    return this.convertRecordData(result.data);
  }

  async deleteAttendanceRecord(id: string): Promise<void> {
    const result = await this.request<{ success: boolean; message?: string }>(
      `${API_BASE}/${id}`,
      {
        method: "DELETE",
      }
    );

    if (!result.success) {
      throw new Error(result.message || "Failed to delete attendance record");
    }
  }
}

export const attendanceService = new AttendanceService();
