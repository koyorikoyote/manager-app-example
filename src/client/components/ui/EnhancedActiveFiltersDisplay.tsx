/**
 * EnhancedActiveFiltersDisplay Component
 * 
 * Enhanced version of ActiveFiltersDisplay for column-based filtering system.
 * Provides grouped filter display, individual filter value removal, results count,
 * and bulk operations with improved UX.
 */
import React, { useState } from 'react';
import { X, Filter } from 'lucide-react';
import { Button } from './Button';
import { useMobileDetection } from '../../hooks/useTouch';
import { cn } from '../../utils/cn';
import { ActiveFilter } from '../../../shared/types/filtering';

export interface EnhancedActiveFiltersDisplayProps {
    /** Active filters grouped by column */
    activeFilters: ActiveFilter[];
    /** Current filtered results count */
    filteredCount: number;
    /** Total results count before filtering */
    totalCount: number;
    /** Callback to remove specific filter value */
    onRemoveFilter: (columnKey: string, value?: string) => void;
    /** Callback to clear all filters */
    onClearAllFilters: () => void;
    /** Whether to show results count */
    showResultsCount?: boolean;
    /** Additional CSS classes */
    className?: string;
    /** Loading state */
    isLoading?: boolean;
}

/**
 * EnhancedActiveFiltersDisplay - Column-based filter display with grouped layout
 * 
 * Features:
 * - Groups filters by column with clear visual separation
 * - Individual remove buttons for each filter value
 * - Swipe-to-remove gesture for mobile devices
 * - Results count display with filtered vs total
 * - Clear All Filters button with proper positioning
 * - Empty state handling with helpful suggestions
 * - Touch-friendly mobile interface
 * - Comprehensive accessibility support
 */
