/**
 * Column Helper Utilities for DataTable Integration
 *
 * This module provides reusable column definition helpers for creating
 * consistent table columns across different data types in the Manager App.
 *
 * Features:
 * - Responsive column visibility based on screen size
 * - Memoized cell components for performance optimization
 * - Consistent formatting for common data types (status, dates, links)
 * - Mobile-optimized column configurations
 * - Accessibility-compliant cell rendering
 */
import * as React from "react";

import { cn } from "./cn";
import { toTokyoISODate } from "../../shared/utils/timezone";

/**
 * Column priority levels for responsive visibility
 */
export enum ColumnPriority {
  ESSENTIAL = 1, // Always visible (name, title, primary identifier)
  HIGH = 2, // Visible on tablet and desktop
  MEDIUM = 3, // Visible on desktop only
  LOW = 4, // Visible on large desktop only
}

/**
 * Extended column definition with responsive priority
 */
export interface ResponsiveColumnDef<T extends Record<string, unknown>> {
  accessorKey?: string;
  header?: string | (({ table }: { table: any }) => React.ReactElement);
  id?: string;
  cell?: ({ row }: { row: { original: T } | any }) => React.ReactElement | null;
  filterFn?: (row: any, id: string, value: any) => boolean;
  sortingFn?: (rowA: any, rowB: any, columnId: string) => number;
  priority?: ColumnPriority;
  mobileHeader?: string; // Shorter header for mobile
  enableSorting?: boolean;
  enableHiding?: boolean;
}

// Memoized cell components for better performance
const MemoizedStatusCell = React.memo<{
  status: string;
  getStatusColor: (status: string) => string;
}>(function MemoizedStatusCell({ status, getStatusColor }) {
  if (!status) {
    return React.createElement("span", { className: "text-neutral-400" }, "--");
  }

  return React.createElement(
    "span",
    {
      className: cn(
        "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium",
        getStatusColor(status)
      ),
    },
    status
  );
});

const MemoizedDateCell = React.memo<{
  date: unknown;
  options: Intl.DateTimeFormatOptions;
}>(function MemoizedDateCell({ date, options: _options }) {
  if (!date) {
    return React.createElement("span", { className: "text-neutral-400" }, "");
  }

  try {
    const dateObj = new Date(date as string | number | Date);
    if (isNaN(dateObj.getTime())) {
      return React.createElement("span", { className: "text-neutral-400" }, "");
    }

    // Use YYYY/MM/DD in Tokyo timezone
    const iso = toTokyoISODate(dateObj);
    const formattedDate = iso ? iso.replace(/-/g, "/") : "";

    return React.createElement(
      "span",
      { className: "text-neutral-900" },
      formattedDate
    );
  } catch {
    return React.createElement("span", { className: "text-neutral-400" }, "");
  }
});

const MemoizedLinkCell = React.memo<{
  value: unknown;
  linkType: "email" | "website" | "phone";
}>(function MemoizedLinkCell({ value, linkType }) {
  if (!value) {
    return React.createElement("span", { className: "text-neutral-400" }, "--");
  }

  let href: string;
  let target: string | undefined;
  let rel: string | undefined;

  const valueStr = String(value);

  switch (linkType) {
    case "email":
      href = `mailto:${valueStr}`;
      break;
    case "phone":
      href = `tel:${valueStr}`;
      break;
    case "website":
      href = valueStr.startsWith("http") ? valueStr : `https://${valueStr}`;
      target = "_blank";
      rel = "noopener noreferrer";
      break;
    default:
      href = valueStr;
  }

  return React.createElement(
    "a",
    {
      href,
      target,
      rel,
      className:
        "text-primary-600 hover:text-primary-800 hover:underline transition-colors",
      onClick: (e: React.MouseEvent) => e.stopPropagation(),
    },
    valueStr
  );
});

