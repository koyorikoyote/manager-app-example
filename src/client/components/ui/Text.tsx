import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../utils/cn';

const textVariants = cva('', {
  variants: {
    variant: {
      h1: 'scroll-m-20 text-4xl font-extrabold tracking-tight lg:text-5xl text-neutral-900',
      h2: 'scroll-m-20 border-b pb-2 text-3xl font-semibold tracking-tight text-neutral-900 first:mt-0',
      h3: 'scroll-m-20 text-2xl font-semibold tracking-tight text-neutral-900',
      h4: 'scroll-m-20 text-xl font-semibold tracking-tight text-neutral-900',
      h5: 'scroll-m-20 text-lg font-semibold tracking-tight text-neutral-900',
      h6: 'scroll-m-20 text-base font-semibold tracking-tight text-neutral-900',
      p: 'leading-7 text-neutral-700 [&:not(:first-child)]:mt-6',
      blockquote: 'mt-6 border-l-2 border-primary-500 pl-6 italic text-neutral-600',
      code: 'relative rounded bg-neutral-100 px-[0.3rem] py-[0.2rem] font-mono text-sm font-semibold text-neutral-900',
      lead: 'text-xl text-neutral-600',
      large: 'text-lg font-semibold text-neutral-900',
      small: 'text-sm font-medium leading-none text-neutral-600',
      muted: 'text-sm text-neutral-500',
      caption: 'text-xs text-neutral-500 uppercase tracking-wide',
      body: 'text-base text-neutral-700 leading-relaxed',
      label: 'text-sm font-medium text-neutral-700',
    },
    align: {
      left: 'text-left',
      center: 'text-center',
      right: 'text-right',
      justify: 'text-justify',
    },
    weight: {
      light: 'font-light',
      normal: 'font-normal',
      medium: 'font-medium',
      semibold: 'font-semibold',
      bold: 'font-bold',
      extrabold: 'font-extrabold',
    },
    color: {
      default: '',
      primary: 'text-primary-600',
      secondary: 'text-secondary-600',
      accent: 'text-accent-600',
      success: 'text-primary-600',
      warning: 'text-secondary-600',
      error: 'text-red-600',
      muted: 'text-neutral-500',
      white: 'text-white',
    },
  },
  defaultVariants: {
    variant: 'body',
    align: 'left',
    color: 'default',
  },
});

export interface TextProps
  extends Omit<React.HTMLAttributes<HTMLElement>, 'color'>,
    VariantProps<typeof textVariants> {
  as?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'p' | 'span' | 'div' | 'blockquote' | 'code' | 'label';
  truncate?: boolean;
}

const Text = React.forwardRef<HTMLElement, TextProps>(
  ({ 
    className, 
    variant, 
    align, 
    weight, 
    color, 
    as, 
    truncate = false,
    children,
    ...props 
  }, ref) => {
    // Determine the HTML element to render
    const Component = as || getDefaultElement(variant);
    
    return React.createElement(
      Component,
      {
        className: cn(
          textVariants({ variant, align, weight, color }),
          truncate && 'truncate',
          className
        ),
        ref,
        ...props,
      },
      children
    );
  }
);

Text.displayName = 'Text';

// Helper function to determine default HTML element based on variant
function getDefaultElement(variant: string | null | undefined): string {
  switch (variant) {
    case 'h1':
      return 'h1';
    case 'h2':
      return 'h2';
    case 'h3':
      return 'h3';
    case 'h4':
      return 'h4';
    case 'h5':
      return 'h5';
    case 'h6':
      return 'h6';
    case 'p':
    case 'lead':
    case 'body':
      return 'p';
    case 'blockquote':
      return 'blockquote';
    case 'code':
      return 'code';
    case 'label':
      return 'label';
    case 'small':
    case 'muted':
    case 'caption':
    case 'large':
    default:
      return 'span';
  }
}

export { Text, textVariants };