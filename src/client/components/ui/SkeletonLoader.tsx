import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../utils/cn';

const skeletonVariants = cva(
  'animate-pulse bg-gradient-to-r from-secondary-200 via-secondary-100 to-secondary-200 bg-[length:200%_100%] rounded',
  {
    variants: {
      variant: {
        default: 'bg-secondary-200',
        card: 'bg-secondary-100 rounded-xl',
        text: 'bg-secondary-200 rounded-md',
        avatar: 'bg-secondary-200 rounded-full',
        button: 'bg-secondary-200 rounded-lg',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

export interface SkeletonProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof skeletonVariants> {}

const Skeleton = React.forwardRef<HTMLDivElement, SkeletonProps>(
  ({ className, variant, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(skeletonVariants({ variant, className }))}
        {...props}
      />
    );
  }
);

Skeleton.displayName = 'Skeleton';

// Pre-built skeleton components for common use cases
export const SkeletonText: React.FC<{ 
  lines?: number; 
  className?: string;
  lastLineWidth?: string;
}> = ({ 
  lines = 3, 
  className,
  lastLineWidth = 'w-3/4'
}) => (
  <div className={cn('space-y-2', className)}>
    {Array.from({ length: lines }).map((_, index) => (
      <Skeleton
        key={index}
        variant="text"
        className={cn(
          'h-4',
          index === lines - 1 ? lastLineWidth : 'w-full'
        )}
      />
    ))}
  </div>
);

export const SkeletonCard: React.FC<{ className?: string }> = ({ className }) => (
  <Skeleton
    variant="card"
    className={cn('h-32 w-full p-6', className)}
  >
    <div className="space-y-3">
      <Skeleton variant="text" className="h-4 w-3/4" />
      <Skeleton variant="text" className="h-4 w-1/2" />
      <Skeleton variant="text" className="h-4 w-2/3" />
    </div>
  </Skeleton>
);

export const SkeletonAvatar: React.FC<{ 
  size?: 'sm' | 'default' | 'lg';
  className?: string;
}> = ({ size = 'default', className }) => {
  const sizeClasses = {
    sm: 'h-8 w-8',
    default: 'h-12 w-12',
    lg: 'h-16 w-16',
  };

  return (
    <Skeleton
      variant="avatar"
      className={cn(sizeClasses[size], className)}
    />
  );
};

export const SkeletonButton: React.FC<{ 
  size?: 'sm' | 'default' | 'lg';
  className?: string;
}> = ({ size = 'default', className }) => {
  const sizeClasses = {
    sm: 'h-10 w-20',
    default: 'h-12 w-24',
    lg: 'h-14 w-28',
  };

  return (
    <Skeleton
      variant="button"
      className={cn(sizeClasses[size], className)}
    />
  );
};

export const SkeletonTable: React.FC<{ 
  rows?: number;
  columns?: number;
  className?: string;
}> = ({ rows = 5, columns = 4, className }) => (
  <div className={cn('space-y-3', className)}>
    {/* Header */}
    <div className="flex space-x-4">
      {Array.from({ length: columns }).map((_, index) => (
        <Skeleton key={`header-${index}`} variant="text" className="h-4 flex-1" />
      ))}
    </div>
    
    {/* Rows */}
    {Array.from({ length: rows }).map((_, rowIndex) => (
      <div key={`row-${rowIndex}`} className="flex space-x-4">
        {Array.from({ length: columns }).map((_, colIndex) => (
          <Skeleton 
            key={`cell-${rowIndex}-${colIndex}`} 
            variant="text" 
            className="h-4 flex-1" 
          />
        ))}
      </div>
    ))}
  </div>
);

export const SkeletonList: React.FC<{ 
  items?: number;
  showAvatar?: boolean;
  className?: string;
}> = ({ items = 5, showAvatar = false, className }) => (
  <div className={cn('space-y-4', className)}>
    {Array.from({ length: items }).map((_, index) => (
      <div key={index} className="flex items-start space-x-3">
        {showAvatar && <SkeletonAvatar size="sm" />}
        <div className="flex-1 space-y-2">
          <Skeleton variant="text" className="h-4 w-3/4" />
          <Skeleton variant="text" className="h-3 w-1/2" />
        </div>
      </div>
    ))}
  </div>
);

export { Skeleton, skeletonVariants };