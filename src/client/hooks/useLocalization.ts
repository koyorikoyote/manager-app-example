import { useLanguage } from '../contexts/LanguageContext';
import { formatDate, formatNumber, formatCurrency, formatTime, formatDateTime } from '../utils/localization';

/**
 * Custom hook that provides localized formatting functions
 */
export const useLocalization = () => {
  const { lang, t } = useLanguage();

  return {
    t,
    language: lang, // Keep backward compatibility for this hook
    formatDate: (date: Date, format?: 'short' | 'long' | 'dashboard') => formatDate(date, lang, format),
    formatNumber: (number: number) => formatNumber(number, lang),
    formatCurrency: (amount: number, currency?: string) => formatCurrency(amount, lang, currency),
    formatTime: (date: Date) => formatTime(date, lang),
    formatDateTime: (date: Date) => formatDateTime(date, lang),
  };
};