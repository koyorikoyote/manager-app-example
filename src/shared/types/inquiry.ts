/**
 * Inquiry type definitions for the manager app
 */

/**
 * Inquiry with related entity information from service layer
 * Note: Date fields can be Date objects (server-side) or strings (API responses)
 */
export interface InquiryWithRelations {
  id: number;
  dateOfInquiry: Date | string;
  inquirerName: string;
  inquirerContact: string;
  companyId?: number;
  typeOfInquiry: string;
  inquiryContent: string;
  progressStatus: "OPEN" | "CLOSED" | "ON_HOLD";
  responderId?: number;
  recorderId: number;
  resolutionDate: Date | string | null;
  company?: {
    id: number;
    name: string;
  } | null;
  responder?: {
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
}

/**
 * Inquiry table data interface for DataTable component
 */
export interface InquiryTableData extends Record<string, unknown> {
  id: number;
  dateOfInquiry: string;
  inquirerName: string;
  inquirerContact: string;
  companyName: string;
  typeOfInquiry: string;
  inquiryContent: string;
  progressStatus: string;
  responderName: string;
  recorderName: string;
  resolutionDate: string;
}
