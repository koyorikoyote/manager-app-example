/**
 * Comprehensive form state management hook
 * Combines validation, loading states, error handling, and success feedback
 */

import { useState, useCallback, useEffect } from "react";
import { FormValidator, ValidationError } from "../../shared/validation";
import {
  ApiError,
  normalizeError,
  mergeErrors,
  ErrorState,
} from "../utils/errorHandling";

export interface FormState<T> {
  data: Partial<T>;
  errors: ApiError[];
  validationErrors: ValidationError[];
  isLoading: boolean;
  isSubmitting: boolean;
  hasAttemptedSubmit: boolean;
  showSuccess: boolean;
  successMessage: string;
}

export interface FormActions<T> {
  setFieldValue: (field: keyof T, value: unknown) => void;
  setFormData: (data: Partial<T>) => void;
  validateField: (field: keyof T) => ValidationError | null;
  validateForm: () => boolean;
  clearErrors: () => void;
  clearFieldError: (field: keyof T) => void;
  setErrors: (errors: unknown) => void;
  setLoading: (loading: boolean) => void;
  setSubmitting: (submitting: boolean) => void;
  showSuccessMessage: (message: string, autoHide?: boolean) => void;
  hideSuccessMessage: () => void;
  resetForm: () => void;
  getFieldError: (field: keyof T) => string | undefined;
  hasErrors: () => boolean;
  hasFieldErrors: () => boolean;
}

export interface UseFormStateOptions<T> {
  initialData?: Partial<T>;
  validator?: FormValidator;
  enableRealTimeValidation?: boolean;
  onValidationChange?: (isValid: boolean) => void;
  onSubmit?: (data: Partial<T>) => Promise<void>;
}

export interface UseFormStateReturn<T> extends FormState<T>, FormActions<T> {
  handleSubmit: (e?: React.FormEvent) => Promise<void>;
  isValid: boolean;
  canSubmit: boolean;
}

