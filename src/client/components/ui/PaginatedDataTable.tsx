import React, { useRef, useState, useCallback, useEffect } from 'react';
import {
    flexRender,
    getCoreRowModel,
    getSortedRowModel,
    getPaginationRowModel,
    useReactTable,
    type ColumnDef,
    type SortingState,
    type PaginationState,
} from '@tanstack/react-table';
import { ChevronLeftIcon, ChevronRightIcon, ChevronsLeftIcon, ChevronsRightIcon, ArrowUpDown } from 'lucide-react';
import { Button } from './Button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './Select';
import { useLanguage } from '../../contexts/LanguageContext';
import { useResponsive } from '../../hooks/useResponsive';

import { cn } from '../../utils/cn';

interface PaginatedDataTableProps<TData> {
    columns: ColumnDef<TData>[];
    data: TData[];
    loading?: boolean;
    error?: string | null;
    pageSize?: number;
    pageSizeOptions?: number[];
    showPagination?: boolean;
    onPaginationChange?: (pagination: PaginationState) => void;
    className?: string;
    _persistKey?: string; // Key for localStorage persistence (unused)
    totalCount?: number; // Total count before filtering (for showing "X of Y filtered records")
}

export function PaginatedDataTable<TData>({
    columns,
    data,
    loading = false,
    error = null,
    pageSize = 20,
    pageSizeOptions = [10, 20, 30, 40, 50, 100],
    showPagination = true,
    onPaginationChange,
    className,
    _persistKey,
    totalCount,
}: PaginatedDataTableProps<TData>) {
    const { t } = useLanguage();
    const { isMobile } = useResponsive();
    const [sorting, setSorting] = useState<SortingState>([]);

    // Use TanStack Table's built-in pagination state
    const [pagination, setPagination] = useState<PaginationState>({
        pageIndex: 0,
        pageSize: pageSize,
    });

    // Scroll functionality (following Sales Assistant pattern)
    const tableContainerRef = useRef<HTMLDivElement>(null);
    const [canScrollLeft, setCanScrollLeft] = useState(false);
    const [canScrollRight, setCanScrollRight] = useState(false);

    const getScrollContainer = useCallback(() => {
        if (!tableContainerRef.current) return null;
        return tableContainerRef.current.querySelector('[data-slot="table-container"]') as HTMLDivElement;
    }, []);

    const updateScrollButtons = useCallback(() => {
        const container = getScrollContainer();
        if (!container) return;

        const { scrollLeft, scrollWidth, clientWidth } = container;
        setCanScrollLeft(scrollLeft > 0);
        setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 1);
    }, [getScrollContainer]);

    const handleScrollLeft = useCallback(() => {
        const container = getScrollContainer();
        if (!container) return;

        const scrollAmount = Math.min(300, container.clientWidth * 0.4);
        container.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
    }, [getScrollContainer]);

    const handleScrollRight = useCallback(() => {
        const container = getScrollContainer();
        if (!container) return;

        const scrollAmount = Math.min(300, container.clientWidth * 0.4);
        container.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }, [getScrollContainer]);

    // Handle pagination changes
    const handlePaginationChange = useCallback((updater: PaginationState | ((old: PaginationState) => PaginationState)) => {
        const newPagination = typeof updater === 'function' ? updater(pagination) : updater;
        setPagination(newPagination);
        onPaginationChange?.(newPagination);
    }, [pagination, onPaginationChange, setPagination]);

    const table = useReactTable({
        data,
        columns,
        state: {
            sorting,
            pagination,
        },
        onSortingChange: setSorting,
        onPaginationChange: handlePaginationChange,
        getCoreRowModel: getCoreRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
    });

    // Update button states on scroll and data changes
    useEffect(() => {
        const container = getScrollContainer();
        if (!container) return;

        updateScrollButtons();

        container.addEventListener('scroll', updateScrollButtons);
        window.addEventListener('resize', updateScrollButtons);

        return () => {
            container.removeEventListener('scroll', updateScrollButtons);
            window.removeEventListener('resize', updateScrollButtons);
        };
    }, [updateScrollButtons, data, getScrollContainer]);

    if (loading) {
        return (
            <div className="flex items-center justify-center py-8">
                <div className="text-sm text-muted-foreground">{t('common.status.loading')}</div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="text-sm text-red-600 bg-red-50 p-3 rounded border border-red-200">
                {error}
            </div>
        );
    }

    return (
        <div className={cn('space-y-4', className)}>
            {/* Custom styles for table scrolling */}
            <style>{`
                .paginated-table-container .table-scroll-container {
                    scrollbar-width: thin;
                    scrollbar-color: #cbd5e1 #f1f5f9;
                }
                .paginated-table-container .table-scroll-container::-webkit-scrollbar {
                    height: 8px;
                }
                .paginated-table-container .table-scroll-container::-webkit-scrollbar-track {
                    background: #f1f5f9;
                    border-radius: 4px;
                }
                .paginated-table-container .table-scroll-container::-webkit-scrollbar-thumb {
                    background: #cbd5e1;
                    border-radius: 4px;
                }
                .paginated-table-container .table-scroll-container::-webkit-scrollbar-thumb:hover {
                    background: #94a3b8;
                }
                
                .scroll-nav-buttons {
                    display: flex;
                    gap: 4px;
                    margin-bottom: 8px;
                    justify-content: flex-end;
                }
                
                .scroll-nav-button {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    width: ${isMobile ? '40px' : '28px'};
                    height: ${isMobile ? '40px' : '28px'};
                    background: #ffffff;
                    border: 1px solid #d1d5db;
                    border-radius: ${isMobile ? '8px' : '4px'};
                    cursor: pointer;
                    transition: all 0.15s ease;
                    color: #6b7280;
                    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
                    touch-action: manipulation;
                    min-width: ${isMobile ? '44px' : '28px'};
                    min-height: ${isMobile ? '44px' : '28px'};
                }
                
                .scroll-nav-button:hover:not(:disabled) {
                    background: #f9fafb;
                    border-color: #9ca3af;
                    color: #374151;
                    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
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
                .paginated-table-container [data-slot="table"] {
                    width: 100%;
                    table-layout: auto;
                }
                
                /* Desktop: columns stretch to fill available space */
                @media (min-width: 769px) {
                    .paginated-table-container [data-slot="table"] {
                        width: 100%;
                        table-layout: auto;
                    }
                    
                    .paginated-table-container th,
                    .paginated-table-container td {
                        width: auto;
                    }
                }
                
                /* Mobile: enable horizontal scrolling with minimum widths */
                @media (max-width: 768px) {
                    .paginated-table-container [data-slot="table"] {
                        min-width: 1000px;
                        width: max-content;
                        table-layout: fixed;
                    }
                    
                    .paginated-table-container th,
                    .paginated-table-container td {
                        white-space: nowrap;
                        min-width: 120px;
                    }
                    
                    .paginated-table-container th:first-child,
                    .paginated-table-container td:first-child {
                        min-width: 150px;
                    }
                }
            `}</style>

            {/* Results summary and navigation controls above the table */}
            <div className="flex items-center justify-between mb-2">
                {/* Results summary */}
                <div className="text-sm text-gray-600">
                    {data.length > 0 && (
                        (() => {
                            const { pageIndex, pageSize } = table.getState().pagination;
                            const totalPages = Math.ceil(data.length / pageSize);

                            if (totalCount && totalCount > data.length) {
                                // Show filtered results - always show simple format for filtered data
                                return t('common.pagination.showingFilteredRecords', {
                                    filtered: data.length,
                                    total: totalCount
                                });
                            } else if (totalPages <= 1) {
                                // Single page - show simple format: "Showing X of X records"
                                return t('common.pagination.showing', {
                                    current: data.length,
                                    total: data.length
                                });
                            } else {
                                // Multiple pages - show simple format: "Showing X of Y records"
                                const currentPageItems = Math.min(pageSize, data.length - (pageIndex * pageSize));
                                return t('common.pagination.showing', {
                                    current: currentPageItems,
                                    total: data.length
                                });
                            }
                        })()
                    )}
                </div>

                {/* Navigation controls */}
                {(isMobile || canScrollLeft || canScrollRight) && (
                    <div className="scroll-nav-buttons">
                        <button
                            className="scroll-nav-button"
                            onClick={handleScrollLeft}
                            disabled={!canScrollLeft}
                            title="Scroll left to see previous columns"
                            aria-label="Scroll table left"
                        >
                            <ChevronLeftIcon className={cn(isMobile ? 'h-5 w-5' : 'h-4 w-4')} />
                        </button>
                        <button
                            className="scroll-nav-button"
                            onClick={handleScrollRight}
                            disabled={!canScrollRight}
                            title="Scroll right to see more columns"
                            aria-label="Scroll table right"
                        >
                            <ChevronRightIcon className={cn(isMobile ? 'h-5 w-5' : 'h-4 w-4')} />
                        </button>
                    </div>
                )}
            </div>

            {/* Table container */}
            <div ref={tableContainerRef} className="paginated-table-container">
                <div
                    className="overflow-x-auto border border-gray-200 rounded-lg"
                    data-slot="table-container"
                >
                    <table className="min-w-full divide-y divide-gray-200" data-slot="table">
                        <thead className="bg-gray-50">
                            {table.getHeaderGroups().map((headerGroup) => (
                                <tr key={headerGroup.id}>
                                    {headerGroup.headers.map((header) => (
                                        <th
                                            key={header.id}
                                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                                        >
                                            {header.isPlaceholder ? null : (
                                                <div
                                                    className={
                                                        header.column.getCanSort()
                                                            ? 'cursor-pointer select-none flex items-center space-x-1'
                                                            : ''
                                                    }
                                                    onClick={header.column.getToggleSortingHandler()}
                                                >
                                                    <span>
                                                        {flexRender(
                                                            header.column.columnDef.header,
                                                            header.getContext()
                                                        )}
                                                    </span>
                                                    {header.column.getCanSort() && (
                                                        <ArrowUpDown className="h-4 w-4" />
                                                    )}
                                                    {header.column.getIsSorted() === 'asc' && (
                                                        <span className="text-blue-600">↑</span>
                                                    )}
                                                    {header.column.getIsSorted() === 'desc' && (
                                                        <span className="text-blue-600">↓</span>
                                                    )}
                                                </div>
                                            )}
                                        </th>
                                    ))}
                                </tr>
                            ))}
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {table.getRowModel().rows.map((row) => (
                                <tr key={row.id} className="hover:bg-gray-50">
                                    {row.getVisibleCells().map((cell) => (
                                        <td
                                            key={cell.id}
                                            className="px-6 py-4 whitespace-nowrap text-sm text-gray-900"
                                        >
                                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                        </td>
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Empty state */}
            {!loading && !error && data.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                    {t('common.emptyStates.noResults')}
                </div>
            )}

            {/* Pagination controls */}
            {showPagination && data.length > 0 && (
                <div className={cn(
                    'flex items-center justify-between border-t border-gray-200 bg-gray-50 px-4 py-3 sm:px-6',
                    isMobile && 'flex-col space-y-3'
                )}>
                    {/* Mobile pagination */}
                    {isMobile ? (
                        <div className="flex flex-col items-center space-y-2 w-full">
                            {/* Page info */}
                            <div className="text-sm font-medium text-gray-700">
                                {t('datatable.page')} {table.getState().pagination.pageIndex + 1} {t('common.navigation.of')}{' '}
                                {table.getPageCount()}
                            </div>

                            {/* Navigation buttons */}
                            <div className="flex items-center gap-3">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => table.previousPage()}
                                    disabled={!table.getCanPreviousPage()}
                                    className="touch-manipulation min-h-[44px] px-4 py-2"
                                >
                                    <ChevronLeftIcon className="h-5 w-5 mr-2" />
                                    {t('common.navigation.previous')}
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => table.nextPage()}
                                    disabled={!table.getCanNextPage()}
                                    className="touch-manipulation min-h-[44px] px-4 py-2"
                                >
                                    {t('common.navigation.next')}
                                    <ChevronRightIcon className="h-5 w-5 ml-2" />
                                </Button>
                            </div>

                            {/* Rows per page */}
                            <div className="flex items-center gap-3">
                                <label htmlFor="mobile-rows-per-page" className="text-sm font-medium text-gray-700">
                                    {t('datatable.rowsPerPage')}
                                </label>
                                <Select
                                    value={`${table.getState().pagination.pageSize}`}
                                    onValueChange={(value) => table.setPageSize(Number(value))}
                                >
                                    <SelectTrigger className="w-20 h-11 touch-manipulation" id="mobile-rows-per-page">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {pageSizeOptions.map((size) => (
                                            <SelectItem key={size} value={`${size}`} className="min-h-[44px] touch-manipulation">
                                                {size}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    ) : (
                        /* Desktop pagination */
                        <>
                            <div className="flex items-center gap-6">
                                {/* Rows per page selector */}
                                <div className="flex items-center gap-2">
                                    <label htmlFor="rows-per-page" className="text-sm font-medium text-gray-700">
                                        {t('datatable.rowsPerPage')}
                                    </label>
                                    <Select
                                        value={`${table.getState().pagination.pageSize}`}
                                        onValueChange={(value) => table.setPageSize(Number(value))}
                                    >
                                        <SelectTrigger className="w-20" id="rows-per-page">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {pageSizeOptions.map((size) => (
                                                <SelectItem key={size} value={`${size}`}>
                                                    {size}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                {/* Page info */}
                                <div className="text-sm font-medium text-gray-700">
                                    {t('datatable.page')} {table.getState().pagination.pageIndex + 1} {t('common.navigation.of')}{' '}
                                    {table.getPageCount()}
                                </div>
                            </div>

                            {/* Navigation buttons */}
                            <div className="flex items-center gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => table.setPageIndex(0)}
                                    disabled={!table.getCanPreviousPage()}
                                    className="hidden lg:flex h-10 w-10 p-0 touch-manipulation"
                                    title="Go to first page"
                                >
                                    <ChevronsLeftIcon className="h-4 w-4" />
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => table.previousPage()}
                                    disabled={!table.getCanPreviousPage()}
                                    className="h-10 w-10 p-0 touch-manipulation"
                                    title="Go to previous page"
                                >
                                    <ChevronLeftIcon className="h-4 w-4" />
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => table.nextPage()}
                                    disabled={!table.getCanNextPage()}
                                    className="h-10 w-10 p-0 touch-manipulation"
                                    title="Go to next page"
                                >
                                    <ChevronRightIcon className="h-4 w-4" />
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => table.setPageIndex(table.getPageCount() - 1)}
                                    disabled={!table.getCanNextPage()}
                                    className="hidden lg:flex h-10 w-10 p-0 touch-manipulation"
                                    title="Go to last page"
                                >
                                    <ChevronsRightIcon className="h-4 w-4" />
                                </Button>
                            </div>
                        </>
                    )}
                </div>
            )}
        </div>
    );
}