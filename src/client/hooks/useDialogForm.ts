import { useState, useCallback, useEffect } from "react";

export interface FormError {
  field?: string;
  message: string;
}

export interface UseDialogFormOptions<T> {
  initialData?: Partial<T>;
  onSubmit: (data: Partial<T>) => Promise<void>;
  onSuccess?: () => void;
  onError?: (errors: FormError[]) => void;
  validateOnChange?: boolean;
  validators?: Array<{
    field: keyof T;
    validator: (value: unknown) => string | null;
  }>;
  requiredFields?: Array<keyof T>;
}

export interface UseDialogFormReturn<T> {
  formData: Partial<T>;
  errors: FormError[];
  isSubmitting: boolean;
  isValid: boolean;
  isDirty: boolean;
  setFieldValue: (field: keyof T, value: unknown) => void;
  setFormData: (data: Partial<T>) => void;
  getFieldError: (field: keyof T) => string | undefined;
  clearFieldError: (field: keyof T) => void;
  clearAllErrors: () => void;
  handleSubmit: (e?: React.FormEvent) => Promise<void>;
  reset: (data?: Partial<T>) => void;
  validate: () => FormError[];
}

export const useDialogForm = <T>(
  options: UseDialogFormOptions<T>
): UseDialogFormReturn<T> => {
  const {
    initialData = {},
    onSubmit,
    onSuccess,
    onError,
    validateOnChange = false,
    validators = [],
    requiredFields = [],
  } = options;

  const [formData, setFormData] = useState<Partial<T>>(initialData);
  const [errors, setErrors] = useState<FormError[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDirty, setIsDirty] = useState(false);

  // Validate form data
  const validate = useCallback((): FormError[] => {
    const newErrors: FormError[] = [];

    // Check required fields
    requiredFields.forEach((field) => {
      const value = formData[field];
      if (value === null || value === undefined || value === "") {
        newErrors.push({
          field: String(field),
          message: `${String(field)} is required`,
        });
      }
    });

    // Run custom validators
    validators.forEach(({ field, validator }) => {
      const value = formData[field];
      const error = validator(value);
      if (error) {
        newErrors.push({
          field: String(field),
          message: error,
        });
      }
    });

    return newErrors;
  }, [formData, requiredFields, validators]);

  // Check if form is valid
  const isValid = errors.length === 0;

  // Set field value with optional validation
  const setFieldValue = useCallback(
    (field: keyof T, value: unknown) => {
      setFormData((prev) => ({
        ...prev,
        [field]: value,
      }));
      setIsDirty(true);

      // Clear field-specific errors
      setErrors((prev) =>
        prev.filter((error) => error.field !== String(field))
      );

      // Validate on change if enabled
      if (validateOnChange) {
        const fieldErrors = validators
          .filter((v) => v.field === field)
          .map((v) => v.validator(value))
          .filter(Boolean)
          .map((message) => ({
            field: String(field),
            message: message!,
          }));

        if (fieldErrors.length > 0) {
          setErrors((prev) => [
            ...prev.filter((e) => e.field !== String(field)),
            ...fieldErrors,
          ]);
        }
      }
    },
    [validateOnChange, validators]
  );

  // Get field-specific error
  const getFieldError = useCallback(
    (field: keyof T): string | undefined => {
      const error = errors.find((err) => err.field === String(field));
      return error?.message;
    },
    [errors]
  );

  // Clear field-specific error
  const clearFieldError = useCallback((field: keyof T) => {
    setErrors((prev) => prev.filter((error) => error.field !== String(field)));
  }, []);

  // Clear all errors
  const clearAllErrors = useCallback(() => {
    setErrors([]);
  }, []);

  // Handle form submission
  const handleSubmit = useCallback(
    async (e?: React.FormEvent) => {
      if (e) {
        e.preventDefault();
      }

      if (isSubmitting) return;

      // Validate form
      const validationErrors = validate();
      setErrors(validationErrors);

      if (validationErrors.length > 0) {
        if (onError) {
          onError(validationErrors);
        }
        return;
      }

      try {
        setIsSubmitting(true);
        await onSubmit(formData);

        if (onSuccess) {
          onSuccess();
        }
      } catch (error) {
        // Handle submission errors
        if (error && typeof error === "object" && "errors" in error) {
          const submitErrors = error.errors as FormError[];
          setErrors(submitErrors);
          if (onError) {
            onError(submitErrors);
          }
        } else {
          const submitError: FormError = {
            message:
              error instanceof Error ? error.message : "Submission failed",
          };
          setErrors([submitError]);
          if (onError) {
            onError([submitError]);
          }
        }
      } finally {
        setIsSubmitting(false);
      }
    },
    [formData, isSubmitting, validate, onSubmit, onSuccess, onError]
  );

  // Reset form
  const reset = useCallback(
    (data?: Partial<T>) => {
      const resetData = data || initialData;
      setFormData(resetData);
      setErrors([]);
      setIsSubmitting(false);
      setIsDirty(false);
    },
    [initialData]
  );

  // Update form data when initialData changes
  useEffect(() => {
    if (!isDirty) {
      setFormData(initialData);
    }
  }, [initialData, isDirty]);

  return {
    formData,
    errors,
    isSubmitting,
    isValid,
    isDirty,
    setFieldValue,
    setFormData,
    getFieldError,
    clearFieldError,
    clearAllErrors,
    handleSubmit,
    reset,
    validate,
  };
};
