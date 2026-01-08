import React from 'react';
import { Building2, MapPin, Phone, Globe, Calendar } from 'lucide-react';
import { Card, CardContent } from './Card';
import { TruncatedText } from './TruncatedText';
import { AddressClickableField } from './AddressClickableField';
import {
    CARD_STYLES,
    TYPOGRAPHY,
    LAYOUT,
    BADGE_STYLES
} from './cardStyles';
import {
    getCompanyStatusColor,
    formatCardDate,
    getDisplayValue,
    createCardKeyHandler
} from './cardUtils';
import { cn } from '../../utils/cn';
import { useLanguage } from '../../contexts/LanguageContext';
import type { Company } from '../../../shared/types';

interface CompanyCardProps {
    company: Company;
    onClick: (company: Company) => void;
}

export const CompanyCard: React.FC<CompanyCardProps> = ({ company, onClick }) => {
    const { t } = useLanguage();

    const getCompanyStatusLabel = (status: string | null | undefined): string => {
        const key = (status || '').toUpperCase();
        switch (key) {
            case 'ACTIVE':
                return t('destinations.status.ACTIVE');
            case 'INACTIVE':
                return t('destinations.status.INACTIVE');
            case 'SUSPENDED':
                return t('destinations.status.SUSPENDED');
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
                CARD_STYLES.active,
                "transition-all duration-200 ease-in-out hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] touch:active:scale-[0.95]"
            )}
            onClick={() => onClick(company)}
            role="button"
            tabIndex={0}
            onKeyDown={createCardKeyHandler(onClick, company)}
        >
            <CardContent className={CARD_STYLES.contentPadding}>
                {/* Header Section */}
                <div className={cn(LAYOUT.header, CARD_STYLES.headerSpacing)}>
                    <div className="flex items-start space-x-3 flex-1 min-w-0">
                        <div className="flex-shrink-0 mt-1">
                            <Building2 className="h-5 w-5 sm:h-6 sm:w-6 text-primary-600" />
                        </div>

                        <div className={LAYOUT.titleContainer}>
                            <div className="flex flex-wrap items-center gap-2 mb-2">
                                <span className={cn(
                                    BADGE_STYLES.base,
                                    BADGE_STYLES.interactive,
                                    getCompanyStatusColor(company.status)
                                )}>
                                    {getCompanyStatusLabel(company.status)}
                                </span>
                            </div>
                            <h3 className={TYPOGRAPHY.title}>
                                {getDisplayValue(company.name)}
                            </h3>
                            <div className="flex items-center space-x-1">
                                <MapPin className="h-3 w-3 sm:h-4 sm:w-4 text-secondary-400 flex-shrink-0" />
                                <div className={cn(TYPOGRAPHY.subtitle, "truncate")}>
                                    <AddressClickableField
                                        address={company.address}
                                        className="text-xs sm:text-sm text-secondary-600"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                </div>

                {/* Content Section - Responsive grid layout */}
                <div className={CARD_STYLES.contentSpacing}>
                    <div className={cn(LAYOUT.contentGrid, TYPOGRAPHY.content, "flex flex-col gap-2")}>
                        {company.industry && (
                            <div className={LAYOUT.contentItem}>
                                <span className={TYPOGRAPHY.label}>{t('destinations.industry')}:</span>
                                <TruncatedText
                                    text={company.industry}
                                    maxLength={25}
                                    className="inline ml-1"
                                />
                            </div>
                        )}
                        {company.phone && (
                            <div className="flex items-center space-x-1 truncate">
                                <Phone className="h-3 w-3 text-secondary-400 flex-shrink-0" />
                                <TruncatedText
                                    text={company.phone}
                                    maxLength={20}
                                    className="text-xs sm:text-sm text-secondary-600"
                                />
                            </div>
                        )}
                        <div className="flex items-center space-x-1 truncate">
                            <Calendar className="h-3 w-3 text-secondary-400 flex-shrink-0" />
                            <span className="text-xs sm:text-sm text-secondary-600">
                                {t('destinations.added')} {formatCardDate(company.createdAt)}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Footer Section */}
                <div className={CARD_STYLES.footer}>
                    <div className={TYPOGRAPHY.footerContent}>
                        {company.website && (
                            <div className="flex items-center space-x-1 mb-2">
                                <Globe className="h-3 w-3 text-secondary-400 flex-shrink-0" />
                                <TruncatedText
                                    text={company.website}
                                    maxLength={40}
                                    className={TYPOGRAPHY.footerText}
                                />
                            </div>
                        )}
                        {company.description && (
                            <div>
                                <span className={TYPOGRAPHY.label}>{t('destinations.description')}:</span>
                                <div className="mt-1">
                                    <TruncatedText
                                        text={company.description}
                                        maxLength={100}
                                        className={TYPOGRAPHY.footerText}
                                    />
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};
