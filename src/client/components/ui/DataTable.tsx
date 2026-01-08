/**
 * DataTable Component - Comprehensive table component adapted from Sales Assistant
 * 
 * Features:
 * - TanStack Table integration for sorting, filtering, and pagination
 * - Responsive design with mobile optimization
 * - Accessibility support with keyboard navigation and screen reader compatibility
 * - Horizontal scroll with navigation buttons for mobile devices
 * - Loading states, error handling, and empty state management
 * - Row selection (single/multiple) and click handlers
 * - URL state management for pagination and sorting
 * - Manager App theme integration with Tailwind CSS
 */
import React from 'react';
import {
    flexRender,
    getCoreRowModel,
    getFilteredRowModel,
    getPaginationRowModel,
    getSortedRowModel,
    useReactTable,
    type SortingState,
    type ColumnFiltersState,
    type VisibilityState,
    type RowSelectionState,
    type Updater,
    type ColumnDef,
    type Row,
} from '@tanstack/react-table';
import {
    ChevronLeftIcon,
    ChevronRightIcon,
    ChevronsLeftIcon,
    ChevronsRightIcon,
    ArrowUpDown,
} from 'lucide-react';
import { Button } from './Button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './Select';
import { useLanguage } from '../../contexts/LanguageContext';
import { useResponsive } from '../../hooks/useResponsive';
import { useMobileDetection } from '../../hooks/useTouch';


import { cn } from '../../utils/cn';
import {
    type ResponsiveColumnDef,
    getResponsiveColumnVisibility,
    getMobileOptimizedColumns
} from '../../utils/columnHelpers';

import { FilterConfiguration } from '../../utils/filterTypeDetection';
import { FilterIcon } from './filters/FilterIcon';
import { getFilterFunction, enhancedFilter } from '../../utils/tableFilterFunctions';
import { validateAndApplyFilter, syncFilterState, getActiveFilterCount } from '../../utils/filterStateManager';



/**
 * Props interface for the DataTable component
 */
interface DataTableProps<TData extends Record<string, unknown>> {
    /** Column definitions with responsive configuration */
    columns: ResponsiveColumnDef<TData>[];
    /** Array of data to display in the table */
    data: TData[];
    /** Loading state indicator */
    loading?: boolean;
    /** Error message to display */
    error?: string | null;
    /** Current row selection state */
    rowSelection?: RowSelectionState;
    /** Callback for row selection changes */
    onRowSelectionChange?: (state: RowSelectionState) => void;
    /** Enable row selection functionality */
    enableRowSelection?: boolean;
    /** Row selection mode - single or multiple */
    rowSelectionMode?: 'multiple' | 'single';
    /** Callback for row click events */
    onRowClick?: (row: TData) => void;
    /** Search query for filtering */
    searchQuery?: string;
    /** Custom empty state message */
    emptyStateMessage?: string;
    /** Additional CSS classes */
    className?: string;
    /** Enable responsive column visibility */
    enableResponsive?: boolean;
    /** Show horizontal scroll navigation buttons */
    showScrollButtons?: boolean;
    /** Results summary text to display inline with scroll buttons */
    resultsSummary?: string;
    /** Loading text to display next to results summary */
    loadingText?: string;
    onRetry?: () => void;
    onClearFilters?: () => void;
    hasActiveFilters?: boolean;
    /** Total count before filtering (for showing "X of Y filtered records") */
    totalCount?: number;
    // URL state management props
    externalPagination?: {
        pageIndex: number;
        pageSize: number;
        onPaginationChange: (pagination: { pageIndex: number; pageSize: number }) => void;
    };
    externalSorting?: {
        sorting: SortingState;
        onSortingChange: (sorting: SortingState) => void;
    };
    /** Enable column filtering functionality */
    enableColumnFiltering?: boolean;
    /** Table name for filter analysis (e.g., 'staff', 'properties') */
    tableName?: string;
    /** Callback when filters change */
    onFiltersChange?: (filters: Record<string, string[]>) => void;
    /** External scroll arrows control */
    externalScrollArrows?: {
        onScrollStateChange?: (state: { canScrollLeft: boolean; canScrollRight: boolean; onScrollLeft: () => void; onScrollRight: () => void }) => void;
    };
}

/**
 * DataTable - A comprehensive table component with advanced features
 * 
 * This component provides a full-featured data table with:
 * - Sorting, filtering, and pagination
 * - Responsive design with mobile optimization
 * - Accessibility features including keyboard navigation
 * - Loading states and error handling
 * - Row selection and click handlers
 * - Horizontal scroll navigation for mobile
 * 
 * @param props - DataTable configuration props
 * @returns Rendered DataTable component
 */
