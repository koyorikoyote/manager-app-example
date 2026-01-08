// Core type definitions for the manager app

export interface UserRole {
  id: number;
  name: string;
  level: number;
  description?: string;
}

export interface User {
  id: number;
  username: string;
  password?: string; // Only used server-side, never sent to client
  role: UserRole;
  name: string;
  email: string;
  isActive: boolean;
  languagePreference: "EN" | "JA";
  themePreference?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Staff {
  id: number;
  userId?: number;
  employeeId?: string | null;
  name: string;
  position?: string | null;
  department?: string | null;
  email?: string;
  phone?: string;
  address?: string;
  hireDate?: Date;
  salary?: number;
  status: "ACTIVE" | "INACTIVE" | "TERMINATED" | "ON_LEAVE";
  createdAt: Date;
  updatedAt: Date;
  user?: User;
  // New properties for datatable column revision
  residenceStatus?: string;
  age?: number;
  nationality?: string;
  userInChargeId?: number;
  companiesId?: number;
  userInCharge?: {
    id: number;
    name: string;
    username: string;
  };
  company?: {
    id: number;
    name: string;
  };

  // New header fields
  photo?: string | null;
  furiganaName?: string | null;
  gender?: "M" | "F" | null;

  // New basic information fields
  dateOfBirth?: Date | null;
  postalCode?: string | null;
  mobile?: string | null;
  fax?: string | null;
  periodOfStayDateStart?: Date | null;
  periodOfStayDateEnd?: Date | null;
  qualificationsAndLicenses?: string | null;
  japaneseProficiency?: string | null;
  japaneseProficiencyRemarks?: string | null;

  // Ordered array fields for education
  educationName?: string[] | null;
  educationType?: EducationType[] | null;

  // Ordered array fields for work history
  workHistoryName?: string[] | null;
  workHistoryDateStart?: Date[] | null;
  workHistoryDateEnd?: Date[] | null;
  workHistoryCountryLocation?: string[] | null;
  workHistoryCityLocation?: string[] | null;
  workHistoryPosition?: string[] | null;
  workHistoryEmploymentType?: EmploymentType[] | null;
  workHistoryDescription?: string[] | null;

  // Additional personal fields
  reasonForApplying?: string | null;
  motivationToComeJapan?: string | null;
  familySpouse?: boolean | null;
  familyChildren?: number | null;
  hobbyAndInterests?: string | null;

  // Emergency contacts
  emergencyContactPrimaryName?: string | null;
  emergencyContactPrimaryRelationship?: string | null;
  emergencyContactPrimaryNumber?: string | null;
  emergencyContactPrimaryEmail?: string | null;
  emergencyContactSecondaryName?: string | null;
  emergencyContactSecondaryRelationship?: string | null;
  emergencyContactSecondaryNumber?: string | null;
  emergencyContactSecondaryEmail?: string | null;

  remarks?: string | null;

  // Related records
  dailyRecords?: DailyRecord[];
  interactionRecords?: InteractionRecord[];
  documents?: Document[];

  // Legacy properties for backward compatibility
  contacts?: {
    phone?: string;
    mobile?: string;
    email?: string;
    fax?: string;
  };
  resume?: string;
}

export interface Property {
  id: number;
  propertyCode?: string | null;
  name: string;
  address: string;
  propertyType: "RESIDENTIAL" | "COMMERCIAL" | "INDUSTRIAL" | "MIXED_USE";
  managerId?: number;
  status: "ACTIVE" | "INACTIVE" | "UNDER_CONSTRUCTION" | "SOLD";
  description?: string;
  contractDate?: Date;
  createdAt: Date;
  updatedAt: Date;
  manager?: User;
  // New property for occupant count
  occupantCount?: number;
  staffAssignments?: Array<{
    id: number;
    role?: string | null;
    isActive: boolean;
    staff: {
      id: number;
      name: string;
      employeeId: string;
      position: string;
    };
  }>;
  // New header fields
  photo?: string | null;
  furiganaName?: string | null;
  establishmentDate?: Date | null;
  // New property information fields
  postalCode?: string | null;
  country?: string | null;
  region?: string | null;
  prefecture?: string | null;
  city?: string | null;
  owner?: string | null;
  ownerPhone?: string | null;
  ownerEmail?: string | null;
  ownerFax?: string | null;
  // Legacy properties for backward compatibility
  type?: string;
  documentIds?: string[];
}

export interface InteractionRecord {
  id: number;
  type: InteractionType;
  date: Date;
  description: string;
  status?: InteractionStatus;
  createdBy: number;
  createdAt: Date;
  updatedAt: Date;
  // New properties for datatable column revision
  name?: string;
  title?: string;
  personInvolvedStaffId?: number;
  userInChargeId?: number;
  personConcerned?: string;
  location?: string;
  means?: InteractionMeans;
  responseDetails?: string;
  personInvolved?: {
    id: number;
    name: string;
    employeeId: string;
  };
  userInCharge?: {
    id: number;
    name: string;
  };
  creator?: {
    id: number;
    name: string;
  };
  // Calculated field
  daysPassed?: number;
}

export interface Document {
  id: number;
  title: string;
  type: DocumentType;
  relatedEntityId: string;
  filePath?: string | null;
  status: DocumentStatus;
  startDate: Date;
  endDate?: Date | null;
  staffId?: number | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface DailyRecord {
  id: number;
  dateOfRecord: Date;
  staffId: number;
  conditionStatus: ConditionStatus;
  feedbackContent: string;
  contactNumber?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface AttendanceRecord {
  id: string;
  staffId: string;
  date: Date;
  checkInTime?: Date;
  checkOutTime?: Date;
  status: "present" | "absent" | "late" | "half-day" | "sick" | "vacation";
  notes?: string;
  hoursWorked?: number;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Company {
  id: number;
  name: string;
  address: string;
  phone?: string;
  email?: string;
  website?: string;
  industry?: string;
  description?: string;
  status: CompanyStatus;
  createdAt: Date;
  updatedAt: Date;
  // New properties for datatable column revision
  contactPerson?: string;
  hiringVacancies?: number;
  preferredNationality?: string;
  userInChargeId?: number;
  userInCharge?: {
    id: number;
    name: string;
    username: string;
  };

  // Company display ID (formatted)
  companyId?: string | null;

  // New header fields
  photo?: string | null;
  corporateNumber?: string | null;
  furiganaName?: string | null;
  establishmentDate?: Date | null;
  country?: string | null;
  region?: string | null;
  prefecture?: string | null;
  city?: string | null;
  postalCode?: string | null;

  // Job Information fields
  preferredStatusOfResidence?: string | null;
  preferredAge?: string | null;
  preferredExperience?: string | null;
  preferredQualifications?: string | null;
  preferredPersonality?: string | null;
  preferredEducation?: string | null;
  preferredJapaneseProficiency?: string | null;
  destinationWorkEnvironment?: string | null;
  destinationAverageAge?: string | null;
  destinationWorkPlace?: string | null;
  destinationTransfer?: string | null;
  jobSelectionProcess?: string | null;
  jobPastRecruitmentHistory?: string | null;
  jobSalary?: string | null;
  jobOvertimeRate?: string | null;
  jobSalaryIncreaseRate?: string | null;
  jobSalaryBonus?: string | null;
  jobAllowances?: string | null;
  jobEmployeeBenefits?: string | null;
  jobRetirementBenefits?: string | null;
  jobTermsAndConditions?: string | null;
  jobDisputePreventionMeasures?: string | null;
  jobProvisionalHiringConditions?: string | null;
  jobContractRenewalConditions?: string | null;
  jobRetirementConditions?: string | null;

  // Related records (optional, loaded when needed)
  interactionRecords?: CompanyInteractionRecord[];
  documents?: CompanyDocument[];
}

export interface SystemConfiguration {
  id: number;
  key: string;
  value: string;
  description?: string;
  category: string;
  dataType: "STRING" | "NUMBER" | "BOOLEAN" | "JSON";
  isActive: boolean;
  createdBy: number;
  createdAt: Date;
  updatedAt: Date;
  creator?: {
    id: number;
    name: string;
    username: string;
  };
}

export type Language = "en" | "ja";

// Enum types for database schema
export type UrgencyLevel = "High" | "Medium" | "Low";
export type ConditionStatus = "Excellent" | "Good" | "Fair" | "Poor";
export type ComplaintStatus = "OPEN" | "CLOSED" | "ON_HOLD";
export type InquiryStatus = "OPEN" | "CLOSED" | "ON_HOLD";
export type Gender = "M" | "F";
export type EducationType =
  | "UNIVERSITY_POSTGRADUATE"
  | "UNIVERSITY_UNDERGRADUATE"
  | "VOCATIONAL"
  | "HIGH_SCHOOL"
  | "LANGUAGE_SCHOOL";
export type EmploymentType =
  | "FULL_TIME"
  | "DISPATCH"
  | "PART_TIME"
  | "CONTRACT"
  | "OTHERS";
export type InteractionType =
  | "DISCUSSION"
  | "INTERVIEW"
  | "CONSULTATION"
  | "OTHER";
export type InteractionStatus = "OPEN" | "IN_PROGRESS" | "RESOLVED";
export type InteractionMeans = "FACE_TO_FACE" | "ONLINE" | "PHONE" | "EMAIL";
export type DocumentType = "STAFF" | "PROPERTY" | "COMPANY";
export type DocumentStatus = "ACTIVE" | "EXPIRED" | "TERMINATED";
export type CompanyStatus = "ACTIVE" | "INACTIVE" | "SUSPENDED";

// Complaint Detail types
export type {
  ComplaintDetailWithRelations,
  ComplaintTableData,
} from "./complaint";

// Daily Record types
export type {
  DailyRecordWithRelations,
  DailyRecordTableData,
} from "./dailyRecord";

// Inquiry types
export type { InquiryWithRelations, InquiryTableData } from "./inquiry";

// Interaction Record types
export type {
  InteractionRecordWithRelations,
  InteractionRecordTableData,
} from "./interactionRecord";

// Document types
export type { DocumentWithRelations, DocumentTableData } from "./document";

// Conversation types
export type {
  Reply,
  MessageDirection,
  CreateReplyRequest,
  CreateReplyResponse,
  GetRepliesResponse,
  UpdateReplyRequest,
  UpdateReplyResponse,
  DeleteReplyResponse,
  ConversationErrorResponse,
} from "./conversation";

// Form validation interfaces for new staff fields
export interface StaffFormValidation {
  // Header fields validation
  photo?: string;
  furiganaName?: string;
  gender?: string;

  // Basic information fields validation
  dateOfBirth?: string;
  postalCode?: string;
  mobile?: string;
  fax?: string;
  periodOfStayDateStart?: string;
  periodOfStayDateEnd?: string;
  qualificationsAndLicenses?: string;
  japaneseProficiency?: string;
  japaneseProficiencyRemarks?: string;

  // Ordered array fields validation
  educationName?: string;
  educationType?: string;
  workHistoryName?: string;
  workHistoryDateStart?: string;
  workHistoryDateEnd?: string;
  workHistoryCountryLocation?: string;
  workHistoryCityLocation?: string;
  workHistoryPosition?: string;
  workHistoryEmploymentType?: string;
  workHistoryDescription?: string;

  // Additional personal fields validation
  reasonForApplying?: string;
  motivationToComeJapan?: string;
  familySpouse?: string;
  familyChildren?: string;
  hobbyAndInterests?: string;

  // Emergency contacts validation
  emergencyContactPrimaryName?: string;
  emergencyContactPrimaryRelationship?: string;
  emergencyContactPrimaryNumber?: string;
  emergencyContactPrimaryEmail?: string;
  emergencyContactSecondaryName?: string;
  emergencyContactSecondaryRelationship?: string;
  emergencyContactSecondaryNumber?: string;
  emergencyContactSecondaryEmail?: string;

  remarks?: string;
}

// Company-specific interaction record interface
export interface CompanyInteractionRecord {
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
  companiesId: number;
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
    username: string;
  };
  creator?: {
    id: number;
    name: string;
    username: string;
  };
  company?: {
    id: number;
    name: string;
  };
}

// Company-specific document interface
export interface CompanyDocument {
  id: number;
  title: string;
  type: DocumentType;
  relatedEntityId: string;
  filePath?: string | null;
  status: DocumentStatus;
  startDate: Date | string;
  endDate?: Date | string | null;
  staffId?: number | null;
  companiesId: number;
  createdAt: Date | string;
  updatedAt: Date | string;
  staff?: {
    id: number;
    name: string;
    employeeId: string;
  };
  company?: {
    id: number;
    name: string;
  };
}

// Form validation interfaces for new company fields
export interface CompanyFormValidation {
  // Header fields validation
  photo?: string;
  corporateNumber?: string;
  furiganaName?: string;
  establishmentDate?: string;
  country?: string;
  region?: string;
  prefecture?: string;
  city?: string;
  postalCode?: string;

  // Job Information fields validation
  preferredStatusOfResidence?: string;
  preferredAge?: string;
  preferredExperience?: string;
  preferredQualifications?: string;
  preferredPersonality?: string;
  preferredEducation?: string;
  preferredJapaneseProficiency?: string;
  destinationWorkEnvironment?: string;
  destinationAverageAge?: string;
  destinationWorkPlace?: string;
  destinationTransfer?: string;
  jobSelectionProcess?: string;
  jobPastRecruitmentHistory?: string;
  jobSalary?: string;
  jobOvertimeRate?: string;
  jobSalaryIncreaseRate?: string;
  jobSalaryBonus?: string;
  jobAllowances?: string;
  jobEmployeeBenefits?: string;
  jobRetirementBenefits?: string;
  jobTermsAndConditions?: string;
  jobDisputePreventionMeasures?: string;
  jobProvisionalHiringConditions?: string;
  jobContractRenewalConditions?: string;
  jobRetirementConditions?: string;
}

// Photo upload related interfaces
export interface PhotoUploadError {
  FILE_TOO_LARGE: string;
  INVALID_FORMAT: string;
  UPLOAD_FAILED: string;
  NETWORK_ERROR: string;
}

export interface PhotoUploadProps {
  currentPhoto?: string | null;
  onPhotoUpload: (file: File) => Promise<void>;
  /**
   * Called when the user removes the currently displayed photo (clicks the X).
   * Implementations should remove the photo from the server/database and any storage.
   * Return a Promise that resolves when the removal has completed.
   */
  onPhotoRemove?: () => Promise<void>;
  isEditMode: boolean;
  loading?: boolean;
  error?: string | null;
  compact?: boolean;
}
