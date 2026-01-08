import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../utils/cn';
import { useLanguage } from '../../contexts/LanguageContext';

const backButtonVariants = cva(
    'inline-flex items-center justify-center whitespace-nowrap rounded-lg text-sm font-medium ring-offset-white transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/20 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 active:scale-95 hover:bg-primary-50 hover:text-primary-900 text-primary-700 shadow-sm hover:shadow-md',
    {
        variants: {
            size: {
                default: 'h-12 px-4 py-3 min-h-[44px]',
                sm: 'h-10 rounded-md px-3 min-h-[40px]',
                lg: 'h-14 rounded-md px-6 min-h-[44px]',
                icon: 'h-12 w-12 min-h-[44px] min-w-[44px]',
            },
        },
        defaultVariants: {
            size: 'default',
        },
    }
);

export interface BackButtonProps
    extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof backButtonVariants> {
    onBack?: () => void;
    label?: string;
    showIcon?: boolean;
    useHistory?: boolean; // New prop to control navigation method
}

const BackButton = React.forwardRef<HTMLButtonElement, BackButtonProps>(
    ({
        className,
        size,
        onBack,
        label,
        showIcon = true,
        useHistory = true,
        children,
        ...props
    }, ref) => {
        const navigate = useNavigate();
        const { t } = useLanguage();

        const handleClick = () => {
            if (onBack) {
                onBack();
            } else if (useHistory) {
                navigate(-1); // Use browser history by default
            } else {
                navigate('/'); // Fallback to dashboard
            }
        };

        const buttonLabel = label || t('common.actions.back');

        return (
            <button
                className={cn(backButtonVariants({ size, className }))}
                ref={ref}
                onClick={handleClick}
                {...props}
            >
                {showIcon && (
                    <ArrowLeft className="h-4 w-4 mr-2 flex-shrink-0" />
                )}
                <span>
                    {children || buttonLabel}
                </span>
            </button>
        );
    }
);

BackButton.displayName = 'BackButton';

export { BackButton, backButtonVariants };