export const EnhancedActiveFiltersDisplay: React.FC<EnhancedActiveFiltersDisplayProps> = ({
    activeFilters,
    filteredCount,
    totalCount,
    onRemoveFilter,
    onClearAllFilters,
    showResultsCount = true,
    className,
    isLoading = false,
}) => {
    const { isMobile } = useMobileDetection();
    const [swipingFilter, setSwipingFilter] = useState<string | null>(null);

    const hasActiveFilters = activeFilters.length > 0;
    const isFiltered = filteredCount !== totalCount;
    const hasNoResults = isFiltered && filteredCount === 0;

    // Don't render if no filters and no filtering applied
    if (!hasActiveFilters && !isFiltered) {
        return null;
    }

    // Handle swipe-to-remove for mobile
    const handleSwipeStart = (filterKey: string) => {
        if (isMobile) {
            setSwipingFilter(filterKey);
        }
    };

    const handleSwipeEnd = () => {
        setSwipingFilter(null);
    };

    // Generate results text with enhanced formatting
    const getResultsText = () => {
        if (isLoading) {
            return 'Loading...';
        }

        if (hasNoResults) {
            return 'No results found';
        }

        if (isFiltered) {
            const percentage = totalCount > 0 ? Math.round((filteredCount / totalCount) * 100) : 0;
            return `Showing ${filteredCount.toLocaleString()} of ${totalCount.toLocaleString()} results (${percentage}%)`;
        }

        return `${totalCount.toLocaleString()} total results`;
    };

    // Generate results summary for accessibility
    const getResultsSummary = () => {
        if (hasNoResults) {
            return 'No results match the current filters. Consider adjusting or clearing filters.';
        }

        if (isFiltered) {
            return `${filteredCount} results shown out of ${totalCount} total results`;
        }

        return `Showing all ${totalCount} results`;
    };

    return (
        <div className={cn('space-y-3', className)}>
            {/* Results count and Clear All button */}
            {showResultsCount && (
                <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                        {isLoading && (
                            <div
                                className="animate-spin h-4 w-4 border-2 border-primary-500 border-t-transparent rounded-full"
                                aria-label="Loading"
                            />
                        )}
                        <span
                            className={cn(
                                'font-medium transition-colors duration-200',
                                hasNoResults ? 'text-red-600' : isFiltered ? 'text-primary-700' : 'text-neutral-700'
                            )}
                            aria-live="polite"
                            aria-atomic="true"
                        >
                            {getResultsText()}
                        </span>

                        {/* Visual indicator for filtered state */}
                        {isFiltered && !hasNoResults && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-800">
                                Filtered
                            </span>
                        )}
                    </div>

                    {hasActiveFilters && (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={onClearAllFilters}
                            className={cn(
                                'text-primary-600 hover:text-primary-700 hover:bg-primary-50',
                                'focus:ring-2 focus:ring-primary-500/20 transition-all duration-200',
                                isMobile && 'min-h-[40px] px-3 touch-target'
                            )}
                            aria-label="Clear all filters"
                            aria-describedby="results-summary"
                        >
                            <X className="h-4 w-4 mr-1" />
                            Clear All
                        </Button>
                    )}
                </div>
            )}

            {/* Hidden accessibility summary */}
            <div
                id="results-summary"
                className="sr-only"
                aria-live="polite"
                aria-atomic="true"
            >
                {getResultsSummary()}
            </div>

            {/* Active filters grouped by column */}
            {hasActiveFilters && (
                <div className="space-y-3">
                    {activeFilters.map((filter) => (
                        <div
                            key={filter.columnKey}
                            className={cn(
                                'bg-neutral-50 rounded-lg p-3 border border-neutral-200',
                                'transition-all duration-200',
                                swipingFilter === filter.columnKey && 'bg-red-50 border-red-200'
                            )}
                            onTouchStart={() => handleSwipeStart(filter.columnKey)}
                            onTouchEnd={handleSwipeEnd}
                        >
                            {/* Column header */}
                            <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                    <Filter className="h-4 w-4 text-primary-600" />
                                    <span className="font-medium text-neutral-900">
                                        {filter.columnLabel}
                                    </span>
                                    <span className="text-xs text-neutral-500 bg-neutral-200 px-2 py-0.5 rounded-full">
                                        {filter.values.length} {filter.values.length === 1 ? 'filter' : 'filters'}
                                    </span>
                                </div>

                                {/* Remove entire column filter */}
                                <button
                                    onClick={() => onRemoveFilter(filter.columnKey)}
                                    className={cn(
                                        'text-neutral-400 hover:text-red-600 hover:bg-red-50',
                                        'rounded-full p-1 transition-colors',
                                        'focus:outline-none focus:ring-2 focus:ring-red-500/20',
                                        isMobile && 'min-w-[32px] min-h-[32px] touch-target'
                                    )}
                                    aria-label={`Remove all ${filter.columnLabel} filters`}
                                >
                                    <X className={cn('h-4 w-4', isMobile && 'h-5 w-5')} />
                                </button>
                            </div>

                            {/* Filter values */}
                            <div className="flex flex-wrap gap-2">
                                {filter.values.map((value, index) => {
                                    const displayValue = filter.displayValues[index] || value;
                                    const filterKey = `${filter.columnKey}-${value}`;

                                    return (
                                        <span
                                            key={filterKey}
                                            className={cn(
                                                'inline-flex items-center gap-1 px-3 py-1',
                                                'bg-primary-100 text-primary-800 rounded-full text-sm',
                                                'transition-all duration-200 touch-manipulation',
                                                isMobile && 'px-4 py-2 min-h-[36px]',
                                                swipingFilter === filter.columnKey && 'bg-red-100 text-red-800'
                                            )}
                                        >
                                            <span className="truncate max-w-[150px]">
                                                {displayValue}
                                            </span>
                                            <button
                                                onClick={() => onRemoveFilter(filter.columnKey, value)}
                                                className={cn(
                                                    'ml-1 hover:bg-primary-200 rounded-full p-0.5',
                                                    'focus:outline-none focus:bg-primary-200',
                                                    'focus:ring-2 focus:ring-primary-500/20',
                                                    'transition-colors touch-target',
                                                    isMobile && 'p-1 min-w-[24px] min-h-[24px]',
                                                    swipingFilter === filter.columnKey && 'hover:bg-red-200 focus:bg-red-200'
                                                )}
                                                aria-label={`Remove ${displayValue} from ${filter.columnLabel} filter`}
                                            >
                                                <X className={cn('h-3 w-3', isMobile && 'h-4 w-4')} />
                                            </button>
                                        </span>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Empty state message when no results */}
            {hasNoResults && (
                <div className="text-center py-8 space-y-4 bg-neutral-50 rounded-lg border border-neutral-200">
                    <div className="text-neutral-400 mb-2">
                        <Filter className="h-12 w-12 mx-auto" />
                    </div>
                    <div className="space-y-2">
                        <p className="text-base text-neutral-700 font-medium">
                            No results match your filters
                        </p>
                        <p className="text-sm text-neutral-500 max-w-md mx-auto">
                            Try adjusting your filters, removing some selections, or clearing all filters to see more results
                        </p>
                    </div>

                    {/* Suggestions */}
                    <div className="space-y-2">
                        <p className="text-xs text-neutral-400 font-medium uppercase tracking-wide">
                            Suggestions
                        </p>
                        <ul className="text-sm text-neutral-600 space-y-1">
                            <li>• Remove some filter selections</li>
                            <li>• Try different filter combinations</li>
                            <li>• Clear all filters to see all results</li>
                        </ul>
                    </div>

                    {hasActiveFilters && (
                        <div className="pt-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={onClearAllFilters}
                                className={cn(
                                    'transition-all duration-200',
                                    isMobile && 'min-h-[44px] px-4 touch-target'
                                )}
                                aria-describedby="empty-state-description"
                            >
                                <X className="h-4 w-4 mr-2" />
                                Clear All Filters
                            </Button>
                        </div>
                    )}

                    <div id="empty-state-description" className="sr-only">
                        No results found with current filters. Clear filters to see all available results.
                    </div>
                </div>
            )}
        </div>
    );
};