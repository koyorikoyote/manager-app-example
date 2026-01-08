import React from 'react';
import { cn } from '../../utils/cn';
import { Skeleton, SkeletonAvatar } from './SkeletonLoader';
import { useResponsive } from '../../hooks/useResponsive';

// Company header skeleton for both mobile and desktop layouts
export const CompanyHeaderSkeleton: React.FC<{ className?: string }> = ({ className }) => {
    const { isMobile, isTablet, isDesktop, isLargeDesktop } = useResponsive();

    if (isMobile || isTablet) {
        return (
            <div className={cn('bg-white border-b border-gray-200 p-4 safe-area-inset', className)}>
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
        );
    }

    return (
        <div className={cn('space-y-6', className)}>
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
    );
};

// Job information tab skeleton
export const JobInformationTabSkeleton: React.FC<{ className?: string }> = ({ className }) => {
    const { isMobile, isTablet } = useResponsive();

    const renderFieldSection = (fieldsCount: number) => (
        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
            <Skeleton className="h-5 w-48 mb-4" />
            <div className={cn(
                'grid gap-4',
                isMobile ? 'grid-cols-1' : isTablet ? 'grid-cols-2' : 'grid-cols-3'
            )}>
                {Array.from({ length: fieldsCount }).map((_, index) => (
                    <div key={index} className="space-y-2">
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-10 w-full" />
                    </div>
                ))}
            </div>
        </div>
    );

    return (
        <div className={cn('space-y-6', className)}>
            {renderFieldSection(12)} {/* Basic company fields */}
            {renderFieldSection(7)}  {/* Preferred candidate fields */}
            {renderFieldSection(4)}  {/* Destination work fields */}
            {renderFieldSection(2)}  {/* Job selection fields */}
            {renderFieldSection(12)} {/* Employment terms fields */}
        </div>
    );
};

// Company interaction tab skeleton
export const CompanyInteractionTabSkeleton: React.FC<{ className?: string }> = ({ className }) => (
    <div className={cn('space-y-4', className)}>
        <div className="flex justify-between items-center">
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-4 w-16" />
        </div>
        <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
                <div key={i} className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                            <Skeleton className="h-4 w-20" />
                            <Skeleton className="h-5 w-16 rounded-full" />
                        </div>
                        <Skeleton className="h-3 w-32" />
                    </div>
                </div>
            ))}
        </div>
    </div>
);

// Company procedures tab skeleton
export const CompanyProceduresTabSkeleton: React.FC<{ className?: string }> = ({ className }) => (
    <div className={cn('space-y-4', className)}>
        <div className="flex justify-between items-center">
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-4 w-20" />
        </div>
        <div className="space-y-3">
            {[1, 2, 3].map((i) => (
                <div key={i} className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                            <Skeleton className="h-4 w-32" />
                            <Skeleton className="h-5 w-20 rounded-full" />
                            <Skeleton className="h-5 w-24 rounded-full" />
                        </div>
                        <Skeleton className="h-3 w-16" />
                    </div>
                </div>
            ))}
        </div>
    </div>
);

// Complete company detail page skeleton
export const CompanyDetailPageSkeleton: React.FC<{ className?: string }> = ({ className }) => {
    const { isDesktop, isLargeDesktop } = useResponsive();
    const isWebView = isDesktop || isLargeDesktop;

    if (isWebView) {
        return (
            <div className={cn('flex gap-6 h-full', className)}>
                {/* Left sidebar skeleton */}
                <div className="w-80 flex-shrink-0">
                    <div className="bg-gray-50 p-6 rounded-lg sticky top-6">
                        <CompanyHeaderSkeleton />
                    </div>
                </div>

                {/* Main content skeleton */}
                <div className="flex-1 min-h-0">
                    <div className="flex flex-col h-full bg-white rounded-lg shadow-sm border border-gray-200">
                        {/* Tab navigation skeleton */}
                        <div className="border-b border-gray-200 bg-white px-6 py-4">
                            <div className="flex gap-2">
                                {[1, 2, 3].map((i) => (
                                    <Skeleton key={i} className="h-10 w-32 rounded-lg" />
                                ))}
                            </div>
                        </div>

                        {/* Tab content skeleton */}
                        <div className="flex-1 bg-gray-50 p-6">
                            <JobInformationTabSkeleton />
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className={cn('flex flex-col h-full safe-area-inset', className)}>
            {/* Mobile header skeleton */}
            <CompanyHeaderSkeleton />

            {/* Mobile tabbed interface skeleton */}
            <div className="flex-1 min-h-0 overflow-hidden">
                <div className="flex flex-col h-full bg-white rounded-lg shadow-sm border border-gray-200">
                    {/* Mobile tab navigation skeleton */}
                    <div className="border-b border-gray-200 bg-white px-4 py-3">
                        <div className="flex gap-2 overflow-x-auto scrollbar-hide">
                            {[1, 2, 3].map((i) => (
                                <Skeleton key={i} className="h-10 w-24 rounded-lg flex-shrink-0" />
                            ))}
                        </div>
                    </div>

                    {/* Mobile tab content skeleton */}
                    <div className="flex-1 bg-gray-50 p-3">
                        <JobInformationTabSkeleton />
                    </div>
                </div>
            </div>
        </div>
    );
};