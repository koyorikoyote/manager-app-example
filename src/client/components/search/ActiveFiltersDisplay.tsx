import React from 'react';
import { X } from 'lucide-react';
import { Button } from '../ui/Button';
import { useLanguage } from '../../contexts/LanguageContext';
import { useMobileDetection } from '../../hooks/useTouch';

export interface ActiveFilter {
    key: string;
    label: string;
    value: string;
    displayValue: string;
}

interface ActiveFiltersDisplayProps {
    activeFilters: ActiveFilter[];
    searchQuery?: string;
    filteredCount: number;
    totalCount: number;
    onRemoveFilter: (filterKey: string, value: string) => void;
    onClearSearch?: () => void;
    onClearAllFilters: () => void;
    className?: string;
}

export const ActiveFiltersDisplay: React.FC<ActiveFiltersDisplayProps> = ({
    activeFilters,
    searchQuery,
    filteredCount,
    totalCount,
    onRemoveFilter,
    onClearSearch,
    onClearAllFilters,
    className
}) => {
    const { t } = useLanguage();
    const { isMobile } = useMobileDetection();

    const hasActiveFilters = activeFilters.length > 0 || (searchQuery && searchQuery.trim().length > 0);
    const isFiltered = filteredCount !== totalCount;

    if (!hasActiveFilters && !isFiltered) {
        return null;
    }

    return (
        <div className={`space-y-3 ${className}`}>
            {/* Results count */}
            {isFiltered && (
                <div className="flex items-center justify-between text-sm text-secondary-600">
                    <span>
                        {t('search.showingResults', {
                            filtered: filteredCount.toLocaleString(),
                            total: totalCount.toLocaleString()
                        })}
                    </span>
                    {hasActiveFilters && (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={onClearAllFilters}
                            className={`text-primary-600 hover:text-primary-700 hover:bg-primary-50 touch-target ${isMobile ? 'min-h-[40px] px-3' : ''}`}
                            aria-label={t('search.clearAllFilters')}
                        >
                            {t('search.clearAllFilters')}
                        </Button>
                    )}
                </div>
            )}

            {/* Active filters and search query */}
            {hasActiveFilters && (
                <div className="flex flex-wrap gap-2">
                    {/* Search query tag */}
                    {searchQuery && searchQuery.trim().length > 0 && (
                        <span
                            className={`inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm touch-manipulation ${isMobile ? 'px-4 py-2 min-h-[40px]' : ''}`}
                        >
                            <span className="truncate max-w-[200px]">
                                {t('search.searchQuery')}: &ldquo;{searchQuery.trim()}&rdquo;
                            </span>
                            {onClearSearch && (
                                <button
                                    onClick={onClearSearch}
                                    className={`ml-1 hover:bg-blue-200 rounded-full p-0.5 focus:outline-none focus:bg-blue-200 focus:ring-2 focus:ring-blue-500/20 touch-target ${isMobile ? 'p-1 min-w-[32px] min-h-[32px]' : ''}`}
                                    aria-label={t('search.clearSearch')}
                                >
                                    <X className={`h-3 w-3 ${isMobile ? 'h-4 w-4' : ''}`} />
                                </button>
                            )}
                        </span>
                    )}

                    {/* Filter tags */}
                    {activeFilters.map((filter) => (
                        <span
                            key={`${filter.key}-${filter.value}`}
                            className={`inline-flex items-center gap-1 px-3 py-1 bg-primary-100 text-primary-800 rounded-full text-sm touch-manipulation ${isMobile ? 'px-4 py-2 min-h-[40px]' : ''}`}
                        >
                            <span className="truncate max-w-[150px]">
                                {filter.label}: {filter.displayValue}
                            </span>
                            <button
                                onClick={() => onRemoveFilter(filter.key, filter.value)}
                                className={`ml-1 hover:bg-primary-200 rounded-full p-0.5 focus:outline-none focus:bg-primary-200 focus:ring-2 focus:ring-primary-500/20 touch-target ${isMobile ? 'p-1 min-w-[32px] min-h-[32px]' : ''}`}
                                aria-label={`${t('search.removeFilter')} ${filter.label}: ${filter.displayValue}`}
                            >
                                <X className={`h-3 w-3 ${isMobile ? 'h-4 w-4' : ''}`} />
                            </button>
                        </span>
                    ))}
                </div>
            )}

            {/* Empty state message when no results */}
            {isFiltered && filteredCount === 0 && (
                <div className="text-center py-4 text-secondary-500">
                    <p className="text-sm">{t('search.noResultsFound')}</p>
                    <p className="text-xs mt-1">{t('search.tryAdjustingFilters')}</p>
                </div>
            )}
        </div>
    );
};