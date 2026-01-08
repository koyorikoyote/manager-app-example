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
import { formatDateForInput } from '../../utils/dateUtils';
import { inquiryValidator } from '../../../shared/validation';
import type { InquiryWithRelations } from '../../../shared/types';

interface InquiryFormDialogProps {
    isOpen: boolean;
    onClose: () => void;
    record?: InquiryWithRelations | null;
    onSubmit: (data: Partial<InquiryWithRelations>) => Promise<void>;
    isLoading?: boolean;
    errors?: FormError[];
    availableCompanies?: Array<{ id: number; name: string }>;
    availableUsers?: Array<{ id: number; name: string }>;
    availableStaff?: Array<{ id: number; name: string; employeeId: string | null }>;
}

interface InquiryFormFieldsProps {
    formData?: Partial<InquiryWithRelations>;
    onFieldChange?: (field: keyof InquiryWithRelations, value: unknown) => void;
    getFieldError?: (field: string) => string | undefined;
    isLoading?: boolean;
    availableCompanies?: Array<{ id: number; name: string }>;
    availableUsers?: Array<{ id: number; name: string }>;
    availableStaff?: Array<{ id: number; name: string; employeeId: string | null }>;
    [key: string]: unknown; // Allow additional props from StandardFormDialog
}

const InquiryFormFields: React.FC<InquiryFormFieldsProps> = React.memo(
    (props) => {
        const {
            formData = {},
            onFieldChange = () => { },
            getFieldError = () => undefined,
            isLoading = false,
            availableCompanies = [],
            availableUsers = [],
            availableStaff = []
        } = props;

        const { t } = useLanguage();

        // Status options
        const statusOptions = [
            { value: 'OPEN', label: t('inquiriesNotifications.progressStatus.OPEN') },
            { value: 'ON_HOLD', label: t('inquiriesNotifications.progressStatus.ON_HOLD') },
            { value: 'CLOSED', label: t('inquiriesNotifications.progressStatus.CLOSED') }
        ];

        // Inquiry type options
        const inquiryTypeOptions = [
            { value: '', label: t('inquiriesNotifications.placeholders.selectInquiryType') },
            { value: 'General', label: t('inquiriesNotifications.types.General') },
            { value: 'Technical', label: t('inquiriesNotifications.types.Technical') },
            { value: 'Billing', label: t('inquiriesNotifications.types.Billing') },
            { value: 'Support', label: t('inquiriesNotifications.types.Support') },
            { value: 'Complaint', label: t('inquiriesNotifications.types.Complaint') }
        ];

        // Company options
        const companyOptions = [
            { value: '', label: t('complaintDetails.placeholders.selectCompany') },
            ...availableCompanies.map(company => ({
                value: company.id.toString(),
                label: company.name
            }))
        ];

        // User options for responder
        const userOptions = [
            { value: '', label: t('complaintDetails.placeholders.selectResponder') },
            ...availableUsers.map(user => ({
                value: user.id.toString(),
                label: user.name
            }))
        ];

        // Staff options for recorder dropdown
        const staffOptions = [
            { value: '', label: t('complaintDetails.placeholders.selectRecorder') },
            ...availableStaff.map(staff => ({
                value: staff.id.toString(),
                label: `${staff.name} (${staff.employeeId})`
            }))
        ];

        return (
            <div className="space-y-6">
                {/* Basic Information Section - Standardized header */}
                <div className="space-y-4">
                    <h4 className="text-lg font-medium text-secondary-900 border-b border-neutral-200 pb-2 mb-4">
                        {t('interactions.sections.basicInformation')}
                    </h4>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                            label={t('inquiriesNotifications.columns.dateOfInquiry')}
                            required
                            error={getFieldError('dateOfInquiry')}
                        >
                            <FormDateInput
                                type="date"
                                value={formatDateForInput(formData.dateOfInquiry as Date | string | null | undefined)}
                                displayValue={formatDateForInput(formData.dateOfInquiry as Date | string | null | undefined)}
                                onChange={(e) => onFieldChange('dateOfInquiry', e.target.value || null)}
                                disabled={isLoading}
                                error={!!getFieldError('dateOfInquiry')}
                            />
                        </FormField>

                        <FormField
                            label={t('inquiriesNotifications.columns.typeOfInquiry')}
                            required
                            error={getFieldError('typeOfInquiry')}
                        >
                            <FormSelect
                                value={formData.typeOfInquiry || ''}
                                onChange={(e) => onFieldChange('typeOfInquiry', e.target.value)}
                                disabled={isLoading}
                                error={!!getFieldError('typeOfInquiry')}
                                options={inquiryTypeOptions}
                            />
                        </FormField>

                        <FormField
                            label={t('inquiriesNotifications.columns.progressStatus')}
                            error={getFieldError('progressStatus')}
                        >
                            <FormSelect
                                value={formData.progressStatus || 'OPEN'}
                                onChange={(e) => onFieldChange('progressStatus', e.target.value)}
                                disabled={isLoading}
                                error={!!getFieldError('progressStatus')}
                                options={statusOptions}
                            />
                        </FormField>

                        <FormField
                            label={t('inquiriesNotifications.columns.resolutionDate')}
                            error={getFieldError('resolutionDate')}
                        >
                            <FormDateInput
                                type="date"
                                value={formatDateForInput(formData.resolutionDate as Date | string | null | undefined)}
                                displayValue={formatDateForInput(formData.resolutionDate as Date | string | null | undefined)}
                                onChange={(e) => onFieldChange('resolutionDate', e.target.value || null)}
                                disabled={isLoading}
                                error={!!getFieldError('resolutionDate')}
                            />
                        </FormField>
                    </div>

                    <FormField
                        label={t('inquiriesNotifications.columns.inquiryContent')}
                        required
                        error={getFieldError('inquiryContent')}
                    >
                        <FormTextarea
                            value={formData.inquiryContent || ''}
                            onChange={(e) => onFieldChange('inquiryContent', e.target.value)}
                            disabled={isLoading}
                            error={!!getFieldError('inquiryContent')}
                            placeholder={t('interactions.placeholders.enterDetailedDescription')}
                            rows={4}
                        />
                    </FormField>
                </div>

                {/* Contact Information Section - Standardized header */}
                <div className="space-y-4">
                    <h4 className="text-lg font-medium text-secondary-900 border-b border-neutral-200 pb-2 mb-4">
                        {t('company.contactInformation')}
                    </h4>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                            label={t('inquiriesNotifications.columns.inquirerName')}
                            required
                            error={getFieldError('inquirerName')}
                        >
                            <FormInput
                                type="text"
                                value={formData.inquirerName || ''}
                                onChange={(e) => onFieldChange('inquirerName', e.target.value)}
                                disabled={isLoading}
                                error={!!getFieldError('inquirerName')}
                                placeholder={t('detailPages.staff.placeholders.enterFullName')}
                            />
                        </FormField>

                        <FormField
                            label={t('inquiriesNotifications.columns.contactInfo')}
                            required
                            error={getFieldError('inquirerContact')}
                        >
                            <FormInput
                                type="text"
                                value={formData.inquirerContact || ''}
                                onChange={(e) => onFieldChange('inquirerContact', e.target.value)}
                                disabled={isLoading}
                                error={!!getFieldError('inquirerContact')}
                                placeholder={t('company.contactInformation')}
                            />
                        </FormField>

                        <FormField
                            label={t('inquiriesNotifications.columns.companyName')}
                            error={getFieldError('companyId')}
                        >
                            <FormSelect
                                value={formData.companyId?.toString() || ''}
                                onChange={(e) => onFieldChange('companyId', e.target.value ? parseInt(e.target.value) : null)}
                                disabled={isLoading}
                                error={!!getFieldError('companyId')}
                                options={companyOptions}
                            />
                        </FormField>
                    </div>
                </div>

                {/* Assignment Section - Standardized header */}
                <div className="space-y-4">
                    <h4 className="text-lg font-medium text-secondary-900 border-b border-neutral-200 pb-2 mb-4">
                        {t('interactions.sections.assignment')}
                    </h4>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                            label={t('complaintDetails.fields.responder')}
                            error={getFieldError('responderId')}
                        >
                            <FormSelect
                                value={formData.responderId?.toString() || ''}
                                onChange={(e) => onFieldChange('responderId', e.target.value ? parseInt(e.target.value) : null)}
                                disabled={isLoading}
                                error={!!getFieldError('responderId')}
                                options={userOptions}
                            />
                        </FormField>

                        <FormField
                            label={t('complaintDetails.fields.recorder')}
                            required
                            error={getFieldError('recorderId')}
                        >
                            <FormSelect
                                value={formData.recorderId?.toString() || ''}
                                onChange={(e) => onFieldChange('recorderId', e.target.value ? parseInt(e.target.value) : null)}
                                disabled={isLoading}
                                error={!!getFieldError('recorderId')}
                                options={staffOptions}
                            />
                        </FormField>
                    </div>
                </div>
            </div>
        );
    });

