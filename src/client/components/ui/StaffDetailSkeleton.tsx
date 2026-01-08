import React from 'react';
import { cn } from '../../utils/cn';
import { useResponsive } from '../../hooks/useResponsive';
import { Card, CardHeader } from './Card';
import { Skeleton, SkeletonAvatar } from './SkeletonLoader';

interface StaffDetailSkeletonProps {
    className?: string;
}

export const StaffDetailSkeleton: React.FC<StaffDetailSkeletonProps> = ({ className }) => {
    const { isMobile, isTablet } = useResponsive();

    return (
        <div className={cn('space-y-6', className)}>
            {/* Header Section Skeleton */}
            <div className={cn(
                'bg-white border-b border-gray-200',
                isMobile || isTablet ? 'p-4' : 'p-6'
            )}>
                {isMobile || isTablet ? (
                    // Mobile layout: photo on left, info on right
                    <div className="flex items-start space-x-4">
                        <SkeletonAvatar size="lg" />
                        <div className="flex-1 min-w-0 space-y-2">
                            <Skeleton className="h-6 w-3/4" />
                            <Skeleton className="h-4 w-1/2" />
                            <Skeleton className="h-4 w-2/3" />
                            <Skeleton className="h-4 w-1/3" />
                        </div>
                    </div>
                ) : (
                    // Desktop layout: photo above name
                    <div className="flex flex-col items-center text-center space-y-4">
                        <SkeletonAvatar size="lg" />
                        <div className="space-y-2">
                            <Skeleton className="h-8 w-48" />
                            <Skeleton className="h-4 w-32" />
                            <Skeleton className="h-4 w-40" />
                        </div>
                    </div>
                )}
            </div>

            {/* Tabbed Interface Skeleton */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                {/* Tab Navigation Skeleton */}
                <div className={cn(
                    'border-b border-gray-200 bg-white',
                    isMobile || isTablet ? 'px-4 py-3' : 'px-6 py-4'
                )}>
                    <div className={cn(
                        'flex gap-2',
                        isMobile && 'overflow-x-auto scrollbar-hide pb-1'
                    )}>
                        {Array.from({ length: 4 }).map((_, index) => (
                            <Skeleton
                                key={index}
                                className={cn(
                                    'rounded-lg',
                                    isMobile ? 'h-8 w-20 flex-shrink-0' :
                                        isTablet ? 'h-9 w-24' :
                                            'h-10 w-32'
                                )}
                            />
                        ))}
                    </div>
                </div>

                {/* Tab Content Skeleton */}
                <div className={cn(
                    'bg-gray-50',
                    isMobile ? 'p-3' : isTablet ? 'p-4' : 'p-6'
                )}>
                    <TabContentSkeleton isMobile={isMobile} isTablet={isTablet} />
                </div>
            </div>
        </div>
    );
};

// Tab content skeleton component
const TabContentSkeleton: React.FC<{ isMobile: boolean; isTablet: boolean }> = ({
    isMobile,
    isTablet
}) => {
    return (
        <div className={cn(
            'space-y-6',
            isMobile ? 'space-y-4' : isTablet ? 'space-y-5' : 'space-y-8'
        )}>
            {/* Section skeletons */}
            {Array.from({ length: 3 }).map((_, sectionIndex) => (
                <div key={sectionIndex} className="space-y-4">
                    {/* Section title */}
                    <div className="border-b border-gray-200 pb-2">
                        <Skeleton className={cn(
                            isMobile ? 'h-5 w-32' : 'h-6 w-40'
                        )} />
                    </div>

                    {/* Section content grid */}
                    <div className={cn(
                        'grid gap-4',
                        isMobile ? 'grid-cols-1' :
                            isTablet ? 'grid-cols-2' :
                                'grid-cols-3'
                    )}>
                        {Array.from({ length: 6 }).map((_, fieldIndex) => (
                            <div key={fieldIndex} className="space-y-1">
                                <Skeleton className={cn(
                                    isMobile ? 'h-3 w-20' : 'h-4 w-24'
                                )} />
                                <Skeleton className={cn(
                                    isMobile ? 'h-4 w-full' : 'h-5 w-full'
                                )} />
                            </div>
                        ))}
                    </div>
                </div>
            ))}

            {/* Array section skeleton (for education/work history) */}
            <div className="space-y-4">
                <div className="border-b border-gray-200 pb-2">
                    <Skeleton className={cn(
                        isMobile ? 'h-5 w-28' : 'h-6 w-36'
                    )} />
                </div>

                {Array.from({ length: 2 }).map((_, itemIndex) => (
                    <div key={itemIndex} className="bg-gray-100 rounded-lg p-4 border border-gray-200">
                        <Skeleton className="h-4 w-24 mb-3" />
                        <div className={cn(
                            'grid gap-3',
                            isMobile ? 'grid-cols-1' : 'grid-cols-2'
                        )}>
                            {Array.from({ length: 4 }).map((_, fieldIndex) => (
                                <div key={fieldIndex} className="space-y-1">
                                    <Skeleton className="h-3 w-16" />
                                    <Skeleton className="h-4 w-full" />
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

// Accordion list skeleton for tabs with dynamic content
export const AccordionListSkeleton: React.FC<{
    items?: number;
    className?: string;
}> = ({ items = 3, className }) => {
    const { isMobile } = useResponsive();

    return (
        <div className={cn('space-y-3', className)}>
            {Array.from({ length: items }).map((_, index) => (
                <Card key={index} className="animate-pulse">
                    <CardHeader className={cn(
                        isMobile ? 'py-2 px-3' : 'py-3'
                    )}>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3 flex-1">
                                <Skeleton className={cn(
                                    isMobile ? 'h-3 w-24' : 'h-4 w-32'
                                )} />
                                <Skeleton className={cn(
                                    'rounded-full',
                                    isMobile ? 'h-5 w-16' : 'h-6 w-20'
                                )} />
                            </div>
                            <Skeleton className={cn(
                                isMobile ? 'h-2 w-6' : 'h-3 w-8'
                            )} />
                        </div>
                    </CardHeader>
                </Card>
            ))}
        </div>
    );
};

// Tab-specific skeleton screens
export const BasicInformationTabSkeleton: React.FC = () => {
    const { isMobile, isTablet } = useResponsive();

    return <TabContentSkeleton isMobile={isMobile} isTablet={isTablet} />;
};

export const DailyRecordTabSkeleton: React.FC = () => (
    <div className="space-y-4">
        <div className="flex justify-between items-center">
            <div>
                <Skeleton className="h-6 w-32 mb-2" />
                <Skeleton className="h-4 w-48" />
            </div>
            <Skeleton className="h-4 w-16" />
        </div>
        <AccordionListSkeleton items={5} />
    </div>
);

export const InteractionTabSkeleton: React.FC = () => (
    <div className="space-y-4">
        <div className="flex justify-between items-center">
            <div>
                <Skeleton className="h-6 w-40 mb-2" />
                <Skeleton className="h-4 w-52" />
            </div>
            <Skeleton className="h-4 w-16" />
        </div>
        <AccordionListSkeleton items={4} />
    </div>
);

export const ProceduresTabSkeleton: React.FC = () => (
    <div className="space-y-4">
        <div className="flex justify-between items-center">
            <div>
                <Skeleton className="h-6 w-44 mb-2" />
                <Skeleton className="h-4 w-56" />
            </div>
            <Skeleton className="h-4 w-16" />
        </div>
        <AccordionListSkeleton items={3} />
    </div>
);