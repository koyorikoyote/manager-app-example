import { useSettings } from "../contexts/SettingsContext";
import { useLanguage } from "../contexts/LanguageContext";
import { TOKYO_TZ, toTokyoISODate } from "../../shared/utils/timezone";

export const useFormatting = () => {
  const { preferences } = useSettings();
  const { lang } = useLanguage();

  const formatDate = (date: Date | string): string => {
    const dateObj = typeof date === "string" ? new Date(date) : date;

    if (isNaN(dateObj.getTime())) {
      return "Invalid Date";
    }

    const locale = lang === "ja" ? "ja-JP" : "en-US";

    switch (preferences.dateFormat) {
      case "MM/dd/yyyy":
        return dateObj.toLocaleDateString("en-US", {
          timeZone: TOKYO_TZ,
          month: "2-digit",
          day: "2-digit",
          year: "numeric",
        });
      case "dd/MM/yyyy":
        return dateObj.toLocaleDateString("en-GB", {
          timeZone: TOKYO_TZ,
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
        });
      case "yyyy-MM-dd":
        return toTokyoISODate(dateObj);
      default:
        return dateObj.toLocaleDateString(locale, { timeZone: TOKYO_TZ });
    }
  };

  const formatTime = (date: Date | string): string => {
    const dateObj = typeof date === "string" ? new Date(date) : date;

    if (isNaN(dateObj.getTime())) {
      return "Invalid Time";
    }

    const locale = lang === "ja" ? "ja-JP" : "en-US";

    return dateObj.toLocaleTimeString(locale, {
      timeZone: TOKYO_TZ,
      hour12: preferences.timeFormat === "12h",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatDateTime = (date: Date | string): string => {
    const dateObj = typeof date === "string" ? new Date(date) : date;

    if (isNaN(dateObj.getTime())) {
      return "Invalid DateTime";
    }

    return `${formatDate(dateObj)} ${formatTime(dateObj)}`;
  };

  const formatNumber = (
    num: number,
    options?: Intl.NumberFormatOptions
  ): string => {
    const locale = lang === "ja" ? "ja-JP" : "en-US";
    return new Intl.NumberFormat(locale, options).format(num);
  };

  const formatCurrency = (amount: number, currency: string = "USD"): string => {
    const locale = lang === "ja" ? "ja-JP" : "en-US";
    const currencyCode = lang === "ja" && currency === "USD" ? "JPY" : currency;

    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency: currencyCode,
    }).format(amount);
  };

  // Format date for dashboard display (MM/dd(ddd) format as specified in requirements)
  const formatDashboardDate = (date: Date | string = new Date()): string => {
    const dateObj = typeof date === "string" ? new Date(date) : date;

    if (isNaN(dateObj.getTime())) {
      return "Invalid Date";
    }

    const locale = lang === "ja" ? "ja-JP" : "en-US";

    // Get month, day, and day of week
    const month = dateObj.toLocaleDateString(locale, {
      month: "2-digit",
      timeZone: TOKYO_TZ,
    });
    const day = dateObj.toLocaleDateString(locale, {
      day: "2-digit",
      timeZone: TOKYO_TZ,
    });
    const dayOfWeek = dateObj.toLocaleDateString(locale, {
      weekday: "short",
      timeZone: TOKYO_TZ,
    });

    return `${month}/${day}(${dayOfWeek})`;
  };

  return {
    formatDate,
    formatTime,
    formatDateTime,
    formatNumber,
    formatCurrency,
    formatDashboardDate,
    preferences,
  };
};
