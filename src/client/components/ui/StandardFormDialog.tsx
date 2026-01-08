import React from 'react';
import { Dialog } from './Dialog';
import { Button } from './Button';
import { DIALOG_STYLES } from './cardStyles';
import { cn } from '../../utils/cn';
import { useLanguage } from '../../contexts/LanguageContext';
import { useToast } from '../../contexts/ToastContext';
import { FormValidator, ValidationError, hasValidationErrors } from '../../../shared/validation';

export interface FormError {
    field?: string;
    message: string;
}

export interface StandardFormDialogProps<T> {
    isOpen: boolean;
    onClose: () => void;
    record?: T | null;
    onSubmit: (data: Partial<T>) => Promise<void>;
    title: string;
    isLoading?: boolean;
    errors?: FormError[];
    children: React.ReactNode;
    submitText?: string;
    cancelText?: string;
    showSuccessMessage?: boolean;
    successMessage?: string;
    validator?: FormValidator;
    enableRealTimeValidation?: boolean;
    disableBackdropClick?: boolean;
}

/** Stable empty array to prevent re-renders */
const EMPTY_ERRORS: FormError[] = [];

/**
 * Submit-time sanitizer for Staff dynamic array groups.
 * Prunes "empty" groups added for Education History and Work History so they are ignored on save.
 * A group is considered empty if all fields in the group are empty (null/undefined or blank string).
 *
 * Note:
 * - This runs only at submit-time.
 * - It only mutates arrays if they exist and have length > 0, so other dialogs remain unaffected.
 */
function pruneStaffArrayGroups(raw: Record<string, unknown>): Record<string, unknown> {
    const data: Record<string, unknown> = { ...raw };

    const isEmptyValue = (v: unknown) =>
        v === null || v === undefined || (typeof v === "string" && v.trim() === "");

    // Normalize: convert blank strings to null so enums validate server-side
    const normalizeValue = (v: unknown) => {
        if (typeof v === "string" && v.trim() === "") return null;
        return v ?? null;
    };

    // Education: aligned arrays educationName, educationType
    const eduName = Array.isArray(data.educationName) ? [...(data.educationName as unknown[])] : [];
    const eduType = Array.isArray(data.educationType) ? [...(data.educationType as unknown[])] : [];
    const eduLen = Math.max(eduName.length, eduType.length);
    if (eduLen > 0) {
        const newEduName: unknown[] = [];
        const newEduType: unknown[] = [];
        for (let i = 0; i < eduLen; i++) {
            const n = eduName[i];
            const t = eduType[i];
            const groupEmpty = isEmptyValue(n) && isEmptyValue(t);
            if (!groupEmpty) {
                newEduName.push(normalizeValue(n));
                newEduType.push(normalizeValue(t));
            }
        }
        data.educationName = newEduName;
        data.educationType = newEduType;
    }

    // Work history: aligned arrays across all workHistory* fields
    const workFields = [
        "workHistoryName",
        "workHistoryDateStart",
        "workHistoryDateEnd",
        "workHistoryCountryLocation",
        "workHistoryCityLocation",
        "workHistoryPosition",
        "workHistoryEmploymentType",
        "workHistoryDescription",
    ] as const;

    const lists = workFields.map((f) =>
        Array.isArray((data as any)[f]) ? ([...((data as any)[f] as unknown[])] as unknown[]) : ([] as unknown[])
    );
    const workLen = lists.reduce((m, arr) => Math.max(m, arr.length), 0);
    if (workLen > 0) {
        const newLists = workFields.map(() => [] as unknown[]);
        for (let i = 0; i < workLen; i++) {
            const vals = lists.map((arr) => arr[i]);
            const groupEmpty = vals.every(isEmptyValue);
            if (!groupEmpty) {
                vals.forEach((val, idx) => {
                    newLists[idx].push(normalizeValue(val));
                });
            }
        }
        workFields.forEach((f, idx) => {
            (data as any)[f] = newLists[idx];
        });
    }

    return data;
}