export function DataTable<TData extends Record<string, unknown>>({
    columns,
    data,
    loading = false,
    error = null,
    rowSelection: externalRowSelection,
    onRowSelectionChange,
    enableRowSelection = false,
    rowSelectionMode = 'multiple',
    onRowClick,
    searchQuery,
    emptyStateMessage,
    className,
    enableResponsive = true,
    showScrollButtons = true,
    resultsSummary,
    loadingText,
    onRetry,
    onClearFilters,
    hasActiveFilters = false,
    totalCount,
    externalPagination,
    externalSorting,
    enableColumnFiltering = true,
    tableName,
    onFiltersChange,
    externalScrollArrows,
}: DataTableProps<TData>) {
    const { t } = useLanguage();
    const { isMobile, isTablet } = useResponsive();
    const { isTouch } = useMobileDetection();

    const [internalRowSelection, setInternalRowSelection] = React.useState<RowSelectionState>({});

    // Use external row selection state if provided, otherwise use internal state
    const rowSelection = externalRowSelection ?? internalRowSelection;

    // Stable initial column visibility - prevent race conditions during mount
    const initialColumnVisibility = React.useMemo(() => {
        const initialVisibility: VisibilityState = {};
        columns.forEach((column) => {
            const columnId = column.accessorKey || column.id;
            if (columnId) {
                // Start with all columns visible to prevent disappearing table
                initialVisibility[columnId] = true;
            }
        });
        return initialVisibility;
    }, [columns]);

    const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>(initialColumnVisibility);
    const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
    const [filterableColumns, setFilterableColumns] = React.useState<Record<string, boolean>>({});
    const [filterConfigurations, setFilterConfigurations] = React.useState<Record<string, FilterConfiguration>>({});



    // Use external state if provided, otherwise use internal state
    const [internalSorting, setInternalSorting] = React.useState<SortingState>([]);
    const [internalPagination, setInternalPagination] = React.useState({
        pageIndex: 0,
        pageSize: isMobile ? 10 : 20,
    });

    const sorting = externalSorting?.sorting ?? internalSorting;
    const setSorting = React.useCallback((updater: SortingState | ((old: SortingState) => SortingState)) => {
        if (externalSorting?.onSortingChange) {
            const newSorting = typeof updater === 'function' ? updater(sorting) : updater;
            externalSorting.onSortingChange(newSorting);
        } else {
            setInternalSorting(updater);
        }
    }, [externalSorting, sorting]);

    const pagination = React.useMemo(() => externalPagination ? {
        pageIndex: externalPagination.pageIndex,
        pageSize: externalPagination.pageSize,
    } : internalPagination, [externalPagination, internalPagination]);

    const setPagination = React.useCallback((updater: { pageIndex: number; pageSize: number } | ((old: { pageIndex: number; pageSize: number }) => { pageIndex: number; pageSize: number })) => {
        if (externalPagination?.onPaginationChange) {
            const newPagination = typeof updater === 'function' ? updater(pagination) : updater;
            externalPagination.onPaginationChange(newPagination);
        } else {
            setInternalPagination(updater);
        }
    }, [externalPagination, pagination]);

    // Accessibility state
    const [announceMessage, setAnnounceMessage] = React.useState<string>('');

    // Calculate active filter count for better UX
    const activeFilterCount = React.useMemo(() => {
        return getActiveFilterCount(columnFilters);
    }, [columnFilters]);

    // Enhanced hasActiveFilters that includes both external and internal state
    const computedHasActiveFilters = React.useMemo(() => {
        return hasActiveFilters || activeFilterCount > 0;
    }, [hasActiveFilters, activeFilterCount]);

    // Focus management (removed unused containerRef)

    // Horizontal scroll functionality
    const tableContainerRef = React.useRef<HTMLDivElement>(null);
    const [canScrollLeft, setCanScrollLeft] = React.useState(false);
    const [canScrollRight, setCanScrollRight] = React.useState(false);

    // Get the actual scrollable container (the table container with overflow-x-auto)
    const getScrollContainer = React.useCallback(() => {
        if (!tableContainerRef.current) return null;
        return tableContainerRef.current.querySelector('[data-scroll-container="true"]') as HTMLDivElement;
    }, []);

    // Check scroll position and update button states
    const updateScrollButtons = React.useCallback(() => {
        const container = getScrollContainer();
        if (!container) return;

        const { scrollLeft, scrollWidth, clientWidth } = container;
        const tolerance = 5; // Add tolerance for floating point precision
        setCanScrollLeft(scrollLeft > tolerance);
        setCanScrollRight(scrollLeft < scrollWidth - clientWidth - tolerance);
    }, [getScrollContainer]);

    // Scroll left by a reasonable amount
    const handleScrollLeft = React.useCallback(() => {
        const container = getScrollContainer();
        if (!container) return;

        // On mobile, scroll by viewport width for better UX, on desktop scroll by column width
        const scrollAmount = isMobile
            ? Math.min(container.clientWidth * 0.8, 400)
            : Math.min(300, container.clientWidth * 0.4);
        container.scrollBy({ left: -scrollAmount, behavior: 'smooth' });

        // Update button states after scroll animation
        setTimeout(updateScrollButtons, 300);
    }, [getScrollContainer, isMobile, updateScrollButtons]);

    // Scroll right by a reasonable amount
    const handleScrollRight = React.useCallback(() => {
        const container = getScrollContainer();
        if (!container) return;

        // On mobile, scroll by viewport width for better UX, on desktop scroll by column width
        const scrollAmount = isMobile
            ? Math.min(container.clientWidth * 0.8, 400)
            : Math.min(300, container.clientWidth * 0.4);
        container.scrollBy({ left: scrollAmount, behavior: 'smooth' });

        // Update button states after scroll animation
        setTimeout(updateScrollButtons, 300);
    }, [getScrollContainer, isMobile, updateScrollButtons]);

    // Get responsive column configuration
    const responsiveColumns = React.useMemo(() => {
        let cols = enableResponsive ? getMobileOptimizedColumns(columns, isMobile) : columns;

        // Add filter function to columns when column filtering is enabled
        if (enableColumnFiltering) {
            cols = cols.map(col => {
                const columnId = col.accessorKey || col.id || '';
                const filterConfig = filterConfigurations[columnId];

                // Get the appropriate filter function based on configuration
                const tanstackFilterFn = filterConfig
                    ? getFilterFunction(filterConfig.filterType)
                    : enhancedFilter; // Default to enhanced filter with auto-detection

                // Create a wrapper function that matches ResponsiveColumnDef signature
                const responsiveFilterFn = (row: Row<TData>, id: string, value: string[]) => {
                    // Convert to TanStack Table format and call the actual filter function
                    return tanstackFilterFn(row, id, value, () => { });
                };

                return {
                    ...col,
                    filterFn: responsiveFilterFn,
                };
            });
        }

        return cols;
    }, [columns, isMobile, enableResponsive, enableColumnFiltering, filterConfigurations]);

    // Simplified and stable column visibility management
    React.useEffect(() => {
        if (!enableResponsive) return;

        // Define essential columns that should never be hidden
        const essentialColumns = ['status', 'name', 'title', 'id'];

        // Create stable visibility state
        const newVisibility: Record<string, boolean> = {};
        columns.forEach((column) => {
            const columnId = column.accessorKey || column.id;
            if (columnId) {
                const isEssential = essentialColumns.includes(columnId.toLowerCase());

                if (isMobile) {
                    // On mobile, show all columns with horizontal scrolling
                    newVisibility[columnId] = true;
                } else {
                    // On desktop/tablet, use responsive rules but protect essential columns
                    const responsiveVisibility = getResponsiveColumnVisibility(columns, isMobile, isTablet);
                    newVisibility[columnId] = isEssential ? true : (responsiveVisibility[columnId] ?? true);
                }
            }
        });

        // Only update if there's a meaningful change
        setColumnVisibility(prev => {
            const hasChanges = Object.keys(newVisibility).some(key => prev[key] !== newVisibility[key]) ||
                Object.keys(prev).some(key => !(key in newVisibility));

            return hasChanges ? newVisibility : prev;
        });
    }, [columns, isMobile, isTablet, enableResponsive]);



    // Update page size based on screen size (only for internal pagination)
    React.useEffect(() => {
        if (!externalPagination) {
            setInternalPagination(prev => ({
                ...prev,
                pageSize: isMobile ? 10 : 20,
                pageIndex: 0, // Reset to first page when changing page size
            }));
        }
    }, [isMobile, externalPagination]);

    // Update button states on scroll and data changes
    React.useEffect(() => {
        const container = getScrollContainer();
        if (!container) return;

        updateScrollButtons();

        container.addEventListener('scroll', updateScrollButtons);
        window.addEventListener('resize', updateScrollButtons);

        return () => {
            container.removeEventListener('scroll', updateScrollButtons);
            window.removeEventListener('resize', updateScrollButtons);
        };
    }, [updateScrollButtons, data, getScrollContainer, columnFilters, columnVisibility]); // Add columnFilters and columnVisibility to dependencies

    // Additional effect to handle scroll button updates when table content changes
    React.useEffect(() => {
        const timeoutId = setTimeout(() => {
            updateScrollButtons();
        }, 100); // Small delay to ensure DOM updates are complete

        return () => clearTimeout(timeoutId);
    }, [columnFilters, data.length, updateScrollButtons]); // Use data.length instead of table dependency

    // Memoize scroll state to prevent infinite loops
    const scrollStateObject = React.useMemo(() => ({
        canScrollLeft,
        canScrollRight,
        onScrollLeft: handleScrollLeft,
        onScrollRight: handleScrollRight
    }), [canScrollLeft, canScrollRight, handleScrollLeft, handleScrollRight]);

    // Notify parent component about scroll state changes for external scroll arrows
    React.useEffect(() => {
        if (externalScrollArrows?.onScrollStateChange) {
            externalScrollArrows.onScrollStateChange(scrollStateObject);
        }
    }, [scrollStateObject, externalScrollArrows]);

    const handleRowSelectionChange = React.useCallback(
        (updater: Updater<RowSelectionState>) => {
            if (!enableRowSelection) return;
            const next = typeof updater === 'function' ? updater(rowSelection) : updater;
            const finalSelection = rowSelectionMode === 'single'
                ? (() => {
                    const lastKey = Object.keys(next).pop();
                    return lastKey ? { [lastKey]: true } : {};
                })()
                : next;

            // Update external state if provided, otherwise update internal state
            if (externalRowSelection !== undefined && onRowSelectionChange) {
                onRowSelectionChange(finalSelection);
            } else {
                setInternalRowSelection(finalSelection);
            }
        },
        [rowSelection, rowSelectionMode, enableRowSelection, externalRowSelection, onRowSelectionChange]
    );

    const table = useReactTable({
        data,
        columns: responsiveColumns as ColumnDef<TData, unknown>[],
        state: {
            sorting,
            columnVisibility,
            rowSelection,
            columnFilters,
            pagination,
        },
        enableRowSelection,
        enableMultiRowSelection: rowSelectionMode === 'multiple',
        onRowSelectionChange: enableRowSelection ? handleRowSelectionChange : undefined,
        onSortingChange: setSorting,
        onColumnFiltersChange: setColumnFilters,
        onColumnVisibilityChange: (updater) => {
            // Ensure essential columns are never hidden when visibility changes
            const newVisibility = typeof updater === 'function' ? updater(columnVisibility) : updater;
            const essentialColumns = ['status', 'name', 'title', 'id'];

            // Protect essential columns from being hidden
            const protectedVisibility = { ...newVisibility };
            Object.keys(protectedVisibility).forEach(columnId => {
                if (essentialColumns.includes(columnId.toLowerCase())) {
                    protectedVisibility[columnId] = true;
                }
            });

            setColumnVisibility(protectedVisibility);
        },
        onPaginationChange: setPagination,
        getCoreRowModel: getCoreRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        getSortedRowModel: getSortedRowModel(),
    });



    // Simplified filter configuration loading
    React.useEffect(() => {
        if (!enableColumnFiltering || !tableName || columns.length === 0) {
            return;
        }

        // Use requestIdleCallback for non-blocking filter loading
        const scheduleFilterLoad = (callback: () => void) => {
            if ('requestIdleCallback' in window) {
                (window as unknown as { requestIdleCallback: (callback: () => void, options?: { timeout: number }) => void }).requestIdleCallback(callback, { timeout: 1000 });
            } else {
                setTimeout(callback, 0);
            }
        };

        scheduleFilterLoad(() => {
            const loadConfigurations = async () => {
                try {
                    const columnDefinitions = columns.map(column => ({
                        key: column.accessorKey || column.id || '',
                        label: typeof column.header === 'string' ? column.header : column.accessorKey || column.id || '',
                        dataType: 'string' as const,
                    })).filter(col => col.key);

                    // Only enable filters for specific columns mentioned in the spec requirements
                    const configMap: Record<string, FilterConfiguration> = {};
                    const filterableMap: Record<string, boolean> = {};

                    // Define ONLY the columns that should have filters based on spec requirements
                    const specifiedFilterableColumns: Record<string, { filterType: 'dropdown' | 'dateRange' | 'numericRange'; dataType: string }> = {
                        // StaffList page - dropdown filters
                        'residenceStatus': { filterType: 'dropdown', dataType: 'string' },
                        'nationality': { filterType: 'dropdown', dataType: 'string' },
                        'userInCharge': { filterType: 'dropdown', dataType: 'string' },
                        // StaffList page - date range filter
                        'hireDate': { filterType: 'dateRange', dataType: 'date' },
                        // StaffList page - numeric range filter
                        'age': { filterType: 'numericRange', dataType: 'number' },

                        // PropertyList page - date range filter
                        'contractDate': { filterType: 'dateRange', dataType: 'date' },

                        // DestinationList page - dropdown filter
                        'preferredNationality': { filterType: 'dropdown', dataType: 'string' },
                        // DestinationList page - numeric range filter
                        'hiringVacancies': { filterType: 'numericRange', dataType: 'number' },

                        // InteractionRecords page - date range filter
                        'date': { filterType: 'dateRange', dataType: 'date' },
                        // InteractionRecords page - numeric range filter
                        'daysPassed': { filterType: 'numericRange', dataType: 'number' },

                        // ComplaintDetails page - dropdown filters
                        'progressStatus': { filterType: 'dropdown', dataType: 'string' },
                        'urgencyLevel': { filterType: 'dropdown', dataType: 'string' },
                        'responderName': { filterType: 'dropdown', dataType: 'string' },
                        // ComplaintDetails page - date range filter
                        'dateOfOccurrence': { filterType: 'dateRange', dataType: 'date' },

                        // DailyRecord page - dropdown filter
                        'conditionStatus': { filterType: 'dropdown', dataType: 'string' },
                        // DailyRecord page - date range filter
                        'dateOfRecord': { filterType: 'dateRange', dataType: 'date' },

                        // InquiriesNotifications page - dropdown filters
                        'typeOfInquiry': { filterType: 'dropdown', dataType: 'string' },
                        // InquiriesNotifications page - date range filters
                        'dateOfInquiry': { filterType: 'dateRange', dataType: 'date' },
                        'resolutionDate': { filterType: 'dateRange', dataType: 'date' }
                    };

                    // Only create filter configurations for columns that exist in the current table AND are specified in requirements
                    Object.entries(specifiedFilterableColumns).forEach(([columnKey, config]) => {
                        const columnDef = columnDefinitions.find(col => col.key === columnKey);
                        if (columnDef) {
                            configMap[columnKey] = {
                                columnKey,
                                columnLabel: columnDef.label,
                                filterType: config.filterType,
                                dataType: config.dataType
                            };
                            filterableMap[columnKey] = true;
                        }
                    });

                    // Add common columns that were previously filterable
                    const commonFilterableColumns = ['status', 'department', 'position', 'type', 'propertytype', 'category', 'industry', 'role', 'level', 'priority', 'state', 'condition'];
                    columnDefinitions.forEach(col => {
                        if (commonFilterableColumns.includes(col.key.toLowerCase()) && !filterableMap[col.key]) {
                            configMap[col.key] = {
                                columnKey: col.key,
                                columnLabel: col.label,
                                filterType: 'dropdown',
                                dataType: 'string'
                            };
                            filterableMap[col.key] = true;
                        }
                    });

                    setFilterConfigurations(configMap);
                    setFilterableColumns(filterableMap);
                } catch (error) {
                    console.error('Error loading filter configurations:', error);
                }
            };

            loadConfigurations();
        });
    }, [enableColumnFiltering, tableName, columns]);

    // Accessibility announcements
    const announce = React.useCallback((message: string) => {
        setAnnounceMessage(message);
        // Clear message after announcement
        setTimeout(() => setAnnounceMessage(''), 1000);
    }, []);

    // Simplified dynamic table width calculation
    React.useEffect(() => {
        const containerEl = tableContainerRef.current;
        if (!isMobile || !containerEl) return;

        const calculateDynamicWidth = () => {
            // On mobile, use all columns instead of just visible ones
            const columnsList = table.getAllLeafColumns();
            let totalMinWidth = 0;

            columnsList.forEach((column) => {
                const columnId = (column.id || '').toLowerCase();

                // Calculate width based on column type and content
                if (columnId === 'name') {
                    totalMinWidth += 180;
                } else if (columnId === 'status') {
                    totalMinWidth += 120;
                } else if (columnId === 'documents') {
                    totalMinWidth += 140;
                } else if (columnId === 'address') {
                    totalMinWidth += 200;
                } else if (columnId === 'email') {
                    totalMinWidth += 180;
                } else if (columnId === 'phone') {
                    totalMinWidth += 160;
                } else if (columnId === 'industry') {
                    totalMinWidth += 150;
                } else if (columnId === 'propertytype') {
                    totalMinWidth += 160;
                } else if (columnId === 'location') {
                    totalMinWidth += 180;
                } else if (columnId === 'createdat') {
                    totalMinWidth += 140;
                } else {
                    totalMinWidth += 150; // Default column width
                }
            });

            // Add padding to ensure the last column is fully visible
            totalMinWidth += 40;

            // Apply the calculated width to the table
            const tableElement = containerEl.querySelector('table');
            if (tableElement) {
                tableElement.style.minWidth = `${totalMinWidth}px`;
            }
        };

        // Run calculation after a small delay to ensure table is rendered
        const timeoutId = setTimeout(calculateDynamicWidth, 100);

        // ResizeObserver for responsive updates
        let ro: ResizeObserver | null = null;
        try {
            if (typeof ResizeObserver !== 'undefined') {
                ro = new ResizeObserver(() => {
                    setTimeout(calculateDynamicWidth, 50);
                });
                ro.observe(containerEl);
            }
        } catch {
            ro = null;
        }

        // Window resize fallback
        const handleResize = () => setTimeout(calculateDynamicWidth, 50);
        window.addEventListener('resize', handleResize);

        // Cleanup
        return () => {
            clearTimeout(timeoutId);
            if (ro && containerEl) {
                try {
                    ro.unobserve(containerEl);
                } catch {
                    // ignore ResizeObserver unobserve errors
                }
            }
            window.removeEventListener('resize', handleResize);
        };
    }, [isMobile, table]);



    // Announce data changes
    React.useEffect(() => {
        if (loading) {
            announce(t('datatable.accessibility.loadingAnnouncement'));
        } else if (error) {
            announce(t('datatable.accessibility.errorAnnouncement'));
        } else if (data.length === 0) {
            announce(t('datatable.accessibility.emptyAnnouncement'));
        } else {
            announce(t('datatable.accessibility.updateAnnouncement', { count: data.length }));
        }
    }, [loading, error, data.length, announce, t]);

    // Keyboard navigation functionality is disabled for now to simplify the implementation

    // Column sort handler with accessibility
    const handleColumnSort = React.useCallback((column: { getIsSorted: () => string | false; toggleSorting: () => void }) => {
        const currentSort = column.getIsSorted();
        column.toggleSorting();

        let sortDirection: string;
        if (currentSort === 'asc') {
            sortDirection = t('datatable.accessibility.descending');
        } else if (currentSort === 'desc') {
            sortDirection = t('datatable.accessibility.unsorted');
        } else {
            sortDirection = t('datatable.accessibility.ascending');
        }

        announce(t('datatable.accessibility.sorted', {
            direction: sortDirection
        }));
    }, [announce, t]);

    // Generate table description for screen readers
    const tableDescription = React.useMemo(() => {
        const rowCount = table.getRowModel().rows.length;
        const columnCount = table.getVisibleLeafColumns().length;
        return t('datatable.accessibility.table', {
            rows: rowCount,
            columns: columnCount
        });
    }, [table, t]);

    // Clean loading skeleton component without overlay
    const LoadingSkeleton = () => (
        <div className={cn('relative overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-soft', className)}>
            {/* Header skeleton */}
            <div className="bg-gradient-to-r from-neutral-50 to-neutral-100 border-b border-neutral-200">
                <div className="flex">
                    {columns.slice(0, isMobile ? 3 : columns.length).map((_column, index) => (
                        <div
                            key={index}
                            className={cn(
                                'border-r border-neutral-100 last:border-r-0 flex-1',
                                isMobile ? 'px-3 py-3' : 'px-6 py-4'
                            )}
                        >
                            <div className={cn('bg-neutral-200 rounded animate-pulse', isMobile ? 'h-3' : 'h-4')} />
                        </div>
                    ))}
                </div>
            </div>

            {/* Body skeleton */}
            <div className="bg-white">
                {Array.from({ length: isMobile ? 5 : 8 }).map((_, rowIndex) => (
                    <div key={rowIndex} className="flex border-b border-neutral-50 last:border-b-0">
                        {columns.slice(0, isMobile ? 3 : columns.length).map((_column, colIndex) => (
                            <div
                                key={colIndex}
                                className={cn(
                                    'border-r border-neutral-50 last:border-r-0 flex-1',
                                    isMobile ? 'px-3 py-3' : 'px-6 py-4'
                                )}
                            >
                                <div
                                    className={cn(
                                        'bg-neutral-100 rounded animate-pulse',
                                        isMobile ? 'h-3' : 'h-4',
                                        // Vary width for more realistic skeleton
                                        colIndex === 0 ? 'w-3/4' : colIndex === 1 ? 'w-1/2' : 'w-2/3'
                                    )}
                                />
                            </div>
                        ))}
                    </div>
                ))}
            </div>

            {/* Footer skeleton */}
            <div className={cn('border-t border-neutral-200 bg-neutral-50', isMobile ? 'px-3 py-3' : 'px-6 py-4')}>
                <div className="flex items-center justify-between">
                    <div className={cn('bg-neutral-200 rounded animate-pulse', isMobile ? 'h-3 w-24' : 'h-4 w-32')} />
                    <div className="flex items-center space-x-2">
                        {Array.from({ length: 4 }).map((_, index) => (
                            <div
                                key={index}
                                className={cn('bg-neutral-200 rounded animate-pulse', isMobile ? 'h-6 w-6' : 'h-8 w-8')}
                            />
                        ))}
                    </div>
                </div>
            </div>

            {/* Simple loading indicator without overlay */}
            <div className="flex items-center justify-center py-4">
                <div className="flex items-center space-x-2 text-neutral-500">
                    <div className="animate-spin h-4 w-4 border-2 border-neutral-300 border-t-primary-600 rounded-full" />
                    <span className="text-sm">{t('datatable.loading')}</span>
                </div>
            </div>
        </div>
    );

    // Load FilterableDataTable module outside conditional to avoid React hooks rule violation
    const shouldUseFilterableTable = enableColumnFiltering && tableName;
    const FilterableDataTableModule = React.useMemo(() => {
        if (!shouldUseFilterableTable) {
            return null;
        }
        try {
            // Use dynamic import instead of require to avoid ESLint issues
            return React.lazy(() => import('./FilterableDataTable').then(module => ({
                default: module.FilterableDataTable
            })));
        } catch (error) {
            console.error('Failed to load FilterableDataTable:', error);
            return null;
        }
    }, [shouldUseFilterableTable]);

    // If column filtering is enabled and table name is provided, use FilterableDataTable
    // Only use FilterableDataTable for complex filtering scenarios, otherwise use built-in filtering
    if (shouldUseFilterableTable && FilterableDataTableModule && tableName?.includes('filtered')) {
        return (
            <React.Suspense fallback={<LoadingSkeleton />}>
                <FilterableDataTableModule
                    columns={columns as ResponsiveColumnDef<Record<string, unknown>>[]}
                    data={data as Record<string, unknown>[]}
                    tableName={tableName}
                    enableColumnFiltering={enableColumnFiltering}
                    loading={loading}
                    error={error}
                    onRowSelectionChange={onRowSelectionChange}
                    enableRowSelection={enableRowSelection}
                    rowSelectionMode={rowSelectionMode}
                    onRowClick={onRowClick as ((row: Record<string, unknown>) => void) | undefined}
                    searchQuery={searchQuery}
                    emptyStateMessage={emptyStateMessage}
                    className={className}
                    enableResponsive={enableResponsive}
                    showScrollButtons={showScrollButtons}
                    resultsSummary={resultsSummary}
                    loadingText={loadingText}
                    onRetry={onRetry}
                    onClearFilters={onClearFilters}
                    hasActiveFilters={computedHasActiveFilters}
                    totalCount={totalCount}
                    externalPagination={externalPagination}
                    externalSorting={externalSorting}
                    onFiltersChange={onFiltersChange}
                />
            </React.Suspense>
        );
    }

    // Handle loading state
    if (loading) {
        return <LoadingSkeleton />;
    }

    // Handle error state
    if (error) {
        return (
            <div className={cn('overflow-hidden rounded-xl border border-red-200 bg-red-50 shadow-soft', className)}>
                <div className={cn('flex items-center justify-center', isMobile ? 'p-8' : 'p-12')}>
                    <div className="flex flex-col items-center space-y-4 text-center max-w-md">
                        <div className={cn('rounded-full bg-red-100 flex items-center justify-center', isMobile ? 'h-10 w-10' : 'h-12 w-12')}>
                            <svg
                                className={cn('text-red-600', isMobile ? 'h-5 w-5' : 'h-6 w-6')}
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                                aria-hidden="true"
                            >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                            </svg>
                        </div>
                        <div>
                            <p className={cn('font-medium text-red-800', isMobile ? 'text-sm' : 'text-base')}>
                                {t('datatable.error')}
                            </p>
                            <p className={cn('text-red-600 mt-1', isMobile ? 'text-xs' : 'text-sm')}>
                                {error}
                            </p>
                        </div>
                        <div className="flex flex-col sm:flex-row gap-2">
                            {onRetry && (
                                <Button
                                    variant="outline"
                                    size={isMobile ? 'sm' : 'default'}
                                    onClick={onRetry}
                                    className="border-red-300 text-red-700 hover:bg-red-100 focus:ring-red-500"
                                >
                                    <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                    </svg>
                                    {t('datatable.retry')}
                                </Button>
                            )}
                            <Button
                                variant="ghost"
                                size={isMobile ? 'sm' : 'default'}
                                onClick={() => window.location.reload()}
                                className="text-red-600 hover:bg-red-100 focus:ring-red-500"
                            >
                                <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                </svg>
                                {t('common.actions.refresh') || 'Refresh Page'}
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* Custom styles for table scrolling */}
            <style>{`
                .manager-table-container .table-scroll-container {
                    scrollbar-width: thin;
                    scrollbar-color: #cbd5e1 #f1f5f9;
                }
                .manager-table-container .table-scroll-container::-webkit-scrollbar {
                    height: 8px;
                }
                .manager-table-container .table-scroll-container::-webkit-scrollbar-track {
                    background: #f1f5f9;
                    border-radius: 4px;
                }
                .manager-table-container .table-scroll-container::-webkit-scrollbar-thumb {
                    background: #cbd5e1;
                    border-radius: 4px;
                }
                .manager-table-container .table-scroll-container::-webkit-scrollbar-thumb:hover {
                    background: #94a3b8;
                }
                
                /* Ensure filter dropdowns appear above everything */
                .filter-dropdown {
                    z-index: 9999 !important;
                    position: absolute !important;
                }
                
                /* Ensure table header allows dropdowns to overflow */
                .manager-table-container thead {
                    position: relative;
                    z-index: 1;
                }
                
                .manager-table-container th {
                    position: relative;
                    overflow: visible;
                }
                
                /* Ensure the table container doesn't clip dropdowns */
                .manager-table-container {
                    overflow: visible !important;
                }
                
                /* Ensure pagination footer has lower z-index than dropdowns */
                .manager-table-container .pagination-footer {
                    position: relative;
                    z-index: 1;
                }
                
                .scroll-nav-button {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    width: ${isMobile ? '32px' : '24px'};
                    height: ${isMobile ? '32px' : '24px'};
                    background: #ffffff;
                    border: 1px solid #d1d5db;
                    border-radius: 4px;
                    cursor: pointer;
                    transition: all 0.15s ease;
                    color: #6b7280;
                    touch-action: manipulation;
                }
                
                .scroll-nav-button:hover:not(:disabled) {
                    background: #f9fafb;
                    border-color: #9ca3af;
                    color: #374151;
                }
                
                .scroll-nav-button:active:not(:disabled) {
                    background: #f3f4f6;
                    transform: translateY(1px);
                }
                
                .scroll-nav-button:disabled {
                    opacity: 0.5;
                    cursor: not-allowed;
                    background: #f9fafb;
                    color: #d1d5db;
                }
                
                /* Table layout and column distribution */
                .manager-table-container table {
                    width: 100%;
                    table-layout: auto;
                }
                
                /* Desktop: columns stretch to fill available space */
                @media (min-width: 769px) {
                    .manager-table-container table {
                        width: 100%;
                        table-layout: auto;
                    }
                    
                    .manager-table-container th,
                    .manager-table-container td {
                        width: auto;
                    }
                }
                
                /* Mobile: enable horizontal scrolling with proper column spacing */
                @media (max-width: 768px) {
                    .manager-table-container .table-scroll-container {
                        overflow-x: auto;
                        overflow-y: visible;
                        -webkit-overflow-scrolling: touch;
                        scroll-behavior: smooth;
                        scrollbar-width: thin;
                        scrollbar-color: #cbd5e1 #f1f5f9;
                        position: relative;
                    }
                    
                    .manager-table-container table {
                        width: max-content;
                        min-width: 100%;
                        table-layout: auto;
                        border-collapse: separate;
                        border-spacing: 0;
                    }
                    
                    /* Base column styling with adequate spacing */
                    .manager-table-container th,
                    .manager-table-container td {
                        white-space: nowrap;
                        min-width: 140px;
                        padding: 12px 12px;
                        box-sizing: border-box;
                    }
                    
                    /* Specific column minimum widths to prevent overlapping */
                    .manager-table-container th[data-column="name"],
                    .manager-table-container td[data-column="name"] {
                        min-width: 160px;
                    }
                    
                    .manager-table-container th[data-column="status"],
                    .manager-table-container td[data-column="status"] {
                        min-width: 100px;
                    }
                    
                    .manager-table-container th[data-column="documents"],
                    .manager-table-container td[data-column="documents"] {
                        min-width: 120px;
                    }
                    
                    .manager-table-container th[data-column="address"],
                    .manager-table-container td[data-column="address"] {
                        min-width: 180px;
                    }
                    
                    .manager-table-container th[data-column="email"],
                    .manager-table-container td[data-column="email"] {
                        min-width: 160px;
                    }
                    
                    /* Ensure last column has extra padding to prevent cut-off */
                    .manager-table-container th:last-child,
                    .manager-table-container td:last-child {
                        padding-right: 20px;
                    }
                    
                    /* Ensure scroll container has padding to show last column */
                    .manager-table-container .table-scroll-container {
                        padding-right: 16px;
                    }
                }
            `}</style>



            {/* Results summary and navigation controls */}
            {(data.length > 0 || resultsSummary || (showScrollButtons && (isMobile || canScrollLeft || canScrollRight))) && (
                <div className="flex items-center justify-between mb-2">
                    {/* Results summary */}
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                        {resultsSummary ? (
                            <span>{resultsSummary}</span>
                        ) : data.length > 0 && !externalPagination ? (
                            (() => {
                                const { pageIndex, pageSize } = table.getState().pagination;
                                const totalPages = Math.ceil(data.length / pageSize);

                                if (totalCount && totalCount > data.length) {
                                    // Show filtered results - always show simple format for filtered data
                                    return (
                                        <span>
                                            {t('common.pagination.showingFilteredRecords', {
                                                filtered: data.length,
                                                total: totalCount
                                            })}
                                        </span>
                                    );
                                } else if (totalPages <= 1) {
                                    // Single page - show simple format: "Showing X of X records"
                                    return (
                                        <span>
                                            {t('common.pagination.showing', {
                                                current: data.length,
                                                total: data.length
                                            })}
                                        </span>
                                    );
                                } else {
                                    // Multiple pages - show simple format: "Showing X of Y records"
                                    const currentPageItems = Math.min(pageSize, data.length - (pageIndex * pageSize));
                                    return (
                                        <span>
                                            {t('common.pagination.showing', {
                                                current: currentPageItems,
                                                total: data.length
                                            })}
                                        </span>
                                    );
                                }
                            })()
                        ) : data.length > 0 && externalPagination ? (
                            (() => {
                                const { pageIndex, pageSize } = externalPagination;
                                const displayTotal = totalCount || data.length;
                                const totalPages = Math.ceil(displayTotal / pageSize);

                                if (totalCount && totalCount > data.length) {
                                    // Show filtered results - always show simple format for filtered data
                                    return (
                                        <span>
                                            {t('common.pagination.showingFilteredRecords', {
                                                filtered: data.length,
                                                total: totalCount
                                            })}
                                        </span>
                                    );
                                } else if (totalPages <= 1) {
                                    // Single page - show simple format: "Showing X of X records"
                                    return (
                                        <span>
                                            {t('common.pagination.showing', {
                                                current: data.length,
                                                total: displayTotal
                                            })}
                                        </span>
                                    );
                                } else {
                                    // Multiple pages - show simple format: "Showing X of Y records"
                                    const currentPageItems = Math.min(pageSize, displayTotal - (pageIndex * pageSize));
                                    return (
                                        <span>
                                            {t('common.pagination.showing', {
                                                current: currentPageItems,
                                                total: displayTotal
                                            })}
                                        </span>
                                    );
                                }
                            })()
                        ) : null}
                        {loading && loadingText && <span>{loadingText}</span>}
                    </div>

                    {/* Navigation controls - only show if not using external scroll arrows */}
                    {showScrollButtons && !externalScrollArrows && (isMobile || canScrollLeft || canScrollRight) && (
                        <div className="inline-flex items-center gap-1 px-2 py-1 bg-neutral-50 border border-neutral-200 rounded-md">
                            <button
                                className="scroll-nav-button"
                                onClick={handleScrollLeft}
                                disabled={!canScrollLeft}
                                title={t('datatable.scrollLeft') || 'Scroll left to see previous columns'}
                                aria-label={t('datatable.scrollLeft') || 'Scroll table left'}
                            >
                                <ChevronLeftIcon className={cn(isMobile ? 'h-5 w-5' : 'h-4 w-4')} />
                            </button>
                            <button
                                className="scroll-nav-button"
                                onClick={handleScrollRight}
                                disabled={!canScrollRight}
                                title={t('datatable.scrollRight') || 'Scroll right to see more columns'}
                                aria-label={t('datatable.scrollRight') || 'Scroll table right'}
                            >
                                <ChevronRightIcon className={cn(isMobile ? 'h-5 w-5' : 'h-4 w-4')} />
                            </button>
                        </div>
                    )}
                </div>
            )}

            {/* Table container */}
            <div
                ref={tableContainerRef}
                className={cn('manager-table-container rounded-xl border border-neutral-200 bg-white shadow-soft', className)}
                style={{ overflow: 'visible', position: 'relative' }}
            >
                {/* Screen reader announcements */}
                <div
                    aria-live="polite"
                    aria-atomic="true"
                    className="sr-only"
                    role="status"
                >
                    {announceMessage}
                </div>

                {/* Table description for screen readers */}
                <div className="sr-only" id="table-description">
                    {tableDescription}
                    {data.length > 0 && (
                        <>
                            {' '}
                            {t('datatable.accessibility.navigationInstructions')}
                            {enableRowSelection && (
                                <>
                                    {' '}
                                    {t('datatable.accessibility.selectInstructions')}
                                </>
                            )}
                        </>
                    )}
                </div>

                {/* Scrollable table container */}
                <div
                    className={cn(
                        'overflow-x-auto table-scroll-container relative rounded-xl',
                        isMobile && 'touch-pan-x'
                    )}
                    data-scroll-container="true"
                    style={{
                        WebkitOverflowScrolling: 'touch',
                        scrollBehavior: 'smooth',
                        // Ensure horizontal scrolling works but vertical overflow is visible for dropdowns
                        overflowY: 'visible'
                    }}
                >
                    {/* Mobile scroll indicators */}
                    {isMobile && (
                        <>
                            {canScrollLeft && (
                                <div className="absolute left-0 top-0 bottom-0 w-4 bg-gradient-to-r from-white to-transparent pointer-events-none z-10" />
                            )}
                            {canScrollRight && (
                                <div className="absolute right-0 top-0 bottom-0 w-4 bg-gradient-to-l from-white to-transparent pointer-events-none z-10" />
                            )}
                        </>
                    )}
                    <table
                        className="w-full"
                        role="table"
                        aria-describedby="table-description"
                        aria-rowcount={table.getRowModel().rows.length + 1} // +1 for header
                        aria-colcount={table.getVisibleLeafColumns().length}
                    >
                        <thead className="sticky top-0 z-10 bg-gradient-to-r from-neutral-50 to-neutral-100 border-b border-neutral-200">
                            {table.getHeaderGroups().map((headerGroup) => (
                                <tr key={headerGroup.id} role="row">
                                    {headerGroup.headers.map((header, headerIndex) => {
                                        // Mobile override: always render all columns on mobile
                                        const columnId = header.column.id;
                                        const essentialColumns = ['status', 'name', 'title', 'id'];
                                        const isEssential = essentialColumns.includes(columnId.toLowerCase());

                                        // On mobile, always render all columns; on desktop, use visibility logic
                                        const shouldRender = isMobile ? true : (isEssential || header.column.getIsVisible());

                                        if (!shouldRender) return null;

                                        return (
                                            <th
                                                key={header.id}
                                                colSpan={header.colSpan}
                                                role="columnheader"
                                                aria-colindex={headerIndex + 1}
                                                aria-sort={
                                                    header.column.getCanSort()
                                                        ? header.column.getIsSorted() === 'asc'
                                                            ? 'ascending'
                                                            : header.column.getIsSorted() === 'desc'
                                                                ? 'descending'
                                                                : 'none'
                                                        : undefined
                                                }
                                                data-column={columnId}
                                                className={cn(
                                                    'text-left text-xs font-semibold text-neutral-700 uppercase tracking-wider border-r border-neutral-100 last:border-r-0',
                                                    'whitespace-nowrap', // Prevent text wrapping that could cause vertical display
                                                    isMobile ? 'px-3 py-3' : 'px-6 py-4'
                                                )}
                                            >
                                                {header.isPlaceholder ? null : (
                                                    <div className="flex items-center w-full">
                                                        {/* Enhanced Filter Dropdown - positioned to the left of column name */}
                                                        {enableColumnFiltering && tableName && filterableColumns[header.column.id] && (
                                                            <div className="relative mr-2">
                                                                <FilterIcon
                                                                    columnId={header.column.id}
                                                                    columnLabel={typeof header.column.columnDef.header === 'string' ? header.column.columnDef.header : header.column.id}
                                                                    data={data}
                                                                    onFilterChange={(values) => {
                                                                        const columnId = header.column.id;
                                                                        const filterConfig = filterConfigurations[columnId];

                                                                        // Validate and apply filter using filter state manager
                                                                        const validation = validateAndApplyFilter(columnId, values, filterConfig);

                                                                        if (!validation.isValid) {
                                                                            console.warn(`Invalid filter for column ${columnId}:`, validation.error);
                                                                            return; // Don't apply invalid filters
                                                                        }

                                                                        // Apply filter to TanStack Table
                                                                        header.column.setFilterValue(validation.filterValue);

                                                                        // Update local state for UI consistency
                                                                        const newFilters = columnFilters.filter(f => f.id !== columnId);
                                                                        if (validation.filterValue && validation.filterValue.length > 0) {
                                                                            newFilters.push({ id: columnId, value: validation.filterValue });
                                                                        }
                                                                        setColumnFilters(newFilters);

                                                                        // Sync with parent component
                                                                        syncFilterState(newFilters, onFiltersChange);
                                                                    }}
                                                                    currentFilter={(() => {
                                                                        const filterValue = header.column.getFilterValue();
                                                                        return Array.isArray(filterValue) ? filterValue : [];
                                                                    })()}
                                                                    filterConfig={filterConfigurations[header.column.id]}
                                                                    tableName={tableName}
                                                                />
                                                            </div>
                                                        )}

                                                        {/* Column name and sort functionality */}
                                                        <div
                                                            className={cn(
                                                                "flex items-center space-x-1 flex-1",
                                                                header.column.getCanSort() && 'cursor-pointer select-none hover:text-primary-600 transition-colors',
                                                                isTouch && header.column.getCanSort() && 'touch-manipulation'
                                                            )}
                                                            onClick={() => header.column.getCanSort() && handleColumnSort(header.column)}
                                                            onKeyDown={(e) => {
                                                                if (header.column.getCanSort() && (e.key === 'Enter' || e.key === ' ')) {
                                                                    e.preventDefault();
                                                                    handleColumnSort(header.column);
                                                                }
                                                            }}
                                                            tabIndex={header.column.getCanSort() ? 0 : -1}
                                                            role={header.column.getCanSort() ? 'button' : undefined}
                                                            aria-label={
                                                                header.column.getCanSort()
                                                                    ? t('datatable.accessibility.sortInstructions')
                                                                    : undefined
                                                            }
                                                        >
                                                            <span className={cn(
                                                                isMobile && 'text-xs',
                                                                'whitespace-nowrap inline-block', // Ensure horizontal text display
                                                                'writing-mode-horizontal-tb' // Force horizontal writing mode for all languages
                                                            )}>
                                                                {flexRender(header.column.columnDef.header, header.getContext())}
                                                            </span>
                                                            {header.column.getCanSort() && (
                                                                <ArrowUpDown
                                                                    className={cn('opacity-50', isMobile ? 'h-3 w-3' : 'h-4 w-4')}
                                                                    aria-hidden="true"
                                                                />
                                                            )}
                                                        </div>
                                                    </div>
                                                )}
                                            </th>
                                        );
                                    })}
                                </tr>
                            ))}
                        </thead>
                        <tbody className="bg-white divide-y divide-neutral-100">
                            {table.getRowModel().rows?.length ? (
                                table.getRowModel().rows.map((row, rowIndex) => (
                                    <tr
                                        key={row.id}
                                        role="row"
                                        aria-rowindex={rowIndex + 2} // +2 because header is row 1
                                        aria-selected={enableRowSelection ? row.getIsSelected() : undefined}
                                        tabIndex={onRowClick || enableRowSelection ? 0 : -1}
                                        className={cn(
                                            'border-b border-neutral-50 last:border-b-0',
                                            row.getIsSelected() && 'bg-primary-50',
                                            (onRowClick || enableRowSelection) && 'cursor-pointer',
                                            isTouch && (onRowClick || enableRowSelection) && 'touch-manipulation',

                                        )}
                                        onClick={(e) => {
                                            // Prevent row click if clicking on checkbox or its container
                                            const target = e.target as HTMLElement;
                                            const isCheckboxClick = target.closest('[data-checkbox-cell="true"]') ||
                                                (target as HTMLInputElement).type === 'checkbox' ||
                                                target.closest('input[type="checkbox"]');

                                            if (!isCheckboxClick && onRowClick) {
                                                onRowClick(row.original);
                                            }
                                        }}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter' || e.key === ' ') {
                                                e.preventDefault();
                                                if (enableRowSelection) {
                                                    row.toggleSelected();
                                                }
                                                if (onRowClick) {
                                                    onRowClick(row.original);
                                                }
                                            }
                                        }}
                                        aria-label={
                                            enableRowSelection
                                                ? row.getIsSelected()
                                                    ? t('datatable.accessibility.deselectRow', { index: rowIndex + 1 })
                                                    : t('datatable.accessibility.selectRow', { index: rowIndex + 1 })
                                                : undefined
                                        }
                                    >
                                        {(isMobile ? row.getAllCells() : row.getVisibleCells()).map((cell, cellIndex) => {
                                            // Mobile override: always render all columns on mobile
                                            const columnId = cell.column.id;
                                            const essentialColumns = ['status', 'name', 'title', 'id'];
                                            const isEssential = essentialColumns.includes(columnId.toLowerCase());

                                            // On mobile, always render all columns; on desktop, use visibility logic
                                            const shouldRender = isMobile ? true : (isEssential || cell.column.getIsVisible());

                                            if (!shouldRender) return null;

                                            return (
                                                <td
                                                    key={cell.id}
                                                    role="gridcell"
                                                    aria-colindex={cellIndex + 1}
                                                    data-column={columnId}
                                                    data-checkbox-cell={columnId === 'select' ? 'true' : undefined}
                                                    className={cn(
                                                        'text-sm text-neutral-900 border-r border-neutral-50 last:border-r-0',
                                                        isMobile ? 'px-3 py-3 whitespace-nowrap' : 'px-6 py-4 whitespace-nowrap',

                                                    )}
                                                >
                                                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                                </td>
                                            );
                                        })}
                                    </tr>
                                ))
                            ) : (
                                <tr role="row">
                                    <td
                                        colSpan={responsiveColumns.length}
                                        role="gridcell"
                                        className={cn('text-center', isMobile ? 'px-3 py-8' : 'px-6 py-12')}
                                    >
                                        <div className="flex flex-col items-center space-y-4">
                                            <div className={cn('rounded-full flex items-center justify-center',
                                                isMobile ? 'h-12 w-12' : 'h-16 w-16',
                                                (searchQuery || computedHasActiveFilters) ? 'bg-blue-100' : 'bg-neutral-100'
                                            )}>
                                                {(searchQuery || computedHasActiveFilters) ? (
                                                    <svg
                                                        className={cn('text-blue-500', isMobile ? 'h-6 w-6' : 'h-8 w-8')}
                                                        fill="none"
                                                        viewBox="0 0 24 24"
                                                        stroke="currentColor"
                                                        aria-hidden="true"
                                                    >
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                                    </svg>
                                                ) : (
                                                    <svg
                                                        className={cn('text-neutral-400', isMobile ? 'h-6 w-6' : 'h-8 w-8')}
                                                        fill="none"
                                                        viewBox="0 0 24 24"
                                                        stroke="currentColor"
                                                        aria-hidden="true"
                                                    >
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                                    </svg>
                                                )}
                                            </div>
                                            <div className="text-center max-w-sm">
                                                <p className={cn('font-medium',
                                                    isMobile ? 'text-sm' : 'text-base',
                                                    (searchQuery || computedHasActiveFilters) ? 'text-blue-900' : 'text-neutral-900'
                                                )}>
                                                    {(searchQuery || computedHasActiveFilters)
                                                        ? t('datatable.noResults')
                                                        : (emptyStateMessage || t('datatable.emptyState'))
                                                    }
                                                </p>
                                                <p className={cn('text-neutral-500 mt-1', isMobile ? 'text-xs' : 'text-sm')}>
                                                    {(searchQuery || computedHasActiveFilters)
                                                        ? t('datatable.filterResults')
                                                        : t('datatable.emptyStateDescription') || 'No data has been added yet.'
                                                    }
                                                </p>
                                                {(searchQuery || computedHasActiveFilters) && onClearFilters && (
                                                    <Button
                                                        variant="outline"
                                                        size={isMobile ? 'sm' : 'default'}
                                                        onClick={onClearFilters}
                                                        className="mt-3 border-blue-300 text-blue-700 hover:bg-blue-50 focus:ring-blue-500"
                                                    >
                                                        <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                        </svg>
                                                        {t('datatable.clearFilters') || 'Clear Filters'}
                                                    </Button>
                                                )}
                                            </div>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination footer */}
                <div
                    className={cn(
                        'pagination-footer flex items-center justify-between border-t border-neutral-200 bg-neutral-50',
                        isMobile ? 'px-3 py-3 flex-col space-y-3' : 'px-6 py-4 flex-row'
                    )}
                    role="navigation"
                    aria-label={t('datatable.accessibility.paginationInstructions')}
                >
                    {/* Row selection info */}
                    {enableRowSelection && rowSelectionMode === 'multiple' && (
                        <div
                            className={cn(
                                'text-neutral-600',
                                isMobile ? 'text-xs text-center' : 'hidden flex-1 text-sm lg:flex'
                            )}
                            role="status"
                            aria-live="polite"
                        >
                            {t('datatable.rowsSelected', {
                                selected: table.getFilteredSelectedRowModel().rows.length,
                                total: table.getFilteredRowModel().rows.length,
                            })}
                        </div>
                    )}

                    {/* Pagination status for screen readers */}
                    <div className="sr-only" aria-live="polite" role="status">
                        {t('datatable.accessibility.currentPage', {
                            page: table.getState().pagination.pageIndex + 1,
                            total: table.getPageCount()
                        })}
                        {' '}
                        {t('datatable.accessibility.pageSize', {
                            size: table.getState().pagination.pageSize
                        })}
                        {' '}
                        {searchQuery
                            ? t('datatable.accessibility.filteredItems', {
                                filtered: table.getFilteredRowModel().rows.length,
                                total: data.length
                            })
                            : t('datatable.accessibility.totalItems', {
                                total: data.length
                            })
                        }
                    </div>

                    {/* Mobile pagination controls */}
                    {isMobile ? (
                        <div className="flex flex-col items-center space-y-2 w-full">
                            {/* Page info */}
                            <div className="text-xs font-medium text-neutral-700 text-center">
                                {t('datatable.page')} {table.getState().pagination.pageIndex + 1} {t('common.navigation.of')}{' '}
                                {table.getPageCount()}
                            </div>

                            {/* Navigation buttons */}
                            <div className="flex items-center gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="h-8 px-2 text-xs"
                                    onClick={() => {
                                        table.previousPage();
                                        announce(t('datatable.accessibility.currentPage', {
                                            page: table.getState().pagination.pageIndex,
                                            total: table.getPageCount()
                                        }));
                                    }}
                                    disabled={!table.getCanPreviousPage()}
                                    aria-label={t('datatable.goToPrevious')}
                                >
                                    <ChevronLeftIcon className="h-3 w-3 mr-1" aria-hidden="true" />
                                    {t('common.navigation.previous')}
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="h-8 px-2 text-xs"
                                    onClick={() => {
                                        table.nextPage();
                                        announce(t('datatable.accessibility.currentPage', {
                                            page: table.getState().pagination.pageIndex + 2,
                                            total: table.getPageCount()
                                        }));
                                    }}
                                    disabled={!table.getCanNextPage()}
                                    aria-label={t('datatable.goToNext')}
                                >
                                    {t('common.navigation.next')}
                                    <ChevronRightIcon className="h-3 w-3 ml-1" aria-hidden="true" />
                                </Button>
                            </div>

                            {/* Rows per page for mobile */}
                            <div className="flex items-center gap-2">
                                <label htmlFor="mobile-rows-per-page" className="text-xs font-medium text-neutral-700">
                                    {t('datatable.rowsPerPage')}
                                </label>
                                <Select
                                    value={`${table.getState().pagination.pageSize}`}
                                    onValueChange={(value) => {
                                        table.setPageSize(Number(value));
                                        announce(t('datatable.accessibility.pageSize', { size: value }));
                                    }}
                                >
                                    <SelectTrigger
                                        className="w-16 h-7 text-xs"
                                        id="mobile-rows-per-page"
                                        aria-label={t('datatable.rowsPerPage')}
                                    >
                                        <SelectValue placeholder={table.getState().pagination.pageSize} />
                                    </SelectTrigger>
                                    <SelectContent side="top">
                                        {[10, 20, 30].map((pageSize) => (
                                            <SelectItem key={pageSize} value={`${pageSize}`}>
                                                {pageSize}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    ) : (
                        /* Desktop pagination controls */
                        <div className="flex w-full items-center gap-6 lg:w-fit">
                            {/* Rows per page selector */}
                            <div className="hidden items-center gap-2 lg:flex">
                                <label htmlFor="rows-per-page" className="text-sm font-medium text-neutral-700">
                                    {t('datatable.rowsPerPage')}
                                </label>
                                <Select
                                    value={`${table.getState().pagination.pageSize}`}
                                    onValueChange={(value) => {
                                        table.setPageSize(Number(value));
                                        announce(t('datatable.accessibility.pageSize', { size: value }));
                                    }}
                                >
                                    <SelectTrigger
                                        className="w-20 h-10"
                                        id="rows-per-page"
                                        aria-label={t('datatable.rowsPerPage')}
                                    >
                                        <SelectValue placeholder={table.getState().pagination.pageSize} />
                                    </SelectTrigger>
                                    <SelectContent side="top">
                                        {[10, 20, 30, 40, 50, 100].map((pageSize) => (
                                            <SelectItem key={pageSize} value={`${pageSize}`}>
                                                {pageSize}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Page info */}
                            <div className="flex w-fit items-center justify-center text-sm font-medium text-neutral-700">
                                {t('datatable.page')} {table.getState().pagination.pageIndex + 1} {t('common.navigation.of')}{' '}
                                {table.getPageCount()}
                            </div>

                            {/* Navigation buttons */}
                            <div className="ml-auto flex items-center gap-2 lg:ml-0">
                                <Button
                                    variant="outline"
                                    className="hidden h-10 w-10 p-0 lg:flex"
                                    onClick={() => {
                                        table.setPageIndex(0);
                                        announce(t('datatable.accessibility.currentPage', {
                                            page: 1,
                                            total: table.getPageCount()
                                        }));
                                    }}
                                    disabled={!table.getCanPreviousPage()}
                                    aria-label={t('datatable.goToFirst')}
                                >
                                    <ChevronsLeftIcon className="h-4 w-4" aria-hidden="true" />
                                </Button>
                                <Button
                                    variant="outline"
                                    size="icon"
                                    className="h-10 w-10"
                                    onClick={() => {
                                        table.previousPage();
                                        announce(t('datatable.accessibility.currentPage', {
                                            page: table.getState().pagination.pageIndex,
                                            total: table.getPageCount()
                                        }));
                                    }}
                                    disabled={!table.getCanPreviousPage()}
                                    aria-label={t('datatable.goToPrevious')}
                                >
                                    <ChevronLeftIcon className="h-4 w-4" aria-hidden="true" />
                                </Button>
                                <Button
                                    variant="outline"
                                    size="icon"
                                    className="h-10 w-10"
                                    onClick={() => {
                                        table.nextPage();
                                        announce(t('datatable.accessibility.currentPage', {
                                            page: table.getState().pagination.pageIndex + 2,
                                            total: table.getPageCount()
                                        }));
                                    }}
                                    disabled={!table.getCanNextPage()}
                                    aria-label={t('datatable.goToNext')}
                                >
                                    <ChevronRightIcon className="h-4 w-4" aria-hidden="true" />
                                </Button>
                                <Button
                                    variant="outline"
                                    className="hidden h-10 w-10 p-0 lg:flex"
                                    onClick={() => {
                                        table.setPageIndex(table.getPageCount() - 1);
                                        announce(t('datatable.accessibility.currentPage', {
                                            page: table.getPageCount(),
                                            total: table.getPageCount()
                                        }));
                                    }}
                                    disabled={!table.getCanNextPage()}
                                    aria-label={t('datatable.goToLast')}
                                >
                                    <ChevronsRightIcon className="h-4 w-4" aria-hidden="true" />
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