InquiryFormFields.displayName = "InquiryFormFields";

export const InquiryFormDialog: React.FC<InquiryFormDialogProps> = ({
    isOpen,
    onClose,
    record,
    onSubmit,
    isLoading = false,
    errors = [],
    availableCompanies = [],
    availableUsers = [],
    availableStaff = []
}) => {
    const { t } = useLanguage();

    const title = record
        ? `${t('common.actions.edit')} ${t('inquiriesNotifications.title')}`
        : `${t('common.actions.create')} ${t('inquiriesNotifications.title')}`;

    // Ensure the record has the correct IDs when editing
    const processedRecord = React.useMemo(() => {
        if (!record) return null;

        return {
            ...record,
            // Ensure companyId is properly set from either companyId or company.id
            companyId: record.companyId || record.company?.id,
            // Ensure responderId is properly set from either responderId or responder.id
            responderId: record.responderId || record.responder?.id,
            // Ensure recorderId is properly set from either recorderId or recorder.id
            recorderId: record.recorderId || record.recorder?.id || 0,
        };
    }, [record]);

    return (
        <StandardFormDialog
            isOpen={isOpen}
            onClose={onClose}
            record={processedRecord}
            onSubmit={onSubmit}
            title={title}
            isLoading={isLoading}
            errors={errors}
            validator={inquiryValidator}
            enableRealTimeValidation={true}
            showSuccessMessage={true}
            successMessage={record
                ? t('common.messages.updateSuccess')
                : t('common.messages.createSuccess')
            }
            disableBackdropClick={true}
        >
            <InquiryFormFields
                availableCompanies={availableCompanies}
                availableUsers={availableUsers}
                availableStaff={availableStaff}
            />
        </StandardFormDialog>
    );
};
