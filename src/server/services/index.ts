// Service exports for easy importing
export { StaffService } from "./StaffService";
export { PropertyService } from "./PropertyService";
export { PropertyStaffAssignmentService } from "./PropertyStaffAssignmentService";
export { PropertyDocumentService } from "./PropertyDocumentService";
export { SystemConfigurationService } from "./SystemConfigurationService";
export { UserService } from "./UserService";
export { ComplaintService } from "./ComplaintService";
export { DailyRecordService } from "./DailyRecordService";
export { InquiryService } from "./InquiryService";
export { CompanyService } from "./CompanyService";
export { InteractionService } from "./InteractionService";
export { FilterAnalyzer } from "./FilterAnalyzer";
export { FilterCacheService } from "./FilterCacheService";
export { ConversationService } from "./ConversationService";

// Default service instances
export { default as staffService } from "./StaffService";
export { default as propertyService } from "./PropertyService";
export { default as propertyStaffAssignmentService } from "./PropertyStaffAssignmentService";
export { default as propertyDocumentService } from "./PropertyDocumentService";
export { default as systemConfigService } from "./SystemConfigurationService";
export { default as userService } from "./UserService";
export { default as complaintService } from "./ComplaintService";
export { default as dailyRecordService } from "./DailyRecordService";
export { default as inquiryService } from "./InquiryService";
export { default as companyService } from "./CompanyService";
export { default as interactionService } from "./InteractionService";
export { default as filterAnalyzer } from "./FilterAnalyzer";
export { default as filterCacheService } from "./FilterCacheService";
export { default as conversationService } from "./ConversationService";

// Type exports
export type {
  StaffFilters,
  StaffCreateData,
  StaffUpdateData,
} from "./StaffService";

export type {
  PropertyFilters,
  PropertyCreateData,
  PropertyUpdateData,
  PropertyWithRelatedData,
} from "./PropertyService";

export type {
  TenantRecord,
  AccordionDisplayData,
} from "./PropertyStaffAssignmentService";

export type {
  ContractRecord,
  ContractAccordionData,
} from "./PropertyDocumentService";

export type {
  SystemConfigFilters,
  SystemConfigCreateData,
  SystemConfigUpdateData,
} from "./SystemConfigurationService";

export type {
  UserFilters,
  UserCreateData,
  UserUpdateData,
  LoginCredentials,
  AuthResult,
  SessionData,
} from "./UserService";

export type {
  ComplaintFilters,
  ComplaintDetailWithRelations,
  ComplaintCreateData,
  ComplaintUpdateData,
} from "./ComplaintService";

export type {
  DailyRecordFilters,
  DailyRecordWithRelations,
  DailyRecordCreateData,
  DailyRecordUpdateData,
} from "./DailyRecordService";

export type {
  InquiryFilters,
  InquiryWithRelations,
  InquiryCreateData,
  InquiryUpdateData,
} from "./InquiryService";

export type {
  CompanyFilters,
  CompanyCreateData,
  CompanyUpdateData,
} from "./CompanyService";

export type {
  InteractionFilters,
  InteractionCreateData,
  InteractionUpdateData,
  InteractionWithDaysPassed,
} from "./InteractionService";
