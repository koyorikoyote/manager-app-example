import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check, X, Filter, User, Building2, MessageSquare, Building, Calendar, FileText } from 'lucide-react';
import { Button } from '../ui/Button';
import { useLanguage } from '../../contexts/LanguageContext';
import { useMobileDetection } from '../../hooks/useTouch';
import { createPortal } from 'react-dom';

// Helper function to get translated filter labels
const getFilterLabel = (filterId: string, t: any): string => {
  if (!t || typeof t !== 'function') {
    return filterId;
  }

  try {
    switch (filterId) {
      case 'staff':
        return t('navigation.staff');
      case 'destinations':
        return t('navigation.destinations');
      case 'interactions':
        return t('navigation.interactions');
      case 'residences':
        return t('navigation.residences');
      case 'attendance':
        return t('navigation.attendance');
      case 'manual':
        return t('navigation.manual');
      case 'dailyRecord':
        return t('navigation.dailyRecord');
      case 'inquiriesNotifications':
        return t('navigation.inquiriesNotifications');
      default:
        return filterId;
    }
  } catch {
    return filterId;
  }
};

export interface FilterOption {
  id: string;
  label: string;
  count?: number;
  icon?: React.ComponentType<{ className?: string }>;
}

interface SearchFilterProps {
  selectedFilters: string[];
  onSelectionChange: (filters: string[]) => void;
  availableFilters: FilterOption[];
  className?: string;
}

// Default filter options based on design specification
export const getDefaultFilterOptions = (t: unknown): FilterOption[] => {
  if (!t || typeof t !== 'function') {
    return DEFAULT_FILTER_OPTIONS;
  }

  try {
    return [
      {
        id: 'staff',
        label: t('navigation.staff'),
        icon: User,
      },
      {
        id: 'destinations',
        label: t('navigation.destinations'),
        icon: Building2,
      },
      {
        id: 'interactions',
        label: t('navigation.interactions'),
        icon: MessageSquare,
      },
      {
        id: 'residences',
        label: t('navigation.residences'),
        icon: Building,
      },
      {
        id: 'attendance',
        label: t('navigation.attendance'),
        icon: Calendar,
      },
      {
        id: 'manual',
        label: t('navigation.manual'),
        icon: FileText,
      },
      {
        id: 'dailyRecord',
        label: t('navigation.dailyRecord'),
        icon: FileText,
      },
      {
        id: 'inquiriesNotifications',
        label: t('navigation.inquiriesNotifications'),
        icon: MessageSquare,
      },
    ];
  } catch {
    return DEFAULT_FILTER_OPTIONS;
  }
};

// Fallback for backward compatibility
export const DEFAULT_FILTER_OPTIONS: FilterOption[] = [
  {
    id: 'staff',
    label: 'Staff',
    icon: User,
  },
  {
    id: 'destinations',
    label: 'Destinations',
    icon: Building2,
  },
  {
    id: 'interactions',
    label: 'Interactions',
    icon: MessageSquare,
  },
  {
    id: 'residences',
    label: 'Residences',
    icon: Building,
  },
  {
    id: 'attendance',
    label: 'Attendance',
    icon: Calendar,
  },
  {
    id: 'manual',
    label: 'Manual',
    icon: FileText,
  },
  {
    id: 'dailyRecord',
    label: 'Daily Record',
    icon: FileText,
  },
  {
    id: 'inquiriesNotifications',
    label: 'Inquiries & Notifications',
    icon: MessageSquare,
  },
];

