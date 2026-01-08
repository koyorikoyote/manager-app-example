/**
 * FilterIcon Component - Simple filter icon that opens the appropriate filter dropdown
 */
import React, { useState, useRef } from 'react';
import { Filter } from 'lucide-react';
import { cn } from '../../../utils/cn';
import { DropdownFilter } from './DropdownFilter';
import { DateRangeFilter } from './DateRangeFilter';
import { NumericRangeFilter } from './NumericRangeFilter';
import type { FilterConfiguration } from '../../../utils/filterTypeDetection';

interface FilterIconProps {
    columnId: string;
    columnLabel: string;
    data: Record<string, unknown>[];
    onFilterChange: (values: string[]) => void;
    currentFilter: string[];
    filterConfig: FilterConfiguration;
    tableName?: string;
}

export const FilterIcon: React.FC<FilterIconProps> = ({
    columnId,
    columnLabel,
    data,
    onFilterChange,
    currentFilter,
    filterConfig,
    tableName,
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const triggerRef = useRef<HTMLButtonElement>(null);
    const [triggerEl, setTriggerEl] = useState<HTMLElement | null>(null);
    const hasActiveFilter = currentFilter && currentFilter.length > 0;

    const handleToggle = () => {
        const next = !isOpen;
        setIsOpen(next);
        if (next) {
            setTriggerEl(triggerRef.current);
        } else {
            setTriggerEl(null);
        }
    };

    const handleClose = () => {
        setIsOpen(false);
        setTriggerEl(null);
    };

    const handleFilterChange = (values: string[]) => {
        onFilterChange(values);
        // Keep date range picker open to allow adjusting year/month/day without requiring Clear
        if (filterConfig.filterType !== 'dateRange') {
            setIsOpen(false);
        }
    };

    return (
        <>
            <button
                ref={triggerRef}
                onClick={handleToggle}
                className={cn(
                    "p-1 rounded hover:bg-gray-100 transition-colors",
                    hasActiveFilter ? "text-blue-600" : "text-gray-400 hover:text-gray-600"
                )}
                title={`Filter ${columnLabel}`}
            >
                <Filter className="h-4 w-4" />
            </button>

            {isOpen && (
                <>
                    {filterConfig.filterType === 'dropdown' && (
                        <DropdownFilter
                            columnId={columnId}
                            columnLabel={columnLabel}
                            data={data}
                            onFilterChange={handleFilterChange}
                            currentFilter={currentFilter}
                            triggerElement={triggerEl}
                            onClose={handleClose}
                        />
                    )}
                    {filterConfig.filterType === 'dateRange' && (
                        <DateRangeFilter
                            columnId={columnId}
                            columnLabel={columnLabel}
                            data={data}
                            onFilterChange={handleFilterChange}
                            currentFilter={currentFilter}
                            triggerElement={triggerEl}
                            onClose={handleClose}
                        />
                    )}
                    {filterConfig.filterType === 'numericRange' && (
                        <NumericRangeFilter
                            columnId={columnId}
                            columnLabel={columnLabel}
                            data={data}
                            onFilterChange={handleFilterChange}
                            currentFilter={currentFilter}
                            triggerElement={triggerEl}
                            onClose={handleClose}
                            tableName={tableName}
                        />
                    )}
                </>
            )}
        </>
    );
};
