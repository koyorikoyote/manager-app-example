/**
 * Optimized Column Helper Utilities with Memoization Support
 *
 * This module extends the existing columnHelpers with performance optimizations
 * including memoization support and calculated field optimization utilities.
 */
import * as React from "react";
import { useMemo } from "react";
import {
  ResponsiveColumnDef,
  ColumnPriority,
  statusColorHelpers,
  createStatusColumn,
} from "./columnHelpers";
import { useMemoizedColumns, useMemoizedCalculation } from "./memoizationUtils";
import { cn } from "./cn";

/**
 * Configuration for optimized column creation
 */
interface OptimizedColumnConfig<T> {
  enableMemoization?: boolean;
  enableCalculatedFields?: boolean;
  debugName?: string;
  enableLogging?: boolean;
  calculatedFieldDependencies?: (keyof T)[];
}

/**
 * Calculated field configuration
 */
interface CalculatedFieldConfig<T, R> {
  fieldName: string;
  calculation: (row: T) => R;
  dependencies: (keyof T)[];
  cacheKey?: (row: T) => string;
}

/**
 * Optimized column factory (no hooks inside to satisfy react-hooks rules)
 * Note: For memoized behavior, prefer useOptimizedColumnSet below.
 */
export const createOptimizedColumns = <T extends Record<string, unknown>>(
  columnFactory: () => ResponsiveColumnDef<T>[],
  _dependencies: unknown[],
  _config: OptimizedColumnConfig<T> = {}
): ResponsiveColumnDef<T>[] => {
  return columnFactory();
};

/**
 * Hook variant that can safely use hooks for memoization within components
 */
export const useOptimizedColumns = <T extends Record<string, unknown>>(
  columnFactory: () => ResponsiveColumnDef<T>[],
  dependencies: unknown[],
  config: OptimizedColumnConfig<T> = {}
): ResponsiveColumnDef<T>[] => {
  const {
    enableMemoization = true,
    debugName = "optimized-columns",
    enableLogging = process.env.NODE_ENV === "development",
  } = config;

  // Call hooks unconditionally to satisfy react-hooks rules
  const columnsMemoized = useMemoizedColumns(columnFactory, {
    dependencies,
    debugName,
    enableLogging,
  });

  const columnsSimple = useMemo(columnFactory, dependencies);

  return enableMemoization ? columnsMemoized : columnsSimple;
};

/**
 * Create optimized status column with simple selector (no hooks)
 */
export const createOptimizedStatusColumn = <T extends Record<string, unknown>>(
  accessor: keyof T,
  header: string = "Status",
  statusType:
    | "staff"
    | "property"
    | "interaction"
    | "company"
    | "interactionType" = "staff",
  priority: ColumnPriority = ColumnPriority.HIGH,
  mobileHeader?: string
): ResponsiveColumnDef<T> => {
  const getStatusColor =
    statusType === "staff"
      ? statusColorHelpers.getStaffStatusColor
      : statusType === "property"
      ? statusColorHelpers.getPropertyStatusColor
      : statusType === "interaction"
      ? statusColorHelpers.getInteractionStatusColor
      : statusType === "company"
      ? statusColorHelpers.getCompanyStatusColor
      : statusColorHelpers.getInteractionTypeColor;

  return createStatusColumn(
    accessor,
    header,
    getStatusColor,
    priority,
    mobileHeader
  );
};

/**
 * Create optimized calculated field column
 */
export const createCalculatedFieldColumn = <
  T extends Record<string, unknown>,
  R
>(
  config: CalculatedFieldConfig<T, R>,
  header: string,
  cellRenderer?: (value: R, row: T) => React.ReactElement,
  priority: ColumnPriority = ColumnPriority.MEDIUM,
  mobileHeader?: string
): ResponsiveColumnDef<T> => {
  const { fieldName, calculation, dependencies } = config;

  // Memoized cell component for calculated fields
  const MemoizedCalculatedCell = React.memo<{
    row: T;
    calculation: (row: T) => R;
    cellRenderer?: (value: R, row: T) => React.ReactElement;
  }>(function MemoizedCalculatedCell({ row, calculation, cellRenderer }) {
    // Use memoized calculation with dependencies
    const calculatedValue = useMemoizedCalculation(
      calculation,
      row,
      dependencies.map((dep) => row[dep]),
      `calculated-${fieldName}`
    );

    if (cellRenderer) {
      return cellRenderer(calculatedValue, row);
    }

    // Default renderer
    return React.createElement(
      "span",
      { className: "text-neutral-900" },
      String(calculatedValue)
    );
  });

  return {
    id: fieldName,
    header,
    priority,
    mobileHeader,
    cell: ({ row }: { row: { original: T } }) =>
      React.createElement(MemoizedCalculatedCell, {
        row: row.original,
        calculation,
        cellRenderer,
      }),
    sortingFn: (rowA: any, rowB: any, _columnId: string) => {
      const valueA = calculation(rowA.original);
      const valueB = calculation(rowB.original);

      if (typeof valueA === "number" && typeof valueB === "number") {
        return valueA - valueB;
      }

      return String(valueA).localeCompare(String(valueB));
    },
  };
};

