/**
 * ViewModeToggle Component
 * 
 * Provides a toggle control for switching between table and card view modes
 * in list pages. Integrates with the DataTable implementation to allow users
 * to choose their preferred data visualization format.
 * 
 * Mobile-specific behavior:
 * - Shows 'Card' option first, then 'Table' option on mobile
 * - Defaults to card mode on mobile view
 * - Stores view mode preference in session storage for mobile users
 * - Smooth transitions between view modes without layout flashing
 * - Touch-friendly interactions with minimum 44px touch targets
 */
import React from 'react';
import { List, Grid } from 'lucide-react';
import { Button } from './Button';
import { cn } from '../../utils/cn';
import { useLanguage } from '../../contexts/LanguageContext';
import { useResponsive } from '../../hooks/useResponsive';
import { getTouchFriendlySize } from '../../utils/responsiveUtils';

/** Available view modes for data display */
export type ViewMode = 'table' | 'cards';

/** Props for the ViewModeToggle component */
interface ViewModeToggleProps {
    /** Current active view mode */
    mode: ViewMode;
    /** Callback when view mode changes */
    onChange: (mode: ViewMode) => void;
    /** Additional CSS classes */
    className?: string;
}

/**
 * ViewModeToggle component for switching between table and card views
 * 
 * @param props - Component props
 * @returns Rendered toggle component
 */
export const ViewModeToggle: React.FC<ViewModeToggleProps> = ({
    mode,
    onChange,
    className,
}) => {
    const { t } = useLanguage();
    const { isMobile, isTablet } = useResponsive();

    // Define button order based on mobile/desktop view (mobile-first approach)
    const buttonOrder = (isMobile || isTablet) ? ['cards', 'table'] : ['table', 'cards'];

    // Get touch-friendly sizing for mobile devices
    const touchSize = getTouchFriendlySize(isMobile || isTablet, 32);

    const renderButton = (viewMode: ViewMode) => {
        const isActive = mode === viewMode;
        const isCards = viewMode === 'cards';

        const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
            // Don't prevent default on mobile as it might interfere with touch events
            if (!isMobile && !isTablet) {
                e.preventDefault();
            }
            e.stopPropagation();

            try {
                onChange(viewMode);
            } catch (error) {
                console.error('Error changing view mode:', error);
            }
        };

        const handleTouchStart = (e: React.TouchEvent<HTMLButtonElement>) => {
            // Ensure touch events work properly on mobile
            e.stopPropagation();
        };

        return (
            <Button
                key={viewMode}
                variant={isActive ? 'default' : 'ghost'}
                size="sm"
                onClick={handleClick}
                onTouchStart={handleTouchStart}
                className={cn(
                    'text-xs transition-all duration-200 ease-in-out cursor-pointer',
                    // Touch-friendly sizing on mobile
                    isMobile || isTablet ? `min-h-[${touchSize}px] min-w-[${touchSize}px] px-3` : 'h-8 px-3',
                    isActive
                        ? 'bg-primary-500 text-white shadow-sm'
                        : 'text-secondary-600 hover:text-secondary-900 hover:bg-secondary-50',
                    // Ensure proper touch interaction on mobile
                    (isMobile || isTablet) && 'touch-manipulation select-none'
                )}
                style={{
                    minHeight: (isMobile || isTablet) ? `${touchSize}px` : undefined,
                    minWidth: (isMobile || isTablet) ? `${touchSize}px` : undefined,
                    touchAction: (isMobile || isTablet) ? 'manipulation' : undefined,
                }}
                // Add mobile-specific attributes
                {...((isMobile || isTablet) && {
                    'data-testid': `view-mode-${viewMode}`,
                    role: 'button',
                    tabIndex: 0,
                })}
            >
                {isCards ? (
                    <Grid className={cn('mr-1', (isMobile || isTablet) ? 'h-5 w-5' : 'h-4 w-4')} />
                ) : (
                    <List className={cn('mr-1', (isMobile || isTablet) ? 'h-5 w-5' : 'h-4 w-4')} />
                )}
                {t(isCards ? 'common.viewMode.cards' : 'common.viewMode.table')}
            </Button>
        );
    };

    return (
        <div
            className={cn(
                'flex items-center rounded-lg border border-secondary-200 p-1 transition-all duration-200 ease-in-out',
                // Enhanced mobile styling
                (isMobile || isTablet) && 'shadow-mobile bg-white',
                className
            )}
            style={{
                // Ensure container doesn't block pointer events
                pointerEvents: 'auto',
                // Prevent any potential z-index issues
                position: 'relative',
                zIndex: 1,
            }}
        >
            {buttonOrder.map(viewMode => renderButton(viewMode as ViewMode))}
        </div>
    );
};