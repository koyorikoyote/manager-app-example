import React, { useState, useCallback, useEffect } from 'react';
import { Card, CardContent, CardHeader } from './Card';
import { EmptyState } from './EmptyState';
import { cn } from '../../utils/cn';
import { useResponsive } from '../../hooks/useResponsive';
import { CARD_STYLES } from './cardStyles';

interface AccordionListProps<T> {
    items: T[];
    renderSummary: (item: T) => React.ReactNode;
    renderDetails: (item: T) => React.ReactNode;
    keyExtractor: (item: T) => string | number;
    loading?: boolean;
    error?: string | null;
    emptyMessage?: string;
    className?: string;
}

export function AccordionList<T>({
    items,
    renderSummary,
    renderDetails,
    keyExtractor,
    loading = false,
    error = null,
    emptyMessage = 'No items to display',
    className
}: AccordionListProps<T>) {
    const { isMobile, isTablet } = useResponsive();
    const [expandedItem, setExpandedItem] = useState<string | number | null>(null);
    const [isInitialized, setIsInitialized] = useState(false);

    // Initialize component after mount to prevent race conditions
    useEffect(() => {
        if (typeof window !== 'undefined') {
            const rafId = window.requestAnimationFrame(() => {
                setIsInitialized(true);
            });
            return () => window.cancelAnimationFrame(rafId);
        } else {
            // Fallback for SSR
            setIsInitialized(true);
        }
    }, []);

    // Toggle expansion function - only one item can be expanded at a time
    const toggleExpansion = useCallback((itemKey: string | number) => {
        setExpandedItem(prev => prev === itemKey ? null : itemKey);
    }, []);

    // Keyboard navigation support
    const handleKeyDown = useCallback((event: React.KeyboardEvent, itemKey: string | number) => {
        if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            toggleExpansion(itemKey);
        } else if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
            event.preventDefault();
            const currentIndex = items.findIndex(item => keyExtractor(item) === itemKey);
            const nextIndex = event.key === 'ArrowDown'
                ? Math.min(currentIndex + 1, items.length - 1)
                : Math.max(currentIndex - 1, 0);

            if (nextIndex !== currentIndex) {
                const nextKey = keyExtractor(items[nextIndex]);
                // Focus the next/previous accordion item
                const nextElement = document.querySelector(`[data-accordion-key="${nextKey}"]`) as HTMLElement;
                if (nextElement) {
                    nextElement.focus();
                }
            }
        }
    }, [items, keyExtractor, toggleExpansion]);

    // Simplified expanded state management - only reset when items change significantly
    useEffect(() => {
        if (!isInitialized) return;
        
        if (items.length === 0) {
            setExpandedItem(null);
        } else if (expandedItem !== null) {
            // Check if currently expanded item still exists
            const expandedExists = items.some(item => keyExtractor(item) === expandedItem);
            if (!expandedExists) {
                setExpandedItem(null);
            }
        }
    }, [items, keyExtractor, expandedItem, isInitialized]);

    // Loading state with improved skeleton - no overlay to prevent blur effects
    if (loading || !isInitialized) {
        return (
            <div className={cn('space-y-0.5', className)}>
                {[1, 2, 3].map((i) => (
                    <Card key={i} className="animate-pulse" padding="none">
                        <CardHeader className={cn(
                            // Minimal padding skeleton
                            isMobile ? 'py-0 px-2' : 'py-0 px-3'
                        )}>
                            <div className="flex items-center justify-between min-h-[44px]">
                                <div className="flex items-center gap-3 flex-1">
                                    <div className={cn(
                                        'bg-gray-200 rounded',
                                        isMobile ? 'h-3 w-24' : 'h-4 w-32'
                                    )}></div>
                                    <div className={cn(
                                        'bg-gray-200 rounded-full',
                                        isMobile ? 'h-5 w-16' : 'h-6 w-20'
                                    )}></div>
                                </div>
                                <div className={cn(
                                    'bg-gray-200 rounded',
                                    isMobile ? 'h-2 w-6' : 'h-3 w-8'
                                )}></div>
                            </div>
                        </CardHeader>
                    </Card>
                ))}
                {/* Simple loading indicator without overlay */}
                {loading && (
                    <div className="flex items-center justify-center py-2">
                        <div className="flex items-center space-x-2 text-gray-500">
                            <div className="h-3 w-3 animate-spin rounded-full border-2 border-gray-300 border-t-primary-600"></div>
                            <span className="text-xs">Loading...</span>
                        </div>
                    </div>
                )}
            </div>
        );
    }

    // Error state
    if (error) {
        return (
            <div className={cn('p-4 bg-red-50 border border-red-200 rounded-lg', className)}>
                <div className="text-red-800 text-sm font-medium mb-1">Error</div>
                <div className="text-red-700 text-sm">{error}</div>
            </div>
        );
    }

    // Empty state
    if (items.length === 0) {
        return (
            <div className={className}>
                <EmptyState title={emptyMessage} />
            </div>
        );
    }

    return (
        <div className={cn('space-y-0.5', className)}>
            {items.map((item) => {
                const itemKey = keyExtractor(item);
                const isExpanded = expandedItem === itemKey;

                return (
                    <Card
                        key={itemKey}
                        variant="interactive"
                        padding="none"
                        className={cn(
                            // Enhanced touch interactions and transitions
                            'cursor-pointer transition-all duration-300 ease-in-out',
                            CARD_STYLES.hover,
                            CARD_STYLES.active,
                            // Better touch feedback with scale and shadow
                            'touch:active:scale-[0.98] touch:transition-all touch:duration-150',
                            'touch:hover:shadow-md',
                            // Enhanced expanded state styling
                            isExpanded && 'ring-2 ring-primary-300 shadow-lg transform',
                            // Better mobile tap highlighting
                            'touch:select-none touch:tap-highlight-transparent'
                        )}
                        onClick={() => toggleExpansion(itemKey)}
                        role="button"
                        tabIndex={0}
                        data-accordion-key={itemKey}
                        onKeyDown={(e) => handleKeyDown(e, itemKey)}
                        aria-expanded={isExpanded}
                        aria-controls={`accordion-content-${itemKey}`}
                    >
                        <CardHeader className={cn(
                            'hover:bg-gray-50/50 transition-colors duration-200',
                            'touch:active:bg-gray-100/70 touch:transition-colors touch:duration-100',
                            // Enhanced mobile padding for better touch targets
                            isMobile ? 'py-1 px-3' : isTablet ? 'py-1 px-4' : 'py-1 px-4',
                            // Remove default header spacing for compact accordion
                            'mb-0'
                        )}>
                            <div className={cn(
                                'flex items-center justify-between',
                                // Enhanced touch target sizes
                                'min-h-[44px] touch:min-h-[48px]',
                                // Better spacing on mobile
                                isMobile && 'py-1'
                            )}>
                                <div className="flex items-center gap-3 flex-1 min-w-0">
                                    <div className="flex-1 min-w-0 overflow-hidden">
                                        <div className="w-full overflow-hidden">
                                            {renderSummary(item)}
                                        </div>
                                    </div>
                                </div>
                                <div className={cn(
                                    'transition-all duration-300 ease-in-out ml-3 flex-shrink-0',
                                    // Enhanced touch target with better padding
                                    'touch:p-2 touch:-m-2 touch:rounded-full',
                                    'touch:active:bg-gray-200/50',
                                    isMobile ? 'text-xs' : 'text-sm',
                                    isExpanded
                                        ? 'rotate-180 text-primary-600'
                                        : 'text-gray-400 hover:text-gray-600'
                                )}>
                                    <svg
                                        width={isMobile ? "12" : "14"}
                                        height={isMobile ? "12" : "14"}
                                        viewBox="0 0 12 12"
                                        fill="currentColor"
                                        className="transition-colors duration-200"
                                    >
                                        <path d="M6 8L2 4h8L6 8z" />
                                    </svg>
                                </div>
                            </div>
                        </CardHeader>

                        {/* Expanded content with smooth animation */}
                        {isExpanded && (
                            <div
                                id={`accordion-content-${itemKey}`}
                                className={cn(
                                    'overflow-hidden transition-all duration-300 ease-in-out',
                                    'animate-in slide-in-from-top-2',
                                    // Better mobile scrolling
                                    'touch:overflow-y-auto touch:scroll-smooth'
                                )}
                                aria-hidden={false}
                                style={{
                                    // Ensure proper touch scrolling on iOS
                                    WebkitOverflowScrolling: 'touch'
                                }}
                            >
                                <CardContent className={cn(
                                    'pt-0 border-t border-gray-200',
                                    // Enhanced padding for better mobile experience
                                    isMobile ? 'pb-3 px-3' : isTablet ? 'pb-4 px-4' : 'pb-4 px-4'
                                )}>
                                    {renderDetails(item)}
                                </CardContent>
                            </div>
                        )}
                    </Card>
                );
            })}
        </div>
    );
}