export const StandardFormDialog = <T,>({
    isOpen,
    onClose,
    record,
    onSubmit,
    title,
    isLoading = false,
    errors = EMPTY_ERRORS,
    children,
    submitText,
    cancelText,
    showSuccessMessage = false,
    successMessage,
    validator,
    enableRealTimeValidation = true,
    disableBackdropClick = false
}: StandardFormDialogProps<T>) => {
    const { t } = useLanguage();
    const { showError } = useToast();
    const [formData, setFormData] = React.useState<Partial<T>>({});
    const [localErrors, setLocalErrors] = React.useState<FormError[]>([]);
    const [validationErrors, setValidationErrors] = React.useState<ValidationError[]>([]);
    const [isSubmitting, setIsSubmitting] = React.useState(false);
    const [showSuccess, setShowSuccess] = React.useState(false);
    const [hasAttemptedSubmit, setHasAttemptedSubmit] = React.useState(false);

    // Translate validation error messages
    const translateValidationError = React.useCallback((message: string): string => {
        if (message.startsWith('validationErrors.')) {
            const [key, ...params] = message.split('|');
            const vars: Record<string, string> = {};

            params.forEach(param => {
                const [paramKey, paramValue] = param.split(':');
                if (paramKey && paramValue) {
                    vars[paramKey] = paramValue;
                }
            });

            return t(key as any, vars);
        }
        return message;
    }, [t]);

    // Initialize form data when dialog opens or record changes
    const recordRef = React.useRef(record);
    const isOpenRef = React.useRef(isOpen);

    React.useEffect(() => {
        // Only update if dialog is opening or record actually changed
        const dialogOpening = isOpen && !isOpenRef.current;
        const recordChanged = record !== recordRef.current;

        if (dialogOpening || recordChanged) {
            if (record) {
                setFormData({ ...record });
            } else {
                setFormData({});
            }
            setLocalErrors([]);
            setValidationErrors([]);
            setShowSuccess(false);
            setHasAttemptedSubmit(false);

            recordRef.current = record;
        }

        isOpenRef.current = isOpen;
    }, [record, isOpen]);

    // Update local errors when errors prop changes
    React.useEffect(() => {
        setLocalErrors(errors);
    }, [errors]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (isSubmitting || isLoading) return;

        setHasAttemptedSubmit(true);

        // Perform client-side validation if validator is provided
        if (validator) {
            const validationResult = validator.validateForm(formData as Record<string, unknown>);
            setValidationErrors(validationResult.errors);

            if (!validationResult.isValid) {
                // Show toast with validation errors
                const errorMessages = validationResult.errors
                    .map(err => translateValidationError(err.message))
                    .join('\n');
                const title = t('common.errors.validationError' as any);
                showError(title, errorMessages);
                return; // Don't submit if validation fails
            }
        }

        try {
            setIsSubmitting(true);
            setLocalErrors([]);

            // Prune empty groups for Staff dynamic array fields at submit time only
            const sanitized = pruneStaffArrayGroups(formData as unknown as Record<string, unknown>) as Partial<T>;
            await onSubmit(sanitized);

            if (showSuccessMessage) {
                setShowSuccess(true);
                // Auto-close after showing success message
                setTimeout(() => {
                    setShowSuccess(false);
                    onClose();
                }, 1500);
            } else {
                onClose();
            }
        } catch (error) {
            // Handle validation errors
            if (error && typeof error === 'object' && 'errors' in error) {
                setLocalErrors(error.errors as FormError[]);
            } else {
                setLocalErrors([{
                    message: error instanceof Error ? error.message : t('common.errors.submitFailed')
                }]);
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleCancel = () => {
        if (isSubmitting || isLoading) return;

        setFormData({});
        setLocalErrors([]);
        setValidationErrors([]);
        setShowSuccess(false);
        setHasAttemptedSubmit(false);
        onClose();
    };

    const handleFieldChange = (field: keyof T, value: unknown) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));

        // Clear field-specific errors when user starts typing
        setLocalErrors(prev => prev.filter(error => error.field !== field));

        // Real-time validation if enabled and validator is provided
        if (enableRealTimeValidation && validator) {
            // Always validate if there are existing errors for this field, or if user has attempted submit
            const hasFieldError = validationErrors.some(error => error.field === field);
            if (hasAttemptedSubmit || hasFieldError || validationErrors.length > 0) {
                const fieldError = validator.validateField(field as string, value);
                setValidationErrors(prev => {
                    const otherErrors = prev.filter(error => error.field !== field);
                    return fieldError ? [...otherErrors, fieldError] : otherErrors;
                });
            }
        }
    };

    // Get field-specific error (check both local errors and validation errors)
    const getFieldError = (field: string): string | undefined => {
        // Check validation errors first (client-side validation)
        const validationError = validationErrors.find(err => err.field === field);
        if (validationError) {
            return translateValidationError(validationError.message);
        }

        // Check server errors
        const serverError = localErrors.find(err => err.field === field);
        return serverError?.message;
    };

    // Get general errors (not field-specific)
    const generalErrors = [
        ...localErrors.filter(error => !error.field),
        ...validationErrors.filter(error => !error.field)
    ];

    // Check if form has validation errors that prevent submission
    const hasFormErrors = hasValidationErrors(validationErrors) || localErrors.length > 0;

    const isFormLoading = isLoading || isSubmitting;

    const footer = (
        <div className="flex items-center justify-end space-x-3">
            <Button
                type="button"
                variant="outline"
                onClick={handleCancel}
                disabled={isFormLoading}
            >
                {cancelText || t('common.actions.cancel')}
            </Button>
            <Button
                type="submit"
                form="standard-form"
                loading={isFormLoading}
                disabled={isFormLoading || (hasAttemptedSubmit && hasFormErrors)}
            >
                {submitText || (record ? t('common.actions.save') : t('common.actions.create'))}
            </Button>
        </div>
    );

    return (
        <Dialog
            isOpen={isOpen}
            onClose={handleCancel}
            title={title}
            footer={footer}
            size="lg"
            disableBackdropClick={disableBackdropClick}
        >
            <form id="standard-form" onSubmit={handleSubmit} className="space-y-6">
                {/* Success Message - Standardized styling */}
                {showSuccess && (
                    <div className={DIALOG_STYLES.form.successMessage}>
                        <div className="flex items-center">
                            <div className="flex-shrink-0">
                                <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                </svg>
                            </div>
                            <div className="ml-3">
                                <p className="text-sm font-medium text-green-800">
                                    {successMessage || t('common.messages.saveSuccess')}
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {/* General Error Messages - Standardized styling */}
                {generalErrors.length > 0 && (
                    <div className={DIALOG_STYLES.form.errorContainer}>
                        <div className="flex">
                            <div className="flex-shrink-0">
                                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                </svg>
                            </div>
                            <div className="ml-3">
                                <h3 className="text-sm font-medium text-red-800">
                                    {generalErrors.length === 1 ? t('common.errors.validationError') : t('common.errors.validationErrors')}
                                </h3>
                                <div className="mt-2 text-sm text-red-700">
                                    <ul className="list-disc pl-5 space-y-1">
                                        {generalErrors.map((error, index) => (
                                            <li key={index}>{error.message}</li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Form Content - Standardized container */}
                <div className={DIALOG_STYLES.form.container}>
                    {React.Children.map(children, (child) => {
                        if (React.isValidElement(child)) {
                            // Pass form utilities to child components
                            return React.cloneElement(child, {
                                formData,
                                onFieldChange: handleFieldChange,
                                getFieldError,
                                isLoading: isFormLoading,
                                ...(child.props && typeof child.props === 'object' ? child.props : {})
                            } as Record<string, unknown>);
                        }
                        return child;
                    })}
                </div>
            </form>
        </Dialog>
    );
};

// Form field wrapper component for consistent styling
export interface FormFieldProps {
    label: string;
    error?: string;
    required?: boolean;
    children: React.ReactNode;
    className?: string;
    htmlFor?: string;
}

export const FormField: React.FC<FormFieldProps> = ({
    label,
    error,
    required = false,
    children,
    className,
    htmlFor
}) => {
    const generatedId = React.useId();
    const fieldId = htmlFor || generatedId;

    return (
        <div className={cn(DIALOG_STYLES.form.fieldWrapper, className)}>
            <label htmlFor={fieldId} className={DIALOG_STYLES.form.label}>
                {label}
                {required && <span className={DIALOG_STYLES.form.required}>*</span>}
            </label>
            {React.Children.map(children, (child) => {
                if (React.isValidElement(child)) {
                    return React.cloneElement(child, {
                        id: fieldId,
                        ...(child.props && typeof child.props === 'object' ? child.props : {})
                    } as React.HTMLAttributes<HTMLElement>);
                }
                return child;
            })}
            {error && (
                <p className={DIALOG_STYLES.form.errorMessage}>
                    <svg className="h-4 w-4 mr-1 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    {error}
                </p>
            )}
        </div>
    );
};

// Input component with consistent styling
export interface FormInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    error?: boolean;
}

export const FormInput: React.FC<FormInputProps> = ({
    error = false,
    className,
    ...props
}) => {
    return (
        <input
            className={cn(
                DIALOG_STYLES.form.input,
                "appearance-auto",
                error && "border-red-300 focus:border-red-500 focus:ring-red-500",
                className
            )}
            style={{
                // Prevent zoom on iOS when input is focused
                fontSize: '16px',
                WebkitAppearance: 'none',
                // Enhanced touch interactions
                touchAction: 'manipulation',
            }}
            {...props}
        />
    );
};

export interface FormDateInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    error?: boolean;
    displayValue?: string;
}

export const FormDateInput: React.FC<FormDateInputProps> = ({
    error = false,
    className,
    displayValue,
    value,
    placeholder = 'YYYY/MM/DD',
    ...props
}) => {
    // Prefer explicit displayValue, otherwise use the raw input value.
    // Convert internal YYYY-MM-DD to the visual YYYY/MM/DD as requested.
    const raw = ((typeof displayValue === 'string' && displayValue) || (typeof value === 'string' ? value : '') || '').trim();
    // Extract date-only portion (supports YYYY-MM-DD, YYYY/MM/DD, and strips any time like 'T...' or space)
    const dateOnlyRaw = (raw.match(/^\d{4}[-/]\d{2}[-/]\d{2}/)?.[0] || (raw.includes('T') ? raw.split('T')[0] : raw.split(' ')[0] || '')).replace(/\//g, '-');
    const visual = dateOnlyRaw ? dateOnlyRaw.replace(/-/g, '/') : '';
    const inputValue = dateOnlyRaw;
    const inputRef = React.useRef<HTMLInputElement | null>(null);


    return (
        <div className="relative">
            <input
                ref={inputRef}
                type="date"
                value={inputValue}
                className={cn(
                    DIALOG_STYLES.form.input,
                    error && "border-red-300 focus:border-red-500 focus:ring-red-500",
                    className
                )}
                // Keep native appearance and icon; make text transparent so we can show formatted value
                style={{
                    color: 'transparent',
                    WebkitTextFillColor: 'transparent',
                    // leave a small right padding so the native browser icon is not covered
                    paddingRight: '2.5rem',
                    caretColor: 'transparent',
                    touchAction: 'manipulation',
                }}
                {...props}
            />
            {/* Overlayed formatted date (visual: YYYY/MM/DD) */}
            <span
                className="pointer-events-none absolute inset-y-0 left-0 flex items-center px-3 text-black truncate"
                style={{ right: '2.5rem' }}
            >
                {visual || placeholder}
            </span>

            {/* Restored clickable icon (transparent backdrop to preserve native look) */}
            <button
                type="button"
                onClick={() => {
                    const el = inputRef.current;
                    if (!el) return;
                    const anyEl = el as any;
                    if (typeof anyEl.showPicker === 'function') {
                        try { anyEl.showPicker(); return; } catch { /* fallthrough */ }
                    }
                    el.focus();
                    el.click();
                }}
                className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center justify-center"
                aria-hidden="true"
                tabIndex={-1}
                style={{ width: 28, height: 28, background: 'transparent', border: 'none', padding: 0 }}
            >
                <svg className="h-5 w-5 text-gray-700" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <rect x="3" y="5" width="18" height="16" rx="2" stroke="currentColor" strokeWidth="1.5" />
                    <path d="M16 3V7M8 3V7M3 11H21" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
            </button>
        </div>
    );
};

// Textarea component with consistent styling
export interface FormTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
    error?: boolean;
}

export const FormTextarea: React.FC<FormTextareaProps> = ({
    error = false,
    className,
    ...props
}) => {
    return (
        <textarea
            className={cn(
                DIALOG_STYLES.form.textarea,
                error && "border-red-300 focus:border-red-500 focus:ring-red-500",
                className
            )}
            style={{
                // Prevent zoom on iOS when textarea is focused
                fontSize: '16px',
                WebkitAppearance: 'none',
                // Enhanced touch interactions
                touchAction: 'manipulation',
            }}
            {...props}
        />
    );
};

// Select component with consistent styling
export interface FormSelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
    error?: boolean;
    options: Array<{ value: string; label: string }>;
    placeholder?: string;
}

export const FormSelect: React.FC<FormSelectProps> = ({
    error = false,
    options,
    placeholder,
    className,
    ...props
}) => {
    return (
        <select
            className={cn(
                DIALOG_STYLES.form.select,
                error && "border-red-300 focus:border-red-500 focus:ring-red-500",
                className
            )}
            style={{
                // Prevent zoom on iOS when select is focused
                fontSize: '16px',
                WebkitAppearance: 'none',
                // Enhanced touch interactions
                touchAction: 'manipulation',
                // Custom dropdown arrow
                backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3e%3c/svg%3e")`,
                backgroundPosition: 'right 12px center',
                backgroundRepeat: 'no-repeat',
                backgroundSize: '16px',
                paddingRight: '48px',
            }}
            {...props}
        >
            {placeholder && (
                <option value="" disabled>
                    {placeholder}
                </option>
            )}
            {options.map((option) => (
                <option key={option.value} value={option.value}>
                    {option.label}
                </option>
            ))}
        </select>
    );
};
