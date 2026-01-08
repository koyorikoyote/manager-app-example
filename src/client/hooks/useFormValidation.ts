/**
 * Custom hook for form validation and error handling
 */

import { useState, useCallback, useEffect } from "react";
import {
  FormValidator,
  ValidationError,
  hasValidationErrors,
} from "../../shared/validation";

interface UseFormValidationOptions {
  validator?: FormValidator;
  enableRealTimeValidation?: boolean;
  onValidationChange?: (isValid: boolean) => void;
}

interface UseFormValidationReturn {
  errors: ValidationError[];
  isValid: boolean;
  hasAttemptedSubmit: boolean;
  validateField: (fieldKey: string, value: unknown) => ValidationError | null;
  validateForm: (formData: Record<string, unknown>) => boolean;
  clearErrors: () => void;
  clearFieldError: (fieldKey: string) => void;
  setErrors: (errors: ValidationError[]) => void;
  getFieldError: (fieldKey: string) => string | undefined;
  markSubmitAttempt: () => void;
  resetValidation: () => void;
}

export function useFormValidation(
  options: UseFormValidationOptions = {}
): UseFormValidationReturn {
  const {
    validator,
    enableRealTimeValidation = true,
    onValidationChange,
  } = options;

  const [errors, setErrors] = useState<ValidationError[]>([]);
  const [hasAttemptedSubmit, setHasAttemptedSubmit] = useState(false);

  const isValid = !hasValidationErrors(errors);

  // Notify parent component of validation state changes
  useEffect(() => {
    onValidationChange?.(isValid);
  }, [isValid, onValidationChange]);

  const validateField = useCallback(
    (fieldKey: string, value: unknown): ValidationError | null => {
      if (!validator) return null;
      return validator.validateField(fieldKey, value);
    },
    [validator]
  );

  const validateForm = useCallback(
    (formData: Record<string, unknown>): boolean => {
      if (!validator) return true;

      const validationResult = validator.validateForm(formData);
      setErrors(validationResult.errors);
      return validationResult.isValid;
    },
    [validator]
  );

  const clearErrors = useCallback(() => {
    setErrors([]);
  }, []);

  const clearFieldError = useCallback((fieldKey: string) => {
    setErrors((prev) => prev.filter((error) => error.field !== fieldKey));
  }, []);

  const getFieldError = useCallback(
    (fieldKey: string): string | undefined => {
      const error = errors.find((err) => err.field === fieldKey);
      return error?.message;
    },
    [errors]
  );

  const markSubmitAttempt = useCallback(() => {
    setHasAttemptedSubmit(true);
  }, []);

  const resetValidation = useCallback(() => {
    setErrors([]);
    setHasAttemptedSubmit(false);
  }, []);

  // Real-time field validation
  const _handleFieldChange = useCallback(
    (fieldKey: string, value: unknown) => {
      if (!enableRealTimeValidation || !validator) return;

      // Only validate in real-time after first submit attempt or if there are existing errors
      if (hasAttemptedSubmit || errors.length > 0) {
        const fieldError = validateField(fieldKey, value);
        setErrors((prev) => {
          const otherErrors = prev.filter((error) => error.field !== fieldKey);
          return fieldError ? [...otherErrors, fieldError] : otherErrors;
        });
      }
    },
    [
      enableRealTimeValidation,
      validator,
      hasAttemptedSubmit,
      errors.length,
      validateField,
    ]
  );

  return {
    errors,
    isValid,
    hasAttemptedSubmit,
    validateField,
    validateForm,
    clearErrors,
    clearFieldError,
    setErrors,
    getFieldError,
    markSubmitAttempt,
    resetValidation,
  };
}

/**
 * Hook for managing loading states in forms
 */
interface UseFormLoadingReturn {
  isLoading: boolean;
  isSubmitting: boolean;
  setLoading: (loading: boolean) => void;
  setSubmitting: (submitting: boolean) => void;
  withLoading: <T>(asyncFn: () => Promise<T>) => Promise<T>;
  withSubmitting: <T>(asyncFn: () => Promise<T>) => Promise<T>;
}

export function useFormLoading(): UseFormLoadingReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const setLoading = useCallback((loading: boolean) => {
    setIsLoading(loading);
  }, []);

  const setSubmitting = useCallback((submitting: boolean) => {
    setIsSubmitting(submitting);
  }, []);

  const withLoading = useCallback(
    async <T>(asyncFn: () => Promise<T>): Promise<T> => {
      setIsLoading(true);
      try {
        return await asyncFn();
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const withSubmitting = useCallback(
    async <T>(asyncFn: () => Promise<T>): Promise<T> => {
      setIsSubmitting(true);
      try {
        return await asyncFn();
      } finally {
        setIsSubmitting(false);
      }
    },
    []
  );

  return {
    isLoading,
    isSubmitting,
    setLoading,
    setSubmitting,
    withLoading,
    withSubmitting,
  };
}

/**
 * Hook for managing success feedback in forms
 */
interface UseFormFeedbackReturn {
  showSuccess: boolean;
  successMessage: string;
  showSuccessMessage: (
    message: string,
    autoHide?: boolean,
    delay?: number
  ) => void;
  hideSuccessMessage: () => void;
}

export function useFormFeedback(): UseFormFeedbackReturn {
  const [showSuccess, setShowSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  const showSuccessMessage = useCallback(
    (message: string, autoHide: boolean = true, delay: number = 3000) => {
      setSuccessMessage(message);
      setShowSuccess(true);

      if (autoHide) {
        setTimeout(() => {
          setShowSuccess(false);
        }, delay);
      }
    },
    []
  );

  const hideSuccessMessage = useCallback(() => {
    setShowSuccess(false);
  }, []);

  return {
    showSuccess,
    successMessage,
    showSuccessMessage,
    hideSuccessMessage,
  };
}

/**
 * Compatibility wrapper used by some UI components.
 * Provides a simple "validated form" API on top of useFormState.
 */
import { useFormState } from "./useFormState";

export type UseValidatedFormOptions<T> = {
  schema: any;
  initialData?: Partial<T>;
  onSubmit?: (data: Partial<T>) => Promise<void>;
  validateOnChange?: boolean;
  validateOnBlur?: boolean;
};

export function useValidatedForm<T extends Record<string, unknown>>(
  options: UseValidatedFormOptions<T>
) {
  const {
    schema,
    initialData = {} as Partial<T>,
    onSubmit,
    validateOnChange = true,
  } = options;
  const validator = new FormValidator(schema as any);

  const form = useFormState<T>({
    initialData,
    validator,
    enableRealTimeValidation: validateOnChange,
    onSubmit,
  });

  return {
    formData: form.data,
    updateField: form.setFieldValue,
    handleSubmit: form.handleSubmit,
    reset: form.resetForm,
    errors: form.errors,
    isValid: form.isValid,
    isSubmitting: form.isSubmitting,
    getFieldError: form.getFieldError,
  };
}
