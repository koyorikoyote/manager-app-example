// Comprehensive form validation utilities for enhanced date and photo fields

import {
  validateDateOfBirth,
  validateManualDateInput,
  validateDate,
} from "./dateValidation";
import {
  validatePhoto,
  validatePhotoPath,
  DAILY_RECORD_PHOTO_OPTIONS,
  STAFF_PHOTO_OPTIONS,
} from "./photoValidation";

export interface FormValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
  warnings?: Record<string, string>;
}

export interface ValidationRule {
  field: string;
  validator: (value: any) => Promise<string | null> | string | null;
  required?: boolean;
}

/**
 * Enhanced form validator that handles both synchronous and asynchronous validation
 */
export class EnhancedFormValidator {
  private rules: ValidationRule[] = [];

  addRule(rule: ValidationRule): this {
    this.rules.push(rule);
    return this;
  }

  addDateOfBirthValidation(field: string, required: boolean = false): this {
    return this.addRule({
      field,
      required,
      validator: (value) => {
        if (!value && required) return "Date of birth is required";
        const result = validateDateOfBirth(value);
        return result.error || null;
      },
    });
  }

  addManualDateValidation(field: string, required: boolean = false): this {
    return this.addRule({
      field,
      required,
      validator: (value) => {
        if (!value && required) return "Date is required";
        const result = validateManualDateInput(value);
        return result.error || null;
      },
    });
  }

  addPhotoValidation(
    field: string,
    context: "daily_record" | "staff" = "daily_record",
    required: boolean = false
  ): this {
    return this.addRule({
      field,
      required,
      validator: async (value) => {
        if (!value && required) return "Photo is required";

        if (typeof value === "string") {
          // Validate photo path
          const pathResult = validatePhotoPath(value);
          return pathResult.error || null;
        } else if (value instanceof File) {
          // Validate photo file
          const options =
            context === "staff"
              ? STAFF_PHOTO_OPTIONS
              : DAILY_RECORD_PHOTO_OPTIONS;
          const result = await validatePhoto(value, options);
          return result.error || null;
        }

        return null;
      },
    });
  }

  async validate(formData: Record<string, any>): Promise<FormValidationResult> {
    const errors: Record<string, string> = {};
    const warnings: Record<string, string> = {};

    for (const rule of this.rules) {
      const value = formData[rule.field];

      try {
        const error = await rule.validator(value);
        if (error) {
          errors[rule.field] = error;
        }
      } catch (err) {
        errors[rule.field] =
          err instanceof Error ? err.message : "Validation error";
      }
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors,
      warnings,
    };
  }
}

/**
 * Pre-configured validators for common form types
 */
export const createDailyRecordValidator = (): EnhancedFormValidator => {
  return new EnhancedFormValidator()
    .addRule({
      field: "dateOfRecord",
      required: true,
      validator: (value) => {
        if (!value) return "Record date is required";
        const result = validateDate(value, { allowFuture: false });
        return result.error || null;
      },
    })
    .addRule({
      field: "staffId",
      required: true,
      validator: (value) => {
        if (!value) return "Staff member is required";
        const num = typeof value === "string" ? parseInt(value) : value;
        if (isNaN(num) || num <= 0) return "Please select a valid staff member";
        return null;
      },
    })
    .addRule({
      field: "conditionStatus",
      required: true,
      validator: (value) => {
        if (!value) return "Condition status is required";
        const validValues = ["Excellent", "Good", "Fair", "Poor"];
        if (!validValues.includes(value))
          return "Please select a valid condition status";
        return null;
      },
    })
    .addRule({
      field: "feedbackContent",
      required: true,
      validator: (value) => {
        if (!value || typeof value !== "string")
          return "Feedback content is required";
        if (value.length < 10)
          return "Feedback content must be at least 10 characters";
        if (value.length > 1000)
          return "Feedback content must be 1000 characters or less";
        return null;
      },
    })
    .addRule({
      field: "contactNumber",
      required: false,
      validator: (value) => {
        if (!value) return null;
        if (typeof value !== "string") return "Contact number must be a string";
        if (!/^[\d\s\-+()]+$/.test(value))
          return "Contact number contains invalid characters";
        if (value.length < 10)
          return "Contact number must be at least 10 characters";
        if (value.length > 20)
          return "Contact number must be 20 characters or less";
        return null;
      },
    })
    .addPhotoValidation("photo", "daily_record", false);
};

export const createStaffValidator = (): EnhancedFormValidator => {
  return new EnhancedFormValidator()
    .addRule({
      field: "name",
      required: true,
      validator: (value) => {
        if (!value || typeof value !== "string") return "Name is required";
        if (value.length > 100) return "Name must be 100 characters or less";
        if (
          !/^[a-zA-Z\s\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]+$/.test(value)
        ) {
          return "Name can only contain letters, spaces, and Japanese characters";
        }
        return null;
      },
    })
    .addDateOfBirthValidation("dateOfBirth", false)
    .addRule({
      field: "age",
      required: false,
      validator: (value) => {
        if (!value) return null;
        const num = typeof value === "string" ? parseInt(value) : value;
        if (isNaN(num)) return "Age must be a valid number";
        if (num < 0 || num > 150) return "Age must be between 0 and 150";
        return null;
      },
    })
    .addRule({
      field: "email",
      required: false,
      validator: (value) => {
        if (!value) return null;
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value)) return "Invalid email format";
        return null;
      },
    })
    .addPhotoValidation("photo", "staff", false);
};

/**
 * Utility functions for specific validation scenarios
 */
export const validateFormField = async (
  fieldName: string,
  value: any,
  validationType: "dateOfBirth" | "manualDate" | "photo" | "photoPath"
): Promise<string | null> => {
  switch (validationType) {
    case "dateOfBirth": {
      const dateResult = validateDateOfBirth(value);
      return dateResult.error || null;
    }

    case "manualDate": {
      const manualResult = validateManualDateInput(value);
      return manualResult.error || null;
    }

    case "photo": {
      if (value instanceof File) {
        const photoResult = await validatePhoto(value);
        return photoResult.error || null;
      }
      return null;
    }

    case "photoPath": {
      const pathResult = validatePhotoPath(value);
      return pathResult.error || null;
    }

    default:
      return null;
  }
};

/**
 * Batch validation for multiple fields
 */
export const validateMultipleFields = async (
  fields: Array<{
    name: string;
    value: any;
    type: "dateOfBirth" | "manualDate" | "photo" | "photoPath";
  }>
): Promise<Record<string, string>> => {
  const errors: Record<string, string> = {};

  for (const field of fields) {
    const error = await validateFormField(field.name, field.value, field.type);
    if (error) {
      errors[field.name] = error;
    }
  }

  return errors;
};

/**
 * Real-time validation debouncer
 */
export const createDebouncedValidator = (
  validator: (value: any) => Promise<string | null> | string | null,
  delay: number = 300
) => {
  let timeoutId: NodeJS.Timeout;

  return (value: any): Promise<string | null> => {
    return new Promise((resolve) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(async () => {
        const result = await validator(value);
        resolve(result);
      }, delay);
    });
  };
};
