import { useState, useCallback } from "react";
import {
  staffValidator,
  ValidationError,
  validateFieldRealTime,
} from "../../shared/validation";
import type { Staff } from "../../shared/types";
import { useLanguage } from "../contexts/LanguageContext";

export interface UseStaffFormValidationOptions {
  initialData?: Partial<Staff>;
  validateOnChange?: boolean;
  validateOnBlur?: boolean;
}

export interface StaffFormValidationResult {
  errors: ValidationError[];
  isValid: boolean;
  getFieldError: (field: string) => string | undefined;
  validateField: (field: keyof Staff, value: unknown) => void;
  validateForm: (formData: Partial<Staff>) => boolean;
  clearFieldError: (field: string) => void;
  clearAllErrors: () => void;
  hasFieldError: (field: string) => boolean;
  getFieldsWithErrors: () => string[];
  showValidationErrors: (
    showToastFn: (title: string, description: string) => void
  ) => void;
}

export const useStaffFormValidation = (
  options: UseStaffFormValidationOptions = {}
): StaffFormValidationResult => {
  const { validateOnChange = true, validateOnBlur: _validateOnBlur = true } =
    options;
  const [errors, setErrors] = useState<ValidationError[]>([]);
  const { t } = useLanguage();

  // Translate error message
  const translateError = useCallback(
    (message: string): string => {
      // Check if message is a translation key
      if (message.startsWith("validationErrors.")) {
        // Parse parameters from message like "validationErrors.required|field:Name"
        const [key, ...params] = message.split("|");
        const vars: Record<string, string> = {};

        params.forEach((param) => {
          const [paramKey, paramValue] = param.split(":");
          if (paramKey && paramValue) {
            vars[paramKey] = paramValue;
          }
        });

        return t(key as any, vars);
      }
      return message;
    },
    [t]
  );

  // Validate a single field
  const validateField = useCallback(
    (field: keyof Staff, value: unknown) => {
      if (!validateOnChange) return;

      validateFieldRealTime(
        staffValidator,
        field as string,
        value,
        setErrors,
        errors
      );
    },
    [errors, validateOnChange]
  );

  // Validate the entire form
  const validateForm = useCallback((formData: Partial<Staff>): boolean => {
    const result = staffValidator.validateForm(
      formData as Record<string, unknown>
    );
    setErrors(result.errors);
    return result.isValid;
  }, []);

  // Get error message for a specific field
  const getFieldError = useCallback(
    (field: string): string | undefined => {
      const error = errors.find((err) => err.field === field);
      return error ? translateError(error.message) : undefined;
    },
    [errors, translateError]
  );

  // Clear error for a specific field
  const clearFieldError = useCallback((field: string) => {
    setErrors((prevErrors) =>
      prevErrors.filter((error) => error.field !== field)
    );
  }, []);

  // Clear all errors
  const clearAllErrors = useCallback(() => {
    setErrors([]);
  }, []);

  // Check if a field has an error
  const hasFieldError = useCallback(
    (field: string): boolean => {
      return errors.some((error) => error.field === field);
    },
    [errors]
  );

  // Get list of fields with errors
  const getFieldsWithErrors = useCallback((): string[] => {
    return errors.map((error) => error.field).filter(Boolean);
  }, [errors]);

  // Show validation errors in a toast
  const showValidationErrors = useCallback(
    (showToastFn: (title: string, description: string) => void) => {
      if (errors.length === 0) return;

      const errorMessages = errors
        .map((err) => translateError(err.message))
        .join("\n");
      const title = t("common.errors.validationError");
      showToastFn(title, errorMessages);
    },
    [errors, translateError, t]
  );

  return {
    errors,
    isValid: errors.length === 0,
    getFieldError,
    validateField,
    validateForm,
    clearFieldError,
    clearAllErrors,
    hasFieldError,
    getFieldsWithErrors,
    showValidationErrors,
  };
};

export const validateEmail = (email: string): string | null => {
  if (!email) return null;
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailPattern.test(email)) {
    return "有効なメールアドレスを入力してください";
  }
  return null;
};

export const validatePhoneNumber = (phone: string): string | null => {
  if (!phone) return null;
  const phonePattern = /^[\d\s\-+()]+$/;
  if (!phonePattern.test(phone)) {
    return "電話番号は数字、スペース、ハイフン、プラス記号、括弧のみ使用できます";
  }
  if (phone.replace(/[\s\-+()]/g, "").length < 10) {
    return "電話番号は10桁以上で入力してください";
  }
  return null;
};

export const validatePostalCode = (postalCode: string): string | null => {
  if (!postalCode) return null;
  const postalPattern = /^[0-9-]{7,10}$/;
  if (!postalPattern.test(postalCode)) {
    return "郵便番号は123-4567の形式で入力してください";
  }
  return null;
};

export const validateDateRange = (
  startDate: Date | string | null,
  endDate: Date | string | null
): string | null => {
  if (!startDate || !endDate) return null;

  const start = new Date(startDate);
  const end = new Date(endDate);

  if (start >= end) {
    return "開始日は終了日より前の日付にしてください";
  }
  return null;
};

export const validateAge = (age: number | string): string | null => {
  if (!age) return null;

  const numAge = typeof age === "string" ? parseInt(age) : age;

  if (isNaN(numAge)) {
    return "年齢は数字で入力してください";
  }

  if (numAge < 16 || numAge > 150) {
    return "年齢は16歳から150歳の範囲で入力してください";
  }

  return null;
};

export const validateFurigana = (furigana: string): string | null => {
  if (!furigana) return null;

  const furiganaPattern = /^[\u3040-\u309F\u30A0-\u30FF\s]*$/;
  if (!furiganaPattern.test(furigana)) {
    return "ふりがなはひらがな、カタカナ、スペースのみ使用できます";
  }

  return null;
};