export function useFormState<T extends Record<string, unknown>>(
  options: UseFormStateOptions<T> = {}
): UseFormStateReturn<T> {
  const {
    initialData = {} as Partial<T>,
    validator,
    enableRealTimeValidation = true,
    onValidationChange,
    onSubmit,
  } = options;

  // Form data state
  const [data, setData] = useState<Partial<T>>(initialData);

  // Error states
  const [errors, setErrors] = useState<ApiError[]>([]);
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>(
    []
  );

  // Loading states
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form interaction state
  const [hasAttemptedSubmit, setHasAttemptedSubmit] = useState(false);

  // Success feedback state
  const [showSuccess, setShowSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  // Computed states
  const isValid = validationErrors.length === 0 && errors.length === 0;
  const canSubmit = isValid && !isLoading && !isSubmitting;

  // Notify parent of validation changes
  useEffect(() => {
    onValidationChange?.(isValid);
  }, [isValid, onValidationChange]);

  // Reset form data when initialData changes
  useEffect(() => {
    setData(initialData);
    setErrors([]);
    setValidationErrors([]);
    setHasAttemptedSubmit(false);
    setShowSuccess(false);
  }, [initialData]);

  // Actions
  const setFieldValue = useCallback(
    (field: keyof T, value: unknown) => {
      setData((prev) => ({ ...prev, [field]: value }));

      // Clear field-specific errors
      setErrors((prev) => prev.filter((error) => error.field !== field));

      // Real-time validation
      if (
        enableRealTimeValidation &&
        validator &&
        (hasAttemptedSubmit || validationErrors.length > 0)
      ) {
        const fieldError = validator.validateField(field as string, value);
        setValidationErrors((prev) => {
          const otherErrors = prev.filter((error) => error.field !== field);
          return fieldError ? [...otherErrors, fieldError] : otherErrors;
        });
      }
    },
    [
      enableRealTimeValidation,
      validator,
      hasAttemptedSubmit,
      validationErrors.length,
    ]
  );

  const setFormData = useCallback((newData: Partial<T>) => {
    setData(newData);
    setErrors([]);
    setValidationErrors([]);
  }, []);

  const validateField = useCallback(
    (field: keyof T): ValidationError | null => {
      if (!validator) return null;
      return validator.validateField(field as string, data[field]);
    },
    [validator, data]
  );

  const validateForm = useCallback((): boolean => {
    if (!validator) return true;

    const result = validator.validateForm(data as Record<string, unknown>);
    setValidationErrors(result.errors);
    return result.isValid;
  }, [validator, data]);

  const clearErrors = useCallback(() => {
    setErrors([]);
    setValidationErrors([]);
  }, []);

  const clearFieldError = useCallback((field: keyof T) => {
    setErrors((prev) => prev.filter((error) => error.field !== field));
    setValidationErrors((prev) =>
      prev.filter((error) => error.field !== field)
    );
  }, []);

  const setErrorsAction = useCallback((newErrors: unknown) => {
    const normalizedErrors = normalizeError(newErrors);
    setErrors(normalizedErrors);
  }, []);

  const setLoadingAction = useCallback((loading: boolean) => {
    setIsLoading(loading);
  }, []);

  const setSubmittingAction = useCallback((submitting: boolean) => {
    setIsSubmitting(submitting);
  }, []);

  const showSuccessMessageAction = useCallback(
    (message: string, autoHide: boolean = true) => {
      setSuccessMessage(message);
      setShowSuccess(true);

      if (autoHide) {
        setTimeout(() => {
          setShowSuccess(false);
        }, 3000);
      }
    },
    []
  );

  const hideSuccessMessage = useCallback(() => {
    setShowSuccess(false);
  }, []);

  const resetForm = useCallback(() => {
    setData(initialData);
    setErrors([]);
    setValidationErrors([]);
    setIsLoading(false);
    setIsSubmitting(false);
    setHasAttemptedSubmit(false);
    setShowSuccess(false);
    setSuccessMessage("");
  }, [initialData]);

  const getFieldError = useCallback(
    (field: keyof T): string | undefined => {
      // Check validation errors first
      const validationError = validationErrors.find(
        (error) => error.field === field
      );
      if (validationError) {
        return validationError.message;
      }

      // Check API errors
      const apiError = errors.find((error) => error.field === field);
      return apiError?.message;
    },
    [validationErrors, errors]
  );

  const hasErrorsCheck = useCallback((): boolean => {
    return errors.length > 0 || validationErrors.length > 0;
  }, [errors, validationErrors]);

  const hasFieldErrorsCheck = useCallback((): boolean => {
    return errors.some((e) => e.field) || validationErrors.some((e) => e.field);
  }, [errors, validationErrors]);

  const handleSubmit = useCallback(
    async (e?: React.FormEvent) => {
      if (e) {
        e.preventDefault();
      }

      if (isSubmitting || isLoading) return;

      setHasAttemptedSubmit(true);

      // Validate form if validator is provided
      if (validator) {
        const isFormValid = validateForm();
        if (!isFormValid) {
          return;
        }
      }

      if (!onSubmit) return;

      try {
        setIsSubmitting(true);
        setErrors([]);

        await onSubmit(data);

        // Success handled by parent component
      } catch (error) {
        setErrorsAction(error);
      } finally {
        setIsSubmitting(false);
      }
    },
    [
      isSubmitting,
      isLoading,
      validator,
      validateForm,
      onSubmit,
      data,
      setErrorsAction,
    ]
  );

  return {
    // State
    data,
    errors,
    validationErrors,
    isLoading,
    isSubmitting,
    hasAttemptedSubmit,
    showSuccess,
    successMessage,
    isValid,
    canSubmit,

    // Actions
    setFieldValue,
    setFormData,
    validateField,
    validateForm,
    clearErrors,
    clearFieldError,
    setErrors: setErrorsAction,
    setLoading: setLoadingAction,
    setSubmitting: setSubmittingAction,
    showSuccessMessage: showSuccessMessageAction,
    hideSuccessMessage,
    resetForm,
    getFieldError,
    hasErrors: hasErrorsCheck,
    hasFieldErrors: hasFieldErrorsCheck,
    handleSubmit,
  };
}
