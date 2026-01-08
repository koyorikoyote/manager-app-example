import React from 'react';
import { Plus, Minus } from 'lucide-react';
import { Button, ButtonProps } from './Button';
import { cn } from '../../utils/cn';
import { useResponsive } from '../../hooks/useResponsive';
import { useLanguage } from '../../contexts/LanguageContext';
import { ViewMode } from './ViewModeToggle';

interface MobileAwareButtonProps extends Omit<ButtonProps, 'children' | 'variant'> {
    variant: 'new' | 'delete';
    onClick: () => void;
    disabled?: boolean;
    className?: string;
    viewMode?: ViewMode;
    count?: number;
}

export const MobileAwareButton: React.FC<MobileAwareButtonProps> = ({
    variant,
    onClick,
    disabled = false,
    className,
    viewMode,
    count,
    ...props
}) => {
    const { isMobile, isTablet } = useResponsive();
    const { t } = useLanguage();
    const isMobileView = isMobile || isTablet;

    // Hide Delete button when in Card view mode
    if (variant === 'delete' && viewMode === 'cards') {
        return null;
    }

    const getIcon = () => {
        return variant === 'new' ? (
            <Plus className="h-4 w-4" />
        ) : (
            <Minus className="h-4 w-4" />
        );
    };

    const getText = () => {
        if (variant === 'new') {
            return t('common.actions.new');
        } else {
            const baseText = t('common.actions.bulkDelete');
            return count && count > 0 ? `${baseText} (${count})` : baseText;
        }
    };

    const getTitle = () => {
        if (variant === 'new') {
            return t('common.actions.new');
        } else {
            const baseText = t('common.actions.bulkDelete');
            return count && count > 0 ? `${baseText} (${count})` : baseText;
        }
    };

    return (
        <Button
            variant={variant === 'delete' ? 'destructive' : 'default'}
            onClick={onClick}
            disabled={disabled}
            className={cn(
                'flex items-center gap-2',
                isMobileView ? 'w-10 h-10 p-0 justify-center' : 'w-24',
                className
            )}
            title={isMobileView ? getTitle() : undefined}
            {...props}
        >
            {getIcon()}
            {!isMobileView && getText()}
        </Button>
    );
};