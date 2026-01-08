/**
 * Text utility functions for consistent text handling across components
 */

/**
 * Truncate text with ellipsis if it exceeds the specified length
 * @param text - The text to truncate
 * @param maxLength - Maximum length before truncation
 * @param suffix - Suffix to append when truncated (default: '...')
 * @returns Truncated text with suffix if needed
 */
export const truncateText = (
  text: string | null | undefined,
  maxLength: number,
  suffix: string = "..."
): string => {
  if (!text) return "";

  if (text.length <= maxLength) {
    return text;
  }

  return text.substring(0, maxLength) + suffix;
};

/**
 * Truncate text with responsive length based on screen size
 * @param text - The text to truncate
 * @param isMobile - Whether the current view is mobile
 * @param mobileLength - Maximum length for mobile (default: 30)
 * @param desktopLength - Maximum length for desktop (default: 50)
 * @param suffix - Suffix to append when truncated (default: '...')
 * @returns Truncated text with suffix if needed
 */
export const truncateTextResponsive = (
  text: string | null | undefined,
  isMobile: boolean,
  mobileLength: number = 30,
  desktopLength: number = 50,
  suffix: string = "..."
): string => {
  const maxLength = isMobile ? mobileLength : desktopLength;
  return truncateText(text, maxLength, suffix);
};

/**
 * Truncate text for accordion summary display
 * @param text - The text to truncate
 * @param isMobile - Whether the current view is mobile
 * @returns Truncated text optimized for accordion summaries
 */
export const truncateForAccordion = (
  text: string | null | undefined,
  isMobile: boolean
): string => {
  return truncateTextResponsive(text, isMobile, 25, 40);
};

/**
 * Get display value with fallback for null/undefined values
 * @param value - The value to display
 * @param fallback - Fallback text (default: '-')
 * @returns Display value or fallback
 */
export const getDisplayValue = (
  value: unknown,
  fallback: string = "-"
): string => {
  if (value === null || value === undefined || value === "") {
    return fallback;
  }
  return String(value);
};

/**
 * Format text for display with truncation and fallback
 * @param value - The value to format
 * @param maxLength - Maximum length before truncation
 * @param fallback - Fallback text for null/undefined values
 * @returns Formatted display text
 */
export const formatDisplayText = (
  value: unknown,
  maxLength?: number,
  fallback: string = "-"
): string => {
  const displayValue = getDisplayValue(value, fallback);

  if (maxLength && displayValue !== fallback) {
    return truncateText(displayValue, maxLength);
  }

  return displayValue;
};
