import { useState, useCallback } from "react";
import type { Property } from "../../shared/types";
import { useLanguage } from "../contexts/LanguageContext";

export interface ValidationError {
  field: string;
  message: string;
}

export interface UsePropertyFormValidationOptions {
  initialData?: Partial<Property>;
  validateOnChange?: boolean;
  validateOnBlur?: boolean;
}

export interface PropertyFormValidationResult {
  errors: ValidationError[];
  isValid: boolean;
  getFieldError: (field: string) => string | undefined;
  validateField: (field: keyof Property, value: unknown) => void;
  validateForm: (formData: Partial<Property>) => boolean;
  clearFieldError: (field: string) => void;
  clearAllErrors: () => void;
  hasFieldError: (field: string) => boolean;
  getFieldsWithErrors: () => string[];
  showValidationErrors: (
    showToastFn: (title: string, description: string) => void
  ) => void;
}

export const usePropertyFormValidation = (
  options: UsePropertyFormValidationOptions = {}
): PropertyFormValidationResult => {
  const { validateOnChange = true, validateOnBlur: _validateOnBlur = true } =
    options;
  const [errors, setErrors] = useState<ValidationError[]>([]);
  const { t } = useLanguage();

  // Translate error message
  const translateError = useCallback(
    (message: string): string => {
      if (message.startsWith("validationErrors.")) {
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
    (field: keyof Property, value: unknown) => {
      if (!validateOnChange) return;

      const fieldErrors: ValidationError[] = [];

      // Validate based on field type
      switch (field) {
        case "name":
          if (!value || (typeof value === "string" && !value.trim())) {
            fieldErrors.push({
              field: "name",
              message: "名は必須です",
            });
          } else if (typeof value === "string" && value.length > 255) {
            fieldErrors.push({
              field: "name",
              message: "名は 255 文字以下でなければなりません",
            });
          }
          break;

        case "propertyCode":
          if (!value || (typeof value === "string" && !value.trim())) {
            fieldErrors.push({
              field: "propertyCode",
              message: "物件コードは必須です",
            });
          } else if (typeof value === "string" && value.length > 50) {
            fieldErrors.push({
              field: "propertyCode",
              message: "物件コードは50文字以内でなければなりません",
            });
          }
          break;

        case "address":
          if (!value || (typeof value === "string" && !value.trim())) {
            fieldErrors.push({
              field: "address",
              message: "住所は必須です",
            });
          } else if (typeof value === "string" && value.length > 500) {
            fieldErrors.push({
              field: "address",
              message: "住所は500文字以内でなければなりません",
            });
          }
          break;

        case "propertyType":
          if (!value) {
            fieldErrors.push({
              field: "propertyType",
              message: "物件タイプは必須です",
            });
          }
          break;

        case "status":
          if (!value) {
            fieldErrors.push({
              field: "status",
              message: "ステータスは必須です",
            });
          }
          break;

        case "description":
          if (value && typeof value === "string" && value.length > 1000) {
            fieldErrors.push({
              field: "description",
              message: "説明は1000文字以内でなければなりません",
            });
          }
          break;

        case "furiganaName":
          if (value && typeof value === "string") {
            const furiganaPattern = /^[\u3040-\u309F\u30A0-\u30FF\s]*$/;
            if (!furiganaPattern.test(value)) {
              fieldErrors.push({
                field: "furiganaName",
                message:
                  "ふりがなはひらがな、カタカナ、スペースのみ使用できます",
              });
            }
            if (value.length > 255) {
              fieldErrors.push({
                field: "furiganaName",
                message: "ふりがな名は255文字以内でなければなりません",
              });
            }
          }
          break;

        case "postalCode":
          if (value && typeof value === "string") {
            const postalPattern = /^[0-9-]{7,10}$/;
            if (!postalPattern.test(value)) {
              fieldErrors.push({
                field: "postalCode",
                message: "郵便番号は123-4567の形式で入力してください",
              });
            }
          }
          break;

        case "country":
        case "region":
        case "prefecture":
        case "city":
        case "owner":
          if (value && typeof value === "string" && value.length > 255) {
            fieldErrors.push({
              field,
              message: `${field} は255文字以下でなければなりません`,
            });
          }
          break;

        case "ownerPhone":
        case "ownerFax":
          if (value && typeof value === "string") {
            const phonePattern = /^[\d\s\-+()]+$/;
            if (!phonePattern.test(value)) {
              fieldErrors.push({
                field,
                message: `${field} には数字、スペース、ハイフン、プラス記号、括弧のみを含めることができます`,
              });
            }
            if (value.replace(/[\s\-+()]/g, "").length < 10) {
              fieldErrors.push({
                field,
                message: `${field} は10桁以上である必要があります`,
              });
            }
          }
          break;

        case "ownerEmail":
          if (value && typeof value === "string") {
            const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailPattern.test(value)) {
              fieldErrors.push({
                field: "ownerEmail",
                message: "有効なメールアドレスを入力してください",
              });
            }
          }
          break;

        case "establishmentDate":
        case "contractDate":
          if (value && !(value instanceof Date) && typeof value === "string") {
            const date = new Date(value);
            if (isNaN(date.getTime())) {
              fieldErrors.push({
                field,
                message: "有効な日付を入力してください",
              });
            }
          }
          break;

        case "managerId":
          if (value !== null && value !== undefined && value !== "") {
            const managerId =
              typeof value === "string"
                ? parseInt(value)
                : typeof value === "number"
                ? value
                : NaN;
            if (isNaN(managerId) || managerId <= 0) {
              fieldErrors.push({
                field: "managerId",
                message: "有効なIDを選択してください",
              });
            }
          }
          break;

        default:
          // No validation for other fields
          break;
      }

      // Update errors state
      setErrors((prevErrors) => {
        // Remove existing errors for this field
        const filteredErrors = prevErrors.filter(
          (error) => error.field !== field
        );
        // Add new errors for this field
        return [...filteredErrors, ...fieldErrors];
      });
    },
    [validateOnChange]
  );

  // Validate the entire form
  const validateForm = useCallback((formData: Partial<Property>): boolean => {
    const allErrors: ValidationError[] = [];

    // Validate all required fields
    Object.entries(formData).forEach(([field, value]) => {
      const fieldErrors: ValidationError[] = [];

      switch (field as keyof Property) {
        case "name":
          if (!value || (typeof value === "string" && !value.trim())) {
            fieldErrors.push({
              field: "name",
              message: "物件名は必須です",
            });
          } else if (typeof value === "string" && value.length > 255) {
            fieldErrors.push({
              field: "name",
              message: "物件名は255文字以内で入力してください",
            });
          }
          break;

        case "propertyCode":
          if (!value || (typeof value === "string" && !value.trim())) {
            fieldErrors.push({
              field: "propertyCode",
              message: "物件コードは必須です",
            });
          } else if (typeof value === "string" && value.length > 50) {
            fieldErrors.push({
              field: "propertyCode",
              message: "物件コードは50文字以内で入力してください",
            });
          }
          break;

        case "address":
          if (!value || (typeof value === "string" && !value.trim())) {
            fieldErrors.push({
              field: "address",
              message: "住所は必須です",
            });
          } else if (typeof value === "string" && value.length > 500) {
            fieldErrors.push({
              field: "address",
              message: "住所は500文字以内で入力してください",
            });
          }
          break;

        case "propertyType":
          if (!value) {
            fieldErrors.push({
              field: "propertyType",
              message: "物件タイプは必須です",
            });
          }
          break;

        case "status":
          if (!value) {
            fieldErrors.push({
              field: "status",
              message: "ステータスは必須です",
            });
          }
          break;

        case "description":
          if (value && typeof value === "string" && value.length > 1000) {
            fieldErrors.push({
              field: "description",
              message: "説明は1000文字以内で入力してください",
            });
          }
          break;

        case "furiganaName":
          if (value && typeof value === "string") {
            const furiganaPattern = /^[\u3040-\u309F\u30A0-\u30FF\s]*$/;
            if (!furiganaPattern.test(value)) {
              fieldErrors.push({
                field: "furiganaName",
                message:
                  "ふりがなはひらがな、カタカナ、スペースのみ使用できます",
              });
            }
            if (value.length > 255) {
              fieldErrors.push({
                field: "furiganaName",
                message: "ふりがなは255文字以内で入力してください",
              });
            }
          }
          break;

        case "postalCode":
          if (value && typeof value === "string") {
            const postalPattern = /^[0-9-]{7,10}$/;
            if (!postalPattern.test(value)) {
              fieldErrors.push({
                field: "postalCode",
                message: "郵便番号は123-4567の形式で入力してください",
              });
            }
          }
          break;

        case "country":
        case "region":
        case "prefecture":
        case "city":
        case "owner":
          if (value && typeof value === "string" && value.length > 255) {
            fieldErrors.push({
              field,
              message: `${field}は255文字以内で入力してください`,
            });
          }
          break;

        case "ownerPhone":
        case "ownerFax":
          if (value && typeof value === "string") {
            const phonePattern = /^[\d\s\-+()]+$/;
            if (!phonePattern.test(value)) {
              fieldErrors.push({
                field,
                message: `${field}は数字、スペース、ハイフン、プラス記号、括弧のみ使用できます`,
              });
            }
            if (value.replace(/[\s\-+()]/g, "").length < 10) {
              fieldErrors.push({
                field,
                message: `${field}は10桁以上で入力してください`,
              });
            }
          }
          break;

        case "ownerEmail":
          if (value && typeof value === "string") {
            const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailPattern.test(value)) {
              fieldErrors.push({
                field: "ownerEmail",
                message: "有効なメールアドレスを入力してください",
              });
            }
          }
          break;

        case "establishmentDate":
        case "contractDate":
          if (value && !(value instanceof Date) && typeof value === "string") {
            const date = new Date(value);
            if (isNaN(date.getTime())) {
              fieldErrors.push({
                field,
                message: "有効な日付を入力してください",
              });
            }
          }
          break;

        case "managerId":
          if (value !== null && value !== undefined && value !== "") {
            const managerId =
              typeof value === "string"
                ? parseInt(value)
                : typeof value === "number"
                ? value
                : NaN;
            if (isNaN(managerId) || managerId <= 0) {
              fieldErrors.push({
                field: "managerId",
                message: "有効な管理者を選択してください",
              });
            }
          }
          break;

        default:
          // No validation for other fields
          break;
      }

      allErrors.push(...fieldErrors);
    });

    setErrors(allErrors);
    return allErrors.length === 0;
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

// Specific validation functions for property fields
// These return translation keys that should be translated by the calling code
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

export const validateFurigana = (furigana: string): string | null => {
  if (!furigana) return null;

  const furiganaPattern = /^[\u3040-\u309F\u30A0-\u30FF\s]*$/;
  if (!furiganaPattern.test(furigana)) {
    return "ふりがなはひらがな、カタカナ、スペースのみ使用できます";
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
