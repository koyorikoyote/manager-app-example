/**
 * Interaction Record type definitions for the manager app
 */

import type {
  InteractionType,
  InteractionStatus,
  InteractionMeans,
} from "./index";

/**
 * Interaction record with related entity information from service layer
 * Note: Date fields can be Date objects (server-side) or strings (API responses)
 */
export interface InteractionRecordWithRelations {
  id: number;
  type: InteractionType;
  date: Date | string;
  description: string;
  status?: InteractionStatus;
  name?: string;
  title?: string;
  personInvolvedStaffId?: number;
  userInChargeId?: number;
  personConcerned?: string;
  location?: string;
  means?: InteractionMeans;
  responseDetails?: string;
  createdBy: number;
  createdAt: Date | string;
  updatedAt: Date | string;
  personInvolved?: {
    id: number;
    name: string;
    employeeId: string;
  };
  userInCharge?: {
    id: number;
    name: string;
  };
  creator: {
    id: number;
    name: string;
  };
  // Calculated field
  daysPassed?: number;
}

/**
 * Interaction record table data interface for DataTable component
 */
export interface InteractionRecordTableData extends Record<string, unknown> {
  id: number;
  type: string;
  date: string;
  description: string;
  status: string;
  personInvolvedName: string;
  userInChargeName: string;
  location: string;
  means: string;
}
