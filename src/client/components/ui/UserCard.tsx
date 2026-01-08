import React from 'react';
import { User } from 'lucide-react';
import { Card, CardContent } from './Card';
import { TruncatedText } from './TruncatedText';
import {
    CARD_STYLES,
    TYPOGRAPHY,
    LAYOUT,
    BADGE_STYLES
} from './cardStyles';
import {
    formatCardDate,
    getDisplayValue,
    createCardKeyHandler
} from './cardUtils';
import { cn } from '../../utils/cn';
import { useLanguage } from '../../contexts/LanguageContext';

interface UserWithRole {
    id: number;
    username: string;
    email: string;
    name: string;
    isActive: boolean;
    languagePreference: "EN" | "JA";
    themePreference: string | null;
    createdAt: Date;
    updatedAt: Date;
    roleId: number;
    role: {
        id: number;
        name: string;
        description: string | null;
        level: number;
        isActive: boolean;
    };
}

interface UserCardProps {
    user: UserWithRole;
    onClick: (user: UserWithRole) => void;
}

const getUserStatusColor = (isActive: boolean): string => {
    return isActive
        ? "bg-green-100 text-green-800"
        : "bg-neutral-100 text-neutral-800";
};

const getRoleLevelColor = (level: number): string => {
    if (level >= 3) return "bg-purple-100 text-purple-800";
    if (level >= 2) return "bg-blue-100 text-blue-800";
    return "bg-neutral-100 text-neutral-800";
};

export const UserCard: React.FC<UserCardProps> = ({ user, onClick }) => {
    const { t } = useLanguage();
    return (
        <Card
            variant="interactive"
            className={cn(
                CARD_STYLES.base,
                CARD_STYLES.hover,
                CARD_STYLES.active,
                "transition-all duration-200 ease-in-out hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] touch:active:scale-[0.95]"
            )}
            onClick={() => onClick(user)}
            role="button"
            tabIndex={0}
            onKeyDown={createCardKeyHandler(onClick, user)}
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
                                    getUserStatusColor(user.isActive)
                                )}>
                                    {user.isActive ? t('userManagement.status.active') : t('userManagement.status.inactive')}
                                </span>
                                <span className={cn(
                                    BADGE_STYLES.base,
                                    BADGE_STYLES.interactive,
                                    getRoleLevelColor(user.role.level)
                                )}>
                                    {t('userManagement.level')} {user.role.level}
                                </span>
                            </div>
                            <h3 className={TYPOGRAPHY.title}>
                                {getDisplayValue(user.name)}
                            </h3>
                            <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-4 space-y-1 sm:space-y-0">
                                <p className={TYPOGRAPHY.subtitle}>
                                    @{getDisplayValue(user.username)}
                                </p>
                                <p className={TYPOGRAPHY.subtitle}>
                                    {getDisplayValue(user.role.name)}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Content Section - Responsive grid layout */}
                <div className={CARD_STYLES.contentSpacing}>
                    <div className={cn(LAYOUT.contentGrid, TYPOGRAPHY.content)}>
                        <div className={LAYOUT.contentItem}>
                            <span className={TYPOGRAPHY.label}>{t('userManagement.fields.email')}:</span>
                            <TruncatedText
                                text={user.email}
                                maxLength={30}
                                className="inline ml-1"
                            />
                        </div>
                        <div className={LAYOUT.contentItem}>
                            <span className={TYPOGRAPHY.label}>{t('userManagement.fields.languagePreference')}:</span>
                            <span className="ml-1">{user.languagePreference === 'EN' ? t('settings.english') : t('settings.japanese')}</span>
                        </div>
                        <div className={LAYOUT.contentItem}>
                            <span className={TYPOGRAPHY.label}>{t('company.created')}:</span> {formatCardDate(user.createdAt)}
                        </div>
                        <div className={LAYOUT.contentItem}>
                            <span className={TYPOGRAPHY.label}>{t('userManagement.roleLevel')}:</span> {user.role.level}
                        </div>
                    </div>
                </div>

                {/* Footer Section */}
                {user.role.description && (
                    <div className={CARD_STYLES.footer}>
                        <div className={TYPOGRAPHY.footerContent}>
                            <span className={TYPOGRAPHY.label}>{t('userManagement.fields.role')}:</span>
                            <div className="mt-1">
                                <TruncatedText
                                    text={user.role.description}
                                    maxLength={80}
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
