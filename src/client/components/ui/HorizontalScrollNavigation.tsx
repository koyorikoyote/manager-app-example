import React, { useRef, useState, useEffect } from 'react';
import { ChevronLeftIcon, ChevronRightIcon } from 'lucide-react';
import { Button } from './Button';
import { cn } from '../../utils/cn';

interface HorizontalScrollNavigationProps {
    children: React.ReactNode;
    className?: string;
    showButtons?: boolean;
    buttonClassName?: string;
}

export const HorizontalScrollNavigation: React.FC<HorizontalScrollNavigationProps> = ({
    children,
    className,
    showButtons = true,
    buttonClassName,
}) => {
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const [canScrollLeft, setCanScrollLeft] = useState(false);
    const [canScrollRight, setCanScrollRight] = useState(false);
    const [isScrolling, setIsScrolling] = useState(false);

    const checkScrollability = () => {
        const container = scrollContainerRef.current;
        if (!container) return;

        const { scrollLeft, scrollWidth, clientWidth } = container;
        setCanScrollLeft(scrollLeft > 0);
        setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 1);
    };

    useEffect(() => {
        checkScrollability();

        const container = scrollContainerRef.current;
        if (!container) return;

        const handleScroll = () => {
            checkScrollability();
        };

        const handleResize = () => {
            checkScrollability();
        };

        container.addEventListener('scroll', handleScroll, { passive: true });
        window.addEventListener('resize', handleResize);

        return () => {
            container.removeEventListener('scroll', handleScroll);
            window.removeEventListener('resize', handleResize);
        };
    }, []);

    const scrollLeft = () => {
        const container = scrollContainerRef.current;
        if (!container) return;

        setIsScrolling(true);
        const scrollAmount = container.clientWidth * 0.8;
        container.scrollBy({
            left: -scrollAmount,
            behavior: 'smooth',
        });

        setTimeout(() => setIsScrolling(false), 300);
    };

    const scrollRight = () => {
        const container = scrollContainerRef.current;
        if (!container) return;

        setIsScrolling(true);
        const scrollAmount = container.clientWidth * 0.8;
        container.scrollBy({
            left: scrollAmount,
            behavior: 'smooth',
        });

        setTimeout(() => setIsScrolling(false), 300);
    };

    return (
        <div className="relative">
            {/* Left scroll button */}
            {showButtons && canScrollLeft && (
                <div className="absolute left-0 top-0 bottom-0 z-20 flex items-center">
                    <div className="bg-gradient-to-r from-white via-white to-transparent w-16 h-full absolute" />
                    <Button
                        variant="outline"
                        size="icon"
                        className={cn(
                            'relative ml-2 h-8 w-8 rounded-full bg-white shadow-md border-neutral-200 hover:bg-neutral-50 hover:border-neutral-300 transition-all duration-200',
                            isScrolling && 'scale-95',
                            buttonClassName
                        )}
                        onClick={scrollLeft}
                        disabled={isScrolling}
                        aria-label="Scroll left"
                    >
                        <ChevronLeftIcon className="h-4 w-4 text-neutral-600" />
                    </Button>
                </div>
            )}

            {/* Right scroll button */}
            {showButtons && canScrollRight && (
                <div className="absolute right-0 top-0 bottom-0 z-20 flex items-center">
                    <div className="bg-gradient-to-l from-white via-white to-transparent w-16 h-full absolute" />
                    <Button
                        variant="outline"
                        size="icon"
                        className={cn(
                            'relative mr-2 h-8 w-8 rounded-full bg-white shadow-md border-neutral-200 hover:bg-neutral-50 hover:border-neutral-300 transition-all duration-200',
                            isScrolling && 'scale-95',
                            buttonClassName
                        )}
                        onClick={scrollRight}
                        disabled={isScrolling}
                        aria-label="Scroll right"
                    >
                        <ChevronRightIcon className="h-4 w-4 text-neutral-600" />
                    </Button>
                </div>
            )}

            {/* Scroll container */}
            <div
                ref={scrollContainerRef}
                className={cn(
                    'overflow-x-auto scrollbar-hide',
                    className
                )}
                style={{
                    scrollbarWidth: 'none',
                    msOverflowStyle: 'none',
                }}
            >
                <style>{`
          .scrollbar-hide::-webkit-scrollbar {
            display: none;
          }
        `}</style>
                {children}
            </div>

            {/* Scroll indicators */}
            {showButtons && (
                <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 flex space-x-1 z-10">
                    {canScrollLeft && (
                        <div className="w-2 h-2 rounded-full bg-neutral-300" />
                    )}
                    {canScrollRight && (
                        <div className="w-2 h-2 rounded-full bg-neutral-300" />
                    )}
                </div>
            )}
        </div>
    );
};