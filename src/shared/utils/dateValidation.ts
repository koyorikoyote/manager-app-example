// Enhanced date validation utilities for date of birth and other date fields

export interface DateValidationResult {
  isValid: boolean;
  error?: string;
  parsedDate?: Date;
}

export interface DateValidationOptions {
  allowFuture?: boolean;
  minDate?: Date;
  maxDate?: Date;
  minAge?: number;
  maxAge?: number;
}

/**
 * Validates a date of birth with comprehensive checks
 */
export const validateDateOfBirth = (
  value: Date | string | null | undefined
): DateValidationResult => {
  if (!value) {
    return { isValid: true }; // Optional field
  }

  const date = typeof value === "string" ? new Date(value) : value;

  // Check if date is valid
  if (isNaN(date.getTime())) {
    return {
      isValid: false,
      error: "Please enter a valid date",
    };
  }

  const today = new Date();
  const minDate = new Date(1900, 0, 1); // January 1, 1900

  // Date cannot be in the future
  if (date > today) {
    return {
      isValid: false,
      error: "Date of birth cannot be in the future",
    };
  }

  // Date cannot be before 1900
  if (date < minDate) {
    return {
      isValid: false,
      error: "Date of birth must be after January 1, 1900",
    };
  }

  // Calculate age and validate reasonable range
  const age = calculateAge(date);
  if (age > 150) {
    return {
      isValid: false,
      error: "Calculated age seems unrealistic (over 150 years)",
    };
  }

  if (age < 0) {
    return {
      isValid: false,
      error: "Invalid date of birth",
    };
  }

  return {
    isValid: true,
    parsedDate: date,
  };
};

/**
 * Validates manual date input in YYYY/MM/DD format
 */
export const validateManualDateInput = (
  input: string
): DateValidationResult => {
  if (!input || input.trim() === "") {
    return { isValid: true }; // Optional field
  }

  const dateRegex = /^(\d{4})\/(\d{1,2})\/(\d{1,2})$/;
  const match = input.match(dateRegex);

  if (!match) {
    return {
      isValid: false,
      error: "Date must be in YYYY/MM/DD format",
    };
  }

  const [, year, month, day] = match;
  const yearNum = parseInt(year);
  const monthNum = parseInt(month);
  const dayNum = parseInt(day);

  // Basic range checks
  if (monthNum < 1 || monthNum > 12) {
    return {
      isValid: false,
      error: "Month must be between 1 and 12",
    };
  }

  if (dayNum < 1 || dayNum > 31) {
    return {
      isValid: false,
      error: "Day must be between 1 and 31",
    };
  }

  // Create date and validate it's real
  const date = new Date(yearNum, monthNum - 1, dayNum);

  if (
    date.getFullYear() !== yearNum ||
    date.getMonth() !== monthNum - 1 ||
    date.getDate() !== dayNum
  ) {
    return {
      isValid: false,
      error: "Invalid date (e.g., February 30th doesn't exist)",
    };
  }

  // Use date of birth validation for additional checks
  return validateDateOfBirth(date);
};

/**
 * Validates a general date with configurable options
 */
export const validateDate = (
  value: Date | string | null | undefined,
  options: DateValidationOptions = {}
): DateValidationResult => {
  if (!value) {
    return { isValid: true }; // Optional field
  }

  const date = typeof value === "string" ? new Date(value) : value;

  // Check if date is valid
  if (isNaN(date.getTime())) {
    return {
      isValid: false,
      error: "Please enter a valid date",
    };
  }

  const today = new Date();

  // Check future dates
  if (!options.allowFuture && date > today) {
    return {
      isValid: false,
      error: "Date cannot be in the future",
    };
  }

  // Check minimum date
  if (options.minDate && date < options.minDate) {
    return {
      isValid: false,
      error: `Date must be after ${options.minDate.toLocaleDateString()}`,
    };
  }

  // Check maximum date
  if (options.maxDate && date > options.maxDate) {
    return {
      isValid: false,
      error: `Date must be before ${options.maxDate.toLocaleDateString()}`,
    };
  }

  // Check age constraints if provided
  if (options.minAge !== undefined || options.maxAge !== undefined) {
    const age = calculateAge(date);

    if (options.minAge !== undefined && age < options.minAge) {
      return {
        isValid: false,
        error: `Age must be at least ${options.minAge} years`,
      };
    }

    if (options.maxAge !== undefined && age > options.maxAge) {
      return {
        isValid: false,
        error: `Age cannot exceed ${options.maxAge} years`,
      };
    }
  }

  return {
    isValid: true,
    parsedDate: date,
  };
};

/**
 * Calculate age from date of birth
 */
export const calculateAge = (birthDate: Date): number => {
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
};

/**
 * Format date for display in different locales
 */
export const formatDateForDisplay = (
  date: Date,
  locale: string = "en-US"
): string => {
  return date.toLocaleDateString(locale, {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
};

/**
 * Parse date from various input formats
 */
export const parseDate = (
  input: string | Date | null | undefined
): Date | null => {
  if (!input) return null;
  if (input instanceof Date) return input;

  // Try parsing as ISO string first
  const isoDate = new Date(input);
  if (!isNaN(isoDate.getTime())) {
    return isoDate;
  }

  // Try parsing manual format YYYY/MM/DD
  const manualResult = validateManualDateInput(input);
  if (manualResult.isValid && manualResult.parsedDate) {
    return manualResult.parsedDate;
  }

  return null;
};