const MemoizedNavigationCell = React.memo<{
  value: unknown;
  onNavigate?: (row: Record<string, unknown>) => void;
  row: Record<string, unknown>;
}>(function MemoizedNavigationCell({ value, onNavigate, row }) {
  if (!value) {
    return React.createElement("span", { className: "text-neutral-400" }, "--");
  }

  if (onNavigate) {
    return React.createElement(
      "button",
      {
        className:
          "text-left text-primary-600 hover:text-primary-800 hover:underline font-medium transition-colors",
        onClick: (e: React.MouseEvent) => {
          e.stopPropagation();
          onNavigate(row);
        },
      },
      String(value)
    );
  }

  return React.createElement(
    "span",
    { className: "font-medium text-neutral-900" },
    String(value)
  );
});

const MemoizedTextCell = React.memo<{
  value: unknown;
  maxLength?: number;
  showTooltip: boolean;
}>(function MemoizedTextCell({ value, maxLength, showTooltip }) {
  if (!value) {
    return React.createElement("span", { className: "text-neutral-400" }, "--");
  }

  const text = String(value);
  const shouldTruncate = maxLength && text.length > maxLength;
  const displayText = shouldTruncate ? `${text.slice(0, maxLength)}...` : text;

  const props: Record<string, unknown> = {
    className: "text-neutral-900",
  };

  if (shouldTruncate && showTooltip) {
    props.title = text;
  }

  return React.createElement("span", props, displayText);
});

const MemoizedNumericCell = React.memo<{
  value: unknown;
  formatter?: (value: number) => string;
}>(function MemoizedNumericCell({ value, formatter }) {
  if (value == null) {
    return React.createElement("span", { className: "text-neutral-400" }, "--");
  }

  const numValue = Number(value);
  if (isNaN(numValue)) {
    return React.createElement("span", { className: "text-neutral-400" }, "--");
  }

  const displayValue = formatter ? formatter(numValue) : numValue.toString();

  return React.createElement(
    "span",
    { className: "text-neutral-900 font-mono" },
    displayValue
  );
});

const MemoizedCountCell = React.memo<{
  value: unknown;
  singularLabel: string;
  pluralLabel: string;
}>(function MemoizedCountCell({ value, singularLabel, pluralLabel }) {
  let count: number;
  if (Array.isArray(value)) {
    count = value.length;
  } else if (typeof value === "number") {
    count = value;
  } else {
    count = 0;
  }

  const label = count === 1 ? singularLabel : pluralLabel;
  const displayText = `${count} ${label}`;

  return React.createElement(
    "span",
    {
      className: cn("text-neutral-900", count === 0 && "text-neutral-400"),
    },
    displayText
  );
});

/**
 * Create a status column with colored badges (optimized with memoized cells)
 */
export const createStatusColumn = <T extends Record<string, unknown>>(
  accessor: keyof T,
  header: string = "Status",
  getStatusColor: (status: string) => string,
  priority: ColumnPriority = ColumnPriority.HIGH,
  mobileHeader?: string
): ResponsiveColumnDef<T> => ({
  accessorKey: accessor as string,
  header,
  priority,
  mobileHeader,
  cell: ({ row }: { row: { original: T } }) =>
    React.createElement(MemoizedStatusCell, {
      status: row.original[accessor] as string,
      getStatusColor,
    }),
  filterFn: (row: any, id: string, value: any) => {
    if (!value || value.length === 0) return true;
    return value.includes(row.getValue(id));
  },
});

/**
 * Create a date column with locale-appropriate formatting (optimized)
 */
