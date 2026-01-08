/**
 * Complaint Detail type definitions for the manager app
 */

/**
 * Complaint detail with related entity information from service layer
 * Note: Date fields can be Date objects (server-side) or strings (API responses)
 */
export interface ComplaintDetailWithRelations {
  id: number;
  dateOfOccurrence: Date | string;
  complainerName: string;
  complainerContact: string;
  personInvolved: string;
  progressStatus: "OPEN" | "CLOSED" | "ON_HOLD";
  urgencyLevel: "High" | "Medium" | "Low";
  complaintContent: string;
  responderId?: number;
  companyId?: number;
  recorderId: number;
  resolutionDate: Date | string | null;
  daysPassed?: number;
  responder?: {
    id: number;
    name: string;
    username: string;
  } | null;
  company?: {
    id: number;
    name: string;
  } | null;
  recorder: {
    id: number;
    name: string;
    employeeId: string;
  };
  createdAt: Date | string;
  updatedAt: Date | string;
  // Flattened relationship data for easier access
  responderName?: string | null;
  companyName?: string | null;
  recorderName?: string;
}

/**
 * Complaint table data interface for DataTable component
 */
export interface ComplaintTableData extends Record<string, unknown> {
  id: number;
  dateOfOccurrence: string;
  complainerName: string;
  companyName: string;
  progressStatus: string;
  urgencyLevel: string;
  complainerContact: string;
  daysPassed: number;
  responderName: string;
  complaintContent: string;
  resolutionDate: string;
}
