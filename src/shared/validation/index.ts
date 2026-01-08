/**
 * Validation utilities export
 */

export * from "./schemas";
export * from "./validator";

// Re-export commonly used types and functions
export type {
  ValidationRule,
  FieldValidationConfig,
  ValidationError,
  ValidationResult,
} from "./schemas";

export {
  FormValidator,
  complaintValidator,
  dailyRecordValidator,
  inquiryValidator,
  interactionValidator,
  staffValidator,
  convertToFormErrors,
  getFieldError,
  hasValidationErrors,
  getGeneralErrors,
  validateFieldRealTime,
} from "./validator";
