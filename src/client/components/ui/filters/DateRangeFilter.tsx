/**
 * DateRangeFilter Component - Date range picker with validation and localization
 * 
 * Features:
 * - Date picker interface with start and end date inputs
 * - Date validation (start <= end, no future dates where inappropriate)
 * - Localized date formatting for English and Japanese
 * - Keyboard navigation and screen reader announcements
 * - Portal rendering to avoid clipping
 */
import React from 'react';
import { createPortal } from 'react-dom';
import { Calendar, X, AlertCircle } from 'lucide-react';
import { useLanguage } from '../../../contexts/LanguageContext';
import { cn } from '../../../utils/cn';
import { parseISODateAsTokyo, toTokyoISODate, startOfTokyoDay, endOfTokyoDay, addTokyoDays, getTokyoDayOfWeek } from '../../../../shared/utils/timezone';


export interface DateRangeFilterProps {
    columnId: string;
    columnLabel: string;
    data: Record<string, unknown>[];
    onFilterChange: (values: string[]) => void;
    currentFilter: string[];
    triggerElement: HTMLElement | null;
    onClose: () => void;
    dateFormat?: string;
    minDate?: Date;
    maxDate?: Date;
    allowFutureDates?: boolean;
}

interface DateRange {
    startDate: Date | null;
    endDate: Date | null;
}

