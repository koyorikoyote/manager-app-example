import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../utils/cn';
import { Button } from './Button';

const emptyStateVariants = cva(
  'flex flex-col items-center justify-center text-center py-12 px-6',
  {
    variants: {
      size: {
        sm: 'py-8 px-4',
        default: 'py-12 px-6',
        lg: 'py-16 px-8',
      },
    },
    defaultVariants: {
      size: 'default',
    },
  }
);

export interface EmptyStateProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof emptyStateVariants> {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
    variant?: 'default' | 'outline' | 'ghost';
  };
  secondaryAction?: {
    label: string;
    onClick: () => void;
    variant?: 'default' | 'outline' | 'ghost';
  };
}

const EmptyState = React.forwardRef<HTMLDivElement, EmptyStateProps>(
  ({ 
    className, 
    size, 
    icon, 
    title, 
    description, 
    action, 
    secondaryAction,
    ...props 
  }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(emptyStateVariants({ size, className }))}
        {...props}
      >
        {icon && (
          <div className="mb-4 text-secondary-400">
            {icon}
          </div>
        )}
        
        <h3 className="text-lg font-semibold text-secondary-900 mb-2">
          {title}
        </h3>
        
        {description && (
          <p className="text-secondary-600 mb-6 max-w-md">
            {description}
          </p>
        )}
        
        {(action || secondaryAction) && (
          <div className="flex flex-col sm:flex-row gap-3">
            {action && (
              <Button
                variant={action.variant || 'default'}
                onClick={action.onClick}
              >
                {action.label}
              </Button>
            )}
            
            {secondaryAction && (
              <Button
                variant={secondaryAction.variant || 'outline'}
                onClick={secondaryAction.onClick}
              >
                {secondaryAction.label}
              </Button>
            )}
          </div>
        )}
      </div>
    );
  }
);

EmptyState.displayName = 'EmptyState';

export { EmptyState, emptyStateVariants };