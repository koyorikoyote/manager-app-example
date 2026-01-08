import { apiClient } from "./apiClient";
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
    employeeId: string;
    position: string;
    department: string;
    email?: string | null;
    phone?: string | null;
  }>;
}

export interface TenantResponse {
  success: boolean;
  data: TenantRecord[];
  message?: string;
}

export const propertyStaffAssignmentService = {
  // Get tenant records by property ID
  getTenantsByPropertyId: async (
    propertyId: number,
    includeInactive = false,
    signal?: AbortSignal
  ): Promise<TenantRecord[]> => {
    const params = new URLSearchParams();
    if (includeInactive) {
      params.append("includeInactive", "true");
    }

    const result = await apiClient.get<any>(
      `/properties/${propertyId}/staff?${params}`,
      { signal }
    );
    const assignments = result.data?.assignments || [];

    // Transform assignments into TenantRecord[] shape expected by the UI
    const transformedData: TenantRecord[] = assignments.map(
      (assignment: any) => {
        const staffArr = Array.isArray(assignment.staff)
          ? assignment.staff
          : [];

        return {
          id: assignment.id,
          room: assignment.room || "",
          staffNames: staffArr.map((s: any) => s?.name || ""),
          staffIds: staffArr.map((s: any) => s?.id),
          rentPriceHigh: assignment.rentPriceHigh ?? null,
          rentPriceLow: assignment.rentPriceLow ?? null,
          startDate: assignment.startDate
            ? new Date(assignment.startDate)
            : new Date(),
          endDate: assignment.endDate ? new Date(assignment.endDate) : null,
          isActive: !!assignment.isActive,
          staff: staffArr.map((s: any) => ({
            id: s.id,
            name: s.name,
            employeeId: s.employeeId,
            position: s.position,
            department: s.department,
            email: s.email ?? null,
            phone: s.phone ?? null,
          })),
        };
      }
    );

    return transformedData;
  },

  // Get active tenant count for a property
  getActiveTenantCount: async (propertyId: number): Promise<number> => {
    const result = await apiClient.get<any>(`/properties/${propertyId}/staff`);
    const assignments = result.data?.assignments || [];
    const activeCount = assignments.filter((a: any) => !!a.isActive).length;
    return activeCount;
  },

  // Get tenant assignment history for a property
  getTenantHistory: async (propertyId: number): Promise<TenantRecord[]> => {
    return propertyStaffAssignmentService.getTenantsByPropertyId(
      propertyId,
      true
    );
  },

  // Create new tenant assignment
  createTenantAssignment: async (data: {
    propertyId: number;
    staffId: number;
    room: string;
    startDate: Date;
    endDate?: Date;
    rentPriceHigh?: number;
    rentPriceLow?: number;
  }) => {
    const result = await apiClient.post(
      `/properties/${data.propertyId}/tenants`,
      {
        staffId: data.staffId,
        room: data.room,
        startDate: toJSTISOString(data.startDate),
        endDate: data.endDate ? toJSTISOString(data.endDate) : undefined,
        rentPriceHigh: data.rentPriceHigh,
        rentPriceLow: data.rentPriceLow,
      }
    );

    return result.data;
  },

  // Update tenant assignment
  updateTenantAssignment: async (
    id: number,
    data: {
      room?: string;
      startDate?: Date;
      endDate?: Date;
      rentPriceHigh?: number;
      rentPriceLow?: number;
      isActive?: boolean;
    }
  ) => {
    const updateData: Record<string, unknown> = {};

    if (data.room !== undefined) updateData.room = data.room;
    if (data.startDate !== undefined)
      updateData.startDate = toJSTISOString(data.startDate);
    if (data.endDate !== undefined)
      updateData.endDate = data.endDate
        ? toJSTISOString(data.endDate)
        : undefined;
    if (data.rentPriceHigh !== undefined)
      updateData.rentPriceHigh = data.rentPriceHigh;
    if (data.rentPriceLow !== undefined)
      updateData.rentPriceLow = data.rentPriceLow;
    if (data.isActive !== undefined) updateData.isActive = data.isActive;

    const result = await apiClient.put(`/tenants/${id}`, updateData);
    return result.data;
  },

  // End tenant assignment
  endTenantAssignment: async (id: number, endDate?: Date) => {
    const result = await apiClient.patch(`/tenants/${id}/end`, {
      endDate: endDate ? toJSTISOString(endDate) : toJSTISOString(new Date()),
    });

    return result.data;
  },
};
