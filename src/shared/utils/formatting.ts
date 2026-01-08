import { TOKYO_TZ, calculateTokyoDaysPassed } from "./timezone";

// Shared formatting utilities

export const formatDate = (
  date: Date | string,
  locale: string = "en"
): string => {
  const dateObj = typeof date === "string" ? new Date(date) : date;

  if (locale === "ja") {
    return dateObj.toLocaleDateString("ja-JP", {
      timeZone: TOKYO_TZ,
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  }

  return dateObj.toLocaleDateString("en-US", {
    timeZone: TOKYO_TZ,
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

export const formatDateTime = (
  date: Date | string,
  locale: string = "en"
): string => {
  const dateObj = typeof date === "string" ? new Date(date) : date;

  if (locale === "ja") {
    return dateObj.toLocaleString("ja-JP", { timeZone: TOKYO_TZ });
  }

  return dateObj.toLocaleString("en-US", { timeZone: TOKYO_TZ });
};

export const calculateDaysPassed = (date: Date | string): number => {
  return calculateTokyoDaysPassed(date);
};
