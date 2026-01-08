import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { ChevronDown, Check, Search, Loader2 } from 'lucide-react';
import { Button } from '../ui/Button';
import { useLanguage } from '../../contexts/LanguageContext';
import { useMobileDetection } from '../../hooks/useTouch';

export interface FilterOption {
    value: string;
    label: string;
    count?: number;
}

export interface FilterConfig {
    key: string;
    label: string;
    field: string;
    type: 'select' | 'multiselect';
    sortBy?: 'alphabetical' | 'frequency';
}

interface DynamicFilterDropdownProps {
    filterKey: string;
    label: string;
    options: FilterOption[];
    selectedValues: string[];
    onSelectionChange: (filterKey: string, values: string[]) => void;
    multiSelect?: boolean;
    className?: string;
    isLoading?: boolean;
    maxHeight?: number;
    position?: 'auto' | 'top' | 'bottom';
}

export const DynamicFilterDropdown: React.FC<DynamicFilterDropdownProps> = ({
    filterKey,
    label,
    options,
    selectedValues,
    onSelectionChange,
    multiSelect = false,
    className,
    isLoading = false,
    maxHeight = 240,
    position = 'auto'
}) => {
    const { t } = useLanguage();
    const { isMobile } = useMobileDetection();
    const [isOpen, setIsOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [dropdownPosition, setDropdownPosition] = useState<'top' | 'bottom'>('bottom');
    const [useBottomSheet, setUseBottomSheet] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const buttonRef = useRef<HTMLButtonElement>(null);
    const searchInputRef = useRef<HTMLInputElement>(null);

    // Screen reader announcements
    const announceMessage = useCallback((message: string) => {
        const announcement = document.createElement('div');
        announcement.setAttribute('aria-live', 'polite');
        announcement.setAttribute('aria-atomic', 'true');
        announcement.className = 'sr-only';
        announcement.textContent = message;
        document.body.appendChild(announcement);

        setTimeout(() => {
            document.body.removeChild(announcement);
        }, 1000);
    }, []);

    const announceSelectionChange = useCallback((value: string, wasSelected: boolean) => {
        const option = options.find(opt => opt.value === value);
        const optionLabel = option?.label || value;
        const message = wasSelected
            ? t('search.optionDeselected', { option: optionLabel }) || `${optionLabel} deselected`
            : t('search.optionSelected', { option: optionLabel }) || `${optionLabel} selected`;
        announceMessage(message);
    }, [options, t, announceMessage]);

    // Filter options based on search query
    const filteredOptions = useMemo(() => {
        if (!searchQuery.trim()) {
            return options;
        }
        const query = searchQuery.toLowerCase().trim();
        return options.filter(option =>
            option.label.toLowerCase().includes(query) ||
            option.value.toLowerCase().includes(query)
        );
    }, [options, searchQuery]);

    // Sort options based on configuration
    const sortedOptions = useMemo(() => {
        return [...filteredOptions].sort((a, b) => {
            // Sort by frequency (count) first, then alphabetically
            if (a.count !== undefined && b.count !== undefined) {
                if (a.count !== b.count) {
                    return b.count - a.count; // Higher count first
                }
            }
            return a.label.localeCompare(b.label);
        });
    }, [filteredOptions]);

    const handleOptionToggle = useCallback((value: string) => {
        if (multiSelect) {
            const isSelected = selectedValues.includes(value);
            if (isSelected) {
                onSelectionChange(filterKey, selectedValues.filter(v => v !== value));
            } else {
                onSelectionChange(filterKey, [...selectedValues, value]);
            }
        } else {
            // Single select - replace current selection
            const newValues = selectedValues.includes(value) ? [] : [value];
            onSelectionChange(filterKey, newValues);
            setIsOpen(false);
        }
    }, [multiSelect, selectedValues, onSelectionChange, filterKey]);

    const handleClearAll = useCallback(() => {
        onSelectionChange(filterKey, []);
    }, [onSelectionChange, filterKey]);

    const handleSelectAll = useCallback(() => {
        if (!multiSelect) return;
        const allFilteredValues = filteredOptions.map(option => option.value);
        onSelectionChange(filterKey, allFilteredValues);
    }, [multiSelect, filteredOptions, onSelectionChange, filterKey]);

    const handleSelectNone = useCallback(() => {
        onSelectionChange(filterKey, []);
    }, [onSelectionChange, filterKey]);

    // Touch gesture handling for mobile
    const handleTouchStart = useCallback((e: React.TouchEvent) => {
        if (!isMobile || !useBottomSheet) return;

        const touch = e.touches[0];
        const startY = touch.clientY;

        const handleTouchMove = (moveEvent: TouchEvent) => {
            const currentTouch = moveEvent.touches[0];
            const deltaY = currentTouch.clientY - startY;

            // If swiping down significantly, close the dropdown
            if (deltaY > 100) {
                setIsOpen(false);
                document.removeEventListener('touchmove', handleTouchMove);
                document.removeEventListener('touchend', handleTouchEnd);
            }
        };

        const handleTouchEnd = () => {
            document.removeEventListener('touchmove', handleTouchMove);
            document.removeEventListener('touchend', handleTouchEnd);
        };

        document.addEventListener('touchmove', handleTouchMove, { passive: true });
        document.addEventListener('touchend', handleTouchEnd);
    }, [isMobile, useBottomSheet]);

    const getDisplayText = useCallback(() => {
        if (selectedValues.length === 0) {
            return label;
        }
        if (selectedValues.length === 1) {
            const option = options.find(opt => opt.value === selectedValues[0]);
            const displayLabel = option?.label || selectedValues[0];
            const count = option?.count;
            return count !== undefined ? `${displayLabel} (${count})` : displayLabel;
        }
        return `${selectedValues.length} ${t('common.misc.items')}`;
    }, [selectedValues, label, options, t]);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Calculate dropdown position and mobile layout
    useEffect(() => {
        if (isOpen) {
            const calculateLayout = () => {
                const viewportHeight = window.innerHeight;
                const viewportWidth = window.innerWidth;

                // Use bottom sheet on small screens or when height is limited
                if (isMobile || viewportHeight < 600 || viewportWidth < 640) {
                    setUseBottomSheet(true);
                    return;
                }

                setUseBottomSheet(false);

                if (buttonRef.current && position === 'auto') {
                    const buttonRect = buttonRef.current.getBoundingClientRect();
                    const spaceBelow = viewportHeight - buttonRect.bottom;
                    const spaceAbove = buttonRect.top;

                    // If there's not enough space below and more space above, position on top
                    if (spaceBelow < maxHeight + 20 && spaceAbove > spaceBelow) {
                        setDropdownPosition('top');
                    } else {
                        setDropdownPosition('bottom');
                    }
                } else if (position !== 'auto') {
                    setDropdownPosition(position);
                }
            };

            calculateLayout();
            window.addEventListener('resize', calculateLayout);
            window.addEventListener('scroll', calculateLayout);

            return () => {
                window.removeEventListener('resize', calculateLayout);
                window.removeEventListener('scroll', calculateLayout);
            };
        }
    }, [isOpen, position, maxHeight, isMobile]);

    // Scroll lock for mobile bottom sheet
    useEffect(() => {
        if (isOpen && useBottomSheet) {
            const originalStyle = window.getComputedStyle(document.body).overflow;
            document.body.style.overflow = 'hidden';

            return () => {
                document.body.style.overflow = originalStyle;
            };
        }
    }, [isOpen, useBottomSheet]);

    // Focus search input when dropdown opens
    useEffect(() => {
        if (isOpen && searchInputRef.current && !isMobile) {
            // Small delay to ensure dropdown is rendered
            setTimeout(() => {
                searchInputRef.current?.focus();
            }, 50);
        }
    }, [isOpen, isMobile]);

    // Enhanced keyboard navigation support
    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (!isOpen) return;

            switch (event.key) {
                case 'Escape':
                    setIsOpen(false);
                    setSearchQuery('');
                    buttonRef.current?.focus();
                    break;
                case 'ArrowDown':
                case 'ArrowUp': {
                    // Don't interfere with search input navigation
                    if (document.activeElement === searchInputRef.current) {
                        if (event.key === 'ArrowDown') {
                            event.preventDefault();
                            const firstOption = dropdownRef.current?.querySelector('[role="option"]') as HTMLElement;
                            firstOption?.focus();
                        }
                        return;
                    }

                    event.preventDefault();
                    const optionElements = dropdownRef.current?.querySelectorAll('[role="option"]');
                    if (optionElements && optionElements.length > 0) {
                        const currentFocus = document.activeElement;
                        const currentIndex = Array.from(optionElements).indexOf(currentFocus as Element);
                        let nextIndex = event.key === 'ArrowDown' ? currentIndex + 1 : currentIndex - 1;

                        if (nextIndex < 0) {
                            // Go back to search input
                            searchInputRef.current?.focus();
                            return;
                        }
                        if (nextIndex >= optionElements.length) nextIndex = 0;

                        (optionElements[nextIndex] as HTMLElement).focus();
                    }
                    break;
                }
                case 'Enter':
                case ' ': {
                    // Handle Enter/Space on options
                    const focusedElement = document.activeElement;
                    if (focusedElement && focusedElement.getAttribute('role') === 'option') {
                        event.preventDefault();
                        const optionValue = focusedElement.getAttribute('data-value');
                        if (optionValue) {
                            handleOptionToggle(optionValue);
                            // Announce selection change
                            announceSelectionChange(optionValue, selectedValues.includes(optionValue));
                        }
                    }
                    break;
                }
                case 'a':
                case 'A': {
                    // Ctrl+A for select all (only in multiselect mode)
                    if ((event.ctrlKey || event.metaKey) && multiSelect && filteredOptions.length > 0) {
                        event.preventDefault();
                        handleSelectAll();
                        announceMessage(t('search.allOptionsSelected') || 'All options selected');
                    }
                    break;
                }
                case 'Home': {
                    // Go to first option
                    event.preventDefault();
                    const firstOption = dropdownRef.current?.querySelector('[role="option"]') as HTMLElement;
                    firstOption?.focus();
                    break;
                }
                case 'End': {
                    // Go to last option
                    event.preventDefault();
                    const optionElements = dropdownRef.current?.querySelectorAll('[role="option"]');
                    if (optionElements && optionElements.length > 0) {
                        (optionElements[optionElements.length - 1] as HTMLElement).focus();
                    }
                    break;
                }
            }
        };

        if (isOpen) {
            document.addEventListener('keydown', handleKeyDown);
            return () => document.removeEventListener('keydown', handleKeyDown);
        }
    }, [isOpen, isMobile, multiSelect, filteredOptions, selectedValues, handleSelectAll, handleOptionToggle, announceSelectionChange, announceMessage, t]);

    return (
        <div className={`relative ${className}`} ref={dropdownRef}>
            <Button
                ref={buttonRef}
                variant="outline"
                onClick={() => setIsOpen(!isOpen)}
                className={`w-full justify-between touch-target ${isMobile ? 'min-h-[48px]' : ''}`}
                aria-expanded={isOpen}
                aria-haspopup="listbox"
                aria-label={`${label} - ${selectedValues.length > 0 ? `${selectedValues.length} selected` : 'none selected'}`}
            >
                <span className="truncate">{getDisplayText()}</span>
                <ChevronDown
                    className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                    aria-hidden="true"
                />
            </Button>

            {isOpen && (
                <>
                    {/* Mobile bottom sheet overlay */}
                    {useBottomSheet && (
                        <div
                            className="fixed inset-0 bg-black bg-opacity-50 z-40"
                            onClick={() => setIsOpen(false)}
                            aria-hidden="true"
                        />
                    )}

                    <div
                        className={`z-50 bg-white border border-secondary-200 shadow-lg overflow-hidden ${useBottomSheet
                            ? 'fixed bottom-0 left-0 right-0 rounded-t-lg max-h-[70vh]'
                            : `absolute w-full rounded-md ${dropdownPosition === 'top' ? 'bottom-full mb-2' : 'top-full mt-2'
                            }`
                            } ${isMobile ? 'shadow-xl' : ''}`}
                        role="listbox"
                        aria-label={`${label} options`}
                        aria-multiselectable={multiSelect}
                        aria-activedescendant={undefined}
                        tabIndex={-1}
                        style={!useBottomSheet ? { maxHeight: `${maxHeight}px` } : undefined}
                        onTouchStart={handleTouchStart}
                    >
                        {/* Mobile bottom sheet handle */}
                        {useBottomSheet && (
                            <div className="flex justify-center py-2">
                                <div className="w-8 h-1 bg-secondary-300 rounded-full"></div>
                            </div>
                        )}

                        {/* Header with search and controls */}
                        <div className={`p-2 border-b border-secondary-100 space-y-2 ${isMobile ? 'p-3' : ''}`}>
                            {/* Search input */}
                            <div className="relative">
                                <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-secondary-400" />
                                <input
                                    ref={searchInputRef}
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder={t('search.searchOptions') || 'Search options...'}
                                    className={`w-full pl-8 pr-3 py-1.5 text-sm border border-secondary-200 rounded focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 ${isMobile ? 'py-2 text-base' : ''}`}
                                    aria-label={`Search ${label} options`}
                                />
                            </div>

                            {/* Controls row */}
                            <div className="flex justify-between items-center">
                                <span className="text-sm font-medium text-secondary-700">
                                    {label}
                                    {filteredOptions.length !== options.length && (
                                        <span className="text-xs text-secondary-500 ml-1">
                                            ({filteredOptions.length} of {options.length})
                                        </span>
                                    )}
                                </span>
                                <div className="flex gap-1">
                                    {multiSelect && filteredOptions.length > 0 && (
                                        <>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={handleSelectAll}
                                                className={`h-6 px-2 text-xs touch-target ${isMobile ? 'min-h-[36px] px-2' : ''}`}
                                                aria-label={t('search.selectAll') || 'Select All'}
                                            >
                                                {t('search.selectAll') || 'All'}
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={handleSelectNone}
                                                className={`h-6 px-2 text-xs touch-target ${isMobile ? 'min-h-[36px] px-2' : ''}`}
                                                aria-label={t('search.selectNone') || 'Select None'}
                                            >
                                                {t('search.selectNone') || 'None'}
                                            </Button>
                                        </>
                                    )}
                                    {selectedValues.length > 0 && !multiSelect && (
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={handleClearAll}
                                            className={`h-6 px-2 text-xs touch-target ${isMobile ? 'min-h-[36px] px-2' : ''}`}
                                            aria-label={t('search.clearAllFilters')}
                                        >
                                            {t('search.clear') || 'Clear'}
                                        </Button>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Options list */}
                        <div className="overflow-auto flex-1">
                            {isLoading ? (
                                /* Loading skeleton */
                                <div className="py-2">
                                    {[...Array(3)].map((_, index) => (
                                        <div
                                            key={index}
                                            className={`px-3 py-2 flex items-center space-x-2 ${isMobile ? 'px-4 py-3' : ''}`}
                                        >
                                            <Loader2 className="h-4 w-4 animate-spin text-secondary-400" />
                                            <div className="flex-1 space-y-1">
                                                <div className="h-3 bg-secondary-200 rounded animate-pulse"></div>
                                                <div className="h-2 bg-secondary-100 rounded animate-pulse w-1/2"></div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="py-1">
                                    {sortedOptions.map((option) => {
                                        const isSelected = selectedValues.includes(option.value);

                                        return (
                                            <button
                                                key={option.value}
                                                onClick={() => handleOptionToggle(option.value)}
                                                className={`w-full px-3 py-2 text-left hover:bg-secondary-50 flex items-center justify-between transition-colors focus:outline-none focus:bg-secondary-100 focus:ring-2 focus:ring-primary-500/20 touch-manipulation ${isMobile ? 'px-4 py-3 min-h-[48px]' : ''} ${isSelected ? 'bg-primary-50' : ''}`}
                                                role="option"
                                                aria-selected={isSelected}
                                                aria-label={`${option.label}${option.count !== undefined ? ` (${option.count} items)` : ''}${isSelected ? ' - selected' : ''}`}
                                                aria-describedby={option.count !== undefined ? `${filterKey}-${option.value}-count` : undefined}
                                                data-value={option.value}
                                                tabIndex={0}
                                            >
                                                <div className="flex items-center space-x-2 flex-1 min-w-0">
                                                    <span className="text-sm text-secondary-900 truncate">{option.label}</span>
                                                    {option.count !== undefined && (
                                                        <span
                                                            id={`${filterKey}-${option.value}-count`}
                                                            className="text-xs text-secondary-500 flex-shrink-0"
                                                            aria-label={`${option.count} items`}
                                                        >
                                                            ({option.count})
                                                        </span>
                                                    )}
                                                </div>
                                                {isSelected && (
                                                    <Check
                                                        className="h-4 w-4 text-primary-600 flex-shrink-0 ml-2"
                                                        aria-hidden="true"
                                                    />
                                                )}
                                            </button>
                                        );
                                    })}
                                    {!isLoading && sortedOptions.length === 0 && searchQuery.trim() && (
                                        <div className={`px-3 py-4 text-sm text-secondary-500 text-center ${isMobile ? 'px-4 py-6' : ''}`}>
                                            <p>{t('search.noMatchingOptions') || 'No matching options found'}</p>
                                            <p className="text-xs mt-1 text-secondary-400">
                                                {t('search.tryDifferentSearch') || 'Try a different search term'}
                                            </p>
                                        </div>
                                    )}
                                    {!isLoading && sortedOptions.length === 0 && !searchQuery.trim() && (
                                        <div className={`px-3 py-2 text-sm text-secondary-500 ${isMobile ? 'px-4 py-3' : ''}`}>
                                            {t('search.noOptionsAvailable') || 'No options available'}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};