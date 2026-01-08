import React from 'react';
import { User } from 'lucide-react';
import { StandardDetailDialog, StatusBadge } from './StandardDetailDialog';
import { formatCardDate, getDisplayValue } from './cardUtils';
import { useLocalization } from '../../hooks/useLocalization';
import type { TranslationFunction } from '../../../shared/types/translations';

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

interface UserDetailDialogProps {
    isOpen: boolean;
    onClose: () => void;
    user: UserWithRole | null;
    onEdit: (user: UserWithRole) => void;
    onDelete: (id: string) => void;
}

const getUserStatusBadges = (user: UserWithRole, t: TranslationFunction): StatusBadge[] => {
    const badges: StatusBadge[] = [];

    // User status badge
    badges.push({
        text: user.isActive ? t('userManagement.status.active') : t('userManagement.status.inactive'),
        className: user.isActive
            ? "bg-green-100 text-green-800 border-green-200"
            : "bg-neutral-100 text-neutral-800 border-neutral-200"
    });

    // Role level badge
    let roleLevelClass = "bg-neutral-100 text-neutral-800 border-neutral-200";
    if (user.role.level >= 3) {
        roleLevelClass = "bg-purple-100 text-purple-800 border-purple-200";
    } else if (user.role.level >= 2) {
        roleLevelClass = "bg-blue-100 text-blue-800 border-blue-200";
    }

    badges.push({
        text: `${t('userManagement.level')} ${user.role.level}`,
        className: roleLevelClass
    });

    return badges;
};

const renderUserHeader = (user: UserWithRole) => (
    <>
        <h3 className="text-lg font-semibold text-secondary-900 mb-1">
            {getDisplayValue(user.name)}
        </h3>
        <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-4 space-y-1 sm:space-y-0 text-sm text-neutral-600">
            <span>@{getDisplayValue(user.username)}</span>
            <span>{getDisplayValue(user.role.name)}</span>
        </div>
    </>
);

const renderUserContent = (user: UserWithRole, t: TranslationFunction) => (
    <div className="space-y-6">
        {/* Basic Information */}
        <div>
            <h4 className="text-sm font-medium text-neutral-700 border-b border-neutral-200 pb-2 mb-4">
                {t('userManagement.basicInformation')}
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                <div>
                    <span className="font-medium text-neutral-700">{t('userManagement.fields.username')}:</span>
                    <span className="ml-2 text-neutral-900">{getDisplayValue(user.username)}</span>
                </div>
                <div>
                    <span className="font-medium text-neutral-700">{t('userManagement.fields.email')}:</span>
                    <span className="ml-2 text-neutral-900">{getDisplayValue(user.email)}</span>
                </div>
                <div>
                    <span className="font-medium text-neutral-700">{t('userManagement.fields.languagePreference')}:</span>
                    <span className="ml-2 text-neutral-900">
                        {user.languagePreference === 'EN' ? t('userManagement.english') : t('userManagement.japanese')}
                    </span>
                </div>
                <div>
                    <span className="font-medium text-neutral-700">{t('userManagement.fields.themePreference')}:</span>
                    <span className="ml-2 text-neutral-900">
                        {getDisplayValue(user.themePreference) || t('userManagement.defaultTheme')}
                    </span>
                </div>
            </div>
        </div>

        {/* Role Information */}
        <div>
            <h4 className="text-sm font-medium text-neutral-700 border-b border-neutral-200 pb-2 mb-4">
                {t('userManagement.roleInformation')}
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                <div>
                    <span className="font-medium text-neutral-700">{t('userManagement.fields.role')}:</span>
                    <span className="ml-2 text-neutral-900">{getDisplayValue(user.role.name)}</span>
                </div>
                <div>
                    <span className="font-medium text-neutral-700">{t('userManagement.roleLevel')}:</span>
                    <span className="ml-2 text-neutral-900">{user.role.level}</span>
                </div>
                <div className="sm:col-span-2">
                    <span className="font-medium text-neutral-700">{t('common.labels.description')}:</span>
                    <span className="ml-2 text-neutral-900">
                        {getDisplayValue(user.role.description) || t('common.emptyStates.noData')}
                    </span>
                </div>
                <div>
                    <span className="font-medium text-neutral-700">{t('userManagement.fields.status')}:</span>
                    <span className="ml-2 text-neutral-900">
                        {user.role.isActive ? t('userManagement.status.active') : t('userManagement.status.inactive')}
                    </span>
                </div>
            </div>
        </div>
    </div>
);

const renderUserDetails = (user: UserWithRole, t: TranslationFunction) => (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
        <div>
            <span className="font-medium text-neutral-700">{t('userManagement.fields.userId')}:</span>
            <span className="ml-2 text-neutral-900">{user.id}</span>
        </div>
        <div>
            <span className="font-medium text-neutral-700">{t('userManagement.fields.roleId')}:</span>
            <span className="ml-2 text-neutral-900">{user.roleId}</span>
        </div>
        <div>
            <span className="font-medium text-neutral-700">{t('userManagement.fields.createdAt')}:</span>
            <span className="ml-2 text-neutral-900">{formatCardDate(user.createdAt)}</span>
        </div>
        <div>
            <span className="font-medium text-neutral-700">{t('userManagement.fields.updatedAt')}:</span>
            <span className="ml-2 text-neutral-900">{formatCardDate(user.updatedAt)}</span>
        </div>
    </div>
);

export const UserDetailDialog: React.FC<UserDetailDialogProps> = ({
    isOpen,
    onClose,
    user,
    onEdit,
    onDelete
}) => {
    const { t } = useLocalization();
    return (
        <StandardDetailDialog
            isOpen={isOpen}
            onClose={onClose}
            record={user}
            onEdit={onEdit}
            onDelete={onDelete}
            title={t('userManagement.userDetails')}
            icon={User}
            renderHeader={renderUserHeader}
            renderContent={(u) => renderUserContent(u, t)}
            renderDetails={(u) => renderUserDetails(u, t)}
            getStatusBadges={(u) => getUserStatusBadges(u, t)}
            getRecordId={(user) => user.id.toString()}
        />
    );
};
