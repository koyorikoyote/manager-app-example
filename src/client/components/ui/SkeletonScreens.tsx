import React from 'react';
import { cn } from '../../utils/cn';
import {
  Skeleton,
  SkeletonText,
  SkeletonAvatar,
  SkeletonButton,
  SkeletonList,
  SkeletonTable
} from './SkeletonLoader';
import { Card, CardContent, CardHeader } from './Card';

// Dashboard skeleton screen
export const DashboardSkeleton: React.FC<{ className?: string }> = ({ className }) => (
  <div className={cn('mobile-spacing mobile-container', className)}>
    {/* Header skeleton */}
    <div className="mobile-spacing">
      <Skeleton className="h-8 w-48 mb-2" />
      <Skeleton className="h-4 w-64" />
    </div>

    {/* Dashboard cards skeleton */}
    <div className="grid grid-cols-1 gap-4 md:gap-6 max-w-md mx-auto">
      {Array.from({ length: 4 }).map((_, index) => (
        <Card key={index} className="mobile-card">
          <CardContent className="flex flex-col items-center justify-center p-4 md:p-6 text-center space-y-3 md:space-y-4 min-h-[140px] md:min-h-[160px]">
            <SkeletonAvatar size="lg" />
            <div className="space-y-2 w-full">
              <Skeleton className="h-5 w-3/4 mx-auto" />
              <div className="flex items-center justify-center space-x-2">
                <Skeleton className="h-6 w-12" />
                <Skeleton className="h-4 w-16" />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>

    {/* Recent activity skeleton */}
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card className="mobile-card">
        <CardHeader>
          <Skeleton className="h-6 w-32" />
        </CardHeader>
        <CardContent className="mobile-spacing">
          <SkeletonList items={3} showAvatar />
        </CardContent>
      </Card>

      <Card className="mobile-card">
        <CardHeader>
          <Skeleton className="h-6 w-28" />
        </CardHeader>
        <CardContent className="mobile-spacing space-y-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="flex justify-between items-center">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-8" />
            </div>
          ))}
          <SkeletonButton className="w-full mt-4" />
        </CardContent>
      </Card>
    </div>
  </div>
);

// Staff list skeleton screen
export const StaffListSkeleton: React.FC<{ className?: string }> = ({ className }) => (
  <div className={cn('space-y-6', className)}>
    {/* Header with search */}
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
      <div>
        <Skeleton className="h-8 w-32 mb-2" />
        <Skeleton className="h-4 w-48" />
      </div>
      <div className="flex gap-2">
        <SkeletonButton size="sm" />
        <SkeletonButton size="sm" />
      </div>
    </div>

    {/* Filters */}
    <div className="flex flex-wrap gap-4">
      <Skeleton className="h-10 w-32" />
      <Skeleton className="h-10 w-32" />
      <Skeleton className="h-10 w-24" />
    </div>

    {/* Staff cards */}
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: 6 }).map((_, index) => (
        <Card key={index} className="p-6">
          <div className="flex items-start space-x-4">
            <SkeletonAvatar />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-5 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-4 w-2/3" />
            </div>
          </div>
          <div className="mt-4 flex justify-end space-x-2">
            <SkeletonButton size="sm" />
            <SkeletonButton size="sm" />
          </div>
        </Card>
      ))}
    </div>
  </div>
);

// Staff detail skeleton screen
export const StaffDetailSkeleton: React.FC<{ className?: string }> = ({ className }) => (
  <div className={cn('space-y-6', className)}>
    {/* Header */}
    <div className="flex items-center justify-between">
      <div className="flex items-center space-x-4">
        <SkeletonAvatar size="lg" />
        <div>
          <Skeleton className="h-8 w-48 mb-2" />
          <Skeleton className="h-4 w-32" />
        </div>
      </div>
      <div className="flex space-x-2">
        <SkeletonButton />
        <SkeletonButton />
      </div>
    </div>

    {/* Content cards */}
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card className="p-6">
        <Skeleton className="h-6 w-32 mb-4" />
        <div className="space-y-4">
          {Array.from({ length: 5 }).map((_, index) => (
            <div key={index} className="flex justify-between">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-32" />
            </div>
          ))}
        </div>
      </Card>

      <Card className="p-6">
        <Skeleton className="h-6 w-28 mb-4" />
        <div className="space-y-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="flex justify-between">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-28" />
            </div>
          ))}
        </div>
      </Card>
    </div>

    {/* Additional sections */}
    <Card className="p-6">
      <Skeleton className="h-6 w-36 mb-4" />
      <SkeletonTable rows={3} columns={4} />
    </Card>
  </div>
);

// Property list skeleton screen
export const PropertyListSkeleton: React.FC<{ className?: string }> = ({ className }) => (
  <div className={cn('space-y-6', className)}>
    {/* Header */}
    <div className="flex justify-between items-center">
      <div>
        <Skeleton className="h-8 w-36 mb-2" />
        <Skeleton className="h-4 w-52" />
      </div>
      <SkeletonButton />
    </div>

    {/* Filters */}
    <div className="flex flex-wrap gap-4">
      <Skeleton className="h-10 w-40" />
      <Skeleton className="h-10 w-32" />
      <Skeleton className="h-10 w-28" />
    </div>

    {/* Property table */}
    <Card className="p-6">
      <SkeletonTable rows={8} columns={5} />
    </Card>
  </div>
);

// Form skeleton screen
export const FormSkeleton: React.FC<{
  fields?: number;
  className?: string;
}> = ({ fields = 6, className }) => (
  <div className={cn('space-y-6', className)}>
    {/* Header */}
    <div>
      <Skeleton className="h-8 w-48 mb-2" />
      <Skeleton className="h-4 w-64" />
    </div>

    {/* Form fields */}
    <Card className="p-6">
      <div className="space-y-6">
        {Array.from({ length: fields }).map((_, index) => (
          <div key={index} className="space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-10 w-full" />
          </div>
        ))}

        {/* Form actions */}
        <div className="flex justify-end space-x-3 pt-4">
          <SkeletonButton size="default" />
          <SkeletonButton />
        </div>
      </div>
    </Card>
  </div>
);

// Generic page skeleton
export const PageSkeleton: React.FC<{
  showHeader?: boolean;
  showSidebar?: boolean;
  contentRows?: number;
  className?: string;
}> = ({
  showHeader = true,
  showSidebar = false,
  contentRows = 5,
  className
}) => (
    <div className={cn('space-y-6', className)}>
      {showHeader && (
        <div className="flex justify-between items-center">
          <div>
            <Skeleton className="h-8 w-40 mb-2" />
            <Skeleton className="h-4 w-56" />
          </div>
          <SkeletonButton />
        </div>
      )}

      <div className={cn('grid gap-6', showSidebar ? 'grid-cols-1 lg:grid-cols-4' : 'grid-cols-1')}>
        {showSidebar && (
          <div className="lg:col-span-1">
            <Card className="p-4">
              <SkeletonList items={4} />
            </Card>
          </div>
        )}

        <div className={cn(showSidebar ? 'lg:col-span-3' : 'col-span-1')}>
          <Card className="p-6">
            <SkeletonText lines={contentRows} />
          </Card>
        </div>
      </div>
    </div>
  );