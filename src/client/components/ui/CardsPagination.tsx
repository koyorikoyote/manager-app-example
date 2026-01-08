/**
 * CardsPagination Component
 * 
 * Provides pagination controls specifically for Cards view mode in list pages.
 * Includes items per page selection and page navigation with mobile-friendly design.
 */
import React from 'react';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { Button } from './Button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './Select';
import { useLanguage } from '../../contexts/LanguageContext';
import { cn } from '../../utils/cn';

/** Available items per page options */
export const ITEMS_PER_PAGE_OPTIONS = [10, 20, 30] as const;

/** Props for the CardsPagination component */
interface CardsPaginationProps {
    /** Current page number (1-based) */
    currentPage: number;
    /** Total number of items */
    totalItems: number;
    /** Items per page */
    itemsPerPage: number;
    /** Callback when page changes */
    onPageChange: (page: number) => void;
    /** Callback when items per page changes */
    onItemsPerPageChange: (itemsPerPage: number) => void;
    /** Additional CSS classes */
    className?: string;
}

/**
 * CardsPagination component for Cards view mode
 * 
 * @param props - Component props
 * @returns Rendered pagination component
 */
export const CardsPagination: React.FC<CardsPaginationProps> = ({
    currentPage,
    totalItems,
    itemsPerPage,
    onPageChange,
    onItemsPerPageChange,
    className,
}) => {
    const { t } = useLanguage();

    // Calculate pagination values
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    const startItem = (currentPage - 1) * itemsPerPage + 1;
    const endItem = Math.min(currentPage * itemsPerPage, totalItems);

    // Don't render if no items or only one page
    if (totalItems === 0) {
        return null;
    }

    const handlePageChange = (page: number, event?: React.MouseEvent) => {
        if (event) {
            event.preventDefault();
            event.stopPropagation();
        }
        // Delegate clamping to parent hook (usePagination.setPage already clamps)
        onPageChange(page);
    };



    const renderPageNumbers = () => {
        const pages: (number | string)[] = [];

        if (totalPages <= 7) {
            // Show all pages if 7 or fewer
            for (let i = 1; i <= totalPages; i++) {
                pages.push(i);
            }
        } else {
            // Show condensed pagination for many pages
            if (currentPage <= 4) {
                // Show first 5 pages + ellipsis + last page
                for (let i = 1; i <= 5; i++) {
                    pages.push(i);
                }
                if (totalPages > 6) {
                    pages.push('...');
                    pages.push(totalPages);
                }
            } else if (currentPage >= totalPages - 3) {
                // Show first page + ellipsis + last 5 pages
                pages.push(1);
                if (totalPages > 6) {
                    pages.push('...');
                }
                for (let i = totalPages - 4; i <= totalPages; i++) {
                    pages.push(i);
                }
            } else {
                // Show first page + ellipsis + current-1, current, current+1 + ellipsis + last page
                pages.push(1);
                pages.push('...');
                for (let i = currentPage - 1; i <= currentPage + 1; i++) {
                    pages.push(i);
                }
                pages.push('...');
                pages.push(totalPages);
            }
        }

        return pages;
    };

    return (
        <div className={cn('flex flex-col sm:flex-row items-center justify-between gap-4 p-4 bg-white border-t border-secondary-200', className)}>
            {/* Items per page selector */}
            <div className="flex items-center space-x-2 text-sm">
                <span className="text-secondary-600 whitespace-nowrap">
                    {t('datatable.rowsPerPage')}:
                </span>
                <Select
                    value={itemsPerPage.toString()}
                    onValueChange={(value) => onItemsPerPageChange(parseInt(value))}
                >
                    <SelectTrigger className="w-20 h-8">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        {ITEMS_PER_PAGE_OPTIONS.map((option) => (
                            <SelectItem key={option} value={option.toString()}>
                                {option}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            {/* Items count and pagination info */}
            <div className="flex flex-col sm:flex-row items-center gap-4">
                {/* Items count */}
                <span className="text-sm text-secondary-600 whitespace-nowrap">
                    {t('common.pagination.showing', {
                        current: `${startItem}-${endItem}`,
                        total: totalItems
                    })}
                </span>

                {/* Pagination controls */}
                {totalPages > 1 && (
                    <div className="flex items-center space-x-1">
                        {/* First page button */}
                        <Button
                            variant="ghost"
                            size="sm"
                            type="button"
                            onClick={(e) => handlePageChange(1, e)}
                            disabled={currentPage === 1}
                            className="w-8 h-8 p-0 hidden sm:flex"
                            aria-label={t('datatable.goToFirst')}
                        >
                            <ChevronsLeft className="h-4 w-4" />
                        </Button>

                        {/* Previous page button */}
                        <Button
                            variant="ghost"
                            size="sm"
                            type="button"
                            onClick={(e) => handlePageChange(currentPage - 1, e)}
                            disabled={currentPage === 1}
                            className="w-8 h-8 p-0"
                            aria-label={`${t('common.navigation.previous')} ${t('datatable.page')}`}
                        >
                            <ChevronLeft className="h-4 w-4" />
                        </Button>

                        {/* Page numbers */}
                        <div className="hidden sm:flex items-center space-x-1">
                            {renderPageNumbers().map((page, index) => (
                                <React.Fragment key={index}>
                                    {page === '...' ? (
                                        <span className="px-2 text-secondary-400" aria-hidden="true">
                                            ...
                                        </span>
                                    ) : (
                                        <Button
                                            variant={page === currentPage ? "default" : "ghost"}
                                            size="sm"
                                            type="button"
                                            onClick={(e) => handlePageChange(page as number, e)}
                                            className="w-8 h-8 p-0"
                                            aria-label={`${t('datatable.page')} ${page}`}
                                            aria-current={page === currentPage ? "page" : undefined}
                                        >
                                            {page}
                                        </Button>
                                    )}
                                </React.Fragment>
                            ))}
                        </div>

                        {/* Mobile page indicator */}
                        <div className="sm:hidden px-2 text-sm text-secondary-600">
                            {currentPage} / {totalPages}
                        </div>

                        {/* Next page button */}
                        <Button
                            variant="ghost"
                            size="sm"
                            type="button"
                            onClick={(e) => handlePageChange(currentPage + 1, e)}
                            disabled={currentPage === totalPages}
                            className="w-8 h-8 p-0"
                            aria-label={`${t('common.navigation.next')} ${t('datatable.page')}`}
                        >
                            <ChevronRight className="h-4 w-4" />
                        </Button>

                        {/* Last page button */}
                        <Button
                            variant="ghost"
                            size="sm"
                            type="button"
                            onClick={(e) => handlePageChange(totalPages, e)}
                            disabled={currentPage === totalPages}
                            className="w-8 h-8 p-0 hidden sm:flex"
                            aria-label={`${t('datatable.page')} ${totalPages}`}
                        >
                            <ChevronsRight className="h-4 w-4" />
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );
};
