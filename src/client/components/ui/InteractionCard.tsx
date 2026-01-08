import React from 'react';
import { MessageSquare, Calendar, User } from 'lucide-react';
import { Card, CardContent } from './Card';
import { TruncatedText } from './TruncatedText';
import {
    CARD_STYLES,
    TYPOGRAPHY,
    LAYOUT,
    BADGE_STYLES
} from './cardStyles';
import {
    getInteractionTypeColor,
    getInteractionStatusColor,
    formatCardDate,
    getDisplayValue,
    createCardKeyHandler
} from './cardUtils';
import { cn } from '../../utils/cn';
import { useLanguage } from '../../contexts/LanguageContext';
import type { InteractionRecord } from '../../../shared/types';

interface InteractionCardProps {
    record: InteractionRecord;
    onClick: (record: InteractionRecord) => void;
    getTypeLabel: (type: InteractionRecord['type']) => string;
    getStatusLabel: (status: InteractionRecord['status']) => string;
}

export const InteractionCard: React.FC<InteractionCardProps> = ({
    record,
    onClick,
    getTypeLabel,
    getStatusLabel
}) => {
    const { t } = useLanguage();

    const handleCardClick = () => {
        onClick(record);
    };

    return (
        <Card
            variant="interactive"
            className={cn(
                CARD_STYLES.base,
                CARD_STYLES.hover,
                CARD_STYLES.active,
                "transition-all duration-200 ease-in-out hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] touch:active:scale-[0.95]"
            )}
            onClick={handleCardClick}
            role="button"
            tabIndex={0}
            onKeyDown={createCardKeyHandler(handleCardClick, record)}
        >
            <CardContent className={CARD_STYLES.contentPadding}>
                {/* Header Section */}
                <div className={cn(LAYOUT.header, CARD_STYLES.headerSpacing)}>
                    <div className="flex items-start space-x-3 flex-1 min-w-0">
                        <div className="flex-shrink-0 mt-1">
                            <MessageSquare className="h-5 w-5 text-primary-600" />
                        </div>

                        <div className={LAYOUT.titleContainer}>
                            {/* Status Badges */}
                            <div className="flex flex-wrap items-center gap-2 mb-2">
                                <span className={cn(
                                    BADGE_STYLES.base,
                                    BADGE_STYLES.interactive,
                                    getInteractionTypeColor(record.type)
                                )}>
                                    {getTypeLabel(record.type)}
                                </span>
                                <span className={cn(
                                    BADGE_STYLES.base,
                                    BADGE_STYLES.interactive,
                                    getInteractionStatusColor(record.status || 'open')
                                )}>
                                    {getStatusLabel(record.status)}
                                </span>
                            </div>

                            {/* Name field - prominently displayed */}
                            <h3 className={TYPOGRAPHY.title}>
                                {getDisplayValue(record.name)}
                            </h3>

                            {/* Person Concerned field */}
                            <p className={TYPOGRAPHY.subtitle}>
                                {t('interactions.columns.personConcerned')}: {getDisplayValue(record.personConcerned)}
                            </p>

                            {/* Title field - secondary heading */}
                            <h4 className="text-sm font-medium text-secondary-700 mb-1 truncate">
                                {getDisplayValue(record.title)}
                            </h4>
                        </div>
                    </div>
                </div>

                {/* Content Section - Description */}
                <div className={CARD_STYLES.contentSpacing}>
                    <div className={TYPOGRAPHY.content}>
                        <TruncatedText
                            text={record.description || ''}
                            maxLength={120}
                            className={TYPOGRAPHY.footerText}
                        />
                    </div>
                </div>

                {/* Footer Section - Key Information */}
                <div className={CARD_STYLES.footer}>
                    <div className={cn(LAYOUT.contentGrid, TYPOGRAPHY.content, "text-xs flex flex-col gap-2")}>
                        <div className={cn(LAYOUT.contentGrid, TYPOGRAPHY.content, "text-xs gap-2")}>
                            <div className="flex items-center space-x-1 truncate">
                                <Calendar className="h-3 w-3 text-secondary-400 flex-shrink-0" />
                                <span>{formatCardDate(record.date)}</span>
                            </div>
                            <div className="truncate">
                                <span className={TYPOGRAPHY.label}>{t('complaintDetails.columns.daysPassed')}:</span> {getDisplayValue(record.daysPassed?.toString())}
                            </div>
                        </div>
                        <div className="flex items-center space-x-1 truncate">
                            <User className="h-3 w-3 text-secondary-400 flex-shrink-0" />
                            <span>{t('interactions.columns.personInvolved')}: {getDisplayValue(record.personInvolved?.name)}</span>
                        </div>
                        <div className="flex items-center space-x-1 truncate">
                            <User className="h-3 w-3 text-secondary-400 flex-shrink-0" />
                            <span>{t('interactions.columns.userInCharge')}: {getDisplayValue(record.userInCharge?.name)}</span>
                        </div>
                        <div className="text-xs text-secondary-500 col-span-full">
                            {t('interactions.columns.updatedAt')}: {formatCardDate(record.updatedAt)}
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};