export const SearchFilter: React.FC<SearchFilterProps> = ({
  selectedFilters,
  onSelectionChange,
  availableFilters,
  className
}) => {
  const { t } = useLanguage();
  const { isMobile } = useMobileDetection();
  const [isOpen, setIsOpen] = useState(false);
  const [isMobileDialogOpen, setIsMobileDialogOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const previousFiltersRef = useRef<string[]>(selectedFilters);

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

  // Clear focus when filters change to ensure visual state updates
  useEffect(() => {
    const filtersChanged = JSON.stringify(previousFiltersRef.current) !== JSON.stringify(selectedFilters);

    if (filtersChanged && isOpen && dropdownRef.current) {
      // Update the ref
      previousFiltersRef.current = selectedFilters;

      // Clear focus from any selected option to force visual update
      const activeElement = document.activeElement;
      if (activeElement && dropdownRef.current.contains(activeElement)) {
        (activeElement as HTMLElement).blur();

        // Brief delay to allow DOM to update, then restore focus to dropdown
        setTimeout(() => {
          if (isOpen && dropdownRef.current) {
            // Focus the dropdown container to maintain keyboard navigation
            dropdownRef.current.focus();
          }
        }, 50);
      }
    } else if (filtersChanged) {
      // Update ref even when dropdown is closed
      previousFiltersRef.current = selectedFilters;
    }
  }, [selectedFilters, isOpen]);

  // Enhanced keyboard navigation support
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!isOpen) return;

      switch (event.key) {
        case 'Escape':
          setIsOpen(false);
          buttonRef.current?.focus();
          break;
        case 'Tab':
          // Allow normal tab navigation within dropdown
          break;
        case 'ArrowDown':
        case 'ArrowUp': {
          event.preventDefault();
          // Focus management for dropdown options
          const options = dropdownRef.current?.querySelectorAll('[role="option"]');
          if (options && options.length > 0) {
            const currentFocus = document.activeElement;
            const currentIndex = Array.from(options).indexOf(currentFocus as Element);
            let nextIndex = event.key === 'ArrowDown' ? currentIndex + 1 : currentIndex - 1;

            if (nextIndex < 0) nextIndex = options.length - 1;
            if (nextIndex >= options.length) nextIndex = 0;

            (options[nextIndex] as HTMLElement).focus();
          }
          break;
        }
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen]);

  const handleFilterToggle = (filterId: string) => {
    const isSelected = selectedFilters.includes(filterId);
    if (isSelected) {
      // Remove filter and ensure immediate state update
      const newFilters = selectedFilters.filter(f => f !== filterId);
      onSelectionChange(newFilters);
    } else {
      // Add filter
      onSelectionChange([...selectedFilters, filterId]);
    }
  };

  const handleClearAll = () => {
    onSelectionChange([]);
  };

  const handleRemoveFilter = (filterId: string) => {
    // Ensure immediate state update and prevent event bubbling
    const newFilters = selectedFilters.filter(f => f !== filterId);
    onSelectionChange(newFilters);

    // Force focus update if dropdown is open
    if (isOpen && dropdownRef.current) {
      setTimeout(() => {
        const optionButton = dropdownRef.current?.querySelector(`[role="option"][aria-label*="${filterId}"]`) as HTMLElement;
        if (optionButton) {
          optionButton.blur();
        }
      }, 10);
    }
  };

  const handleFilterClick = () => {
    if (isMobile) {
      setIsMobileDialogOpen(true);
    } else {
      setIsOpen(!isOpen);
    }
  };

  return (
    <div className={`${className}`}>
      {/* Inline Filter Row - Button and Active Tags */}
      <div className="flex items-center gap-2 flex-wrap">
        {/* Compact Filter Button */}
        <div className="relative" ref={dropdownRef}>
          <Button
            ref={buttonRef}
            variant="outline"
            size="sm"
            onClick={handleFilterClick}
            className={`flex-shrink-0 ${selectedFilters.length > 0 ? 'bg-primary-50 border-primary-300 text-primary-700' : 'text-secondary-600'} ${isMobile ? 'min-h-[44px] px-3' : 'px-3'}`}
            aria-expanded={isMobile ? isMobileDialogOpen : isOpen}
            aria-haspopup="listbox"
            aria-label={`Filter results - ${selectedFilters.length} selected`}
          >
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4" />
              {selectedFilters.length > 0 ? (
                <span className="bg-primary-600 text-white text-xs rounded-full px-1.5 py-0.5 min-w-[18px] text-center font-medium">
                  {selectedFilters.length}
                </span>
              ) : (
                <span className="text-sm">{t('search.filter')}</span>
              )}
              <ChevronDown
                className={`h-3 w-3 transition-transform ${(isMobile ? isMobileDialogOpen : isOpen) ? 'rotate-180' : ''}`}
                aria-hidden="true"
              />
            </div>
          </Button>

          {!isMobile && isOpen && (
            <div
              className="absolute z-50 mt-1 bg-white border border-secondary-200 rounded-lg shadow-lg min-w-[280px] max-h-80 overflow-auto"
              role="listbox"
              aria-label="Filter options"
              style={{ left: 0 }}
            >
              <div className="p-3 border-b border-secondary-100">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-semibold text-secondary-800">{t('search.filters')}</span>
                  {selectedFilters.length > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleClearAll}
                      className="h-7 px-2 text-xs text-secondary-600 hover:text-secondary-800"
                    >
                      {t('search.clearAllFilters')}
                    </Button>
                  )}
                </div>
              </div>

              <div className="py-2">
                {availableFilters.map((filter) => {
                  const isSelected = selectedFilters.includes(filter.id);
                  const IconComponent = filter.icon;

                  return (
                    <button
                      key={filter.id}
                      onClick={() => handleFilterToggle(filter.id)}
                      className={`w-full px-3 py-2.5 text-left hover:bg-secondary-50 flex items-center gap-3 transition-colors focus:outline-none focus:bg-secondary-100 ${isSelected ? 'bg-primary-50 text-primary-900' : 'text-secondary-700'}`}
                      role="option"
                      aria-selected={isSelected}
                    >
                      {IconComponent && (
                        <IconComponent
                          className={`h-4 w-4 flex-shrink-0 ${isSelected ? 'text-primary-600' : 'text-secondary-500'}`}
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <span className="text-sm font-medium">{getFilterLabel(filter.id, t) || filter.label}</span>
                        {filter.count !== undefined && (
                          <span className="text-xs text-secondary-500 ml-1">({filter.count})</span>
                        )}
                      </div>
                      {isSelected && (
                        <Check className="h-4 w-4 text-primary-600 flex-shrink-0" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Active Filter Tags - Inline with Button */}
        {selectedFilters.length > 0 && selectedFilters.map(filterId => {
          const filter = availableFilters.find(f => f.id === filterId);
          if (!filter) return null;

          const IconComponent = filter.icon;

          return (
            <span
              key={filterId}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-primary-100 text-primary-800 rounded-full text-xs font-medium flex-shrink-0"
            >
              {IconComponent && (
                <IconComponent className="h-3 w-3" />
              )}
              <span className="truncate max-w-[100px]">{getFilterLabel(filter.id, t) || filter.label}</span>
              <button
                onClick={() => handleRemoveFilter(filterId)}
                className="hover:bg-primary-200 rounded-full p-0.5 transition-colors"
                aria-label={`Remove ${getFilterLabel(filter.id, t) || filter.label} filter`}
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          );
        })}
      </div>

      {/* Mobile Filter Dialog */}
      {isMobileDialogOpen && createPortal(
        <div className="fixed inset-0 z-50 bg-black/50 flex items-end">
          <div className="w-full bg-white rounded-t-2xl max-h-[85vh] flex flex-col animate-in slide-in-from-bottom duration-300">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-secondary-200">
              <h2 className="text-lg font-semibold text-secondary-900">{t('search.filters')}</h2>
              <button
                onClick={() => setIsMobileDialogOpen(false)}
                className="p-2 text-secondary-500 hover:text-secondary-700 hover:bg-secondary-100 rounded-lg transition-colors"
                aria-label="Close filter"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Filter Options */}
            <div className="flex-1 overflow-y-auto p-4">
              <div className="space-y-1">
                {availableFilters.map((filter) => {
                  const isSelected = selectedFilters.includes(filter.id);
                  const IconComponent = filter.icon;

                  return (
                    <button
                      key={filter.id}
                      onClick={() => handleFilterToggle(filter.id)}
                      className={`w-full flex items-center gap-3 p-3 rounded-lg transition-colors ${isSelected
                        ? 'bg-primary-50 text-primary-900 border border-primary-200'
                        : 'text-secondary-700 hover:bg-secondary-50'
                        }`}
                    >
                      {IconComponent && (
                        <IconComponent
                          className={`h-5 w-5 ${isSelected ? 'text-primary-600' : 'text-secondary-500'}`}
                        />
                      )}
                      <div className="flex-1 text-left">
                        <span className="font-medium">{getFilterLabel(filter.id, t) || filter.label}</span>
                        {filter.count !== undefined && (
                          <span className="text-sm text-secondary-500 ml-1">({filter.count})</span>
                        )}
                      </div>
                      {isSelected && (
                        <Check className="h-5 w-5 text-primary-600" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-secondary-200">
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={handleClearAll}
                  className="flex-1"
                  disabled={selectedFilters.length === 0}
                >
                  {t('search.clearAllFilters')}
                </Button>
                <Button
                  onClick={() => setIsMobileDialogOpen(false)}
                  className="flex-1"
                >
                  {t('search.applyFilters')} ({selectedFilters.length})
                </Button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};