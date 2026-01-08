/**
 * Daily Record type definitions for the manager app
 */

/**
 * Daily record with related entity information from service layer
 * Note: Date fields can be Date objects (server-side) or strings (API responses)
 */
export interface DailyRecordWithRelations {
  id: number;
  dateOfRecord: Date | string;
  staffId: number;
  conditionStatus: "Excellent" | "Good" | "Fair" | "Poor";
  feedbackContent: string;
  contactNumber?: string;
  photo?: string;
  staff: {
    id: number;
    name: string;
    employeeId: string;
    phone?: string;
  };
  createdAt: Date | string;
  updatedAt: Date | string;
}

/**
 * Daily record table data interface for DataTable component
 */
export interface DailyRecordTableData extends Record<string, unknown> {
  id: number;
  dateOfRecord: string;
  staffName: string;
  conditionStatus: string;
  feedbackContent: string;
  contactNumber: string;
}
