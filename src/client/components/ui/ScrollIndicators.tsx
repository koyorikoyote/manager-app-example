import React from 'react';
import { cn } from '../../utils/cn';

interface ScrollIndicatorsProps {
    scrollRef: React.RefObject<HTMLElement | null>;
    className?: string;
}

export const ScrollIndicators: React.FC<ScrollIndicatorsProps> = ({
    scrollRef,
    className,
}) => {
    const [showTopIndicator, setShowTopIndicator] = React.useState(false);
    const [showBottomIndicator, setShowBottomIndicator] = React.useState(false);

    React.useEffect(() => {
        const element = scrollRef.current;
        if (!element) return;

        const updateIndicators = () => {
            const { scrollTop, scrollHeight, clientHeight } = element;

            // Show top indicator if scrolled down from top
            setShowTopIndicator(scrollTop > 10);

            // Show bottom indicator if not at bottom
            setShowBottomIndicator(scrollTop < scrollHeight - clientHeight - 10);
        };

        // Initial check
        updateIndicators();

        // Listen for scroll events
        element.addEventListener('scroll', updateIndicators, { passive: true });

        // Listen for resize events that might change scroll state
        const resizeObserver = new ResizeObserver(updateIndicators);
        resizeObserver.observe(element);

        return () => {
            element.removeEventListener('scroll', updateIndicators);
            resizeObserver.disconnect();
        };
    }, [scrollRef]);

    return (
        <>
            {/* Top scroll indicator */}
            <div
                className={cn(
                    'absolute top-0 left-0 right-0 h-2 pointer-events-none z-20 transition-opacity duration-300',
                    'bg-gradient-to-b from-white via-white/80 to-transparent',
                    showTopIndicator ? 'opacity-100' : 'opacity-0',
                    className
                )}
            />

            {/* Bottom scroll indicator */}
            <div
                className={cn(
                    'absolute bottom-0 left-0 right-0 h-2 pointer-events-none z-20 transition-opacity duration-300',
                    'bg-gradient-to-t from-white via-white/80 to-transparent',
                    showBottomIndicator ? 'opacity-100' : 'opacity-0',
                    className
                )}
            />
        </>
    );
};

// Hook for managing scroll indicators
export const useScrollIndicators = (scrollRef: React.RefObject<HTMLElement | null>) => {
    const [canScrollUp, setCanScrollUp] = React.useState(false);
    const [canScrollDown, setCanScrollDown] = React.useState(false);
    const [isScrolling, setIsScrolling] = React.useState(false);

    React.useEffect(() => {
        const element = scrollRef.current;
        if (!element) return;

        let scrollTimeout: NodeJS.Timeout;

        const updateScrollState = () => {
            const { scrollTop, scrollHeight, clientHeight } = element;

            setCanScrollUp(scrollTop > 0);
            setCanScrollDown(scrollTop < scrollHeight - clientHeight);

            // Track scrolling state
            setIsScrolling(true);
            clearTimeout(scrollTimeout);
            scrollTimeout = setTimeout(() => {
                setIsScrolling(false);
            }, 150);
        };

        // Initial check
        updateScrollState();

        // Listen for scroll events
        element.addEventListener('scroll', updateScrollState, { passive: true });

        // Listen for resize events
        const resizeObserver = new ResizeObserver(updateScrollState);
        resizeObserver.observe(element);

        return () => {
            element.removeEventListener('scroll', updateScrollState);
            resizeObserver.disconnect();
            clearTimeout(scrollTimeout);
        };
    }, [scrollRef]);

    return {
        canScrollUp,
        canScrollDown,
        isScrolling,
    };
};