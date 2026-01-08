import React from 'react';
import {
    StandardFormDialog,
    FormField,
    FormInput,
    FormDateInput,
    FormSelect,
    FormTextarea,
    type FormError
} from './StandardFormDialog';
import { useLanguage } from '../../contexts/LanguageContext';
import { formatDateForInput, parseDateFromInput } from '../../utils/dateUtils';
import { interactionValidator } from '../../../shared/validation';
import type { InteractionRecord } from '../../../shared/types';

interface InteractionFormDialogProps {
    isOpen: boolean;
    onClose: () => void;
    record?: InteractionRecord | null;
    onSubmit: (data: Partial<InteractionRecord>) => Promise<void>;
    isLoading?: boolean;
    errors?: FormError[];
    availableStaff?: Array<{ id: number; name: string; employeeId: string | null }>;
    availableUsers?: Array<{ id: number; name: string }>;
}

interface InteractionFormFieldsProps {
    formData?: Partial<InteractionRecord>;
    onFieldChange?: (field: keyof InteractionRecord, value: unknown) => void;
    getFieldError?: (field: string) => string | undefined;
    isLoading?: boolean;
    availableStaff?: Array<{ id: number; name: string; employeeId: string | null }>;
    availableUsers?: Array<{ id: number; name: string }>;
    [key: string]: unknown; // Allow additional props from StandardFormDialog
}

// Communication method values - use exact database enum values
// Database expects: enum('Face-to-face','Online','Phone','Email')

