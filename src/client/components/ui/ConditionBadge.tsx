import React from 'react';
import { cn } from '../../utils/cn';
import { useLanguage } from '../../contexts/LanguageContext';

interface ConditionBadgeProps {
    condition: 'Excellent' | 'Good' | 'Fair' | 'Poor';
    className?: string;
}

export const ConditionBadge: React.FC<ConditionBadgeProps> = ({ condition, className }) => {
    const { t } = useLanguage();

    const getConditionColor = (condition: string) => {
        switch (condition) {
            case 'Excellent':
                return 'bg-green-100 text-green-800';
            case 'Good':
                return 'bg-blue-100 text-blue-800';
            case 'Fair':
                return 'bg-yellow-100 text-yellow-800';
            case 'Poor':
                return 'bg-red-100 text-red-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    const getLocalizedCondition = (condition: string) => {
        const conditionMap: Record<string, string> = {
            'Excellent': t('dailyRecord.conditionStatus.Excellent'),
            'Good': t('dailyRecord.conditionStatus.Good'),
            'Fair': t('dailyRecord.conditionStatus.Fair'),
            'Poor': t('dailyRecord.conditionStatus.Poor')
        };
        return conditionMap[condition] || condition;
    };

    return (
        <span
            className={cn(
                'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
                getConditionColor(condition),
                className
            )}
        >
            {getLocalizedCondition(condition)}
        </span>
    );
};