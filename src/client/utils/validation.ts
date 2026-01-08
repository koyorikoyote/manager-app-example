/**
 * Form validation utilities for consistent validation across all forms
 */
import React from "react";

export interface ValidationRule<T = unknown> {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  min?: number;
  max?: number;
  custom?: (value: T) => string | null;
}

export type ValidationSchema<T> = {
  [K in keyof T]?: ValidationRule<T[K]>;
};

export interface ValidationResult {
  isValid: boolean;
  errors: Array<{
    field: string;
    message: string;
  }>;
}

/**
 * Validates a single field value against its validation rule
 */
export function validateField<T>(
  fieldName: string,
  value: T,
  rule: ValidationRule<T>,
  t: (key: string, vars?: Record<string, unknown>) => string
): string | null {
  // Required validation
  if (
    rule.required &&
    (value === null || value === undefined || value === "")
  ) {
    return t("validation.required", { field: fieldName });
  }

  // Skip other validations if value is empty and not required
  if (
    !rule.required &&
    (value === null || value === undefined || value === "")
  ) {
    return null;
  }

  // String validations
  if (typeof value === "string") {
    if (rule.minLength && value.length < rule.minLength) {
      return t("validation.minLength", {
        field: fieldName,
        min: rule.minLength,
      });
    }

    if (rule.maxLength && value.length > rule.maxLength) {
      return t("validation.maxLength", {
        field: fieldName,
        max: rule.maxLength,
      });
    }

    if (rule.pattern && !rule.pattern.test(value)) {
      return t("validation.pattern", { field: fieldName });
    }
  }

  // Number validations
  if (typeof value === "number") {
    if (rule.min !== undefined && value < rule.min) {
      return t("validation.min", { field: fieldName, min: rule.min });
    }

    if (rule.max !== undefined && value > rule.max) {
      return t("validation.max", { field: fieldName, max: rule.max });
    }
  }

  // Custom validation
  if (rule.custom) {
    return rule.custom(value);
  }

  return null;
}

/**
 * Validates an entire form object against a validation schema
 */
export function validateForm<T extends Record<string, unknown>>(
  data: Partial<T>,
  schema: ValidationSchema<T>,
  t: (key: string, vars?: Record<string, unknown>) => string
): ValidationResult {
  const errors: Array<{ field: string; message: string }> = [];

  for (const [fieldName, rule] of Object.entries(schema)) {
    if (rule) {
      const value = data[fieldName as keyof T];
      const error = validateField(fieldName, value, rule, t);

      if (error) {
        errors.push({
          field: fieldName,
          message: error,
        });
      }
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Common validation patterns
 */
export const ValidationPatterns = {
  email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  phone: /^[+]?[1-9][\d]{0,15}$/,
  phoneJapan: /^(\+81|0)[1-9]\d{8,9}$/,
  url: /^https?:\/\/.+/,
  alphanumeric: /^[a-zA-Z0-9]+$/,
  alphanumericWithSpaces: /^[a-zA-Z0-9\s]+$/,
  numbersOnly: /^\d+$/,
  postalCodeJapan: /^[0-9-]{7,10}$/,
  employeeId: /^[A-Z0-9]{3,10}$/,
  propertyCode: /^[A-Z0-9-]{3,20}$/,
} as const;

/**
 * Pre-defined validation rules for common fields
 */
export const CommonValidationRules = {
  required: { required: true },

  name: {
    required: true,
    minLength: 1,
    maxLength: 100,
    pattern: ValidationPatterns.alphanumericWithSpaces,
  },

  email: {
    required: true,
    pattern: ValidationPatterns.email,
    maxLength: 255,
  },

  optionalEmail: {
    pattern: ValidationPatterns.email,
    maxLength: 255,
  },

  phone: {
    pattern: ValidationPatterns.phone,
    maxLength: 20,
  },

  phoneJapan: {
    pattern: ValidationPatterns.phoneJapan,
    maxLength: 15,
  },

  employeeId: {
    required: true,
    pattern: ValidationPatterns.employeeId,
    minLength: 3,
    maxLength: 10,
  },

  propertyCode: {
    required: true,
    pattern: ValidationPatterns.propertyCode,
    minLength: 3,
    maxLength: 20,
  },

  address: {
    required: true,
    minLength: 5,
    maxLength: 500,
  },

  description: {
    maxLength: 2000,
  },

  url: {
    pattern: ValidationPatterns.url,
    maxLength: 500,
  },

  postalCode: {
    pattern: ValidationPatterns.postalCodeJapan,
  },

  salary: {
    min: 0,
    max: 99999999,
  },

  age: {
    min: 16,
    max: 100,
  },
} as const;

/**
 * Validation schemas for specific entity types
 */
export const ValidationSchemas = {
  staff: {
    employeeId: CommonValidationRules.employeeId,
    name: CommonValidationRules.name,
    position: CommonValidationRules.required,
    department: CommonValidationRules.required,
    email: CommonValidationRules.optionalEmail,
    phone: CommonValidationRules.phone,
    address: { maxLength: 500 },
    salary: CommonValidationRules.salary,
    status: CommonValidationRules.required,
  },

  property: {
    propertyCode: CommonValidationRules.propertyCode,
    name: CommonValidationRules.name,
    address: CommonValidationRules.address,
    propertyType: CommonValidationRules.required,
    status: CommonValidationRules.required,
    description: CommonValidationRules.description,
  },

  company: {
    name: CommonValidationRules.name,
    address: CommonValidationRules.address,
    phone: CommonValidationRules.phone,
    email: CommonValidationRules.optionalEmail,
    website: CommonValidationRules.url,
    industry: { maxLength: 100 },
    description: CommonValidationRules.description,
    status: CommonValidationRules.required,
  },

  user: {
    username: {
      required: true,
      minLength: 3,
      maxLength: 50,
      pattern: ValidationPatterns.alphanumeric,
    },
    name: CommonValidationRules.name,
    email: CommonValidationRules.email,
    password: {
      required: true,
      minLength: 8,
      maxLength: 100,
    },
  },

  interactionRecord: {
    name: CommonValidationRules.name,
    title: { maxLength: 200 },
    type: CommonValidationRules.required,
    description: {
      required: true,
      minLength: 10,
      maxLength: 2000,
    },
    personConcerned: { maxLength: 100 },
  },
} as const;

/**
 * Async validation function for server-side validation
 */
export async function validateAsync<T>(
  data: Partial<T>,
  validationEndpoint: string,
  signal?: AbortSignal
): Promise<ValidationResult> {
  try {
    const response = await fetch(validationEndpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
      signal,
    });

    if (!response.ok) {
      throw new Error("Validation request failed");
    }

    const result = await response.json();
    return result;
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw error;
    }

    // Return client-side validation as fallback
    return {
      isValid: false,
      errors: [
        {
          field: "",
          message:
            "Unable to validate data. Please check your input and try again.",
        },
      ],
    };
  }
}

/**
 * Debounced validation hook for real-time validation
 */
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = React.useState<T>(value);

  React.useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}
