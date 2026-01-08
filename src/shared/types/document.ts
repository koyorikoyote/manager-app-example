/**
 * Document type definitions for the manager app
 */

import type { DocumentType, DocumentStatus } from "./index";

/**
 * Document with related entity information from service layer
 * Note: Date fields can be Date objects (server-side) or strings (API responses)
 */
export interface DocumentWithRelations {
  id: number;
  title: string;
  type: DocumentType;
  relatedEntityId: string;
  filePath?: string | null;
  status: DocumentStatus;
  startDate: Date | string;
  endDate?: Date | string | null;
  staffId?: number | null;
  createdAt: Date | string;
  updatedAt: Date | string;
  staff?: {
    id: number;
    name: string;
    employeeId: string;
  };
}

/**
 * Document table data interface for DataTable component
 */
export interface DocumentTableData extends Record<string, unknown> {
  id: number;
  title: string;
  type: string;
  status: string;
  startDate: string;
  endDate: string;
  staffName: string;
  filePath: string;
}