/**
 * Create optimized date column with calculated days passed
 */
export const createDaysPassedColumn = <T extends Record<string, unknown>>(
  dateAccessor: keyof T,
  header: string = "Days Passed",
  priority: ColumnPriority = ColumnPriority.MEDIUM,
  mobileHeader?: string
): ResponsiveColumnDef<T> => {
  const calculateDaysPassed = (date: unknown): number => {
    if (!date) return 0;

    try {
      const dateObj = new Date(date as string | number | Date);
      if (isNaN(dateObj.getTime())) return 0;

      const now = new Date();
      const diffTime = now.getTime() - dateObj.getTime();
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

      return Math.max(0, diffDays);
    } catch {
      return 0;
    }
  };

  const daysCellRenderer = (days: number) => {
    const colorClass =
      days > 30
        ? "text-red-600 font-semibold"
        : days > 7
        ? "text-yellow-600 font-medium"
        : "text-green-600";

    return React.createElement(
      "span",
      { className: cn("font-mono", colorClass) },
      `${days} days`
    );
  };

  return createCalculatedFieldColumn(
    {
      fieldName: `${String(dateAccessor)}_days_passed`,
      calculation: (row: T) => calculateDaysPassed(row[dateAccessor]),
      dependencies: [dateAccessor],
    },
    header,
    daysCellRenderer,
    priority,
    mobileHeader
  );
};

/**
 * Create optimized progress percentage column
 */
export const createProgressColumn = <T extends Record<string, unknown>>(
  completedAccessor: keyof T,
  totalAccessor: keyof T,
  header: string = "Progress",
  priority: ColumnPriority = ColumnPriority.MEDIUM,
  mobileHeader?: string
): ResponsiveColumnDef<T> => {
  const calculateProgress = (completed: unknown, total: unknown): number => {
    const completedNum = Number(completed) || 0;
    const totalNum = Number(total) || 0;

    if (totalNum === 0) return 0;
    return Math.round((completedNum / totalNum) * 100);
  };

  const progressCellRenderer = (percentage: number) => {
    const colorClass =
      percentage >= 80
        ? "bg-green-500"
        : percentage >= 50
        ? "bg-yellow-500"
        : "bg-red-500";

    return React.createElement(
      "div",
      { className: "flex items-center space-x-2" },
      React.createElement(
        "div",
        { className: "w-16 bg-gray-200 rounded-full h-2" },
        React.createElement("div", {
          className: cn(
            "h-2 rounded-full transition-all duration-300",
            colorClass
          ),
          style: { width: `${percentage}%` },
        })
      ),
      React.createElement(
        "span",
        { className: "text-sm font-medium text-neutral-700" },
        `${percentage}%`
      )
    );
  };

  return createCalculatedFieldColumn(
    {
      fieldName: `${String(completedAccessor)}_${String(
        totalAccessor
      )}_progress`,
      calculation: (row: T) =>
        calculateProgress(row[completedAccessor], row[totalAccessor]),
      dependencies: [completedAccessor, totalAccessor],
    },
    header,
    progressCellRenderer,
    priority,
    mobileHeader
  );
};

/**
 * Create optimized age calculation column
 */
export const createAgeColumn = <T extends Record<string, unknown>>(
  birthDateAccessor: keyof T,
  header: string = "Age",
  priority: ColumnPriority = ColumnPriority.MEDIUM,
  mobileHeader?: string
): ResponsiveColumnDef<T> => {
  const calculateAge = (birthDate: unknown): number => {
    if (!birthDate) return 0;

    try {
      const birthDateObj = new Date(birthDate as string | number | Date);
      if (isNaN(birthDateObj.getTime())) return 0;

      const today = new Date();
      let age = today.getFullYear() - birthDateObj.getFullYear();
      const monthDiff = today.getMonth() - birthDateObj.getMonth();

      if (
        monthDiff < 0 ||
        (monthDiff === 0 && today.getDate() < birthDateObj.getDate())
      ) {
        age--;
      }

      return Math.max(0, age);
    } catch {
      return 0;
    }
  };

  const ageCellRenderer = (age: number) => {
    return React.createElement(
      "span",
      { className: "font-mono text-neutral-900" },
      age > 0 ? `${age} years` : "--"
    );
  };

  return createCalculatedFieldColumn(
    {
      fieldName: `${String(birthDateAccessor)}_age`,
      calculation: (row: T) => calculateAge(row[birthDateAccessor]),
      dependencies: [birthDateAccessor],
    },
    header,
    ageCellRenderer,
    priority,
    mobileHeader
  );
};

