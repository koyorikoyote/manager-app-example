import React, { useState, useEffect } from 'react';
import { StandardFormDialog, FormField, FormInput, FormSelect } from './StandardFormDialog';
import { userService } from '../../services/userService';
import { useLanguage } from '../../contexts/LanguageContext';
import type { TranslationFunction } from '../../../shared/types/translations';

interface UserWithRole {
    id: number;
    username: string;
    email: string;
    name: string;
    isActive: boolean;
    languagePreference: "JA" | "EN";
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

interface CreateUserData {
    username: string;
    email: string;
    name: string;
    password: string;
    roleId: number;
    isActive: boolean;
    languagePreference: "JA" | "EN";
}

interface UpdateUserData {
    username?: string;
    email?: string;
    name?: string;
    password?: string;
    roleId?: number;
    isActive?: boolean;
    languagePreference?: "JA" | "EN";
}

interface UserRole {
    id: number;
    name: string;
    description: string | null;
    level: number;
    isActive: boolean;
}

interface UserFormDialogProps {
    isOpen: boolean;
    onClose: () => void;
    user?: UserWithRole | null;
    onSubmit: (data: CreateUserData | UpdateUserData) => Promise<void>;
    isLoading?: boolean;
}

interface UserFormData {
    username: string;
    email: string;
    name: string;
    password: string;
    confirmPassword: string;
    roleId: number;
    isActive: boolean;
    languagePreference: "JA" | "EN";
}

interface UserFormFieldsProps {
    formData?: Partial<UserFormData>;
    onFieldChange?: (field: keyof UserFormData, value: unknown) => void;
    getFieldError?: (field: string) => string | undefined;
    isLoading?: boolean;
    availableRoles?: UserRole[];
    isEditing?: boolean;
    t?: TranslationFunction;
    [key: string]: unknown; // Allow additional props from StandardFormDialog
}

const UserFormFields: React.FC<UserFormFieldsProps> = React.memo(function UserFormFields(props) {
    const {
        formData = {},
        onFieldChange = () => { },
        getFieldError = () => undefined,
        isLoading = false,
        availableRoles = [],
        isEditing = false,
        t = (key: string) => key,
    } = props;

    const roleOptions = availableRoles.map(role => ({
        value: role.id.toString(),
        label: `${role.name} (${t('userManagement.level')} ${role.level})`
    }));

    const languageOptions = [
        { value: 'JA', label: t('userManagement.japanese') },
        { value: 'EN', label: t('userManagement.english') }
    ];

    return (
        <div className="space-y-6">
            {/* Basic Information */}
            <div className="space-y-4">
                <h4 className="text-sm font-medium text-neutral-700 border-b border-neutral-200 pb-2">
                    {t('userManagement.basicInformation')}
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                        label={t('userManagement.fields.username')}
                        required
                        error={getFieldError('username')}
                    >
                        <FormInput
                            type="text"
                            value={formData.username || ''}
                            onChange={(e) => onFieldChange('username', e.target.value)}
                            error={!!getFieldError('username')}
                            disabled={isLoading}
                            placeholder={t('userManagement.placeholders.enterUsername')}
                        />
                    </FormField>

                    <FormField
                        label={t('userManagement.fields.name')}
                        required
                        error={getFieldError('name')}
                    >
                        <FormInput
                            type="text"
                            value={formData.name || ''}
                            onChange={(e) => onFieldChange('name', e.target.value)}
                            error={!!getFieldError('name')}
                            disabled={isLoading}
                            placeholder={t('userManagement.placeholders.enterName')}
                        />
                    </FormField>
                </div>

                <FormField
                    label={t('userManagement.fields.email')}
                    required
                    error={getFieldError('email')}
                >
                    <FormInput
                        type="email"
                        value={formData.email || ''}
                        onChange={(e) => onFieldChange('email', e.target.value)}
                        error={!!getFieldError('email')}
                        disabled={isLoading}
                        placeholder={t('userManagement.placeholders.enterEmail')}
                    />
                </FormField>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                        label={t('userManagement.fields.password')}
                        required={!isEditing}
                        error={getFieldError('password')}
                    >
                        <FormInput
                            type="password"
                            value={formData.password || ''}
                            onChange={(e) => onFieldChange('password', e.target.value)}
                            error={!!getFieldError('password')}
                            disabled={isLoading}
                            placeholder={
                                isEditing
                                    ? t('mobileUserManagement.placeholders.leaveBlankToKeep')
                                    : t('userManagement.placeholders.enterPassword')
                            }
                        />
                    </FormField>

                    <FormField
                        label={t('userManagement.fields.confirmPassword')}
                        required={!isEditing}
                        error={getFieldError('confirmPassword')}
                    >
                        <FormInput
                            type="password"
                            value={formData.confirmPassword || ''}
                            onChange={(e) => onFieldChange('confirmPassword', e.target.value)}
                            error={!!getFieldError('confirmPassword')}
                            disabled={isLoading}
                            placeholder={t('userManagement.placeholders.confirmPassword')}
                        />
                    </FormField>
                </div>
            </div>

            {/* Role and Permissions */}
            <div className="space-y-4">
                <h4 className="text-sm font-medium text-neutral-700 border-b border-neutral-200 pb-2">
                    {t('userManagement.roleInformation')}
                </h4>

                <FormField
                    label={t('userManagement.fields.role')}
                    required
                    error={getFieldError('roleId')}
                >
                    <FormSelect
                        value={formData.roleId?.toString() || ''}
                        onChange={(e) => onFieldChange('roleId', parseInt(e.target.value))}
                        error={!!getFieldError('roleId')}
                        disabled={isLoading}
                        options={roleOptions}
                        placeholder={t('userManagement.placeholders.selectRole')}
                    />
                </FormField>
            </div>

            {/* Preferences */}
            <div className="space-y-4">
                <h4 className="text-sm font-medium text-neutral-700 border-b border-neutral-200 pb-2">
                    {t('userManagement.accountSettings')}
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                        label={t('userManagement.fields.languagePreference')}
                        required
                        error={getFieldError('languagePreference')}
                    >
                        <FormSelect
                            value={formData.languagePreference || 'JA'}
                            onChange={(e) => onFieldChange('languagePreference', e.target.value)}
                            error={!!getFieldError('languagePreference')}
                            disabled={isLoading}
                            options={languageOptions}
                        />
                    </FormField>

                    <FormField
                        label={t('userManagement.fields.isActive')}
                        error={getFieldError('isActive')}
                    >
                        <div className="flex items-center space-x-3 mt-2">
                            <label className="flex items-center">
                                <input
                                    type="checkbox"
                                    checked={formData.isActive ?? true}
                                    onChange={(e) => onFieldChange('isActive', e.target.checked)}
                                    disabled={isLoading}
                                    className="rounded border-neutral-300 text-primary-600 focus:ring-primary-500"
                                />
                                <span className="ml-2 text-sm text-neutral-700">
                                    {t('userManagement.status.active')} ({t('auth.login').toLowerCase()})
                                </span>
                            </label>
                        </div>
                    </FormField>
                </div>
            </div>
        </div>
    );
});

export const UserFormDialog: React.FC<UserFormDialogProps> = ({
    isOpen,
    onClose,
    user,
    onSubmit,
    isLoading = false
}) => {
    const { t } = useLanguage();
    const [availableRoles, setAvailableRoles] = useState<UserRole[]>([]);
    const [loadingRoles, setLoadingRoles] = useState(false);
    const isEditing = !!user;

    // Load available roles when dialog opens
    useEffect(() => {
        if (isOpen) {
            const loadRoles = async () => {
                setLoadingRoles(true);
                try {
                    const roles = await userService.getAvailableRoles();
                    setAvailableRoles(roles);
                } catch (error) {
                    console.error('Failed to load roles:', error);
                    setAvailableRoles([]);
                } finally {
                    setLoadingRoles(false);
                }
            };
            loadRoles();
        }
    }, [isOpen]);

    const handleSubmit = async (formData: Partial<UserFormData>) => {
        const data = formData as UserFormData;

        // Validate password confirmation
        if (data.password || data.confirmPassword) {
            if (data.password !== data.confirmPassword) {
                throw new Error(t('userManagement.validation.passwordsDoNotMatch'));
            }
        }

        if (isEditing) {
            const updateData: UpdateUserData = {
                username: data.username,
                email: data.email,
                name: data.name,
                roleId: data.roleId,
                isActive: data.isActive,
                languagePreference: data.languagePreference,
            };

            // Only include password if it's provided
            if (data.password && data.password.trim()) {
                updateData.password = data.password;
            }

            await onSubmit(updateData);
        } else {
            // For new users, password is required
            if (!data.password || !data.password.trim()) {
                throw new Error(t('userManagement.validation.passwordRequired'));
            }

            const createData: CreateUserData = {
                username: data.username,
                email: data.email,
                name: data.name,
                password: data.password,
                roleId: data.roleId,
                isActive: data.isActive,
                languagePreference: data.languagePreference,
            };

            await onSubmit(createData);
        }
    };

    // Convert user to form data format - memoized to prevent infinite re-renders
    const processedRecord = React.useMemo(() => {
        return user ? {
            username: user.username,
            email: user.email,
            name: user.name,
            password: '',
            confirmPassword: '',
            roleId: user.roleId,
            isActive: user.isActive,
            languagePreference: user.languagePreference,
        } : undefined;
    }, [user]);

    return (
        <StandardFormDialog
            isOpen={isOpen}
            onClose={onClose}
            record={processedRecord}
            onSubmit={handleSubmit}
            title={isEditing ? t('userManagement.editUser') : t('userManagement.createUser')}
            isLoading={isLoading || loadingRoles}
            submitText={isEditing ? t('common.actions.update') : t('common.actions.create')}
            showSuccessMessage={true}
            successMessage={
                isEditing
                    ? t('common.messages.updateSuccess')
                    : t('common.messages.createSuccess')
            }
        >
            <UserFormFields
                availableRoles={availableRoles}
                isEditing={isEditing}
                t={t}
            />
        </StandardFormDialog>
    );
};