import React from 'react';
import { Building, MapPin, Calendar } from 'lucide-react';
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
    getPropertyStatusColor,
    formatCardDate,
    getDisplayValue,
    createCardKeyHandler
} from './cardUtils';
import { cn } from '../../utils/cn';
import { useLanguage } from '../../contexts/LanguageContext';
import type { Property } from '../../../shared/types';

interface PropertyCardProps {
    property: Property;
    onClick: (property: Property) => void;
}

export const PropertyCard: React.FC<PropertyCardProps> = ({ property, onClick }) => {
    const { t } = useLanguage();

    const getPropertyStatusLabel = (status: string | null | undefined): string => {
        const key = (status || '').toUpperCase();
        switch (key) {
            case 'ACTIVE':
                return t('properties.ACTIVE');
            case 'INACTIVE':
                return t('properties.INACTIVE');
            case 'UNDER_CONSTRUCTION':
                return t('properties.UNDER_CONSTRUCTION');
            case 'SOLD':
                return t('properties.SOLD');
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
            onClick={() => onClick(property)}
            role="button"
            tabIndex={0}
            onKeyDown={createCardKeyHandler(onClick, property)}
        >
            <CardContent className={CARD_STYLES.contentPadding}>
                {/* Header Section */}
                <div className={cn(LAYOUT.header, CARD_STYLES.headerSpacing)}>
                    <div className="flex items-start space-x-3 flex-1 min-w-0">
                        <div className="flex-shrink-0 mt-1">
                            <Building className="h-5 w-5 sm:h-6 sm:w-6 text-primary-600" />
                        </div>

                        <div className={LAYOUT.titleContainer}>
                            <div className="flex flex-wrap items-center gap-2 mb-2">
                                <span className={cn(
                                    BADGE_STYLES.base,
                                    BADGE_STYLES.interactive,
                                    getPropertyStatusColor(property.status)
                                )}>
                                    {getPropertyStatusLabel(property.status)}
                                </span>
                            </div>
                            <h3 className={TYPOGRAPHY.title}>
                                {getDisplayValue(property.name)}
                            </h3>
                            <div className="flex items-center space-x-1">
                                <MapPin className="h-3 w-3 sm:h-4 sm:w-4 text-secondary-400 flex-shrink-0" />
                                <div className={cn(TYPOGRAPHY.subtitle, "truncate")}>
                                    <AddressClickableField
                                        address={property.address}
                                        className="text-xs sm:text-sm text-secondary-600"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                </div>

                {/* Content Section - Responsive grid layout */}
                <div className={CARD_STYLES.contentSpacing}>
                    <div className={cn(LAYOUT.contentGrid, TYPOGRAPHY.content)}>
                        <div className={LAYOUT.contentItem}>
                            <span className={TYPOGRAPHY.label}>{t('residences.type')}:</span>
                            <TruncatedText
                                text={property.propertyType || ''}
                                maxLength={30}
                                className="inline ml-1"
                            />
                        </div>
                        <div className="flex items-center space-x-1 truncate">
                            <span className={TYPOGRAPHY.label}>{t('residences.documents')}:</span><span>{property.documentIds?.length || 0}</span>
                        </div>
                        <div className="flex items-center space-x-1 truncate col-span-full sm:col-span-2">
                            <Calendar className="h-3 w-3 text-secondary-400 flex-shrink-0" />
                            <span className="text-xs sm:text-sm text-secondary-600">
                                <span className={TYPOGRAPHY.label}>{t('residences.contractDate')}:</span> {formatCardDate(property.contractDate)}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Footer Section - Optional description or notes */}
                {property.description && (
                    <div className={CARD_STYLES.footer}>
                        <div className={TYPOGRAPHY.footerContent}>
                            <span className={TYPOGRAPHY.label}>{t('properties.description')}:</span>
                            <div className="mt-1">
                                <TruncatedText
                                    text={property.description}
                                    maxLength={100}
                                    className={TYPOGRAPHY.footerText}
                                />
                            </div>
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
};
