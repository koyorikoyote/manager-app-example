/**
 * Error handling utilities for form dialogs and API operations
 */

import { ValidationError } from "../../shared/validation";

export interface ApiError {
  message: string;
  field?: string;
  code?: string;
  details?: unknown;
}

export interface ErrorState {
  hasError: boolean;
  errors: ApiError[];
  isLoading: boolean;
}

/**
 * Convert various error formats to a standardized format
 */
export function normalizeError(error: unknown): ApiError[] {
  if (!error) {
    return [];
  }

  // Handle validation errors
  if (Array.isArray(error)) {
    return error.map((err) => ({
      message: err.message || String(err),
      field: err.field,
      code: err.code,
    }));
  }

  // Handle API response errors
  if (typeof error === "object" && error !== null) {
    const errorObj = error as Record<string, unknown>;

    // Handle structured error response
    if (errorObj.errors && Array.isArray(errorObj.errors)) {
      return normalizeError(errorObj.errors);
    }

    // Handle single error object
    if (errorObj.message) {
      return [
        {
          message: String(errorObj.message),
          field: errorObj.field as string,
          code: errorObj.code as string,
          details: errorObj.details,
        },
      ];
    }
  }

  // Handle Error instances
  if (error instanceof Error) {
    return [
      {
        message: error.message,
        code: error.name,
      },
    ];
  }

  // Fallback for unknown error types
  return [
    {
      message: String(error),
    },
  ];
}

/**
 * Extract field-specific errors from error list
 */
export function getFieldErrors(errors: ApiError[]): Record<string, string> {
  const fieldErrors: Record<string, string> = {};

  errors.forEach((error) => {
    if (error.field) {
      fieldErrors[error.field] = error.message;
    }
  });

  return fieldErrors;
}

/**
 * Extract general (non-field-specific) errors
 */
export function getGeneralErrors(errors: ApiError[]): ApiError[] {
  return errors.filter((error) => !error.field);
}

/**
 * Check if errors contain any field-specific errors
 */
export function hasFieldErrors(errors: ApiError[]): boolean {
  return errors.some((error) => error.field);
}

/**
 * Check if errors contain any general errors
 */
export function hasGeneralErrors(errors: ApiError[]): boolean {
  return errors.some((error) => !error.field);
}

/**
 * Convert validation errors to API error format
 */
export function validationToApiErrors(
  validationErrors: ValidationError[]
): ApiError[] {
  return validationErrors.map((error) => ({
    message: error.message,
    field: error.field,
    code: error.type,
  }));
}

/**
 * Merge multiple error sources into a single error list
 */
export function mergeErrors(
  ...errorSources: (ApiError[] | ValidationError[] | unknown)[]
): ApiError[] {
  const allErrors: ApiError[] = [];

  errorSources.forEach((source) => {
    if (Array.isArray(source)) {
      // Check if it's validation errors
      if (source.length > 0 && "type" in source[0]) {
        allErrors.push(...validationToApiErrors(source as ValidationError[]));
      } else {
        allErrors.push(...(source as ApiError[]));
      }
    } else if (source) {
      allErrors.push(...normalizeError(source));
    }
  });

  return allErrors;
}

/**
 * Create user-friendly error messages for common scenarios
 */
export const ERROR_MESSAGES = {
  NETWORK_ERROR: "Network error. Please check your connection and try again.",
  SERVER_ERROR: "Server error. Please try again later.",
  VALIDATION_ERROR: "Please correct the highlighted fields and try again.",
  UNAUTHORIZED: "You are not authorized to perform this action.",
  FORBIDDEN:
    "Access denied. You do not have permission to perform this action.",
  NOT_FOUND: "The requested resource was not found.",
  CONFLICT: "This operation conflicts with existing data.",
  TIMEOUT: "Request timed out. Please try again.",
  UNKNOWN: "An unexpected error occurred. Please try again.",
};

/**
 * Get user-friendly error message based on error code or type
 */
export function getUserFriendlyMessage(error: ApiError): string {
  if (error.code) {
    switch (error.code.toUpperCase()) {
      case "NETWORK_ERROR":
      case "ERR_NETWORK":
        return ERROR_MESSAGES.NETWORK_ERROR;
      case "SERVER_ERROR":
      case "INTERNAL_SERVER_ERROR":
        return ERROR_MESSAGES.SERVER_ERROR;
      case "UNAUTHORIZED":
      case "401":
        return ERROR_MESSAGES.UNAUTHORIZED;
      case "FORBIDDEN":
      case "403":
        return ERROR_MESSAGES.FORBIDDEN;
      case "NOT_FOUND":
      case "404":
        return ERROR_MESSAGES.NOT_FOUND;
      case "CONFLICT":
      case "409":
        return ERROR_MESSAGES.CONFLICT;
      case "TIMEOUT":
        return ERROR_MESSAGES.TIMEOUT;
      case "VALIDATION_ERROR":
        return ERROR_MESSAGES.VALIDATION_ERROR;
    }
  }

  // Return original message if no mapping found
  return error.message || ERROR_MESSAGES.UNKNOWN;
}

/**
 * Hook for managing error state in components
 */
export function createErrorState(): ErrorState {
  return {
    hasError: false,
    errors: [],
    isLoading: false,
  };
}

/**
 * Update error state with new errors
 */
export function updateErrorState(
  currentState: ErrorState,
  newErrors: unknown,
  isLoading: boolean = false
): ErrorState {
  const normalizedErrors = normalizeError(newErrors);

  return {
    hasError: normalizedErrors.length > 0,
    errors: normalizedErrors,
    isLoading,
  };
}

/**
 * Clear error state
 */
export function clearErrorState(): ErrorState {
  return createErrorState();
}

/**
 * Retry mechanism for failed operations
 */
export interface RetryOptions {
  maxAttempts: number;
  delay: number;
  backoff: boolean;
}

export async function withRetry<T>(
  operation: () => Promise<T>,
  options: Partial<RetryOptions> = {}
): Promise<T> {
  const { maxAttempts = 3, delay = 1000, backoff = true } = options;

  let lastError: unknown;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;

      if (attempt === maxAttempts) {
        throw error;
      }

      const waitTime = backoff ? delay * Math.pow(2, attempt - 1) : delay;
      await new Promise((resolve) => setTimeout(resolve, waitTime));
    }
  }

  throw lastError;
}
