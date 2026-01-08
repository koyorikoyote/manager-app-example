import React from 'react';
import { Phone, Calendar, CalendarCheck } from 'lucide-react';
import { Card, CardContent } from './Card';

import { TruncatedText } from './TruncatedText';
import {
    CARD_STYLES,
    TYPOGRAPHY,
    LAYOUT,
    BADGE_STYLES
} from './cardStyles';
import {
    getProgressStatusColor,
    getUrgencyLevelColor,
    formatCardDate,
    getDisplayValue,
    createCardKeyHandler
} from './cardUtils';
import { cn } from '../../utils/cn';
import type { ComplaintDetailWithRelations } from '../../../shared/types';
import { useLanguage } from '../../contexts/LanguageContext';

interface ComplaintCardProps {
    complaint: ComplaintDetailWithRelations;
    onClick: (complaint: ComplaintDetailWithRelations) => void;
}

export const ComplaintCard: React.FC<ComplaintCardProps> = ({ complaint, onClick }) => {
    const { t } = useLanguage();

    const getProgressStatusLabel = (status: string | null | undefined): string => {
        const key = (status || '').toUpperCase();
        switch (key) {
            case 'OPEN':
                return t('inquiriesNotifications.progressStatus.OPEN');
            case 'CLOSED':
                return t('inquiriesNotifications.progressStatus.CLOSED');
            case 'ON_HOLD':
                return t('inquiriesNotifications.progressStatus.ON_HOLD');
            default:
                return getDisplayValue(status || '');
        }
    };

    const getUrgencyLabel = (level: string | null | undefined): string => {
        const normalized = (level || '').toLowerCase();
        switch (normalized) {
            case 'high':
                return t('complaintDetails.urgencyLevel.high');
            case 'medium':
                return t('complaintDetails.urgencyLevel.medium');
            case 'low':
                return t('complaintDetails.urgencyLevel.low');
            default:
                return getDisplayValue(level || '');
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
            onClick={() => onClick(complaint)}
            role="button"
            tabIndex={0}
            onKeyDown={createCardKeyHandler(onClick, complaint)}
        >
            <CardContent className={CARD_STYLES.contentPadding}>
                {/* Header Section */}
                <div className={cn(LAYOUT.header, CARD_STYLES.headerSpacing)}>
                    <div className={LAYOUT.titleContainer}>
                        <div className="flex flex-wrap items-center gap-2 mb-2">
                            {complaint.urgencyLevel && (
                                <span
                                    className={cn(
                                        BADGE_STYLES.base,
                                        BADGE_STYLES.interactive,
                                        getUrgencyLevelColor(complaint.urgencyLevel)
                                    )}
                                >
                                    {getUrgencyLabel(complaint.urgencyLevel)}
                                </span>
                            )}
                            <span className={cn(
                                BADGE_STYLES.base,
                                BADGE_STYLES.interactive,
                                getProgressStatusColor(complaint.progressStatus)
                            )}>
                                {getProgressStatusLabel(complaint.progressStatus)}
                            </span>
                        </div>
                        <h3 className={TYPOGRAPHY.title}>
                            {getDisplayValue(complaint.complainerName)}
                        </h3>
                        <p className={TYPOGRAPHY.subtitle}>
                            {getDisplayValue(complaint.company?.name)}
                        </p>
                    </div>

                </div>

                {/* Content Section - Responsive grid layout */}
                <div className={CARD_STYLES.contentSpacing}>
                    <div className={cn(LAYOUT.contentGrid, TYPOGRAPHY.content, "text-xs flex flex-col gap-2")}>
                        <div className={cn(LAYOUT.contentGrid, TYPOGRAPHY.content, "text-xs gap-2")}>
                            <div className="flex items-center space-x-1">
                                <Calendar className="h-3 w-3 text-secondary-400 flex-shrink-0" />
                                <span>{formatCardDate(complaint.dateOfOccurrence)}</span>
                            </div>
                        </div>
                        <div className="flex items-center space-x-1">
                            <Phone className="h-3 w-3 text-secondary-400 flex-shrink-0" />
                            <span>{getDisplayValue(complaint.complainerContact)}</span>
                        </div>
                        <div className={cn(LAYOUT.contentItem, "flex flex-wrap items-center gap-2 truncate")}>
                            <span className={TYPOGRAPHY.label}>{t("complaintDetails.fields.responder")}:</span> <span>{getDisplayValue(complaint.responder?.name)}</span>
                            {complaint.resolutionDate && (
                                <div className="flex items-center space-x-1 truncate ml-auto">
                                    <CalendarCheck className="h-4 w-4 text-green-500 flex-shrink-0" />
                                    <span>{formatCardDate(complaint.resolutionDate)}</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Footer Section */}
                <div className={CARD_STYLES.footer}>
                    <div className={TYPOGRAPHY.footerContent}>
                        <span className={TYPOGRAPHY.label}>{t("complaintDetails.columns.complaintContent")}:</span>
                        <div className="mt-1">
                            <TruncatedText
                                text={complaint.complaintContent || ''}
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
