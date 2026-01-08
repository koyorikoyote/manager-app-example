import React, { ReactNode } from 'react';
import { RefreshCw } from 'lucide-react';
import { usePullToRefresh } from '../../hooks/useTouch';
import { cn } from '../../utils/cn';

interface PullToRefreshProps {
  children: ReactNode;
  onRefresh: () => Promise<void> | void;
  refreshThreshold?: number;
  className?: string;
  disabled?: boolean;
}

export const PullToRefresh: React.FC<PullToRefreshProps> = ({
  children,
  onRefresh,
  refreshThreshold = 60,
  className,
  disabled = false,
}) => {
  const { bindPullToRefresh, isRefreshing, pullDistance } = usePullToRefresh(onRefresh);

  const refreshProgress = Math.min(pullDistance / refreshThreshold, 1);
  const shouldShowRefreshIndicator = pullDistance > 10;
  const isReadyToRefresh = pullDistance >= refreshThreshold;

  return (
    <div
      className={cn('relative overflow-hidden', className)}
      {...(!disabled ? bindPullToRefresh : {})}
    >
      {/* Pull to Refresh Indicator */}
      <div
        className={cn(
          'absolute top-0 left-0 right-0 flex items-center justify-center transition-all duration-200 z-10',
          'bg-gradient-to-b from-primary-50 to-transparent',
          shouldShowRefreshIndicator ? 'opacity-100' : 'opacity-0'
        )}
        style={{
          height: `${Math.max(pullDistance * 0.8, 0)}px`,
          transform: `translateY(${Math.max(pullDistance - 60, -60)}px)`,
        }}
      >
        <div className="flex flex-col items-center space-y-2 py-4">
          <div
            className={cn(
              'transition-all duration-200',
              isRefreshing ? 'animate-spin' : '',
              isReadyToRefresh ? 'text-primary-600 scale-110' : 'text-primary-400'
            )}
            style={{
              transform: `rotate(${refreshProgress * 180}deg)`,
            }}
          >
            <RefreshCw className="h-6 w-6" />
          </div>
          
          <div className="text-center">
            <p className={cn(
              'text-sm font-medium transition-colors duration-200',
              isReadyToRefresh ? 'text-primary-700' : 'text-primary-500'
            )}>
              {isRefreshing 
                ? 'Refreshing...' 
                : isReadyToRefresh 
                  ? 'Release to refresh' 
                  : 'Pull to refresh'
              }
            </p>
            
            {/* Progress indicator */}
            <div className="w-16 h-1 bg-primary-200 rounded-full mt-2 overflow-hidden">
              <div
                className="h-full bg-primary-500 transition-all duration-100 rounded-full"
                style={{ width: `${refreshProgress * 100}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div
        className="transition-transform duration-200"
        style={{
          transform: `translateY(${Math.max(pullDistance * 0.3, 0)}px)`,
        }}
      >
        {children}
      </div>

      {/* Loading overlay when refreshing */}
      {isRefreshing && (
        <div className="absolute top-0 left-0 right-0 h-1 bg-primary-200 overflow-hidden z-20">
          <div className="h-full bg-primary-500 animate-pulse" />
        </div>
      )}
    </div>
  );
};