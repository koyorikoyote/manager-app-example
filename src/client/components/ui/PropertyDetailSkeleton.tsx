import React from 'react';
import { cn } from '../../utils/cn';
import { Skeleton, SkeletonAvatar } from './SkeletonLoader';
import { useResponsive } from '../../hooks/useResponsive';

export const PropertyDetailSkeleton: React.FC<{ className?: string }> = ({ className }) => {
    const { isMobile, isTablet } = useResponsive();

    // Mobile/Tablet layout: photo on left, info on right (full width with border)
    if (isMobile || isTablet) {
        return (
            <div className={cn('space-y-6', className)}>
                {/* Header section for mobile/tablet */}
                <div className="bg-white border-b border-gray-200 p-4 safe-area-inset">
                    <div className={cn('flex items-start', isMobile ? 'space-x-3' : 'space-x-4')}>
                        <SkeletonAvatar size={isMobile ? 'default' : 'lg'} />
                        <div className="flex-1 min-w-0 space-y-2">
                            <Skeleton className="h-5 w-3/4" />
                            <Skeleton className="h-4 w-1/2" />
                            <Skeleton className="h-3 w-2/3" />
                            <Skeleton className="h-3 w-1/3" />
                        </div>
                    </div>
                </div>

                {/* Tabbed interface skeleton */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                    {/* Tab navigation skeleton */}
                    <div className="border-b border-gray-200 bg-white px-4 py-3">
                        <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
                            {Array.from({ length: 3 }).map((_, index) => (
                                <Skeleton key={index} className={cn(
                                    'h-10 rounded-lg flex-shrink-0',
                                    isMobile ? 'w-20' : 'w-24'
                                )} />
                            ))}
                        </div>
                    </div>

                    {/* Tab content skeleton */}
                    <div className="p-3 space-y-4">
                        {Array.from({ length: 3 }).map((_, sectionIndex) => (
                            <div key={sectionIndex} className="bg-white rounded-lg border border-gray-200 p-4">
                                <Skeleton className="h-5 w-32 mb-4" />
                                <div className="grid grid-cols-1 gap-4">
                                    {Array.from({ length: 4 }).map((_, fieldIndex) => (
                                        <div key={fieldIndex} className="space-y-2">
                                            <Skeleton className="h-4 w-24" />
                                            <Skeleton className="h-10 w-full" />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    // Desktop sidebar layout: photo above name, no background/border (handled by parent)
    return (
        <div className={cn('flex flex-col lg:flex-row lg:gap-6 lg:h-[calc(100vh-200px)]', className)}>
            {/* Left Sidebar Skeleton */}
            <div className="lg:w-80 lg:flex-shrink-0 lg:bg-white lg:rounded-lg lg:shadow-sm lg:border lg:border-gray-200 lg:p-6 lg:h-fit lg:sticky lg:top-6">
                <div className="space-y-6">
                    <div className="flex flex-col items-center text-center">
                        <SkeletonAvatar size="lg" className="mb-4" />
                        <div className="w-full space-y-3">
                            <Skeleton className="h-6 w-3/4 mx-auto" />
                            <Skeleton className="h-4 w-1/2 mx-auto" />
                            <Skeleton className="h-4 w-2/3 mx-auto" />
                            <Skeleton className="h-4 w-1/3 mx-auto" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Right Content Skeleton - Tabbed Interface */}
            <div className="flex-1 lg:min-w-0 mt-6 lg:mt-0">
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 h-full flex flex-col">
                    {/* Tab navigation skeleton */}
                    <div className="border-b border-gray-200 bg-white sticky top-0 z-10 px-6 py-4">
                        <div className="flex gap-2 flex-wrap">
                            {Array.from({ length: 3 }).map((_, index) => (
                                <Skeleton key={index} className="h-10 w-32 rounded-lg" />
                            ))}
                        </div>
                    </div>

                    {/* Tab content skeleton */}
                    <div className="flex-1 bg-gray-50 overflow-y-auto p-6 space-y-6">
                        {Array.from({ length: 4 }).map((_, sectionIndex) => (
                            <div key={sectionIndex} className="bg-white rounded-lg border border-gray-200 p-4">
                                <Skeleton className="h-5 w-48 mb-4" />
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {Array.from({ length: 6 }).map((_, fieldIndex) => (
                                        <div key={fieldIndex} className="space-y-2">
                                            <Skeleton className="h-4 w-24" />
                                            <Skeleton className="h-10 w-full" />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};