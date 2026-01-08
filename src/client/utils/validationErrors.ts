import { ZodError } from "zod";

export interface ValidationErrorDetail {
  field: string;
  message: string;
  code: string;
}

export interface FormValidationResult {
  isValid: boolean;
  errors: ValidationErrorDetail[];
  fieldErrors: Record<string, string>;
}

/**
 * Converts a Zod error into a more usable format for forms
 */
export function parseValidationError(error: ZodError): FormValidationResult {
  const errors: ValidationErrorDetail[] = error.issues.map((issue) => ({
    field: issue.path.join("."),
    message: issue.message,
    code: issue.code,
  }));

  const fieldErrors: Record<string, string> = {};
  errors.forEach((error) => {
    if (!fieldErrors[error.field]) {
      fieldErrors[error.field] = error.message;
    }
  });

  return {
    isValid: false,
    errors,
    fieldErrors,
  };
}

/**
 * Formats validation errors for display to users
 */
export function formatValidationErrors(
  errors: ValidationErrorDetail[]
): string[] {
  return errors.map((error) => {
    const fieldName = error.field.split(".").pop() || error.field;
    const capitalizedField =
      fieldName.charAt(0).toUpperCase() + fieldName.slice(1);
    return `${capitalizedField}: ${error.message}`;
  });
}

/**
 * Gets the first error message for a specific field
 */
export function getFieldError(
  errors: ValidationErrorDetail[],
  fieldName: string
): string | undefined {
  const error = errors.find((err) => err.field === fieldName);
  return error?.message;
}

/**
 * Checks if a specific field has validation errors
 */
export function hasFieldError(
  errors: ValidationErrorDetail[],
  fieldName: string
): boolean {
  return errors.some((err) => err.field === fieldName);
}

/**
 * Groups validation errors by field for easier processing
 */
export function groupErrorsByField(
  errors: ValidationErrorDetail[]
): Record<string, ValidationErrorDetail[]> {
  return errors.reduce((acc, error) => {
    if (!acc[error.field]) {
      acc[error.field] = [];
    }
    acc[error.field].push(error);
    return acc;
  }, {} as Record<string, ValidationErrorDetail[]>);
}

/**
 * Creates user-friendly error messages for common validation scenarios
 */
export function createUserFriendlyErrorMessage(
  error: ValidationErrorDetail
): string {
  const { field, message, code } = error;
  const fieldName = field.split(".").pop() || field;

  switch (code) {
    case "too_small":
      if (message.includes("at least")) {
        return `${fieldName}が短すぎます`;
      }
      return `${fieldName}は必須です`;

    case "too_big":
      return `${fieldName}が長すぎます`;

    case "invalid_type":
      return `${fieldName}の形式が無効です`;

    case "invalid_string":
      if (message.includes("email")) {
        return `有効なメールアドレスを入力してください`;
      }
      if (message.includes("regex")) {
        return `${fieldName}に無効な文字が含まれています`;
      }
      return `${fieldName}の形式が無効です`;

    case "custom":
      return message;

    default:
      return message;
  }
}

/**
 * Validates a single field value against a schema
 */
export async function validateField<T>(
  schema: any,
  fieldName: keyof T,
  value: any
): Promise<{ isValid: boolean; error?: string }> {
  try {
    // Create a partial schema for just this field
    const fieldSchema = schema.pick({ [fieldName]: true });
    await fieldSchema.parseAsync({ [fieldName]: value });
    return { isValid: true };
  } catch (error) {
    if (error instanceof ZodError) {
      const validationResult = parseValidationError(error);
      const fieldError = getFieldError(
        validationResult.errors,
        fieldName as string
      );
      return {
        isValid: false,
        error: fieldError
          ? createUserFriendlyErrorMessage({
              field: fieldName as string,
              message: fieldError,
              code: error.issues[0]?.code || "custom",
            })
          : "検証に失敗しました",
      };
    }
    return { isValid: false, error: "検証に失敗しました" };
  }
}

/**
 * Utility to check if an error is a validation error
 */
export function isValidationError(error: any): error is ZodError {
  return error instanceof ZodError;
}

/**
 * Converts server-side validation errors to client-side format
 */
export function parseServerValidationError(
  serverError: any
): FormValidationResult {
  if (serverError?.message?.includes("Validation failed:")) {
    const errorMessage = serverError.message.replace("Validation failed: ", "");
    const errorParts = errorMessage.split(", ");

    const errors: ValidationErrorDetail[] = errorParts.map((part: string) => {
      const [field, message] = part.split(": ");
      return {
        field: field || "unknown",
        message: message || part,
        code: "server_validation",
      };
    });

    const fieldErrors: Record<string, string> = {};
    errors.forEach((error) => {
      if (!fieldErrors[error.field]) {
        fieldErrors[error.field] = error.message;
      }
    });

    return {
      isValid: false,
      errors,
      fieldErrors,
    };
  }

  return {
    isValid: false,
    errors: [
      {
        field: "general",
        message: serverError?.message || "エラーが発生しました",
        code: "server_error",
      },
    ],
    fieldErrors: {
      general: serverError?.message || "エラーが発生しました",
    },
  };
}
