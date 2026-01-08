import React, { useCallback } from 'react';
import { Calendar } from 'lucide-react';
import { cn } from '../../utils/cn';
import { Input } from './Input';
import { useResponsive } from '../../hooks/useResponsive';
import { parseISODateAsTokyo, toTokyoISODate } from '../../../shared/utils/timezone';

/**
 * Props for the DateOfBirthInput component
 */
export interface DateOfBirthInputProps {
    /** The current date value */
    value: Date | null;
    /** Callback fired when the date changes */
    onChange: (date: Date | null) => void;
    /** Callback fired when age is calculated from the date */
    onAgeCalculated: (age: number | null) => void;
    /** Whether the input should be disabled */
    disabled?: boolean;
    /** Error message to display */
    error?: string;
    /** Label text for the input field */
    label?: string;
    /** Placeholder text for the input */
    placeholder?: string;
    /** Additional CSS classes to apply */
    className?: string;
}

/**
 * Date of birth input component using only the native date picker with automatic age calculation.
 *
 * Removed manual text input mode and toggle while preserving the public API and behavior.
 */
export const DateOfBirthInput: React.FC<DateOfBirthInputProps> = ({
    value,
    onChange,
    onAgeCalculated,
    disabled = false,
    error,
    label = "",
    placeholder = "",
    className,
}) => {
    const { isMobile } = useResponsive();

    // Calculate age from birth date
    const calculateAge = useCallback((birthDate: Date): number => {
        const today = new Date();
        let age = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();

        if (
            monthDiff < 0 ||
            (monthDiff === 0 && today.getDate() < birthDate.getDate())
        ) {
            age--;
        }

        return Math.max(0, age);
    }, []);

    // Handle date change and age calculation
    const handleDateChange = useCallback(
        (newDate: Date | null) => {
            onChange(newDate);
            if (newDate) {
                const calculatedAge = calculateAge(newDate);
                onAgeCalculated(calculatedAge);
            } else {
                onAgeCalculated(null);
            }
        },
        [onChange, onAgeCalculated, calculateAge]
    );

    // Handle date picker change
    const handleDatePickerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const dateValue = e.target.value;
        if (dateValue) {
            const newDate = parseISODateAsTokyo(dateValue);
            handleDateChange(newDate);
        } else {
            handleDateChange(null);
        }
    };

    // Format date for HTML date input
    const formatDateForInput = (date: Date | null): string => {
        if (!date) return "";
        return toTokyoISODate(date);
    };

    const currentError = error || undefined;

    return (
        <div className={cn("space-y-2", className)}>
            {label && (
                <label
                    className={cn(
                        "block font-medium text-secondary-700",
                        isMobile ? "text-sm" : "text-sm"
                    )}
                >
                    {label}
                </label>
            )}

            <div
                className={cn(
                    "flex items-center",
                    isMobile ? "space-x-2" : "space-x-2"
                )}
            >
                <div className="flex-1">
                    <Input
                        type="date"
                        value={formatDateForInput(value)}
                        onChange={handleDatePickerChange}
                        placeholder={placeholder}
                        disabled={disabled}
                        error={currentError}
                        startIcon={
                            <Calendar className={cn(isMobile ? "h-4 w-4" : "h-4 w-4")} />
                        }
                        size={isMobile ? "default" : "default"}
                    />
                </div>
            </div>

            {currentError && (
                <p
                    className={cn(
                        "text-red-600",
                        isMobile ? "text-xs" : "text-sm"
                    )}
                    role="alert"
                >
                    {currentError}
                </p>
            )}

            {value && !currentError && (
                <p
                    className={cn(
                        "text-secondary-600",
                        isMobile ? "text-xs" : "text-sm"
                    )}
                >
                </p>
            )}
        </div>
    );
};