export const createDateColumn = <T extends Record<string, unknown>>(
  accessor: keyof T,
  header: string,
  options: Intl.DateTimeFormatOptions = {
    year: "numeric",
    month: "short",
    day: "numeric",
  },
  priority: ColumnPriority = ColumnPriority.MEDIUM,
  mobileHeader?: string
): ResponsiveColumnDef<T> => ({
  accessorKey: accessor as string,
  header,
  priority,
  mobileHeader,
  cell: ({ row }: { row: { original: T } }) =>
    React.createElement(MemoizedDateCell, {
      date: row.original[accessor],
      options,
    }),
  sortingFn: (rowA: any, rowB: any, _columnId: string) => {
    const dateA = new Date(rowA.original[accessor] as string | number | Date);
    const dateB = new Date(rowB.original[accessor] as string | number | Date);

    if (isNaN(dateA.getTime()) && isNaN(dateB.getTime())) return 0;
    if (isNaN(dateA.getTime())) return 1;
    if (isNaN(dateB.getTime())) return -1;

    return dateA.getTime() - dateB.getTime();
  },
});

/**
 * Create a clickable link column (email, website, phone) (optimized)
 */
export const createLinkColumn = <T extends Record<string, unknown>>(
  accessor: keyof T,
  header: string,
  linkType: "email" | "website" | "phone",
  priority: ColumnPriority = ColumnPriority.LOW,
  mobileHeader?: string
): ResponsiveColumnDef<T> => ({
  accessorKey: accessor as string,
  header,
  priority,
  mobileHeader,
  cell: ({ row }: { row: { original: T } }) =>
    React.createElement(MemoizedLinkCell, {
      value: row.original[accessor],
      linkType,
    }),
});

/**
 * Create a clickable name/title column that navigates to detail page (optimized)
 */
export const createNavigationColumn = <T extends Record<string, unknown>>(
  accessor: keyof T,
  header: string,
  onNavigate?: (row: T) => void,
  priority: ColumnPriority = ColumnPriority.ESSENTIAL,
  mobileHeader?: string
): ResponsiveColumnDef<T> => ({
  accessorKey: accessor as string,
  header,
  priority,
  mobileHeader,
  cell: ({ row }: { row: { original: T } }) =>
    React.createElement(MemoizedNavigationCell, {
      value: row.original[accessor],
      onNavigate: onNavigate as
        | ((row: Record<string, unknown>) => void)
        | undefined,
      row: row.original,
    }),
});

/**
 * Create a text column with optional truncation (optimized)
 */
export const createTextColumn = <T extends Record<string, unknown>>(
  accessor: keyof T,
  header: string,
  maxLength?: number,
  showTooltip: boolean = true,
  priority: ColumnPriority = ColumnPriority.MEDIUM,
  mobileHeader?: string
): ResponsiveColumnDef<T> => ({
  accessorKey: accessor as string,
  header,
  priority,
  mobileHeader,
  cell: ({ row }: { row: { original: T } }) =>
    React.createElement(MemoizedTextCell, {
      value: row.original[accessor],
      maxLength,
      showTooltip,
    }),
});

/**
 * Create a numeric column with optional formatting (optimized)
 */
export const createNumericColumn = <T extends Record<string, unknown>>(
  accessor: keyof T,
  header: string,
  formatter?: (value: number) => string,
  priority: ColumnPriority = ColumnPriority.MEDIUM,
  mobileHeader?: string
): ResponsiveColumnDef<T> => ({
  accessorKey: accessor as string,
  header,
  priority,
  mobileHeader,
  cell: ({ row }: { row: { original: T } }) =>
    React.createElement(MemoizedNumericCell, {
      value: row.original[accessor],
      formatter,
    }),
  sortingFn: (rowA: any, rowB: any, _columnId: string) => {
    const numA = Number(rowA.original[accessor]) || 0;
    const numB = Number(rowB.original[accessor]) || 0;
    return numA - numB;
  },
});

/**
 * Create a count column (e.g., for document counts, relationship counts) (optimized)
 */
