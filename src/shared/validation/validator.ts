/**
 * Form validation utility functions
 * Provides field-specific validation and error handling
 */

import {
  FieldValidationConfig,
  ValidationError,
  ValidationResult,
  ERROR_MESSAGES,
  COMPLAINT_VALIDATION_SCHEMA,
  DAILY_RECORD_VALIDATION_SCHEMA,
  INQUIRY_VALIDATION_SCHEMA,
  INTERACTION_VALIDATION_SCHEMA,
  STAFF_VALIDATION_SCHEMA,
} from "./schemas";

export class FormValidator {
  private schema: FieldValidationConfig[];

  constructor(schema: FieldValidationConfig[]) {
    this.schema = schema;
  }

  /**
   * Validate a single field value
   */
  validateField(fieldKey: string, value: unknown): ValidationError | null {
    const fieldConfig = this.schema.find((config) => config.key === fieldKey);
    if (!fieldConfig) {
      return null;
    }

    const { label, rules } = fieldConfig;

    // Check required validation
    if (rules.required && this.isEmpty(value)) {
      return {
        field: fieldKey,
        message: ERROR_MESSAGES.required(label),
        type: "required",
      };
    }

    // Skip other validations if field is empty and not required
    if (this.isEmpty(value) && !rules.required) {
      return null;
    }

    const stringValue = String(value || "");

    // Check minimum length
    if (rules.minLength && stringValue.length < rules.minLength) {
      return {
        field: fieldKey,
        message: ERROR_MESSAGES.minLength(label, rules.minLength),
        type: "length",
      };
    }

    // Check maximum length
    if (rules.maxLength && stringValue.length > rules.maxLength) {
      return {
        field: fieldKey,
        message: ERROR_MESSAGES.maxLength(label, rules.maxLength),
        type: "length",
      };
    }

    // Check pattern validation
    if (rules.pattern && stringValue && !rules.pattern.test(stringValue)) {
      return {
        field: fieldKey,
        message: ERROR_MESSAGES.pattern(label),
        type: "format",
      };
    }

    // Check numeric range validation
    if (
      fieldConfig.type === "number" &&
      value !== null &&
      value !== undefined
    ) {
      const numValue = Number(value);
      if (!isNaN(numValue)) {
        if (rules.min !== undefined && numValue < rules.min) {
          return {
            field: fieldKey,
            message: ERROR_MESSAGES.min(label, rules.min),
            type: "range",
          };
        }
        if (rules.max !== undefined && numValue > rules.max) {
          return {
            field: fieldKey,
            message: ERROR_MESSAGES.max(label, rules.max),
            type: "range",
          };
        }
      }
    }

    // Check email format for email fields
    if (fieldConfig.type === "email" && stringValue) {
      const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailPattern.test(stringValue)) {
        return {
          field: fieldKey,
          message: ERROR_MESSAGES.email(label),
          type: "format",
        };
      }
    }

    // Check phone format for tel fields
    if (fieldConfig.type === "tel" && stringValue) {
      const phonePattern = /^[\d\s\-+()]+$/;
      if (!phonePattern.test(stringValue)) {
        return {
          field: fieldKey,
          message: ERROR_MESSAGES.tel(label),
          type: "format",
        };
      }
    }

    // Check date format for date fields
    if (fieldConfig.type === "date" && stringValue) {
      const date = new Date(stringValue);
      if (isNaN(date.getTime())) {
        return {
          field: fieldKey,
          message: ERROR_MESSAGES.date(label),
          type: "format",
        };
      }
    }

    // Check custom validation
    if (rules.custom) {
      const customError = rules.custom(value);
      if (customError) {
        return {
          field: fieldKey,
          message: ERROR_MESSAGES.custom(customError),
          type: "custom",
        };
      }
    }

    return null;
  }

  /**
   * Validate all fields in a form data object
   */
  validateForm(formData: Record<string, unknown>): ValidationResult {
    const errors: ValidationError[] = [];

    for (const fieldConfig of this.schema) {
      const value = formData[fieldConfig.key];
      const error = this.validateField(fieldConfig.key, value);
      if (error) {
        errors.push(error);
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Get validation configuration for a specific field
   */
  getFieldConfig(fieldKey: string): FieldValidationConfig | undefined {
    return this.schema.find((config) => config.key === fieldKey);
  }

  /**
   * Check if a value is considered empty
   */
  private isEmpty(value: unknown): boolean {
    if (value === null || value === undefined) {
      return true;
    }
    if (typeof value === "string") {
      return value.trim() === "";
    }
    if (Array.isArray(value)) {
      return value.length === 0;
    }
    return false;
  }
}

// Pre-configured validators for each dialog type
export const complaintValidator = new FormValidator(
  COMPLAINT_VALIDATION_SCHEMA
);
export const dailyRecordValidator = new FormValidator(
  DAILY_RECORD_VALIDATION_SCHEMA
);
export const inquiryValidator = new FormValidator(INQUIRY_VALIDATION_SCHEMA);
export const interactionValidator = new FormValidator(
  INTERACTION_VALIDATION_SCHEMA
);
export const staffValidator = new FormValidator(STAFF_VALIDATION_SCHEMA);

/**
 * Utility function to convert validation errors to FormError format
 */
export function convertToFormErrors(
  validationErrors: ValidationError[]
): Array<{ field?: string; message: string }> {
  return validationErrors.map((error) => ({
    field: error.field,
    message: error.message,
  }));
}

/**
 * Utility function to get field-specific error from validation errors
 */
export function getFieldError(
  errors: ValidationError[],
  fieldKey: string
): string | undefined {
  const error = errors.find((err) => err.field === fieldKey);
  return error?.message;
}

/**
 * Utility function to check if form has any validation errors
 */
export function hasValidationErrors(errors: ValidationError[]): boolean {
  return errors.length > 0;
}

/**
 * Utility function to filter out field-specific errors and return general errors
 */
export function getGeneralErrors(errors: ValidationError[]): ValidationError[] {
  return errors.filter((error) => !error.field);
}

/**
 * Real-time validation hook for form fields
 */
export function validateFieldRealTime(
  validator: FormValidator,
  fieldKey: string,
  value: unknown,
  setErrors: (errors: ValidationError[]) => void,
  currentErrors: ValidationError[]
): void {
  const fieldError = validator.validateField(fieldKey, value);

  // Remove existing errors for this field
  const otherErrors = currentErrors.filter((error) => error.field !== fieldKey);

  // Add new error if validation failed
  const newErrors = fieldError ? [...otherErrors, fieldError] : otherErrors;

  setErrors(newErrors);
}
