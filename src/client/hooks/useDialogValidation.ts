import { useCallback } from "react";
import { useLanguage } from "../contexts/LanguageContext";

export interface ValidationRule<T> {
  field: keyof T;
  validator: (value: unknown) => string | null;
}

export interface ValidationError {
  field?: string;
  message: string;
}

export interface UseDialogValidationReturn<T> {
  validateRequired: (
    fields: Array<keyof T>,
    data: Partial<T>
  ) => ValidationError[];
  validateEmail: (email: string | null | undefined) => string | null;
  validatePhone: (phone: string | null | undefined) => string | null;
  validateUrl: (url: string | null | undefined) => string | null;
  validateMinLength: (
    minLength: number
  ) => (value: string | null | undefined) => string | null;
  validateMaxLength: (
    maxLength: number
  ) => (value: string | null | undefined) => string | null;
  validateNumericRange: (
    min?: number,
    max?: number
  ) => (value: number | string | null | undefined) => string | null;
  validateDate: (value: Date | string | null | undefined) => string | null;
  validateDateRange: (
    minDate?: Date,
    maxDate?: Date
  ) => (value: Date | string | null | undefined) => string | null;
  validateCustom: <K extends keyof T>(
    field: K,
    validator: (value: T[K]) => string | null
  ) => ValidationRule<T>;
  combineValidators: (
    ...validators: Array<(value: unknown) => string | null>
  ) => (value: unknown) => string | null;
}

export const useDialogValidation = <T>(): UseDialogValidationReturn<T> => {
  const { t } = useLanguage();

  const validateRequired = useCallback(
    (fields: Array<keyof T>, data: Partial<T>): ValidationError[] => {
      return fields
        .filter((field) => {
          const value = data[field];
          return value === null || value === undefined || value === "";
        })
        .map((field) => ({
          field: String(field),
          message: t("validation.required", { field: String(field) }),
        }));
    },
    [t]
  );

  const validateEmail = useCallback(
    (email: string | null | undefined): string | null => {
      if (!email) return null;
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return emailRegex.test(email)
        ? null
        : "Please enter a valid email address";
    },
    []
  );

  const validatePhone = useCallback(
    (phone: string | null | undefined): string | null => {
      if (!phone) return null;
      const phoneRegex = /^[+]?[\d\s\-()]+$/;
      const digitCount = phone.replace(/\D/g, "").length;
      return phoneRegex.test(phone) && digitCount >= 10
        ? null
        : "Please enter a valid phone number";
    },
    []
  );

  const validateUrl = useCallback(
    (url: string | null | undefined): string | null => {
      if (!url) return null;
      try {
        new URL(url);
        return null;
      } catch {
        return "Please enter a valid URL";
      }
    },
    []
  );

  const validateMinLength = useCallback(
    (minLength: number) =>
      (value: string | null | undefined): string | null => {
        if (!value) return null;
        return value.length >= minLength
          ? null
          : `Must be at least ${minLength} characters long`;
      },
    []
  );

  const validateMaxLength = useCallback(
    (maxLength: number) =>
      (value: string | null | undefined): string | null => {
        if (!value) return null;
        return value.length <= maxLength
          ? null
          : `Must not exceed ${maxLength} characters`;
      },
    []
  );

  const validateNumericRange = useCallback(
    (min?: number, max?: number) =>
      (value: number | string | null | undefined): string | null => {
        if (value === null || value === undefined || value === "") return null;

        const numValue = typeof value === "string" ? parseFloat(value) : value;
        if (isNaN(numValue)) return "Please enter a valid number";

        if (min !== undefined && numValue < min)
          return `Value must be at least ${min}`;
        if (max !== undefined && numValue > max)
          return `Value must not exceed ${max}`;

        return null;
      },
    []
  );

  const validateDate = useCallback(
    (value: Date | string | null | undefined): string | null => {
      if (!value) return null;
      const date = typeof value === "string" ? new Date(value) : value;
      return isNaN(date.getTime()) ? "Please enter a valid date" : null;
    },
    []
  );

  const validateDateRange = useCallback(
    (minDate?: Date, maxDate?: Date) =>
      (value: Date | string | null | undefined): string | null => {
        if (!value) return null;

        const date = typeof value === "string" ? new Date(value) : value;
        if (isNaN(date.getTime())) return "Please enter a valid date";

        if (minDate && date < minDate)
          return `Date must be after ${minDate.toLocaleDateString()}`;
        if (maxDate && date > maxDate)
          return `Date must be before ${maxDate.toLocaleDateString()}`;

        return null;
      },
    []
  );

  const validateCustom = useCallback(
    <K extends keyof T>(
      field: K,
      validator: (value: T[K]) => string | null
    ): ValidationRule<T> => ({
      field,
      validator: (value: unknown) => validator(value as T[K]),
    }),
    []
  );

  const combineValidators = useCallback(
    (...validators: Array<(value: unknown) => string | null>) => {
      return (value: unknown): string | null => {
        for (const validator of validators) {
          const error = validator(value);
          if (error) return error;
        }
        return null;
      };
    },
    []
  );

  return {
    validateRequired,
    validateEmail,
    validatePhone,
    validateUrl,
    validateMinLength,
    validateMaxLength,
    validateNumericRange,
    validateDate,
    validateDateRange,
    validateCustom,
    combineValidators,
  };
};
