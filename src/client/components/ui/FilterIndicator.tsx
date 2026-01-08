import React, { useState, useEffect } from 'react';
import { Filter } from 'lucide-react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../utils/cn';

const filterIndicatorVariants = cva(
    'inline-flex items-center justify-center rounded-md transition-all duration-200 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/20 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
    {
        variants: {
            state: {
                inactive: 'text-neutral-400 hover:text-neutral-600 hover:bg-neutral-50',
                active: 'text-primary-600 bg-primary-50 hover:text-primary-700 hover:bg-primary-100',
                hover: 'text-primary-700 bg-primary-100',
            },
            size: {
                compact: 'h-6 w-6 min-h-[24px] min-w-[24px]', // Compact size for inline use
                default: 'h-8 w-8 min-h-[32px] min-w-[32px]', // Base size
                mobile: 'h-11 w-11 min-h-[44px] min-w-[44px]', // Touch-friendly mobile size
            },
        },
        defaultVariants: {
            state: 'inactive',
            size: 'default',
        },
    }
);

const badgeVariants = cva(
    'absolute -top-1 -right-1 inline-flex items-center justify-center rounded-full text-xs font-medium min-w-[18px] h-[18px] px-1',
    {
        variants: {
            variant: {
                default: 'bg-primary-500 text-white',
                secondary: 'bg-neutral-500 text-white',
            },
        },
        defaultVariants: {
            variant: 'default',
        },
    }
);

export interface FilterIndicatorProps
    extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof filterIndicatorVariants> {
    /** Column key for identification */
    columnKey: string;
    /** Whether this column is filterable */
    isFilterable: boolean;
    /** Whether this column has active filters */
    hasActiveFilter: boolean;
    /** Number of active filter values (optional count badge) */
    filterCount?: number;
    /** Column label for accessibility */
    columnLabel?: string;
    /** Whether to use mobile-optimized sizing */
    isMobile?: boolean;
    /** Whether the filter dropdown is currently open */
    isDropdownOpen?: boolean;
    /** Additional CSS classes */
    className?: string;
}

/**
 * FilterIndicator Component
 * 
 * Visual indicator beside column headers showing filter availability and status.
 * Provides three visual states: inactive, active, and hover with optional count badge.
 * 
 * Features:
 * - Three visual states with smooth transitions
 * - Optional count badge for active filter values
 * - Touch-friendly sizing for mobile devices (44px minimum)
 * - Comprehensive ARIA attributes for accessibility
 * - Keyboard navigation support (Enter/Space)
 * - Tooltip on hover for better UX
 * - Screen reader announcements for state changes
 * - Lucide React Filter icon with theme colors
 */
const FilterIndicator = React.forwardRef<HTMLButtonElement, FilterIndicatorProps>(
    ({
        columnKey,
        isFilterable,
        hasActiveFilter,
        filterCount,
        columnLabel,
        isMobile = false,
        isDropdownOpen = false,
        size,
        className,
        onClick,
        onKeyDown,
        onFocus,
        onBlur,
        ...props
    }, ref) => {
        const [isHovered, setIsHovered] = useState(false);
        const [isFocused, setIsFocused] = useState(false);
        const [announceText, setAnnounceText] = useState<string>('');

        // Announce state changes for screen readers
        useEffect(() => {
            if (hasActiveFilter && filterCount) {
                const message = `${filterCount} filter${filterCount > 1 ? 's' : ''} applied to ${columnLabel || columnKey}`;
                setAnnounceText(message);

                // Clear announcement after a short delay
                const timer = setTimeout(() => setAnnounceText(''), 1000);
                return () => clearTimeout(timer);
            }
        }, [hasActiveFilter, filterCount, columnLabel, columnKey]);

        // Don't render if column is not filterable
        if (!isFilterable) {
            return null;
        }

        // Determine visual state
        const state = hasActiveFilter ? 'active' : 'inactive';

        // Handle keyboard navigation with comprehensive support
        const handleKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>) => {
            if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                // Trigger click handler for keyboard activation
                if (onClick) {
                    const target = event.currentTarget;
                    target.click();
                }
            }
            onKeyDown?.(event);
        };

        // Handle focus events for accessibility
        const handleFocus = (event: React.FocusEvent<HTMLButtonElement>) => {
            setIsFocused(true);
            onFocus?.(event);
        };

        const handleBlur = (event: React.FocusEvent<HTMLButtonElement>) => {
            setIsFocused(false);
            onBlur?.(event);
        };

        // Handle mouse events for hover state
        const handleMouseEnter = () => {
            setIsHovered(true);
        };

        const handleMouseLeave = () => {
            setIsHovered(false);
        };

        // Generate comprehensive ARIA label
        const ariaLabel = columnLabel
            ? `Filter by ${columnLabel}${hasActiveFilter ? ` (${filterCount || 1} filter${(filterCount || 1) > 1 ? 's' : ''} active)` : ''}`
            : `Filter column ${columnKey}${hasActiveFilter ? ` (${filterCount || 1} filter${(filterCount || 1) > 1 ? 's' : ''} active)` : ''}`;

        // Generate tooltip text
        const tooltipText = columnLabel ? `Filter by ${columnLabel}` : `Filter column ${columnKey}`;

        return (
            <>
                <button
                    ref={ref}
                    type="button"
                    className={cn(
                        filterIndicatorVariants({ state, size: size || (isMobile ? 'mobile' : 'default') }),
                        'relative', // For badge positioning
                        // Enhanced focus and hover states
                        isFocused && 'ring-2 ring-primary-500/20 ring-offset-2',
                        isHovered && !hasActiveFilter && 'text-neutral-600 bg-neutral-50',
                        isHovered && hasActiveFilter && 'text-primary-700 bg-primary-100',
                        className
                    )}
                    onClick={onClick}
                    onKeyDown={handleKeyDown}
                    onFocus={handleFocus}
                    onBlur={handleBlur}
                    onMouseEnter={handleMouseEnter}
                    onMouseLeave={handleMouseLeave}
                    aria-label={ariaLabel}
                    aria-expanded={isDropdownOpen}
                    aria-haspopup="listbox"
                    aria-describedby={hasActiveFilter ? `${columnKey}-filter-status` : undefined}
                    title={tooltipText}
                    tabIndex={0}
                    {...props}
                >
                    <Filter
                        className={cn(
                            'flex-shrink-0',
                            (size || (isMobile ? 'mobile' : 'default')) === 'mobile' ? 'h-5 w-5' :
                                (size || (isMobile ? 'mobile' : 'default')) === 'compact' ? 'h-3 w-3' : 'h-4 w-4'
                        )}
                        aria-hidden="true"
                    />

                    {/* Count badge for active filters */}
                    {hasActiveFilter && filterCount && filterCount > 0 && (
                        <span
                            className={cn(badgeVariants())}
                            aria-hidden="true"
                        >
                            {filterCount > 99 ? '99+' : filterCount}
                        </span>
                    )}
                </button>

                {/* Hidden status text for screen readers */}
                {hasActiveFilter && (
                    <span
                        id={`${columnKey}-filter-status`}
                        className="sr-only"
                        aria-live="polite"
                    >
                        {filterCount} filter{(filterCount || 1) > 1 ? 's' : ''} active on {columnLabel || columnKey}
                    </span>
                )}

                {/* Screen reader announcements */}
                {announceText && (
                    <span
                        className="sr-only"
                        aria-live="polite"
                        aria-atomic="true"
                    >
                        {announceText}
                    </span>
                )}
            </>
        );
    }
);

FilterIndicator.displayName = 'FilterIndicator';

export { FilterIndicator, filterIndicatorVariants, badgeVariants };