import { useCallback } from "react";
import { useLanguage } from "../contexts/LanguageContext";
import {
  formatDialogField,
  createDialogField,
  createStatusBadges,
  createDialogSections,
  createDialogTitle,
  getDisplayValue,
} from "../components/ui/cardUtils";
import { EMPTY_STATE } from "../components/ui/cardStyles";

export interface DialogField {
  label: string;
  value: string;
  isEmpty: boolean;
}

export interface DialogSection {
  title?: string;
  fields: DialogField[];
}

export interface StatusBadge {
  text: string;
  className: string;
}

export interface UseDialogFormattingReturn {
  formatField: (
    value: string | number | Date | null | undefined,
    type?: "text" | "date" | "number"
  ) => string;
  createField: (
    label: string,
    value: string | number | Date | null | undefined,
    type?: "text" | "date" | "number"
  ) => DialogField;
  createSections: (
    sections: Array<{
      title?: string;
      fields: Array<{
        label: string;
        value: string | number | Date | null | undefined;
        type?: "text" | "date" | "number";
      }>;
    }>
  ) => DialogSection[];
  createBadges: (
    statuses: Array<{ key: string; value: string; type?: string }>
  ) => StatusBadge[];
  createTitle: (baseTitle: string, identifier?: string | number) => string;
  getDisplayValue: (value: string | null | undefined) => string;
  formatDateTime: (date: Date | string | null | undefined) => string;
  formatDate: (date: Date | string | null | undefined) => string;
  formatTime: (date: Date | string | null | undefined) => string;
  formatNumber: (value: number | string | null | undefined) => string;
  formatCurrency: (
    amount: number | string | null | undefined,
    currency?: string
  ) => string;
  formatBoolean: (
    value: boolean | null | undefined,
    trueText?: string,
    falseText?: string
  ) => string;
  formatList: (
    items: string[] | null | undefined,
    separator?: string
  ) => string;
  truncateText: (text: string | null | undefined, maxLength: number) => string;
}

export const useDialogFormatting = (): UseDialogFormattingReturn => {
  const { t, lang } = useLanguage();

  // Format field value with type-specific formatting
  const formatField = useCallback(
    (
      value: string | number | Date | null | undefined,
      type: "text" | "date" | "number" = "text"
    ): string => {
      return formatDialogField(value, type);
    },
    []
  );

  // Create dialog field with label and formatted value
  const createField = useCallback(
    (
      label: string,
      value: string | number | Date | null | undefined,
      type: "text" | "date" | "number" = "text"
    ): DialogField => {
      return createDialogField(label, value, type);
    },
    []
  );

  // Create dialog sections with formatted fields
  const createSections = useCallback(
    (
      sections: Array<{
        title?: string;
        fields: Array<{
          label: string;
          value: string | number | Date | null | undefined;
          type?: "text" | "date" | "number";
        }>;
      }>
    ): DialogSection[] => {
      return createDialogSections(sections);
    },
    []
  );

  // Create status badges with consistent styling
  const createBadges = useCallback(
    (
      statuses: Array<{ key: string; value: string; type?: string }>
    ): StatusBadge[] => {
      return createStatusBadges(statuses);
    },
    []
  );

  // Create dialog title with identifier
  const createTitle = useCallback(
    (baseTitle: string, identifier?: string | number): string => {
      return createDialogTitle(baseTitle, identifier);
    },
    []
  );

  // Format date and time with locale support
  const formatDateTime = useCallback(
    (date: Date | string | null | undefined): string => {
      if (!date) return EMPTY_STATE.placeholder;

      try {
        const dateObj = typeof date === "string" ? new Date(date) : date;
        if (isNaN(dateObj.getTime())) return EMPTY_STATE.placeholder;

        const locale = lang === "ja" ? "ja-JP" : "en-US";
        return dateObj.toLocaleString(locale, {
          year: "numeric",
          month: "short",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        });
      } catch {
        return EMPTY_STATE.placeholder;
      }
    },
    [lang]
  );

  // Format date only
  const formatDate = useCallback(
    (date: Date | string | null | undefined): string => {
      if (!date) return EMPTY_STATE.placeholder;

      try {
        const dateObj = typeof date === "string" ? new Date(date) : date;
        if (isNaN(dateObj.getTime())) return EMPTY_STATE.placeholder;

        const locale = lang === "ja" ? "ja-JP" : "en-US";
        return dateObj.toLocaleDateString(locale, {
          year: "numeric",
          month: "short",
          day: "numeric",
        });
      } catch {
        return EMPTY_STATE.placeholder;
      }
    },
    [lang]
  );

  // Format time only
  const formatTime = useCallback(
    (date: Date | string | null | undefined): string => {
      if (!date) return EMPTY_STATE.placeholder;

      try {
        const dateObj = typeof date === "string" ? new Date(date) : date;
        if (isNaN(dateObj.getTime())) return EMPTY_STATE.placeholder;

        const locale = lang === "ja" ? "ja-JP" : "en-US";
        return dateObj.toLocaleTimeString(locale, {
          hour: "2-digit",
          minute: "2-digit",
        });
      } catch {
        return EMPTY_STATE.placeholder;
      }
    },
    [lang]
  );

  // Format number with locale support
  const formatNumber = useCallback(
    (value: number | string | null | undefined): string => {
      if (value === null || value === undefined || value === "") {
        return EMPTY_STATE.placeholder;
      }

      const numValue = typeof value === "string" ? parseFloat(value) : value;
      if (isNaN(numValue)) return EMPTY_STATE.placeholder;

      const locale = lang === "ja" ? "ja-JP" : "en-US";
      return numValue.toLocaleString(locale);
    },
    [lang]
  );

  // Format currency with locale support
  const formatCurrency = useCallback(
    (
      amount: number | string | null | undefined,
      currency: string = "JPY"
    ): string => {
      if (amount === null || amount === undefined || amount === "") {
        return EMPTY_STATE.placeholder;
      }

      const numAmount =
        typeof amount === "string" ? parseFloat(amount) : amount;
      if (isNaN(numAmount)) return EMPTY_STATE.placeholder;

      const locale = lang === "ja" ? "ja-JP" : "en-US";
      return numAmount.toLocaleString(locale, {
        style: "currency",
        currency: currency,
      });
    },
    [lang]
  );

  // Format boolean values
  const formatBoolean = useCallback(
    (
      value: boolean | null | undefined,
      trueText: string = t("common.responses.yes"),
      falseText: string = t("common.responses.no")
    ): string => {
      if (value === null || value === undefined) {
        return EMPTY_STATE.placeholder;
      }
      return value ? trueText : falseText;
    },
    [t]
  );

  // Format array of strings as a list
  const formatList = useCallback(
    (items: string[] | null | undefined, separator: string = ", "): string => {
      if (!items || items.length === 0) {
        return EMPTY_STATE.placeholder;
      }
      return items.filter(Boolean).join(separator);
    },
    []
  );

  // Truncate text with ellipsis
  const truncateText = useCallback(
    (text: string | null | undefined, maxLength: number): string => {
      if (!text) return EMPTY_STATE.placeholder;

      if (text.length <= maxLength) return text;
      return text.substring(0, maxLength - 3) + "...";
    },
    []
  );

  return {
    formatField,
    createField,
    createSections,
    createBadges,
    createTitle,
    getDisplayValue,
    formatDateTime,
    formatDate,
    formatTime,
    formatNumber,
    formatCurrency,
    formatBoolean,
    formatList,
    truncateText,
  };
};