const InteractionFormFields: React.FC<InteractionFormFieldsProps> = React.memo(
    (props) => {
        const {
            formData = {},
            onFieldChange = () => { },
            getFieldError = () => undefined,
            isLoading = false,
            availableStaff = [],
            availableUsers = []
        } = props;

        const { t } = useLanguage();

        // Interaction type options - Match database enum values
        const interactionTypes: Array<{ value: string; label: string }> = [
            { value: 'DISCUSSION', label: t('interactions.types.DISCUSSION') },
            { value: 'INTERVIEW', label: t('interactions.types.INTERVIEW') },
            { value: 'CONSULTATION', label: t('interactions.types.CONSULTATION') },
            { value: 'OTHER', label: t('interactions.types.OTHER') },
        ];

        // Status options - Match database enum values
        const statusOptions: Array<{ value: string; label: string }> = [
            { value: 'OPEN', label: t('interactions.open') },
            { value: 'IN_PROGRESS', label: t('interactions.inProgress') },
            { value: 'RESOLVED', label: t('interactions.resolved') },
        ];

        // Communication method options - use internal enum keys matching shared types (InteractionMeans)
        const meansOptions: Array<{ value: string; label: string }> = [
            { value: '', label: t('interactions.placeholders.selectCommunicationMethod') },
            { value: 'FACE_TO_FACE', label: t('interactions.communicationMethods.faceToFace') },
            { value: 'ONLINE', label: t('interactions.communicationMethods.online') },
            { value: 'PHONE', label: t('interactions.communicationMethods.phone') },
            { value: 'EMAIL', label: t('interactions.communicationMethods.email') }
        ];

        // Staff options for person involved
        const staffOptions = [
            { value: '', label: t('interactions.placeholders.selectPersonInvolved') },
            ...availableStaff.map((staff) => ({
                value: staff.id.toString(),
                label: `${staff.name} (${staff.employeeId})`
            }))
        ];

        // User options for user in charge
        const userOptions = [
            { value: '', label: t('interactions.placeholders.selectUserInCharge') },
            ...availableUsers.map((user) => ({
                value: user.id.toString(),
                label: user.name
            }))
        ];

        return (
            <div className="space-y-6">
                {/* Basic Information Section */}
                <div className="space-y-4">
                    <h4 className="text-lg font-medium text-secondary-900 border-b border-neutral-200 pb-2 mb-4">
                        {t('interactions.sections.basicInformation')}
                    </h4>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                            label={t('interactions.type')}
                            required
                            error={getFieldError('type')}
                        >
                            <FormSelect
                                value={formData.type || ''}
                                onChange={(e) => onFieldChange('type', e.target.value)}
                                disabled={isLoading}
                                error={!!getFieldError('type')}
                                options={interactionTypes}
                            />
                        </FormField>

                        <FormField
                            label={t('interactions.columns.date')}
                            required
                            error={getFieldError('date')}
                        >
                            <FormDateInput
                                type="date"
                                value={formatDateForInput(formData.date as Date | string | null | undefined)}
                                displayValue={formatDateForInput(formData.date as Date | string | null | undefined)}
                                onChange={(e) => onFieldChange('date', e.target.value || null)}
                                disabled={isLoading}
                                error={!!getFieldError('date')}
                            />
                        </FormField>

                        <FormField
                            label={t('interactions.fields.name')}
                            error={getFieldError('name')}
                        >
                            <FormInput
                                type="text"
                                value={formData.name || ''}
                                onChange={(e) => onFieldChange('name', e.target.value)}
                                disabled={isLoading}
                                error={!!getFieldError('name')}
                                placeholder={t('interactions.placeholders.enterInteractionName')}
                            />
                        </FormField>

                        <FormField
                            label={t('interactions.fields.title')}
                            error={getFieldError('title')}
                        >
                            <FormInput
                                type="text"
                                value={formData.title || ''}
                                onChange={(e) => onFieldChange('title', e.target.value)}
                                disabled={isLoading}
                                error={!!getFieldError('title')}
                                placeholder={t('interactions.placeholders.enterInteractionTitle')}
                            />
                        </FormField>

                        <FormField
                            label={t('interactions.columns.personConcerned')}
                            error={getFieldError('personConcerned')}
                        >
                            <FormInput
                                type="text"
                                value={formData.personConcerned || ''}
                                onChange={(e) => onFieldChange('personConcerned', e.target.value)}
                                disabled={isLoading}
                                error={!!getFieldError('personConcerned')}
                                placeholder={t('interactions.placeholders.enterPersonConcerned')}
                            />
                        </FormField>

                        <FormField
                            label={t('interactions.status.label')}
                            required
                            error={getFieldError('status')}
                        >
                            <FormSelect
                                value={formData.status || 'OPEN'}
                                onChange={(e) => onFieldChange('status', e.target.value)}
                                disabled={isLoading}
                                error={!!getFieldError('status')}
                                options={statusOptions}
                            />
                        </FormField>
                    </div>
                </div>

                {/* Description Section */}
                <div className="space-y-4">
                    <h4 className="text-lg font-medium text-secondary-900 border-b border-neutral-200 pb-2 mb-4">
                        {t('interactions.sections.description')}
                    </h4>

                    <FormField
                        label={t('interactions.description')}
                        required
                        error={getFieldError('description')}
                    >
                        <FormTextarea
                            value={formData.description || ''}
                            onChange={(e) => onFieldChange('description', e.target.value)}
                            disabled={isLoading}
                            error={!!getFieldError('description')}
                            placeholder={t('interactions.placeholders.enterDetailedDescription')}
                            rows={4}
                        />
                    </FormField>
                </div>

                {/* Assignment Section */}
                <div className="space-y-4">
                    <h4 className="text-lg font-medium text-secondary-900 border-b border-neutral-200 pb-2 mb-4">
                        {t('interactions.sections.assignment')}
                    </h4>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                            label={t('interactions.fields.personInvolved')}
                            error={getFieldError('personInvolvedStaffId')}
                        >
                            <FormSelect
                                value={formData.personInvolvedStaffId?.toString() || ''}
                                onChange={(e) => onFieldChange('personInvolvedStaffId', e.target.value ? parseInt(e.target.value) : null)}
                                disabled={isLoading}
                                error={!!getFieldError('personInvolvedStaffId')}
                                options={staffOptions}
                            />
                        </FormField>

                        <FormField
                            label={t('interactions.fields.userInCharge')}
                            error={getFieldError('userInChargeId')}
                        >
                            <FormSelect
                                value={formData.userInChargeId?.toString() || ''}
                                onChange={(e) => onFieldChange('userInChargeId', e.target.value ? parseInt(e.target.value) : null)}
                                disabled={isLoading}
                                error={!!getFieldError('userInChargeId')}
                                options={userOptions}
                            />
                        </FormField>
                    </div>
                </div>

                {/* Communication Details Section */}
                <div className="space-y-4">
                    <h4 className="text-lg font-medium text-secondary-900 border-b border-neutral-200 pb-2 mb-4">
                        {t('interactions.sections.communicationDetails')}
                    </h4>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                            label={t('interactions.columns.location')}
                            error={getFieldError('location')}
                        >
                            <FormInput
                                type="text"
                                value={formData.location || ''}
                                onChange={(e) => onFieldChange('location', e.target.value)}
                                disabled={isLoading}
                                error={!!getFieldError('location')}
                                placeholder={t('interactions.placeholders.enterLocation')}
                            />
                        </FormField>

                        <FormField
                            label={t('interactions.columns.means')}
                            error={getFieldError('means')}
                        >
                            <FormSelect
                                value={formData.means || ''}
                                onChange={(e) => onFieldChange('means', e.target.value)}
                                disabled={isLoading}
                                error={!!getFieldError('means')}
                                options={meansOptions}
                            />
                        </FormField>
                    </div>

                    <FormField
                        label={t('interactions.columns.responseDetails')}
                        error={getFieldError('responseDetails')}
                    >
                        <FormTextarea
                            value={formData.responseDetails || ''}
                            onChange={(e) => onFieldChange('responseDetails', e.target.value)}
                            disabled={isLoading}
                            error={!!getFieldError('responseDetails')}
                            placeholder={t('interactions.placeholders.enterResponseDetails')}
                            rows={4}
                        />
                    </FormField>
                </div>
            </div>
        );
    });

