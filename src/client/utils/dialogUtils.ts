import { StatusBadge } from "../components/ui/StandardDetailDialog";
import {
  getDisplayValue,
  formatCardDate,
  getProgressStatusColor,
  getStaffStatusColor,
  getCompanyStatusColor,
  getPropertyStatusColor,
  getInteractionTypeColor,
  getInteractionStatusColor,
  getInquiryTypeColor,
  getConditionStatusColor,
} from "../components/ui/cardUtils";

/**
 * Common dialog utility functions for consistent data formatting and display
 */

/**
 * Create status badges for different entity types
 */
export const createStatusBadges = {
  /**
   * Create badges for interaction records
   */
  interaction: (record: { type?: string; status?: string }): StatusBadge[] => {
    const badges: StatusBadge[] = [];

    if (record.type) {
      badges.push({
        text: record.type.charAt(0).toUpperCase() + record.type.slice(1),
        className: getInteractionTypeColor(record.type),
      });
    }

    if (record.status) {
      badges.push({
        text:
          record.status.charAt(0).toUpperCase() +
          record.status.slice(1).replace("-", " "),
        className: getInteractionStatusColor(record.status),
      });
    }

    return badges;
  },

  /**
   * Create badges for staff records
   */
  staff: (record: { status?: string }): StatusBadge[] => {
    const badges: StatusBadge[] = [];

    if (record.status) {
      badges.push({
        text:
          record.status.charAt(0).toUpperCase() +
          record.status.slice(1).replace("_", " "),
        className: getStaffStatusColor(record.status),
      });
    }

    return badges;
  },

  /**
   * Create badges for property records
   */
  property: (record: {
    status?: string;
    condition?: string;
  }): StatusBadge[] => {
    const badges: StatusBadge[] = [];

    if (record.status) {
      badges.push({
        text: record.status.charAt(0).toUpperCase() + record.status.slice(1),
        className: getPropertyStatusColor(record.status),
      });
    }

    if (record.condition) {
      badges.push({
        text:
          record.condition.charAt(0).toUpperCase() + record.condition.slice(1),
        className: getConditionStatusColor(record.condition),
      });
    }

    return badges;
  },

  /**
   * Create badges for complaint records
   */
  complaint: (record: {
    status?: string;
    priority?: string;
  }): StatusBadge[] => {
    const badges: StatusBadge[] = [];

    if (record.status) {
      badges.push({
        text:
          record.status.charAt(0).toUpperCase() +
          record.status.slice(1).replace("_", " "),
        className: getProgressStatusColor(record.status),
      });
    }

    if (record.priority) {
      const priorityColors = {
        low: "bg-green-100 text-green-800",
        medium: "bg-yellow-100 text-yellow-800",
        high: "bg-red-100 text-red-800",
        urgent: "bg-red-200 text-red-900",
      };
      badges.push({
        text:
          record.priority.charAt(0).toUpperCase() + record.priority.slice(1),
        className:
          priorityColors[record.priority as keyof typeof priorityColors] ||
          "bg-gray-100 text-gray-800",
      });
    }

    return badges;
  },

  /**
   * Create badges for inquiry records
   */
  inquiry: (record: { type?: string; status?: string }): StatusBadge[] => {
    const badges: StatusBadge[] = [];

    if (record.type) {
      badges.push({
        text: record.type.charAt(0).toUpperCase() + record.type.slice(1),
        className: getInquiryTypeColor(record.type),
      });
    }

    if (record.status) {
      badges.push({
        text:
          record.status.charAt(0).toUpperCase() +
          record.status.slice(1).replace("_", " "),
        className: getProgressStatusColor(record.status),
      });
    }

    return badges;
  },

  /**
   * Create badges for daily record entries
   */
  dailyRecord: (record: { status?: string }): StatusBadge[] => {
    const badges: StatusBadge[] = [];

    if (record.status) {
      badges.push({
        text:
          record.status.charAt(0).toUpperCase() +
          record.status.slice(1).replace("_", " "),
        className: getProgressStatusColor(record.status),
      });
    }

    return badges;
  },

  /**
   * Create badges for destination records
   */
  destination: (record: { status?: string }): StatusBadge[] => {
    const badges: StatusBadge[] = [];

    if (record.status) {
      badges.push({
        text: record.status.charAt(0).toUpperCase() + record.status.slice(1),
        className: getCompanyStatusColor(record.status),
      });
    }

    return badges;
  },
};

/**
 * Common field formatters for consistent display
 */
export const formatters = {
  /**
   * Format date fields consistently
   */
  date: (date: Date | string | null | undefined): string => {
    return formatCardDate(date);
  },

  /**
   * Format display values with fallback
   */
  text: (value: string | null | undefined): string => {
    return getDisplayValue(value);
  },

  /**
   * Format user references consistently
   */
  user: (
    user: { id?: number; name?: string } | null | undefined
  ): string => {
    if (!user) return getDisplayValue(null);
    return user.name || `User ${user.id}`;
  },

  /**
   * Format staff references consistently
   */
  staff: (
    staff:
      | { id?: number; name?: string; employeeId?: string }
      | null
      | undefined
  ): string => {
    if (!staff) return getDisplayValue(null);
    return staff.name || staff.employeeId || `Staff ${staff.id}`;
  },

  /**
   * Format company references consistently
   */
  company: (
    company: { id?: number; name?: string } | null | undefined
  ): string => {
    if (!company) return getDisplayValue(null);
    return company.name || `Company ${company.id}`;
  },
};

/**
 * Common dialog configuration helpers
 */
export const dialogConfig = {
  /**
   * Get record ID from different record types
   */
  getId: {
    string: (record: { id: string }): string => record.id,
    number: (record: { id: number }): string => record.id.toString(),
    auto: (record: { id: string | number }): string => record.id.toString(),
  },
};

/**
 * Error handling utilities for dialogs
 */
export const dialogErrors = {
  /**
   * Format error messages for user display
   */
  format: (error: unknown): string => {
    if (error instanceof Error) {
      return error.message;
    }
    if (typeof error === "string") {
      return error;
    }
    return "An unexpected error occurred";
  },

  /**
   * Check if error is a network error
   */
  isNetworkError: (error: unknown): boolean => {
    if (error instanceof Error) {
      return (
        error.message.toLowerCase().includes("network") ||
        error.message.toLowerCase().includes("fetch") ||
        error.message.toLowerCase().includes("connection")
      );
    }
    return false;
  },
};
