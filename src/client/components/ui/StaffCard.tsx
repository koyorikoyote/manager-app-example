import React from 'react';
import { User, Phone, Calendar } from 'lucide-react';
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
    getStaffStatusColor,
    formatCardDate,
    getDisplayValue,
    createCardKeyHandler
} from './cardUtils';
import { cn } from '../../utils/cn';
import { useLanguage } from '../../contexts/LanguageContext';
import type { Staff } from '../../../shared/types';

interface StaffCardProps {
    staff: Staff;
    onClick: (staff: Staff) => void;
}

export const StaffCard: React.FC<StaffCardProps> = ({ staff, onClick }) => {
    const { t } = useLanguage();

    const getStaffStatusLabel = (status: string | null | undefined): string => {
        const key = (status || '').toUpperCase();
        switch (key) {
            case 'ACTIVE':
                return t('staff.status.ACTIVE');
            case 'INACTIVE':
                return t('staff.status.INACTIVE');
            case 'ON_LEAVE':
                return t('staff.status.ON_LEAVE');
            case 'TERMINATED':
                return t('staff.status.TERMINATED');
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
            onClick={() => onClick(staff)}
            role="button"
            tabIndex={0}
            onKeyDown={createCardKeyHandler(onClick, staff)}
        >
            <CardContent className={CARD_STYLES.contentPadding}>
                {/* Header Section */}
                <div className={cn(LAYOUT.header, CARD_STYLES.headerSpacing)}>
                    <div className="flex items-start space-x-3 flex-1 min-w-0">
                        <div className="flex-shrink-0 mt-1">
                            <User className="h-5 w-5 sm:h-6 sm:w-6 text-primary-600" />
                        </div>

                        <div className={LAYOUT.titleContainer}>
                            <div className="flex flex-wrap items-center gap-2 mb-2">
                                <span className={cn(
                                    BADGE_STYLES.base,
                                    BADGE_STYLES.interactive,
                                    getStaffStatusColor(staff.status)
                                )}>
                                    {getStaffStatusLabel(staff.status)}
                                </span>
                            </div>
                            <h3 className={TYPOGRAPHY.title}>
                                {getDisplayValue(staff.name)}
                            </h3>
                            <div className="flex flex-col space-y-1 sm:space-y-0">
                                <p className={TYPOGRAPHY.subtitle}>
                                    {getDisplayValue(staff.employeeId)}
                                </p>
                                <p className={TYPOGRAPHY.subtitle}>
                                    {getDisplayValue(staff.company?.name)}
                                </p>
                            </div>
                        </div>
                    </div>

                </div>

                {/* Content Section - Responsive grid layout */}
                <div className={CARD_STYLES.contentSpacing}>
                    <div className={cn(LAYOUT.contentGrid, TYPOGRAPHY.content, "flex flex-col gap-2")}>
                        {staff.phone && (
                            <div className="flex items-center space-x-1 truncate">
                                <Phone className="h-3 w-3 text-secondary-400 flex-shrink-0" />
                                <span>
                                    <TruncatedText
                                        text={staff.phone}
                                        maxLength={20}
                                        className="inline ml-1"
                                    />
                                </span>
                            </div>
                        )}
                        <div className="flex items-center space-x-1 truncate">
                            <Calendar className="h-3 w-3 text-secondary-400 flex-shrink-0" />
                            <span className="text-xs sm:text-sm text-secondary-600">
                                {t('staff.hireDate')}: {formatCardDate(staff.hireDate)}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Footer Section */}
                {staff.address && (
                    <div className={CARD_STYLES.footer}>
                        <div className={TYPOGRAPHY.footerContent}>
                            <span className={TYPOGRAPHY.label}>{t('staff.address')}:</span>
                            <div className="mt-1">
                                <AddressClickableField
                                    address={staff.address}
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
