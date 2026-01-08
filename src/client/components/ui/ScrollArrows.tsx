import React from 'react';
import { ChevronLeftIcon, ChevronRightIcon } from 'lucide-react';
import { cn } from '../../utils/cn';
import { useLanguage } from '../../contexts/LanguageContext';
import { useResponsive } from '../../hooks/useResponsive';

interface ScrollArrowsProps {
    canScrollLeft: boolean;
    canScrollRight: boolean;
    onScrollLeft: () => void;
    onScrollRight: () => void;
    className?: string;
}

export const ScrollArrows: React.FC<ScrollArrowsProps> = ({
    canScrollLeft,
    canScrollRight,
    onScrollLeft,
    onScrollRight,
    className
}) => {
    const { t } = useLanguage();
    const { isMobile } = useResponsive();

    if (!canScrollLeft && !canScrollRight && !isMobile) {
        return null;
    }

    return (
        <>
            <style>{`
                .scroll-nav-button {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    width: ${isMobile ? '32px' : '24px'};
                    height: ${isMobile ? '32px' : '24px'};
                    background: #ffffff;
                    border: 1px solid #d1d5db;
                    border-radius: 4px;
                    cursor: pointer;
                    transition: all 0.15s ease;
                    color: #6b7280;
                    touch-action: manipulation;
                }
                
                .scroll-nav-button:hover:not(:disabled) {
                    background: #f9fafb;
                    border-color: #9ca3af;
                    color: #374151;
                }
                
                .scroll-nav-button:active:not(:disabled) {
                    background: #f3f4f6;
                    transform: translateY(1px);
                }
                
                .scroll-nav-button:disabled {
                    opacity: 0.5;
                    cursor: not-allowed;
                    background: #f9fafb;
                    color: #d1d5db;
                }
            `}</style>
            <div className={cn("inline-flex items-center gap-1 px-2 py-1 bg-neutral-50 border border-neutral-200 rounded-md", className)}>
                <button
                    className="scroll-nav-button"
                    onClick={onScrollLeft}
                    disabled={!canScrollLeft}
                    title={t('datatable.scrollLeft') || 'Scroll left to see previous columns'}
                    aria-label={t('datatable.scrollLeft') || 'Scroll table left'}
                >
                    <ChevronLeftIcon className={cn(isMobile ? 'h-5 w-5' : 'h-4 w-4')} />
                </button>
                <button
                    className="scroll-nav-button"
                    onClick={onScrollRight}
                    disabled={!canScrollRight}
                    title={t('datatable.scrollRight') || 'Scroll right to see more columns'}
                    aria-label={t('datatable.scrollRight') || 'Scroll table right'}
                >
                    <ChevronRightIcon className={cn(isMobile ? 'h-5 w-5' : 'h-4 w-4')} />
                </button>
            </div>
        </>
    );
};