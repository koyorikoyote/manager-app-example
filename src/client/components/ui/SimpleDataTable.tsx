import React, { useRef, useState, useCallback, useEffect } from 'react';
import {
    flexRender,
    getCoreRowModel,
    getSortedRowModel,
    useReactTable,
    type ColumnDef,
    type SortingState,
} from '@tanstack/react-table';
import { ChevronLeftIcon, ChevronRightIcon, ArrowUpDown } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';

interface SimpleDataTableProps<TData> {
    columns: ColumnDef<TData>[];
    data: TData[];
    loading?: boolean;
    error?: string | null;
}

export function SimpleDataTable<TData>({
    columns,
    data,
    loading = false,
    error = null,
}: SimpleDataTableProps<TData>) {
    const { t } = useLanguage();
    const [sorting, setSorting] = useState<SortingState>([]);

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

    const table = useReactTable({
        data,
        columns,
        state: {
            sorting,
        },
        onSortingChange: setSorting,
        getCoreRowModel: getCoreRowModel(),
        getSortedRowModel: getSortedRowModel(),
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
        <div className="space-y-4">
            {/* Custom styles for table scrolling */}
            <style>{`
        .simple-table-container .table-scroll-container {
          scrollbar-width: thin;
          scrollbar-color: #cbd5e1 #f1f5f9;
        }
        .simple-table-container .table-scroll-container::-webkit-scrollbar {
          height: 8px;
        }
        .simple-table-container .table-scroll-container::-webkit-scrollbar-track {
          background: #f1f5f9;
          border-radius: 4px;
        }
        .simple-table-container .table-scroll-container::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 4px;
        }
        .simple-table-container .table-scroll-container::-webkit-scrollbar-thumb:hover {
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
          width: 28px;
          height: 28px;
          background: #ffffff;
          border: 1px solid #d1d5db;
          border-radius: 4px;
          cursor: pointer;
          transition: all 0.15s ease;
          color: #6b7280;
          box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
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
        
        .simple-table-container [data-slot="table"] {
          min-width: 1200px;
        }
      `}</style>

            {/* Navigation controls above the table */}
            <div className="scroll-nav-buttons">
                <button
                    className="scroll-nav-button"
                    onClick={handleScrollLeft}
                    disabled={!canScrollLeft}
                    title="Scroll left to see previous columns"
                    aria-label="Scroll table left"
                >
                    <ChevronLeftIcon className="h-4 w-4" />
                </button>
                <button
                    className="scroll-nav-button"
                    onClick={handleScrollRight}
                    disabled={!canScrollRight}
                    title="Scroll right to see more columns"
                    aria-label="Scroll table right"
                >
                    <ChevronRightIcon className="h-4 w-4" />
                </button>
            </div>

            {/* Table container */}
            <div ref={tableContainerRef} className="simple-table-container">
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
        </div>
    );
}