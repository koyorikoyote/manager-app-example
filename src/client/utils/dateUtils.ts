import {
  toTokyoISODate,
  parseISODateAsTokyo,
} from "../../shared/utils/timezone";

/**
 * Date utility functions for consistent date handling across the application
 */

/**
 * Formats a date value to YYYY-MM-DD format for backend submission
 * @param date - Date object, string, or null/undefined
 * @returns YYYY-MM-DD formatted string or null
 */
export const formatDateForBackend = (
  date: Date | string | null | undefined
): string | null => {
  if (!date) return null;

  // If already YYYY-MM-DD, pass through
  if (typeof date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return date;
  }

  // If it's a datetime string from database, extract just the date part
  if (typeof date === "string") {
    const dateMatch = date.match(/^(\d{4}-\d{2}-\d{2})/);
    if (dateMatch) {
      return dateMatch[1];
    }
  }

  const dateObj = typeof date === "string" ? new Date(date) : date;
  if (!(dateObj instanceof Date) || isNaN(dateObj.getTime())) return null;

  // Format to YYYY-MM-DD in Tokyo timezone
  const iso = toTokyoISODate(dateObj);
  return iso || null;
};

/**
 * Formats a date value for HTML date input display
 * @param date - Date object, string, or null/undefined
 * @returns YYYY-MM-DD formatted string or empty string
 */
export const formatDateForInput = (
  date: Date | string | null | undefined
): string => {
  const formatted = formatDateForBackend(date);
  return formatted || "";
};

/**
 * Converts a date input value to a Date object or null
 * @param value - Date input string value
 * @returns Date object or null
 */
export const parseDateFromInput = (value: string): Date | null => {
  if (!value || !value.trim()) return null;
  return parseISODateAsTokyo(value) ?? null;
};

/**
 * Validates if a date string is in YYYY-MM-DD format
 * @param dateString - Date string to validate
 * @returns boolean indicating if format is valid
 */
export const isValidDateFormat = (dateString: string): boolean => {
  return /^\d{4}-\d{2}-\d{2}$/.test(dateString);
};