export const DateRangeFilter: React.FC<DateRangeFilterProps> = ({
    columnId: _columnId,
    columnLabel,
    data: _data,
    onFilterChange,
    currentFilter,
    triggerElement,
    onClose,
    dateFormat: _dateFormat = 'yyyy-MM-dd',
    minDate,
    maxDate,
    allowFutureDates = true,
}) => {
    const { t } = useLanguage();
    const [dateRange, setDateRange] = React.useState<DateRange>(() => {
        // Parse current filter values
        const startDate = currentFilter[0] ? parseISODateAsTokyo(currentFilter[0]) : null;
        const endDate = currentFilter[1] ? parseISODateAsTokyo(currentFilter[1]) : null;
        return { startDate, endDate };
    });
    const [validationErrors, setValidationErrors] = React.useState<{
        startDate?: string;
        endDate?: string;
        range?: string;
    }>({});

    const dropdownRef = React.useRef<HTMLDivElement>(null);
    const startDateRef = React.useRef<HTMLInputElement>(null);
    const endDateRef = React.useRef<HTMLInputElement>(null);
    const [position, setPosition] = React.useState<{ top: number; left: number; maxHeight: number }>({
        top: 0,
        left: 0,
        maxHeight: 400
    });

    // Format date for input (always use YYYY-MM-DD for HTML date inputs) - avoid toISOString (UTC shift)
    const formatDateForInput = (date: Date | null): string => {
        if (!date) return '';
        return toTokyoISODate(date);
    };


    // Parse date from input
    const parseDateFromInput = (value: string): Date | null => {
        if (!value) return null;
        return parseISODateAsTokyo(value);
    };

    // Validate date range
    const validateDateRange = React.useCallback((start: Date | null, end: Date | null) => {
        const errors: typeof validationErrors = {};
        const tokyoTodayEnd = endOfTokyoDay(new Date());

        // Validate start date
        if (start) {
            if (minDate && start < minDate) {
                errors.startDate = t('datatable.filter.dateBeforeMin');
            } else if (!allowFutureDates && start > tokyoTodayEnd) {
                errors.startDate = t('datatable.filter.futureDateNotAllowed');
            } else if (maxDate && start > maxDate) {
                errors.startDate = t('datatable.filter.dateAfterMax');
            }
        }

        // Validate end date
        if (end) {
            if (minDate && end < minDate) {
                errors.endDate = t('datatable.filter.dateBeforeMin');
            } else if (!allowFutureDates && end > tokyoTodayEnd) {
                errors.endDate = t('datatable.filter.futureDateNotAllowed');
            } else if (maxDate && end > maxDate) {
                errors.endDate = t('datatable.filter.dateAfterMax');
            }
        }

        // Validate range
        if (start && end && start > end) {
            errors.range = t('datatable.filter.invalidDateRange');
        }

        return errors;
    }, [minDate, maxDate, allowFutureDates, t]);




    // Calculate optimal position based on trigger element and viewport with mobile optimization
    React.useEffect(() => {
        if (triggerElement) {
            const updatePosition = () => {
                const triggerRect = triggerElement.getBoundingClientRect();
                const viewportWidth = window.innerWidth;
                const viewportHeight = window.innerHeight;
                const isMobile = viewportWidth < 768;

                // Mobile-friendly dropdown width
                const dropdownWidth = isMobile ? Math.min(350, viewportWidth - 20) : 320;
                const dropdownMaxHeight = 400;

                // Calculate horizontal position with mobile optimization
                let left = triggerRect.left;

                if (isMobile) {
                    // On mobile, center the dropdown or align to screen edges
                    const centerPosition = (viewportWidth - dropdownWidth) / 2;
                    left = Math.max(10, Math.min(centerPosition, viewportWidth - dropdownWidth - 10));
                } else {
                    // Desktop positioning
                    if (left + dropdownWidth > viewportWidth - 20) {
                        left = triggerRect.right - dropdownWidth;
                    }
                    left = Math.max(10, left);
                }

                // Calculate vertical position with better mobile handling
                let top = triggerRect.bottom + 4;
                let calculatedMaxHeight = dropdownMaxHeight;

                // More generous spacing for mobile
                const bottomPadding = isMobile ? 60 : 20; // Extra space for mobile keyboards/UI
                const topPadding = isMobile ? 60 : 20;

                const spaceBelow = viewportHeight - triggerRect.bottom - bottomPadding;
                const spaceAbove = triggerRect.top - topPadding;

                // Minimum height requirements
                const minHeight = isMobile ? 250 : 200;

                if (spaceBelow < minHeight && spaceAbove > spaceBelow) {
                    // Position above if there's more space above
                    const availableHeight = Math.min(dropdownMaxHeight, spaceAbove);
                    top = triggerRect.top - availableHeight - 4;
                    calculatedMaxHeight = availableHeight;
                } else {
                    // Position below
                    calculatedMaxHeight = Math.min(dropdownMaxHeight, spaceBelow);
                }

                // Ensure minimum height on mobile
                if (isMobile && calculatedMaxHeight < minHeight) {
                    calculatedMaxHeight = Math.min(minHeight, viewportHeight - 120);
                    // Recalculate top to fit
                    if (spaceBelow >= calculatedMaxHeight) {
                        top = triggerRect.bottom + 4;
                    } else {
                        top = Math.max(60, viewportHeight - calculatedMaxHeight - 60);
                    }
                }

                setPosition({ top, left, maxHeight: calculatedMaxHeight });
            };

            updatePosition();
            window.addEventListener('scroll', updatePosition);
            window.addEventListener('resize', updatePosition);

            return () => {
                window.removeEventListener('scroll', updatePosition);
                window.removeEventListener('resize', updatePosition);
            };
        }
    }, [triggerElement]);

    // Close dropdown when clicking outside
    React.useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            const target = event.target as Node;

            if (dropdownRef.current && dropdownRef.current.contains(target)) {
                return;
            }

            if (triggerElement && triggerElement.contains(target)) {
                return;
            }

            // Close filter (filters are applied immediately)
            onClose();
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [onClose, triggerElement]);

    // Focus management
    React.useEffect(() => {
        if (startDateRef.current) {
            startDateRef.current.focus();
        }
    }, []);

    // Clear filters
    const handleClear = React.useCallback(() => {
        setDateRange({ startDate: null, endDate: null });
        setValidationErrors({});
        onFilterChange([]);
        onClose();
    }, [onFilterChange, onClose]);

    // Quick date range presets
    const handlePresetRange = React.useCallback((preset: 'today' | 'yesterday' | 'thisWeek' | 'lastWeek' | 'thisMonth' | 'lastMonth') => {
        const base = startOfTokyoDay(new Date());

        let startDate: Date;
        let endDate: Date;

        switch (preset) {
            case 'today': {
                startDate = base;
                endDate = base;
                break;
            }
            case 'yesterday': {
                startDate = addTokyoDays(base, -1);
                endDate = startDate;
                break;
            }
            case 'thisWeek': {
                const weekday = getTokyoDayOfWeek(base);
                startDate = addTokyoDays(base, -weekday);
                endDate = base;
                break;
            }
            case 'lastWeek': {
                const weekday = getTokyoDayOfWeek(base);
                startDate = addTokyoDays(base, -(weekday + 7));
                endDate = addTokyoDays(startDate, 6);
                break;
            }
            case 'thisMonth': {
                const ymd = toTokyoISODate(base); // YYYY-MM-DD
                const [y, m] = ymd.split("-").map((v) => parseInt(v, 10));
                const mm = String(m).padStart(2, "0");
                startDate = new Date(`${y}-${mm}-01T00:00:00+09:00`);
                endDate = base;
                break;
            }
            case 'lastMonth': {
                const ymd = toTokyoISODate(base); // YYYY-MM-DD
                let [y, m] = ymd.split("-").map((v) => parseInt(v, 10));
                m = m - 1;
                if (m === 0) {
                    y = y - 1;
                    m = 12;
                }
                const mm = String(m).padStart(2, "0");
                startDate = new Date(`${y}-${mm}-01T00:00:00+09:00`);
                const currMonthStart = new Date(`${ymd.slice(0, 7)}-01T00:00:00+09:00`);
                endDate = addTokyoDays(currMonthStart, -1);
                break;
            }
            default:
                return;
        }

        setDateRange({ startDate, endDate });
        const errors = validateDateRange(startDate, endDate);
        setValidationErrors(errors);

        // Apply filter immediately if no validation errors
        if (Object.keys(errors).length === 0) {
            const filterValues: string[] = [];
            if (startDate) {
                filterValues.push(formatDateForInput(startDate));
            }
            if (endDate) {
                filterValues.push(formatDateForInput(endDate));
            }
            onFilterChange(filterValues);
        }
    }, [onFilterChange, validateDateRange]);

    // Enhanced keyboard navigation
    React.useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            const target = event.target as HTMLElement;
            const isDateInput = target === startDateRef.current || target === endDateRef.current;

            switch (event.key) {
                case 'Tab':
                    // Allow natural tab navigation between inputs and preset buttons
                    break;
                case 'Escape':
                    event.preventDefault();
                    onClose();
                    break;
                case 'Enter':
                    if (!isDateInput) {
                        event.preventDefault();
                        onClose();
                    }
                    break;
                case 'ArrowDown':
                    if (target === startDateRef.current) {
                        event.preventDefault();
                        endDateRef.current?.focus();
                    }
                    break;
                case 'ArrowUp':
                    if (target === endDateRef.current) {
                        event.preventDefault();
                        startDateRef.current?.focus();
                    }
                    break;
                case 'c':
                case 'C':
                    if ((event.ctrlKey || event.metaKey) && !isDateInput) {
                        event.preventDefault();
                        handleClear();
                    }
                    break;
                case '1':
                    if (event.altKey && !isDateInput) {
                        event.preventDefault();
                        handlePresetRange('today');
                    }
                    break;
                case '2':
                    if (event.altKey && !isDateInput) {
                        event.preventDefault();
                        handlePresetRange('yesterday');
                    }
                    break;
                case '3':
                    if (event.altKey && !isDateInput) {
                        event.preventDefault();
                        handlePresetRange('thisWeek');
                    }
                    break;
                case '4':
                    if (event.altKey && !isDateInput) {
                        event.preventDefault();
                        handlePresetRange('lastWeek');
                    }
                    break;
                case '5':
                    if (event.altKey && !isDateInput) {
                        event.preventDefault();
                        handlePresetRange('thisMonth');
                    }
                    break;
                case '6':
                    if (event.altKey && !isDateInput) {
                        event.preventDefault();
                        handlePresetRange('lastMonth');
                    }
                    break;
            }
        };

        if (dropdownRef.current) {
            const currentRef = dropdownRef.current;
            currentRef.addEventListener('keydown', handleKeyDown);
            return () => {
                currentRef.removeEventListener('keydown', handleKeyDown);
            };
        }
    }, [onClose, handleClear, handlePresetRange]);

    // Handle date input changes
    const handleStartDateChange = (value: string) => {
        const date = parseDateFromInput(value);
        const newRange = { ...dateRange, startDate: date };
        setDateRange(newRange);

        // Validate and update errors
        const errors = validateDateRange(date, dateRange.endDate);
        setValidationErrors(errors);

        // Apply filter immediately if no validation errors
        if (Object.keys(errors).length === 0) {
            const filterValues: string[] = [];
            if (date) {
                filterValues.push(formatDateForInput(date));
            }
            if (dateRange.endDate) {
                filterValues.push(formatDateForInput(dateRange.endDate));
            }
            onFilterChange(filterValues);
        }
    };

    const handleEndDateChange = (value: string) => {
        const date = parseDateFromInput(value);
        const newRange = { ...dateRange, endDate: date };
        setDateRange(newRange);

        // Validate and update errors
        const errors = validateDateRange(dateRange.startDate, date);
        setValidationErrors(errors);

        // Apply filter immediately if no validation errors
        if (Object.keys(errors).length === 0) {
            const filterValues: string[] = [];
            if (dateRange.startDate) {
                filterValues.push(formatDateForInput(dateRange.startDate));
            }
            if (date) {
                filterValues.push(formatDateForInput(date));
            }
            onFilterChange(filterValues);
        }
    };


    // Render dropdown in a portal to avoid clipping
    const dropdownContent = (
        <div
            ref={dropdownRef}
            className="bg-white border border-neutral-200 rounded-lg shadow-xl min-w-[320px] max-w-[400px] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
            style={{
                position: 'fixed',
                top: position.top,
                left: position.left,
                zIndex: 9999,
                maxHeight: position.maxHeight,
            }}
            tabIndex={-1}
        >
            {/* Header */}
            <div className="px-4 pt-4 pb-2 border-b border-neutral-100 bg-gradient-to-r from-neutral-50 to-neutral-100">
                <div className="flex items-center justify-between mb-2">
                    <h4 id="date-filter-title" className="text-sm font-medium text-neutral-900 flex items-center">
                        <Calendar className="h-4 w-4 mr-2" />
                        {t('datatable.filter.dateRange')} - {columnLabel}
                    </h4>
                    <button
                        onClick={onClose}
                        className="text-neutral-600 hover:text-neutral-800 p-1 rounded transition-colors"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2 mt-2">
                    <button
                        onClick={handleClear}
                        className="text-xs text-neutral-600 hover:text-neutral-700 font-medium"
                        title="Ctrl+C"
                    >
                        {t('datatable.filter.clear')}
                    </button>
                </div>
            </div>

            {/* Date Inputs */}
            <div className="px-4 pt-2 pb-1 space-y-3">
                {/* Start Date */}
                <div>
                    <label htmlFor="start-date" className="block text-sm font-medium text-neutral-700 mb-1">
                        {t('datatable.filter.startDate')}
                    </label>
                    <input
                        ref={startDateRef}
                        id="start-date"
                        type="date"
                        value={formatDateForInput(dateRange.startDate)}
                        onChange={(e) => handleStartDateChange(e.target.value)}
                        min={minDate ? formatDateForInput(minDate) : undefined}
                        max={maxDate ? formatDateForInput(maxDate) : undefined}
                        className={cn(
                            "w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500",
                            validationErrors.startDate ? "border-red-300" : "border-neutral-300"
                        )}
                    />
                    {validationErrors.startDate && (
                        <p id="start-date-error" className="mt-1 text-sm text-red-600 flex items-center">
                            <AlertCircle className="h-4 w-4 mr-1" />
                            {validationErrors.startDate}
                        </p>
                    )}

                </div>

                {/* End Date */}
                <div>
                    <label htmlFor="end-date" className="block text-sm font-medium text-neutral-700 mb-1">
                        {t('datatable.filter.endDate')}
                    </label>
                    <input
                        ref={endDateRef}
                        id="end-date"
                        type="date"
                        value={formatDateForInput(dateRange.endDate)}
                        onChange={(e) => handleEndDateChange(e.target.value)}
                        min={minDate ? formatDateForInput(minDate) : undefined}
                        max={maxDate ? formatDateForInput(maxDate) : undefined}
                        className={cn(
                            "w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500",
                            validationErrors.endDate ? "border-red-300" : "border-neutral-300"
                        )}
                    />
                    {validationErrors.endDate && (
                        <p id="end-date-error" className="mt-1 text-sm text-red-600 flex items-center">
                            <AlertCircle className="h-4 w-4 mr-1" />
                            {validationErrors.endDate}
                        </p>
                    )}

                </div>

                {/* Range Validation Error */}
                {validationErrors.range && (
                    <p className="text-sm text-red-600 flex items-center">
                        <AlertCircle className="h-4 w-4 mr-1" />
                        {validationErrors.range}
                    </p>
                )}
            </div>

            {/* Quick Presets */}
            <div className="px-4 pt-1 pb-4 border-t border-neutral-100 bg-neutral-50">
                <p className="text-xs font-medium text-neutral-700 mb-2">
                    {t('datatable.filter.quickRanges')}
                </p>
                <div className="grid grid-cols-2 gap-2">
                    <button
                        onClick={() => handlePresetRange('today')}
                        className="text-xs px-2 py-1 bg-white border border-neutral-200 rounded hover:bg-neutral-50 transition-colors"
                        title="Alt+1"
                    >
                        {t('datatable.filter.today')}
                    </button>
                    <button
                        onClick={() => handlePresetRange('yesterday')}
                        className="text-xs px-2 py-1 bg-white border border-neutral-200 rounded hover:bg-neutral-50 transition-colors"
                        title="Alt+2"
                    >
                        {t('datatable.filter.yesterday')}
                    </button>
                    <button
                        onClick={() => handlePresetRange('thisWeek')}
                        className="text-xs px-2 py-1 bg-white border border-neutral-200 rounded hover:bg-neutral-50 transition-colors"
                        title="Alt+3"
                    >
                        {t('datatable.filter.thisWeek')}
                    </button>
                    <button
                        onClick={() => handlePresetRange('lastWeek')}
                        className="text-xs px-2 py-1 bg-white border border-neutral-200 rounded hover:bg-neutral-50 transition-colors"
                        title="Alt+4"
                    >
                        {t('datatable.filter.lastWeek')}
                    </button>
                    <button
                        onClick={() => handlePresetRange('thisMonth')}
                        className="text-xs px-2 py-1 bg-white border border-neutral-200 rounded hover:bg-neutral-50 transition-colors"
                        title="Alt+5"
                    >
                        {t('datatable.filter.thisMonth')}
                    </button>
                    <button
                        onClick={() => handlePresetRange('lastMonth')}
                        className="text-xs px-2 py-1 bg-white border border-neutral-200 rounded hover:bg-neutral-50 transition-colors"
                        title="Alt+6"
                    >
                        {t('datatable.filter.lastMonth')}
                    </button>
                </div>
            </div>

        </div>
    );

    // Render in portal to avoid clipping by parent containers
    return createPortal(dropdownContent, document.body);
};