export const createCountColumn = <T extends Record<string, unknown>>(
  accessor: keyof T,
  header: string,
  singularLabel: string,
  pluralLabel: string,
  priority: ColumnPriority = ColumnPriority.MEDIUM,
  mobileHeader?: string
): ResponsiveColumnDef<T> => ({
  accessorKey: accessor as string,
  header,
  priority,
  mobileHeader,
  cell: ({ row }: { row: { original: T } }) =>
    React.createElement(MemoizedCountCell, {
      value: row.original[accessor],
      singularLabel,
      pluralLabel,
    }),
  sortingFn: (rowA: any, rowB: any, _columnId: string) => {
    const getCount = (val: unknown) => {
      if (Array.isArray(val)) return val.length;
      if (typeof val === "number") return val;
      return 0;
    };

    const countA = getCount(rowA.original[accessor]);
    const countB = getCount(rowB.original[accessor]);
    return countA - countB;
  },
});

/**
 * Status color helper functions for common status types
 */
export const statusColorHelpers = {
  /**
   * Get color classes for staff status
   */
  getStaffStatusColor: (status: string): string => {
    switch (status) {
      case "ACTIVE":
        return "bg-green-100 text-green-800 border-green-200";
      case "INACTIVE":
        return "bg-gray-100 text-gray-800 border-gray-200";
      case "TERMINATED":
        return "bg-red-100 text-red-800 border-red-200";
      case "ON_LEAVE":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  },

  /**
   * Get color classes for property status
   */
  getPropertyStatusColor: (status: string): string => {
    switch (status) {
      case "ACTIVE":
      case "active":
        return "bg-green-100 text-green-800 border-green-200";
      case "INACTIVE":
      case "inactive":
        return "bg-gray-100 text-gray-800 border-gray-200";
      case "UNDER_CONSTRUCTION":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "SOLD":
        return "bg-purple-100 text-purple-800 border-purple-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  },

  /**
   * Get color classes for interaction status
   */
  getInteractionStatusColor: (status: string): string => {
    switch (status) {
      case "open":
        return "bg-red-100 text-red-800 border-red-200";
      case "in-progress":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "resolved":
        return "bg-green-100 text-green-800 border-green-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  },

  /**
   * Get color classes for company/destination status
   */
  getCompanyStatusColor: (status: string): string => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800 border-green-200";
      case "inactive":
        return "bg-gray-100 text-gray-800 border-gray-200";
      case "suspended":
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  },

  /**
   * Get color classes for interaction type
   */
  getInteractionTypeColor: (type: string): string => {
    switch (type) {
      case "discussion":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "interview":
        return "bg-purple-100 text-purple-800 border-purple-200";
      case "consultation":
        return "bg-green-100 text-green-800 border-green-200";
      case "other":
        return "bg-orange-100 text-orange-800 border-orange-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  },
};

/**
 * Get column visibility configuration based on screen size and column priorities (memoized)
 */
export const getResponsiveColumnVisibility = <
  T extends Record<string, unknown>
>(
  columns: ResponsiveColumnDef<T>[],
  isMobile: boolean,
  isTablet: boolean
): Record<string, boolean> => {
  const visibility: Record<string, boolean> = {};

  columns.forEach((column) => {
    const columnId = column.accessorKey || column.id;
    if (!columnId) return;

    const priority = column.priority || ColumnPriority.MEDIUM;

    if (isMobile) {
      // On mobile, only show essential columns
      visibility[columnId] = priority === ColumnPriority.ESSENTIAL;
    } else if (isTablet) {
      // On tablet, show essential and high priority columns
      visibility[columnId] = priority <= ColumnPriority.HIGH;
    } else {
      // On desktop, show all columns except low priority on smaller desktops
      visibility[columnId] = true;
    }
  });

  return visibility;
};

/**
 * Get mobile-optimized column definitions with shorter headers (memoized)
 */
export const getMobileOptimizedColumns = <T extends Record<string, unknown>>(
  columns: ResponsiveColumnDef<T>[],
  isMobile: boolean
): ResponsiveColumnDef<T>[] => {
  if (!isMobile) return columns;

  return columns.map((column) => ({
    ...column,
    header: column.mobileHeader || column.header,
  }));
};