/**
 * Create optimized full name column from first and last name
 */
export const createFullNameColumn = <T extends Record<string, unknown>>(
  firstNameAccessor: keyof T,
  lastNameAccessor: keyof T,
  header: string = "Full Name",
  onNavigate?: (row: T) => void,
  priority: ColumnPriority = ColumnPriority.ESSENTIAL,
  mobileHeader?: string
): ResponsiveColumnDef<T> => {
  const calculateFullName = (firstName: unknown, lastName: unknown): string => {
    const first = String(firstName || "").trim();
    const last = String(lastName || "").trim();

    if (!first && !last) return "--";
    if (!first) return last;
    if (!last) return first;

    return `${first} ${last}`;
  };

  const fullNameCellRenderer = (fullName: string, row: T) => {
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
        fullName
      );
    }

    return React.createElement(
      "span",
      { className: "font-medium text-neutral-900" },
      fullName
    );
  };

  return createCalculatedFieldColumn(
    {
      fieldName: `${String(firstNameAccessor)}_${String(
        lastNameAccessor
      )}_full_name`,
      calculation: (row: T) =>
        calculateFullName(row[firstNameAccessor], row[lastNameAccessor]),
      dependencies: [firstNameAccessor, lastNameAccessor],
    },
    header,
    fullNameCellRenderer,
    priority,
    mobileHeader
  );
};

/**
 * Create optimized currency column with formatting
 */
export const createCurrencyColumn = <T extends Record<string, unknown>>(
  accessor: keyof T,
  header: string,
  currency: string = "USD",
  locale: string = "en-US",
  priority: ColumnPriority = ColumnPriority.MEDIUM,
  mobileHeader?: string
): ResponsiveColumnDef<T> => {
  const formatCurrency = (value: unknown): string => {
    const numValue = Number(value);
    if (isNaN(numValue)) return "--";

    try {
      return new Intl.NumberFormat(locale, {
        style: "currency",
        currency: currency,
      }).format(numValue);
    } catch {
      return `${currency} ${numValue.toFixed(2)}`;
    }
  };

  const currencyCellRenderer = (formattedValue: string) => {
    return React.createElement(
      "span",
      { className: "font-mono text-neutral-900" },
      formattedValue
    );
  };

  return createCalculatedFieldColumn(
    {
      fieldName: `${String(accessor)}_currency`,
      calculation: (row: T) => formatCurrency(row[accessor]),
      dependencies: [accessor],
    },
    header,
    currencyCellRenderer,
    priority,
    mobileHeader
  );
};

/**
 * Hook for creating optimized column sets with batch memoization
 */
export const useOptimizedColumnSet = <T extends Record<string, unknown>>(
  columnConfigs: Array<() => ResponsiveColumnDef<T>>,
  dependencies: unknown[],
  debugName: string = "column-set"
): ResponsiveColumnDef<T>[] => {
  return useMemoizedColumns(() => columnConfigs.map((config) => config()), {
    dependencies,
    debugName,
    enableLogging: process.env.NODE_ENV === "development",
  });
};

/**
 * Performance-optimized column visibility manager
 */
export const useOptimizedColumnVisibility = <T extends Record<string, unknown>>(
  columns: ResponsiveColumnDef<T>[],
  screenSize: { isMobile: boolean; isTablet: boolean },
  customVisibility: Record<string, boolean> = {}
): Record<string, boolean> => {
  return useMemo(() => {
    const { isMobile, isTablet } = screenSize;
    const visibility: Record<string, boolean> = {};

    columns.forEach((column) => {
      const columnId = column.accessorKey || column.id;
      if (!columnId) return;

      // Check custom visibility first
      if (columnId in customVisibility) {
        visibility[columnId] = customVisibility[columnId];
        return;
      }

      const priority = column.priority || ColumnPriority.MEDIUM;

      if (isMobile) {
        visibility[columnId] = priority === ColumnPriority.ESSENTIAL;
      } else if (isTablet) {
        visibility[columnId] = priority <= ColumnPriority.HIGH;
      } else {
        visibility[columnId] = true;
      }
    });

    return visibility;
  }, [screenSize, columns, customVisibility]);
};
