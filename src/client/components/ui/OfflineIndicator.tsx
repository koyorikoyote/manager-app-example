import React from 'react';
import { WifiOff } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import { cn } from '../../utils/cn';

export interface OfflineIndicatorProps {
    className?: string;
}

export const OfflineIndicator: React.FC<OfflineIndicatorProps> = ({ className }) => {
    const { t } = useLanguage();

    return (
        <div
            className={cn(
                'flex items-center gap-2 px-4 py-2 bg-yellow-50 border border-yellow-200 rounded-lg text-yellow-800',
                className
            )}
            role="alert"
        >
            <WifiOff className="h-5 w-5 flex-shrink-0" />
            <div className="flex-1">
                <p className="text-sm font-medium">{t('conversation.errors.offline')}</p>
                <p className="text-xs opacity-90">{t('conversation.errors.offlineMessage')}</p>
            </div>
        </div>
    );
};