InteractionFormFields.displayName = "InteractionFormFields";

export const InteractionFormDialog: React.FC<InteractionFormDialogProps> = ({
    isOpen,
    onClose,
    record,
    onSubmit,
    isLoading = false,
    errors = [],
    availableStaff = [],
    availableUsers = []
}) => {
    const { t } = useLanguage();

    const title = record
        ? t('interactions.editRecord')
        : t('interactions.addNew');

    // Ensure the record has the correct IDs and formats when editing
    const processedRecord = React.useMemo(() => {
        if (!record) return null;

        const processed = {
            ...record,
            // Ensure personInvolvedStaffId is properly set from either personInvolvedStaffId or personInvolved.id
            personInvolvedStaffId: record.personInvolvedStaffId || record.personInvolved?.id,
            // Ensure userInChargeId is properly set from either userInChargeId or userInCharge.id
            userInChargeId: record.userInChargeId || record.userInCharge?.id,
            // Ensure type is in uppercase format for validation
            type: record.type ? (record.type.toString().toUpperCase() as any) : record.type,
            // Ensure status is in uppercase format for validation
            status: record.status ? (record.status.toString().toUpperCase().replace('-', '_') as any) : record.status,
            // Normalize means value: convert DB-mapped strings to internal enum keys (FACE_TO_FACE/ONLINE/PHONE/EMAIL)
            means: (() => {
                const m = record.means as any;
                if (!m) return '';
                const map: Record<string, string> = {
                    'Face-to-face': 'FACE_TO_FACE',
                    'Online': 'ONLINE',
                    'Phone': 'PHONE',
                    'Email': 'EMAIL'
                };
                return typeof m === 'string' && map[m] ? map[m] : m;
            })(),
        };

        return processed;
    }, [record]);

    // Handle form submission with format conversion
    const handleSubmit = React.useCallback(async (data: Partial<InteractionRecord>) => {
        // Normalize date: ensure Date instance for service layer (Tokyo-aware)
        const normalizedDate = data.date
            ? (typeof data.date === 'string' ? parseDateFromInput(data.date) : data.date)
            : undefined;
        const processedData = {
            ...data,
            // Ensure type is in correct database format
            type: data.type ? (data.type.toString().toUpperCase() as InteractionRecord['type']) : data.type,
            // Ensure status is in correct database format  
            status: data.status ? (data.status.toString().toUpperCase().replace('-', '_') as InteractionRecord['status']) : data.status,
            // Pass means directly - no conversion needed
            means: data.means || undefined,
            // Ensure 'date' is a Date object (avoid .toISOString error in service)
            date: normalizedDate && !isNaN(normalizedDate as unknown as number) ? normalizedDate : undefined,
        };

        await onSubmit(processedData);
    }, [onSubmit]);

    return (
        <StandardFormDialog
            isOpen={isOpen}
            onClose={onClose}
            record={processedRecord}
            onSubmit={handleSubmit}
            title={title}
            isLoading={isLoading}
            errors={errors}
            validator={interactionValidator}
            enableRealTimeValidation={true}
            showSuccessMessage={true}
            successMessage={record
                ? t('common.messages.updateSuccess')
                : t('common.messages.createSuccess')
            }
            submitText={t('common.actions.save')}
            cancelText={t('common.actions.cancel')}
            disableBackdropClick={true}
        >
            <InteractionFormFields
                availableStaff={availableStaff}
                availableUsers={availableUsers}
            />
        </StandardFormDialog>
    );
};
