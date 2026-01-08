import { Language } from "../contexts/LanguageContext";
import { TOKYO_TZ, toTokyoISODate } from "../../shared/utils/timezone";

/**
 * Format date according to the specified language locale
 */
export const formatDate = (
  date: Date,
  language: Language,
  format: "short" | "long" | "dashboard" = "short"
): string => {
  const locale = language === "ja" ? "ja-JP" : "en-US";

  if (format === "dashboard") {
    // Special format for dashboard: MM/dd(ddd)
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const dayOfWeek = date.toLocaleDateString(locale, {
      weekday: "short",
      timeZone: TOKYO_TZ,
    });
    return `${month}/${day}(${dayOfWeek})`;
  }

  const options: Intl.DateTimeFormatOptions =
    format === "long"
      ? { year: "numeric", month: "long", day: "numeric" }
      : { year: "numeric", month: "short", day: "numeric" };

  return date.toLocaleDateString(locale, { ...options, timeZone: TOKYO_TZ });
};

/**
 * Format number according to the specified language locale
 */
export const formatNumber = (number: number, language: Language): string => {
  const locale = language === "ja" ? "ja-JP" : "en-US";
  return number.toLocaleString(locale);
};

/**
 * Format numeric range for display according to language locale
 */
export const formatNumericRange = (
  min: number,
  max: number,
  language: Language
): string => {
  const locale = language === "ja" ? "ja-JP" : "en-US";
  const formattedMin = min.toLocaleString(locale);
  const formattedMax = max.toLocaleString(locale);

  // Use culturally appropriate range separators
  const separator = language === "ja" ? "〜" : " to ";
  return `${formattedMin}${separator}${formattedMax}`;
};

/**
 * Format percentage according to the specified language locale
 */
export const formatPercentage = (
  value: number,
  language: Language,
  decimals: number = 1
): string => {
  const locale = language === "ja" ? "ja-JP" : "en-US";
  return new Intl.NumberFormat(locale, {
    style: "percent",
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value / 100);
};

/**
 * Localize a numeric range object by updating its label
 */
export const localizeNumericRange = (
  range: { label: string; min: number; max: number; count?: number },
  language: Language
): { label: string; min: number; max: number; count?: number } => {
  return {
    ...range,
    label: formatNumericRange(range.min, range.max, language),
  };
};

/**
 * Format date range for display according to language locale
 */
export const formatDateRange = (
  startDate: Date | null,
  endDate: Date | null,
  language: Language
): string => {
  const locale = language === "ja" ? "ja-JP" : "en-US";
  const options: Intl.DateTimeFormatOptions = {
    year: "numeric",
    month: "short",
    day: "numeric",
  };

  if (!startDate && !endDate) return "";
  if (!startDate)
    return `〜 ${endDate!.toLocaleDateString(locale, {
      ...options,
      timeZone: TOKYO_TZ,
    })}`;
  if (!endDate)
    return `${startDate.toLocaleDateString(locale, {
      ...options,
      timeZone: TOKYO_TZ,
    })} 〜`;

  const separator = language === "ja" ? " 〜 " : " to ";
  return `${startDate.toLocaleDateString(locale, {
    ...options,
    timeZone: TOKYO_TZ,
  })}${separator}${endDate.toLocaleDateString(locale, {
    ...options,
    timeZone: TOKYO_TZ,
  })}`;
};

/**
 * Format currency according to the specified language locale
 */
export const formatCurrency = (
  amount: number,
  language: Language,
  currency: string = "JPY"
): string => {
  const locale = language === "ja" ? "ja-JP" : "en-US";
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: currency,
  }).format(amount);
};

/**
 * Format time according to the specified language locale
 */
export const formatTime = (date: Date, language: Language): string => {
  const locale = language === "ja" ? "ja-JP" : "en-US";
  return date.toLocaleTimeString(locale, {
    timeZone: TOKYO_TZ,
    hour: "2-digit",
    minute: "2-digit",
  });
};

/**
 * Format date for datatable display in YYYY/MM/DD format
 * Returns empty string for null/invalid dates instead of NaN
 * For datetime fields from database, extracts just the date part without timezone conversion
 */
export const formatDateForTable = (
  date: Date | string | null | undefined
): string => {
  if (!date) return "";
  try {
    // If it's a string, check if it's an ISO datetime string from database
    if (typeof date === "string") {
      // Extract just the date part (YYYY-MM-DD) from datetime strings like "2024-01-04T23:30:00.000Z"
      const dateMatch = date.match(/^(\d{4}-\d{2}-\d{2})/);
      if (dateMatch) {
        return dateMatch[1].replace(/-/g, "/");
      }
    }

    // For Date objects, use timezone-aware formatting
    const base = typeof date === "string" ? new Date(date) : date;
    const iso = toTokyoISODate(base);
    return iso ? iso.replace(/-/g, "/") : "";
  } catch {
    return "";
  }
};

/**
 * Format datetime according to the specified language locale
 */
export const formatDateTime = (date: Date, language: Language): string => {
  const locale = language === "ja" ? "ja-JP" : "en-US";
  return date.toLocaleString(locale, {
    timeZone: TOKYO_TZ,
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};
