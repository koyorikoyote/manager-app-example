import React from 'react';
import { Phone, Calendar } from 'lucide-react';
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
    getInquiryTypeColor,
    formatCardDate,
    getDisplayValue,
    createCardKeyHandler
} from './cardUtils';
import { cn } from '../../utils/cn';
import { useLanguage } from '../../contexts/LanguageContext';
import type { InquiryWithRelations } from '../../../shared/types';

interface InquiryCardProps {
    inquiry: InquiryWithRelations;
    onClick: (inquiry: InquiryWithRelations) => void;
}

export const InquiryCard: React.FC<InquiryCardProps> = ({ inquiry, onClick }) => {
    const { t } = useLanguage();

    const getInquiryTypeLabel = (type: string | null | undefined): string => {
        switch (type) {
            case 'General':
                return t('inquiriesNotifications.types.General');
            case 'Technical':
                return t('inquiriesNotifications.types.Technical');
            case 'Billing':
                return t('inquiriesNotifications.types.Billing');
            case 'Support':
                return t('inquiriesNotifications.types.Support');
            case 'Complaint':
                return t('inquiriesNotifications.types.Complaint');
            default:
                return getDisplayValue(type || '');
        }
    };

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

    return (
        <Card
            variant="interactive"
            className={cn(
                CARD_STYLES.base,
                CARD_STYLES.hover,
                CARD_STYLES.active
            )}
            onClick={() => onClick(inquiry)}
            role="button"
            tabIndex={0}
            onKeyDown={createCardKeyHandler(onClick, inquiry)}
        >
            <CardContent className={CARD_STYLES.contentPadding}>
                {/* Header Section */}
                <div className={cn(LAYOUT.header, CARD_STYLES.headerSpacing)}>
                    <div className={LAYOUT.titleContainer}>
                        <div className="flex flex-wrap items-center gap-2 mb-2">
                            <span className={cn(
                                BADGE_STYLES.base,
                                BADGE_STYLES.interactive,
                                getInquiryTypeColor(inquiry.typeOfInquiry)
                            )}>
                                {getInquiryTypeLabel(inquiry.typeOfInquiry)}
                            </span>
                            <span className={cn(
                                BADGE_STYLES.base,
                                BADGE_STYLES.interactive,
                                getProgressStatusColor(inquiry.progressStatus)
                            )}>
                                {getProgressStatusLabel(inquiry.progressStatus)}
                            </span>
                        </div>
                        <h3 className={TYPOGRAPHY.title}>
                            {getDisplayValue(inquiry.inquirerName)}
                        </h3>
                        <p className={TYPOGRAPHY.subtitle}>
                            {getDisplayValue(inquiry.company?.name)}
                        </p>
                    </div>

                </div>

                {/* Content Section - Responsive grid layout */}
                <div className={CARD_STYLES.contentSpacing}>
                    <div className={cn(LAYOUT.contentGrid, TYPOGRAPHY.content, "flex flex-col gap-2")}>
                        <div className="flex items-center space-x-1 truncate">
                            <Calendar className="h-3 w-3 text-secondary-400 flex-shrink-0" />
                            <span className="text-xs sm:text-sm text-secondary-600">
                                {t('inquiriesNotifications.columns.dateOfInquiry')}: {formatCardDate(inquiry.dateOfInquiry)}
                            </span>
                        </div>
                        <div className="flex items-center space-x-1 truncate">
                            <Phone className="h-3 w-3 text-secondary-400 flex-shrink-0" />
                            <span>
                                {getDisplayValue(inquiry.inquirerContact)}
                            </span>
                        </div>
                        {inquiry.resolutionDate && (
                            <div className={LAYOUT.contentItem}>
                                <span className={TYPOGRAPHY.label}>{t('inquiriesNotifications.columns.resolutionDate')}:</span> {formatCardDate(inquiry.resolutionDate)}
                            </div>
                        )}
                        <div className={LAYOUT.contentItem}>
                            <span className={TYPOGRAPHY.label}>{t('inquiriesNotifications.columns.responderName')}:</span> {getDisplayValue(inquiry.responder?.name)}
                        </div>
                    </div>
                </div>

                {/* Footer Section */}
                <div className={CARD_STYLES.footer}>
                    <div className={TYPOGRAPHY.footerContent}>
                        <span className={TYPOGRAPHY.label}>{t('inquiriesNotifications.columns.inquiryContent')}:</span>
                        <div className="mt-1">
                            <TruncatedText
                                text={inquiry.inquiryContent || ''}
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
