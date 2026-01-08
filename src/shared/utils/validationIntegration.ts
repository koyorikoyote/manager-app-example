// Integration layer for enhanced validation with backward compatibility

import { validateDateOfBirth, validateManualDateInput } from "./dateValidation";
import { validatePhotoPath } from "./photoValidation";
import {
  EnhancedFormValidator,
  createDailyRecordValidator,
  createStaffValidator,
} from "./formValidation";

/**
 * Backward compatible validation wrapper for existing forms
 */
export class BackwardCompatibleValidator {
  private validator: EnhancedFormValidator;

  constructor(formType: "dailyRecord" | "staff") {
    this.validator =
      formType === "dailyRecord"
        ? createDailyRecordValidator()
        : createStaffValidator();
  }

  /**
   * Validate form data with backward compatibility
   */
  async validateForm(formData: Record<string, any>): Promise<{
    isValid: boolean;
    errors: Record<string, string>;
    warnings?: Record<string, string>;
  }> {
    // Handle legacy data formats
    const normalizedData = this.normalizeFormData(formData);

    // Run enhanced validation
    const result = await this.validator.validate(normalizedData);

    // Convert errors to legacy format if needed
    return {
      isValid: result.isValid,
      errors: this.convertErrorsToLegacyFormat(result.errors),
      warnings: result.warnings,
    };
  }

  /**
   * Normalize form data to handle legacy formats
   */
  private normalizeFormData(
    formData: Record<string, any>
  ): Record<string, any> {
    const normalized = { ...formData };

    // Handle date fields that might be in different formats
    if (normalized.dateOfBirth) {
      if (typeof normalized.dateOfBirth === "string") {
        // Handle both ISO format and manual format
        if (normalized.dateOfBirth.includes("/")) {
          // Manual format YYYY/MM/DD - keep as is for manual validation
        } else if (normalized.dateOfBirth.includes("-")) {
          // ISO format YYYY-MM-DD - convert to Date for validation
          normalized.dateOfBirth = new Date(normalized.dateOfBirth);
        }
      }
    }

    if (normalized.dateOfRecord) {
      if (typeof normalized.dateOfRecord === "string") {
        normalized.dateOfRecord = new Date(normalized.dateOfRecord);
      }
    }

    // Handle photo field - ensure it's treated as path string if not File
    if (normalized.photo && typeof normalized.photo === "string") {
      // Keep as string for path validation
    }

    return normalized;
  }

  /**
   * Convert enhanced validation errors to legacy format
   */
  private convertErrorsToLegacyFormat(
    errors: Record<string, string>
  ): Record<string, string> {
    const legacyErrors: Record<string, string> = {};

    for (const [field, error] of Object.entries(errors)) {
      // Map enhanced error messages to legacy format if needed
      legacyErrors[field] = this.mapErrorMessage(error);
    }

    return legacyErrors;
  }

  /**
   * Map enhanced error messages to user-friendly legacy messages
   */
  private mapErrorMessage(error: string): string {
    // Map technical validation errors to user-friendly messages
    const errorMappings: Record<string, string> = {
      "Date must be in YYYY-MM-DD format": "Please enter a valid date",
      "Date of birth cannot be in the future":
        "Date of birth cannot be in the future",
      "Date of birth must be after January 1, 1900":
        "Please enter a realistic date of birth",
      "Calculated age seems unrealistic (over 150 years)":
        "Please check the date of birth - calculated age seems too high",
      "Photo path too long (maximum 500 characters)":
        "Photo file path is too long",
      "Invalid photo path format": "Invalid photo file",
    };

    return errorMappings[error] || error;
  }
}

/**
 * Factory function to create validators for different form types
 */
export const createValidator = (
  formType: "dailyRecord" | "staff"
): BackwardCompatibleValidator => {
  return new BackwardCompatibleValidator(formType);
};

/**
 * Quick validation functions for individual fields (backward compatible)
 */
export const validateField = {
  dateOfBirth: (value: any): string | null => {
    const result = validateDateOfBirth(value);
    return result.error || null;
  },

  manualDate: (value: string): string | null => {
    const result = validateManualDateInput(value);
    return result.error || null;
  },

  photoPath: (value: string): string | null => {
    const result = validatePhotoPath(value);
    return result.error || null;
  },

  age: (value: any): string | null => {
    if (!value) return null;
    const num = typeof value === "string" ? parseInt(value) : value;
    if (isNaN(num)) return "Age must be a valid number";
    if (num < 0 || num > 150) return "Age must be between 0 and 150";
    return null;
  },

  email: (value: string): string | null => {
    if (!value) return null;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value)) return "Invalid email format";
    return null;
  },

  phone: (value: string): string | null => {
    if (!value) return null;
    if (!/^[\d\s\-+()]+$/.test(value))
      return "Phone number contains invalid characters";
    if (value.length < 10) return "Phone number must be at least 10 characters";
    if (value.length > 20) return "Phone number must be 20 characters or less";
    return null;
  },
};

/**
 * Validation rules for form fields with enhanced validation
 */
export const validationRules = {
  dailyRecord: {
    dateOfRecord: {
      required: true,
      validator: (value: any) => {
        if (!value) return "Record date is required";
        const date = typeof value === "string" ? new Date(value) : value;
        if (isNaN(date.getTime())) return "Please enter a valid date";
        if (date > new Date()) return "Record date cannot be in the future";
        return null;
      },
    },
    staffId: {
      required: true,
      validator: (value: any) => {
        if (!value) return "Staff member is required";
        const num = typeof value === "string" ? parseInt(value) : value;
        if (isNaN(num) || num <= 0) return "Please select a valid staff member";
        return null;
      },
    },
    conditionStatus: {
      required: true,
      validator: (value: any) => {
        if (!value) return "Condition status is required";
        const validValues = ["Excellent", "Good", "Fair", "Poor"];
        if (!validValues.includes(value))
          return "Please select a valid condition status";
        return null;
      },
    },
    feedbackContent: {
      required: true,
      validator: (value: any) => {
        if (!value || typeof value !== "string")
          return "Feedback content is required";
        if (value.length < 10)
          return "Feedback content must be at least 10 characters";
        if (value.length > 1000)
          return "Feedback content must be 1000 characters or less";
        return null;
      },
    },
    contactNumber: {
      required: false,
      validator: validateField.phone,
    },
    photo: {
      required: false,
      validator: validateField.photoPath,
    },
  },

  staff: {
    name: {
      required: true,
      validator: (value: any) => {
        if (!value || typeof value !== "string") return "Name is required";
        if (value.length > 100) return "Name must be 100 characters or less";
        if (
          !/^[a-zA-Z\s\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]+$/.test(value)
        ) {
          return "Name can only contain letters, spaces, and Japanese characters";
        }
        return null;
      },
    },
    dateOfBirth: {
      required: false,
      validator: validateField.dateOfBirth,
    },
    age: {
      required: false,
      validator: validateField.age,
    },
    email: {
      required: false,
      validator: validateField.email,
    },
    phone: {
      required: false,
      validator: validateField.phone,
    },
    photo: {
      required: false,
      validator: validateField.photoPath,
    },
  },
};

/**
 * Utility to validate entire form using validation rules
 */
export const validateFormWithRules = (
  formData: Record<string, any>,
  formType: "dailyRecord" | "staff"
): { isValid: boolean; errors: Record<string, string> } => {
  const rules = validationRules[formType];
  const errors: Record<string, string> = {};

  for (const [fieldName, rule] of Object.entries(rules)) {
    const value = formData[fieldName];
    const error = rule.validator(value);

    if (error) {
      errors[fieldName] = error;
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};
