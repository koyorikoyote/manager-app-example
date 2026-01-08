import React from 'react';
import { Phone } from 'lucide-react';
import { Card, CardContent } from './Card';
import { TruncatedText } from './TruncatedText';
import {
    CARD_STYLES,
    TYPOGRAPHY,
    LAYOUT,
    BADGE_STYLES
} from './cardStyles';
import {
    getConditionStatusColor,
    getDisplayValue,
    createCardKeyHandler
} from './cardUtils';
import { formatDateForInput } from '../../utils/dateUtils';
import { cn } from '../../utils/cn';
import type { DailyRecordWithRelations } from '../../../shared/types';
import { useLanguage } from '../../contexts/LanguageContext';

interface DailyRecordCardProps {
    dailyRecord: DailyRecordWithRelations;
    onClick: (dailyRecord: DailyRecordWithRelations) => void;
}

export const DailyRecordCard: React.FC<DailyRecordCardProps> = ({ dailyRecord, onClick }) => {
    const { t } = useLanguage();

    const getConditionStatusLabel = (status: string | null | undefined): string => {
        const key = (status || '').toUpperCase();
        switch (key) {
            case 'EXCELLENT':
                return t('dailyRecord.conditionStatus.EXCELLENT');
            case 'GOOD':
                return t('dailyRecord.conditionStatus.GOOD');
            case 'FAIR':
                return t('dailyRecord.conditionStatus.FAIR');
            case 'POOR':
                return t('dailyRecord.conditionStatus.POOR');
            default:
                return getDisplayValue(status || '');
        }
    };

    return (
        <Card
            variant="interactive"
            className={cn(
                CARD_STYLES.base,
                CARD_STYLES.hover,
                CARD_STYLES.active
            )}
            onClick={() => onClick(dailyRecord)}
            role="button"
            tabIndex={0}
            onKeyDown={createCardKeyHandler(onClick, dailyRecord)}
        >
            <CardContent className={CARD_STYLES.contentPadding}>
                {/* Header Section */}
                <div className={cn(LAYOUT.header, CARD_STYLES.headerSpacing)}>
                    <div className={LAYOUT.titleContainer}>
                        <div className="flex flex-wrap items-center gap-2 mb-2">
                            <span className={cn(
                                BADGE_STYLES.base,
                                BADGE_STYLES.interactive,
                                getConditionStatusColor(dailyRecord.conditionStatus)
                            )}>
                                {getConditionStatusLabel(dailyRecord.conditionStatus)}
                            </span>
                        </div>
                        <h3 className={TYPOGRAPHY.title}>
                            {getDisplayValue(dailyRecord.staff?.name)}
                        </h3>
                        <p className={TYPOGRAPHY.subtitle}>
                            {formatDateForInput(dailyRecord.dateOfRecord as Date | string | null | undefined).replace(/-/g, '/')}
                        </p>
                    </div>

                </div>

                {/* Content Section - Responsive grid layout */}
                <div className={CARD_STYLES.contentSpacing}>
                    <div className={cn(LAYOUT.contentGrid, TYPOGRAPHY.content, "flex flex-col gap-2")}>
                        <div className="flex items-center space-x-1 truncate">
                            <Phone className="h-3 w-3 text-secondary-400 flex-shrink-0" /> <span>{getDisplayValue(dailyRecord.contactNumber)}</span>
                        </div>
                        <div className={LAYOUT.contentItem}>
                            <span className={TYPOGRAPHY.label}>{t("staff.employeeId")}:</span> {getDisplayValue(dailyRecord.staff?.employeeId)}
                        </div>
                    </div>
                </div>

                {/* Footer Section */}
                <div className={CARD_STYLES.footer}>
                    <div className={TYPOGRAPHY.footerContent}>
                        <span className={TYPOGRAPHY.label}>{t("dailyRecord.columns.feedbackContent")}:</span>
                        <div className="mt-1">
                            <TruncatedText
                                text={dailyRecord.feedbackContent || ''}
                                maxLength={100}
                                className={TYPOGRAPHY.footerText}
                            />
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};
