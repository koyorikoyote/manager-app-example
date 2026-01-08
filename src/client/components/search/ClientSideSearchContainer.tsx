import React from 'react';
import { ClientSideSearchInput } from './ClientSideSearchInput';
import { DynamicFilterDropdown } from './DynamicFilterDropdown';
import { ActiveFiltersDisplay } from './ActiveFiltersDisplay';
import { useClientSideFiltering, UseClientSideFilteringOptions } from './useClientSideFiltering';

interface ClientSideSearchContainerProps<T> extends UseClientSideFilteringOptions<T> {
    children: (result: ReturnType<typeof useClientSideFiltering<T>>) => React.ReactNode;
    searchPlaceholder?: string;
    className?: string;
    showFiltersInline?: boolean;
}

export function ClientSideSearchContainer<T extends Record<string, unknown>>({
    data,
    searchFields,
    filterConfigs,
    initialState,
    children,
    searchPlaceholder,
    className,
    showFiltersInline = true
}: ClientSideSearchContainerProps<T>) {
    const filteringResult = useClientSideFiltering({
        data,
        searchFields,
        filterConfigs,
        initialState
    });

    const {
        searchQuery,
        setSearchQuery,
        activeFilters,
        setFilter,
        removeFilter,
        clearAllFilters,
        filterOptions,
        activeFiltersDisplay,
        filteredCount,
        totalCount,
        clearSearch
    } = filteringResult;

    return (
        <div className={`space-y-4 ${className}`}>
            {/* Search and Filters Row */}
            <div className={`flex gap-4 ${showFiltersInline ? 'flex-col sm:flex-row' : 'flex-col'}`}>
                {/* Search Input */}
                <div className="flex-1 min-w-0">
                    <ClientSideSearchInput
                        value={searchQuery}
                        onChange={setSearchQuery}
                        placeholder={searchPlaceholder}
                        className="w-full"
                    />
                </div>

                {/* Filter Dropdowns */}
                {showFiltersInline && filterConfigs.length > 0 && (
                    <div className="flex gap-2 flex-wrap sm:flex-nowrap">
                        {filterConfigs.map(config => (
                            <DynamicFilterDropdown
                                key={config.key}
                                filterKey={config.key}
                                label={config.label}
                                options={filterOptions[config.key] || []}
                                selectedValues={activeFilters[config.key] || []}
                                onSelectionChange={setFilter}
                                multiSelect={config.type === 'multiselect'}
                                className="min-w-[150px]"
                            />
                        ))}
                    </div>
                )}
            </div>

            {/* Separate Filter Row (when not inline) */}
            {!showFiltersInline && filterConfigs.length > 0 && (
                <div className="flex gap-2 flex-wrap">
                    {filterConfigs.map(config => (
                        <DynamicFilterDropdown
                            key={config.key}
                            filterKey={config.key}
                            label={config.label}
                            options={filterOptions[config.key] || []}
                            selectedValues={activeFilters[config.key] || []}
                            onSelectionChange={setFilter}
                            multiSelect={config.type === 'multiselect'}
                            className="min-w-[150px]"
                        />
                    ))}
                </div>
            )}

            {/* Active Filters Display */}
            <ActiveFiltersDisplay
                activeFilters={activeFiltersDisplay}
                searchQuery={searchQuery}
                filteredCount={filteredCount}
                totalCount={totalCount}
                onRemoveFilter={removeFilter}
                onClearSearch={clearSearch}
                onClearAllFilters={clearAllFilters}
            />

            {/* Render children with filtering result */}
            {children(filteringResult)}
        </div>
    );
}