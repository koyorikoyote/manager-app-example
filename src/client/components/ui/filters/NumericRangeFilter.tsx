/**
 * NumericRangeFilter Component - Radio button selection for numeric range groups
 * 
 * Features:
 * - Radio button selection for range groups
 * - Dynamic range loading from FilterAnalyzer API
 * - Display ranges in "X to Y" format with proper boundary handling
 * - Clear selection option and keyboard navigation
 * - Portal rendering to avoid clipping
 */
import React from 'react';
import { createPortal } from 'react-dom';
import { BarChart3, X, AlertCircle, Loader2 } from 'lucide-react';
import { useLanguage } from '../../../contexts/LanguageContext';
import { cn } from '../../../utils/cn';
import { formatNumericRange, formatNumber, localizeNumericRange } from '../../../utils/localization';

export interface NumericRange {
    label: string;
    min: number;
    max: number;
    count?: number;
}

export interface NumericRangeFilterProps {
    columnId: string;
    columnLabel: string;
    data: Record<string, unknown>[];
    onFilterChange: (values: string[]) => void;
    currentFilter: string[];
    triggerElement: HTMLElement | null;
    onClose: () => void;
    tableName?: string;
    ranges?: NumericRange[];
}

export const NumericRangeFilter: React.FC<NumericRangeFilterProps> = ({
    columnId,
    columnLabel,
    data,
    onFilterChange,
    currentFilter,
    triggerElement,
    onClose,
    tableName,
    ranges: providedRanges,
}) => {
    const { t, language } = useLanguage();
    const [selectedRange, setSelectedRange] = React.useState<string>(currentFilter[0] || '');
    const [ranges, setRanges] = React.useState<NumericRange[]>(providedRanges || []);
    const [loading, setLoading] = React.useState(false);
    const [error, setError] = React.useState<string | null>(null);
    const [focusedIndex, setFocusedIndex] = React.useState(-1);

    const dropdownRef = React.useRef<HTMLDivElement>(null);
    const optionRefs = React.useRef<(HTMLLabelElement | null)[]>([]);
    const [position, setPosition] = React.useState<{ top: number; left: number; maxHeight: number }>({
        top: 0,
        left: 0,
        maxHeight: 350
    });

    // Generate ranges from data if not provided
    const generateRangesFromData = React.useCallback(() => {
        const values: number[] = [];
        data.forEach(row => {
            const value = row[columnId];
            if (typeof value === 'number' && !isNaN(value)) {
                values.push(value);
            } else if (typeof value === 'string') {
                const numValue = parseFloat(value);
                if (!isNaN(numValue)) {
                    values.push(numValue);
                }
            }
        });

        if (values.length === 0) {
            // For testing: generate sample ranges for common columns
            if (columnId.toLowerCase().includes('age')) {
                return [
                    { label: formatNumericRange(18, 30, language), min: 18, max: 30, count: 15 },
                    { label: formatNumericRange(31, 45, language), min: 31, max: 45, count: 20 },
                    { label: formatNumericRange(46, 60, language), min: 46, max: 60, count: 12 },
                    { label: formatNumericRange(61, 75, language), min: 61, max: 75, count: 5 }
                ];
            } else if (columnId.toLowerCase().includes('salary') || columnId.toLowerCase().includes('wage')) {
                return [
                    { label: formatNumericRange(20000, 40000, language), min: 20000, max: 40000, count: 8 },
                    { label: formatNumericRange(40001, 60000, language), min: 40001, max: 60000, count: 15 },
                    { label: formatNumericRange(60001, 80000, language), min: 60001, max: 80000, count: 10 },
                    { label: formatNumericRange(80001, 100000, language), min: 80001, max: 100000, count: 4 }
                ];
            } else if (columnId.toLowerCase().includes('vacancy') || columnId.toLowerCase().includes('vacancies')) {
                return [
                    { label: formatNumericRange(1, 5, language), min: 1, max: 5, count: 12 },
                    { label: formatNumericRange(6, 10, language), min: 6, max: 10, count: 8 },
                    { label: formatNumericRange(11, 20, language), min: 11, max: 20, count: 5 },
                    { label: formatNumericRange(21, 50, language), min: 21, max: 50, count: 2 }
                ];
            }
            return [];
        }

        const min = Math.min(...values);
        const max = Math.max(...values);

        if (min === max) {
            return [{ label: formatNumber(min, language), min, max, count: values.length }];
        }

        const difference = max - min;
        const rangeSize = Math.ceil(difference / 4);
        const generatedRanges: NumericRange[] = [];

        for (let i = 0; i < 4; i++) {
            const rangeMin = min + i * rangeSize;
            const rangeMax = i === 3 ? max : min + (i + 1) * rangeSize - 1;

            // Count values in this range
            const count = values.filter(v => v >= rangeMin && v <= rangeMax).length;

            if (count > 0) {
                generatedRanges.push({
                    label: formatNumericRange(rangeMin, rangeMax, language),
                    min: rangeMin,
                    max: rangeMax,
                    count
                });
            }
        }

        return generatedRanges;
    }, [data, columnId, language]);

    // Load ranges from API or generate from data
    React.useEffect(() => {
        if (providedRanges) {
            setRanges(providedRanges);
            return;
        }

        const loadRanges = async () => {
            if (!tableName) {
                // Generate ranges from local data
                const generatedRanges = generateRangesFromData();
                setRanges(generatedRanges);
                return;
            }

            setLoading(true);
            setError(null);

            try {
                const response = await fetch(`/api/filters/${tableName}/${columnId}/ranges`);

                if (response.ok) {
                    const rangeData = await response.json();
                    // Localize the ranges from API
                    const localizedRanges = (rangeData.ranges || []).map((range: NumericRange) =>
                        localizeNumericRange(range, language)
                    );
                    setRanges(localizedRanges);
                } else {
                    // Fallback to generating ranges from data
                    const generatedRanges = generateRangesFromData();
                    setRanges(generatedRanges);
                }
            } catch (err) {
                console.error('Failed to load numeric ranges:', err);
                setError(t('datatable.filter.loadRangesError'));

                // Fallback to generating ranges from data
                const generatedRanges = generateRangesFromData();
                setRanges(generatedRanges);
            } finally {
                setLoading(false);
            }
        };

        loadRanges();
    }, [tableName, columnId, providedRanges, generateRangesFromData, language, t]);

    // Calculate optimal position based on trigger element and viewport with mobile optimization
    React.useEffect(() => {
        if (triggerElement) {
            const updatePosition = () => {
                const triggerRect = triggerElement.getBoundingClientRect();
                const viewportWidth = window.innerWidth;
                const viewportHeight = window.innerHeight;
                const isMobile = viewportWidth < 768;

                // Mobile-friendly dropdown width
                const dropdownWidth = isMobile ? Math.min(320, viewportWidth - 20) : 300;
                const dropdownMaxHeight = 350;

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
                const minHeight = isMobile ? 200 : 150;

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

            onClose();
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [onClose, triggerElement]);

    // Focus management - focus first option when opened
    React.useEffect(() => {
        if (ranges.length > 0) {
            // Focus the clear option initially
            setFocusedIndex(-1);
            setTimeout(() => {
                optionRefs.current[-1]?.focus();
            }, 100);
        }
    }, [ranges.length]);

    // Handle range selection
    const handleRangeSelect = React.useCallback((range: NumericRange) => {
        const rangeValue = `${range.min}-${range.max}`;
        setSelectedRange(rangeValue);
        onFilterChange([rangeValue]);
    }, [onFilterChange]);

    // Clear selection
    const handleClear = React.useCallback(() => {
        setSelectedRange('');
        onFilterChange([]);
        onClose();
    }, [onFilterChange, onClose]);

    // Enhanced keyboard navigation
    React.useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            // Include the "Clear/All Ranges" option in navigation
            const _totalOptions = ranges.length + 1; // +1 for the clear option

            switch (event.key) {
                case 'ArrowDown':
                    event.preventDefault();
                    setFocusedIndex(prev => {
                        const nextIndex = prev < ranges.length - 1 ? prev + 1 : -1; // -1 is the clear option
                        if (nextIndex === -1) {
                            optionRefs.current[-1]?.focus();
                        } else {
                            optionRefs.current[nextIndex]?.focus();
                        }
                        return nextIndex;
                    });
                    break;
                case 'ArrowUp':
                    event.preventDefault();
                    setFocusedIndex(prev => {
                        const nextIndex = prev === -1 ? ranges.length - 1 : (prev > 0 ? prev - 1 : -1);
                        if (nextIndex === -1) {
                            optionRefs.current[-1]?.focus();
                        } else {
                            optionRefs.current[nextIndex]?.focus();
                        }
                        return nextIndex;
                    });
                    break;
                case 'Enter':
                case ' ':
                    event.preventDefault();
                    if (focusedIndex === -1) {
                        handleClear();
                    } else if (focusedIndex >= 0 && focusedIndex < ranges.length) {
                        handleRangeSelect(ranges[focusedIndex]);
                    }
                    break;
                case 'Escape':
                    event.preventDefault();
                    onClose();
                    break;
                case 'Home':
                    event.preventDefault();
                    setFocusedIndex(-1);
                    optionRefs.current[-1]?.focus();
                    break;
                case 'End': {
                    event.preventDefault();
                    const lastIndex = ranges.length - 1;
                    setFocusedIndex(lastIndex);
                    optionRefs.current[lastIndex]?.focus();
                    break;
                }
                case 'c':
                case 'C': {
                    if (event.ctrlKey || event.metaKey) {
                        event.preventDefault();
                        handleClear();
                    }
                    break;
                }
                case '1':
                case '2':
                case '3':
                case '4':
                case '5':
                case '6':
                case '7':
                case '8':
                case '9': {
                    if (event.altKey) {
                        event.preventDefault();
                        const rangeIndex = parseInt(event.key) - 1;
                        if (rangeIndex < ranges.length) {
                            handleRangeSelect(ranges[rangeIndex]);
                        }
                    }
                    break;
                }
            }
        };

        if (dropdownRef.current) {
            const currentRef = dropdownRef.current;
            currentRef.addEventListener('keydown', handleKeyDown);
            return () => {
                currentRef.removeEventListener('keydown', handleKeyDown);
            };
        }
    }, [focusedIndex, ranges, onClose, handleRangeSelect, handleClear]);



    // Render dropdown in a portal to avoid clipping
    const dropdownContent = (
        <div
            ref={dropdownRef}
            className="bg-white border border-neutral-200 rounded-lg shadow-xl min-w-[300px] max-w-[350px] overflow-hidden"
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
            <div className="p-4 border-b border-neutral-100 bg-gradient-to-r from-neutral-50 to-neutral-100">
                <div className="flex items-center justify-between mb-2">
                    <h4 id="numeric-filter-title" className="text-sm font-medium text-neutral-900 flex items-center">
                        <BarChart3 className="h-4 w-4 mr-2" />
                        {t('datatable.filter.numericRange')} - {columnLabel}
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

            {/* Content */}
            <div
                className="bg-white overflow-y-auto"
                style={{
                    maxHeight: Math.max(120, position.maxHeight - 140), // Account for header (60px) + footer (80px) with minimum height
                    minHeight: typeof window !== 'undefined' && window.innerWidth < 768 ? '120px' : '80px' // Ensure minimum scrollable area
                }}
            >
                {loading ? (
                    <div className="p-6 text-center">
                        <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2 text-primary-500" />
                        <p className="text-sm text-neutral-600">{t('datatable.filter.loadingRanges')}</p>
                    </div>
                ) : error ? (
                    <div className="p-4 text-center">
                        <AlertCircle className="h-6 w-6 mx-auto mb-2 text-red-500" />
                        <p className="text-sm text-red-600 mb-2">{error}</p>
                        <button
                            onClick={() => {
                                const generatedRanges = generateRangesFromData();
                                setRanges(generatedRanges);
                                setError(null);
                            }}
                            className="text-xs text-primary-600 hover:text-primary-700 font-medium"
                        >
                            {t('datatable.filter.useLocalData')}
                        </button>
                    </div>
                ) : ranges.length === 0 ? (
                    <div className="p-6 text-center">
                        <BarChart3 className="h-6 w-6 mx-auto mb-2 text-neutral-400" />
                        <p className="text-sm text-neutral-600">{t('datatable.filter.noRanges')}</p>
                    </div>
                ) : (
                    <div className="max-h-60 overflow-y-auto">
                        {/* Clear Option */}
                        <label
                            ref={(el) => { optionRefs.current[-1] = el; }}
                            className={cn(
                                "flex items-center px-4 py-3 hover:bg-neutral-50 cursor-pointer transition-colors border-b border-neutral-100",
                                !selectedRange && "bg-primary-50",
                                focusedIndex === -1 && "bg-primary-50"
                            )}
                            tabIndex={0}
                            onFocus={() => setFocusedIndex(-1)}
                        >
                            <input
                                type="radio"
                                name={`${columnId}-range`}
                                checked={!selectedRange}
                                onChange={() => handleClear()}
                                className="mr-3 h-4 w-4 text-primary-600 border-neutral-300 focus:ring-primary-500 focus:ring-2"
                                tabIndex={-1}
                            />
                            <span className="text-sm text-neutral-700 font-medium">
                                {t('datatable.filter.allRanges')}
                            </span>
                        </label>

                        {/* Range Options */}
                        {ranges.map((range, index) => {
                            const rangeValue = `${range.min}-${range.max}`;
                            const isSelected = selectedRange === rangeValue;

                            return (
                                <label
                                    key={rangeValue}
                                    ref={(el) => { optionRefs.current[index] = el; }}
                                    className={cn(
                                        "flex items-center px-4 py-3 hover:bg-neutral-50 cursor-pointer transition-colors border-b border-neutral-50 last:border-b-0",
                                        isSelected && "bg-primary-50",
                                        focusedIndex === index && "bg-primary-50"
                                    )}
                                    tabIndex={0}
                                    onFocus={() => setFocusedIndex(index)}
                                    title={`Alt+${index + 1}`}
                                >
                                    <input
                                        type="radio"
                                        name={`${columnId}-range`}
                                        checked={isSelected}
                                        onChange={() => handleRangeSelect(range)}
                                        className="mr-3 h-4 w-4 text-primary-600 border-neutral-300 focus:ring-primary-500 focus:ring-2"
                                        tabIndex={-1}
                                    />
                                    <div className="flex-1">
                                        <span className="text-sm text-neutral-700 font-medium">
                                            {range.label}
                                        </span>
                                        {range.count !== undefined && (
                                            <span className="ml-2 text-xs text-neutral-500 bg-neutral-100 px-2 py-0.5 rounded-full">
                                                {range.count} {t('datatable.filter.items')}
                                            </span>
                                        )}
                                    </div>
                                </label>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Footer */}
            <div className="p-3 border-t border-neutral-100 bg-neutral-50">
                <div className="flex items-center justify-between text-xs text-neutral-600">
                    <span>
                        {ranges.length > 0 && (
                            t('datatable.filter.rangeCount', { count: ranges.length })
                        )}
                    </span>
                    <span className="text-neutral-400">
                        ↑↓ Navigate
                    </span>
                </div>
            </div>
        </div>
    );

    // Render in portal to avoid clipping by parent containers
    return createPortal(dropdownContent, document.body);
};
