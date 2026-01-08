import React from 'react';
import { useResponsive } from '../../hooks/useResponsive';
import { useResponsiveNavigation } from '../../hooks/useResponsiveNavigation';
import { useLanguage } from '../../contexts/LanguageContext';
import { cn } from '../../utils/cn';
import { staffService } from '../../services/staffService';
import { FormField, FormInput, FormSelect, FormTextarea } from '../ui/StandardFormDialog';
import { AddressClickableField } from '../ui/AddressClickableField';
import type { Staff } from '../../../shared/types';
import { TOKYO_TZ, toTokyoISODate } from '../../../shared/utils/timezone';

export interface BasicInformationTabProps {
    staff: Staff;
    isEditMode: boolean;
    onFieldChange?: (field: keyof Staff, value: unknown) => void;
    getFieldError?: (field: string) => string | undefined;
    availableUsers?: Array<{ id: number; name: string }>;
    availableNationalities?: string[];
}

/**
 * Helper functions (module scope to avoid creating during render)
 */
const formatDate = (date: Date | string | null | undefined): string => {
    if (!date) return '-';
    try {
        const dateObj = typeof date === 'string' ? new Date(date) : date;
        return dateObj.toLocaleDateString('ja-JP', {
            timeZone: TOKYO_TZ,
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
        });
    } catch {
        return '-';
    }
};

const formatPostalCode = (postalCode: string | null | undefined): string => {
    if (!postalCode) return '-';
    return `〒${postalCode}`;
};

const formatBoolean = (value: boolean | null | undefined): string => {
    if (value === null || value === undefined) return '-';
    return value ? 'Yes' : 'No';
};

const formatEnumValue = (value: string | null | undefined): string => {
    if (!value) return '-';
    return value.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
};

const formatDateForInput = (date: Date | string | null | undefined): string => {
    if (!date) return '';
    return toTokyoISODate(typeof date === 'string' ? new Date(date) : date);
};

/**
 * FieldDisplay: extracted to module scope to satisfy lint rule
 */
interface FieldDisplayProps {
    label: string;
    value: React.ReactNode;
    className?: string;
    field?: keyof Staff;
    type?: 'text' | 'email' | 'tel' | 'number' | 'date' | 'select' | 'textarea';
    options?: Array<{ value: string; label: string }>;
    required?: boolean;
    // Dependencies previously captured via closure
    isEditMode: boolean;
    isMobile: boolean;
    staff: Staff;
    onFieldChange?: (field: keyof Staff, value: unknown) => void;
    getFieldError?: (field: string) => string | undefined;
}

const FieldDisplay: React.FC<FieldDisplayProps> = ({
    label,
    value,
    className,
    field,
    type = 'text',
    options,
    required = false,
    isEditMode,
    isMobile,
    staff,
    onFieldChange,
    getFieldError,
}) => {
    if (isEditMode && field && onFieldChange) {
        return (
            <div className={className}>
                <FormField
                    label={label}
                    required={required}
                    error={field ? getFieldError?.(field as string) : undefined}
                >
                    {type === 'select' && options ? (
                        <FormSelect
                            value={
                                field === 'familySpouse'
                                    ? staff.familySpouse === true
                                        ? 'true'
                                        : staff.familySpouse === false
                                            ? 'false'
                                            : ''
                                    : String(staff[field] ?? '')
                            }
                            onChange={(e) => {
                                if (field === 'familySpouse') {
                                    const v = e.target.value;
                                    if (v === 'true') onFieldChange(field, true);
                                    else if (v === 'false') onFieldChange(field, false);
                                    else onFieldChange(field, null);
                                } else if (field === 'userInChargeId') {
                                    const v = e.target.value;
                                    onFieldChange(field, v ? Number(v) : null);
                                } else {
                                    onFieldChange(field, e.target.value || null);
                                }
                            }}
                            error={!!(field && getFieldError?.(field as string))}
                            options={options}
                        />
                    ) : type === 'textarea' ? (
                        <FormTextarea
                            value={String(staff[field] || '')}
                            onChange={(e) => onFieldChange(field, e.target.value || null)}
                            error={!!(field && getFieldError?.(field as string))}
                            rows={3}
                        />
                    ) : type === 'number' ? (
                        <FormInput
                            type="number"
                            value={staff[field] ? String(staff[field]) : ''}
                            onChange={(e) => {
                                const v = e.target.value.trim();
                                if (v === '') {
                                    onFieldChange(field, null);
                                } else {
                                    const numValue = parseFloat(v);
                                    onFieldChange(field, Number.isNaN(numValue) ? v : numValue);
                                }
                            }}
                            error={!!(field && getFieldError?.(field as string))}
                        />
                    ) : (
                        <FormInput
                            type={type}
                            value={
                                type === 'date'
                                    ? formatDateForInput(staff[field] as Date | string)
                                    : String(staff[field] || '')
                            }
                            onChange={(e) => onFieldChange(field, e.target.value || null)}
                            error={!!(field && getFieldError?.(field as string))}
                        />
                    )}
                </FormField>
            </div>
        );
    }

    return (
        <div className={cn('space-y-1', className)}>
            <dt className={cn('font-medium text-neutral-600', isMobile ? 'text-xs' : 'text-sm')}>
                {label}
            </dt>
            <dd
                className={cn(
                    'text-neutral-900 break-words',
                    type === 'textarea' && 'whitespace-pre-wrap',
                    isMobile ? 'text-sm' : 'text-sm'
                )}
            >
                {value || '-'}
            </dd>
        </div>
    );
};

/**
 * Section: extracted to module scope to satisfy lint rule
 */
interface SectionProps {
    title: string;
    children: React.ReactNode;
    className?: string;
    isMobile: boolean;
    isTablet: boolean;
}

const Section: React.FC<SectionProps> = ({ title, children, className, isMobile, isTablet }) => (
    <div className={cn(isMobile ? 'space-y-3' : 'space-y-4', className)}>
        <h4 className={cn('font-semibold text-neutral-900 border-b border-neutral-200 pb-2', isMobile ? 'text-base' : 'text-lg')}>
            {title}
        </h4>
        <dl
            className={cn(
                'grid',
                isMobile ? 'grid-cols-1 gap-3' : isTablet ? 'grid-cols-2 gap-4' : 'grid-cols-3 gap-4'
            )}
        >
            {children}
        </dl>
    </div>
);

/**
 * ArraySection: extracted to module scope to satisfy lint rule
 */
interface ArraySectionProps {
    title: string;
    items: Array<Record<string, unknown>>;
    renderItem: (item: Record<string, unknown>, index: number) => React.ReactNode;
    className?: string;
}

const ArraySection: React.FC<ArraySectionProps> = ({ title, items, renderItem, className }) => (
    <div className={cn('space-y-4', className)}>
        <h4 className="text-lg font-semibold text-neutral-900 border-b border-neutral-200 pb-2">
            {title}
        </h4>
        {items.length > 0 ? (
            <div className="space-y-4">
                {items.map((item, index) => (
                    <div key={index} className="bg-neutral-50 rounded-lg p-4 border border-neutral-200">
                        <h5 className="text-sm font-medium text-neutral-700 mb-3">
                            {title.slice(0, -1)} {index + 1}
                        </h5>
                        {renderItem(item, index)}
                    </div>
                ))}
            </div>
        ) : (
            <p className="text-sm text-neutral-500 italic">No {title.toLowerCase()} records</p>
        )}
    </div>
);

export const BasicInformationTab: React.FC<BasicInformationTabProps> = ({
    staff,
    isEditMode,
    onFieldChange,
    getFieldError,
    availableUsers = [],
    availableNationalities = [],
}) => {
    const { t: _t } = useLanguage();
    const { isMobile, isTablet } = useResponsive();
    const { navigateToDetail } = useResponsiveNavigation();

    // Options for dropdowns
    const statusOptions = [
        { value: 'ACTIVE', label: _t('detailPages.staff.options.active') },
        { value: 'INACTIVE', label: _t('detailPages.staff.options.inactive') },
        { value: 'ON_LEAVE', label: _t('detailPages.staff.options.onLeave') },
        { value: 'TERMINATED', label: _t('detailPages.staff.options.terminated') },
    ];

    const userOptions = [
        { value: '', label: _t('detailPages.common.selectOption') },
        ...availableUsers.map((user) => ({
            value: user.id.toString(),
            label: user.name,
        })),
    ];

    const nationalityOptions = [
        { value: '', label: _t('detailPages.common.selectOption') },
        ...availableNationalities.map((nationality) => ({
            value: nationality,
            label: nationality,
        })),
    ];


    const residenceStatusOptions = [
        { value: '', label: _t('detailPages.common.selectOption') },
        { value: 'ENGINEER', label: _t('detailPages.staff.options.ENGINEER') },
        { value: 'DESIGNATED_ACTIVITIES', label: _t('detailPages.staff.options.DESIGNATED_ACTIVITIES') },
        { value: 'PERMANENT_RESIDENT', label: _t('detailPages.staff.options.PERMANENT_RESIDENT') },
        { value: 'LONG_TERM_RESIDENT', label: _t('detailPages.staff.options.LONG_TERM_RESIDENT') },
        { value: 'SPOUSE_OF_JAPANESE_NATIONAL', label: _t('detailPages.staff.options.SPOUSE_OF_JAPANESE_NATIONAL') },
        { value: 'SPOUSE_OF_PERMANENT_RESIDENT', label: _t('detailPages.staff.options.SPOUSE_OF_PERMANENT_RESIDENT') },
        { value: 'HIGHLY_SKILLED_PROFESSIONAL', label: _t('detailPages.staff.options.HIGHLY_SKILLED_PROFESSIONAL') },
        { value: 'NURSING_CARE', label: _t('detailPages.staff.options.NURSING_CARE') },
        { value: 'MEDICAL_CARE', label: _t('detailPages.staff.options.MEDICAL_CARE') },
        { value: 'BUSINESS_MANAGEMENT', label: _t('detailPages.staff.options.BUSINESS_MANAGEMENT') },
        { value: 'LEGAL_ACCOUNTING_SERVICES', label: _t('detailPages.staff.options.LEGAL_ACCOUNTING_SERVICES') },
        { value: 'ARTIST', label: _t('detailPages.staff.options.ARTIST') },
        { value: 'PROFESSOR', label: _t('detailPages.staff.options.PROFESSOR') },
        { value: 'TEACHER', label: _t('detailPages.staff.options.TEACHER') },
        { value: 'STUDENT', label: _t('detailPages.staff.options.STUDENT') },
        { value: 'OTHER', label: _t('detailPages.staff.options.OTHER') },
    ];

    // Process ordered array fields using staffService helper
    const { education, workHistory } = staffService.processOrderedArrayFields(staff);

    // Localized display helpers for non-edit mode
    const tKey = (key: string): string => _t(key as unknown as Parameters<typeof _t>[0]);
    const getCountryLabel = (country?: string | null): string => {
        if (!country) return '-';
        const key = `staff.countries.${country}`;
        const translated = tKey(key);
        return translated === key ? String(country) : translated;
    };

    const getStatusLabel = (status?: string | null): string => {
        if (!status) return '-';
        const candidates = [status, status.toLowerCase(), status.toUpperCase()];
        for (const c of candidates) {
            const key = `staff.status.${c}`;
            const translated = tKey(key);
            if (translated !== key) return translated;
        }
        return formatEnumValue(status);
    };

    return (
        <div className={cn('space-y-6', isMobile ? 'space-y-4' : isTablet ? 'space-y-5' : 'space-y-8')}>
            {/* Basic Personal Information */}
            <Section
                title={_t('detailPages.staff.sections.personalInformation')}
                isMobile={isMobile}
                isTablet={isTablet}
            >
                <FieldDisplay
                    label={_t('detailPages.staff.fields.employeeId')}
                    value={staff.employeeId}
                    field="employeeId"
                    required={true}
                    isEditMode={isEditMode}
                    isMobile={isMobile}
                    staff={staff}
                    onFieldChange={onFieldChange}
                    getFieldError={getFieldError}
                />
                <FieldDisplay
                    label={_t('detailPages.staff.fields.name')}
                    value={staff.name}
                    field="name"
                    required={true}
                    isEditMode={isEditMode}
                    isMobile={isMobile}
                    staff={staff}
                    onFieldChange={onFieldChange}
                    getFieldError={getFieldError}
                />
                <FieldDisplay
                    label={_t('detailPages.staff.fields.dateOfBirth')}
                    value={formatDate(staff.dateOfBirth)}
                    field="dateOfBirth"
                    type="date"
                    isEditMode={isEditMode}
                    isMobile={isMobile}
                    staff={staff}
                    onFieldChange={onFieldChange}
                    getFieldError={getFieldError}
                />
                <FieldDisplay
                    label={_t('detailPages.staff.fields.age')}
                    value={staff.age}
                    field="age"
                    type="number"
                    isEditMode={isEditMode}
                    isMobile={isMobile}
                    staff={staff}
                    onFieldChange={onFieldChange}
                    getFieldError={getFieldError}
                />
                <FieldDisplay
                    label={_t('detailPages.staff.fields.nationality')}
                    value={isEditMode ? staff.nationality : getCountryLabel(staff.nationality)}
                    field="nationality"
                    type="select"
                    options={nationalityOptions}
                    isEditMode={isEditMode}
                    isMobile={isMobile}
                    staff={staff}
                    onFieldChange={onFieldChange}
                    getFieldError={getFieldError}
                />
                <FieldDisplay
                    label={_t('detailPages.staff.fields.residenceStatus')}
                    value={
                        isEditMode
                            ? staff.residenceStatus
                            : (residenceStatusOptions.find((opt) => opt.value === staff.residenceStatus)?.label ?? '')
                    }
                    field="residenceStatus"
                    type="select"
                    options={residenceStatusOptions}
                    isEditMode={isEditMode}
                    isMobile={isMobile}
                    staff={staff}
                    onFieldChange={onFieldChange}
                    getFieldError={getFieldError}
                />
            </Section>

            {/* Contact Information */}
            <Section
                title={_t('detailPages.staff.sections.contactInformation')}
                isMobile={isMobile}
                isTablet={isTablet}
            >
                <FieldDisplay
                    label={_t('detailPages.staff.fields.email')}
                    value={staff.email}
                    field="email"
                    type="email"
                    isEditMode={isEditMode}
                    isMobile={isMobile}
                    staff={staff}
                    onFieldChange={onFieldChange}
                    getFieldError={getFieldError}
                />
                <FieldDisplay
                    label={_t('detailPages.staff.fields.phone')}
                    value={staff.phone}
                    field="phone"
                    type="tel"
                    isEditMode={isEditMode}
                    isMobile={isMobile}
                    staff={staff}
                    onFieldChange={onFieldChange}
                    getFieldError={getFieldError}
                />
                <FieldDisplay
                    label={_t('detailPages.staff.fields.mobile')}
                    value={staff.mobile}
                    field="mobile"
                    type="tel"
                    isEditMode={isEditMode}
                    isMobile={isMobile}
                    staff={staff}
                    onFieldChange={onFieldChange}
                    getFieldError={getFieldError}
                />
                <FieldDisplay
                    label={_t('detailPages.staff.fields.fax')}
                    value={staff.fax}
                    field="fax"
                    type="tel"
                    isEditMode={isEditMode}
                    isMobile={isMobile}
                    staff={staff}
                    onFieldChange={onFieldChange}
                    getFieldError={getFieldError}
                />
                {/* Postal Code + Address side-by-side (postal first, address takes remaining width) */}
                {isEditMode ? (
                    <div className="col-span-full">
                        <div className="flex flex-col md:flex-row gap-4 items-start">
                            <FieldDisplay
                                label={_t('detailPages.staff.fields.postalCode')}
                                value={staff.postalCode}
                                field="postalCode"
                                className="w-32 shrink-0"
                                isEditMode={isEditMode}
                                isMobile={isMobile}
                                staff={staff}
                                onFieldChange={onFieldChange}
                                getFieldError={getFieldError}
                            />
                            <FieldDisplay
                                label={_t('detailPages.staff.fields.address')}
                                value={staff.address}
                                field="address"
                                type="textarea"
                                className="flex-1"
                                isEditMode={isEditMode}
                                isMobile={isMobile}
                                staff={staff}
                                onFieldChange={onFieldChange}
                                getFieldError={getFieldError}
                            />
                        </div>
                    </div>
                ) : (
                    <div className="col-span-full">
                        <div className="flex flex-col md:flex-row gap-4 items-baseline">
                            <div className="w-24 shrink-0">
                                <dt className={cn('font-medium text-neutral-600 whitespace-nowrap', isMobile ? 'text-xs' : 'text-sm')}>
                                    {_t('detailPages.staff.fields.postalCode')}
                                </dt>
                                <dd className={cn('text-neutral-900 break-words inline-block align-baseline', isMobile ? 'text-sm' : 'text-sm')}>
                                    {formatPostalCode(staff.postalCode)}
                                </dd>
                            </div>
                            <div className="flex-1 min-w-0">
                                <dt className={cn('font-medium text-neutral-600 whitespace-nowrap', isMobile ? 'text-xs' : 'text-sm')}>
                                    {_t('detailPages.staff.fields.address')}
                                </dt>
                                <dd className={cn('text-neutral-900 break-words inline-block align-baseline', isMobile ? 'text-sm' : 'text-sm')}>
                                    <AddressClickableField address={staff.address} />
                                </dd>
                            </div>
                        </div>
                    </div>
                )}
            </Section>

            {/* Employment Information */}
            <Section
                title={_t('detailPages.staff.sections.employmentInformation')}
                isMobile={isMobile}
                isTablet={isTablet}
            >
                <div className="col-span-full w-full">
                    <FieldDisplay
                        label={_t('detailPages.staff.fields.status')}
                        value={isEditMode ? staff.status : getStatusLabel(staff.status)}
                        field="status"
                        type="select"
                        options={statusOptions}
                        isEditMode={isEditMode}
                        isMobile={isMobile}
                        staff={staff}
                        onFieldChange={onFieldChange}
                        getFieldError={getFieldError}
                    />
                </div>
                <FieldDisplay
                    label={_t('detailPages.staff.fields.company')}
                    value={
                        staff.company?.id ? (
                            <button
                                type="button"
                                className="text-blue-600 hover:underline focus:outline-none p-0 bg-transparent cursor-pointer"
                                onClick={() => navigateToDetail(String(staff.company!.id), 'destination')}
                            >
                                {staff.company!.name}
                            </button>
                        ) : (
                            staff.company?.name || '-'
                        )
                    }
                    isEditMode={isEditMode}
                    isMobile={isMobile}
                    staff={staff}
                />
                <FieldDisplay
                    label={_t('detailPages.staff.fields.department')}
                    value={staff.department}
                    field="department"
                    required={true}
                    isEditMode={isEditMode}
                    isMobile={isMobile}
                    staff={staff}
                    onFieldChange={onFieldChange}
                    getFieldError={getFieldError}
                />
                <FieldDisplay
                    label={_t('detailPages.staff.fields.position')}
                    value={staff.position}
                    field="position"
                    required={true}
                    isEditMode={isEditMode}
                    isMobile={isMobile}
                    staff={staff}
                    onFieldChange={onFieldChange}
                    getFieldError={getFieldError}
                />
                <div className="col-span-full w-full">
                    <FieldDisplay
                        label={_t('detailPages.staff.fields.userInCharge')}
                        value={isEditMode ? staff.userInChargeId : staff.userInCharge?.name || '-'}
                        field="userInChargeId"
                        type="select"
                        options={userOptions}
                        isEditMode={isEditMode}
                        isMobile={isMobile}
                        staff={staff}
                        onFieldChange={onFieldChange}
                        getFieldError={getFieldError}
                    />
                </div>
                <FieldDisplay
                    label={_t('detailPages.staff.fields.hireDate')}
                    value={formatDate(staff.hireDate)}
                    field="hireDate"
                    type="date"
                    isEditMode={isEditMode}
                    isMobile={isMobile}
                    staff={staff}
                    onFieldChange={onFieldChange}
                    getFieldError={getFieldError}
                />
                <FieldDisplay
                    label={_t('detailPages.staff.fields.salary')}
                    value={isEditMode ? staff.salary : staff.salary ? `¥${staff.salary.toLocaleString()}` : '-'}
                    field="salary"
                    type="number"
                    isEditMode={isEditMode}
                    isMobile={isMobile}
                    staff={staff}
                    onFieldChange={onFieldChange}
                    getFieldError={getFieldError}
                />
            </Section>

            {/* Hire Period Information */}
            <Section
                title={_t('detailPages.staff.sections.periodOfStay')}
                isMobile={isMobile}
                isTablet={isTablet}
            >
                <FieldDisplay
                    label={_t('detailPages.staff.fields.periodStart')}
                    value={formatDate(staff.periodOfStayDateStart)}
                    field="periodOfStayDateStart"
                    type="date"
                    isEditMode={isEditMode}
                    isMobile={isMobile}
                    staff={staff}
                    onFieldChange={onFieldChange}
                    getFieldError={getFieldError}
                />
                <FieldDisplay
                    label={_t('detailPages.staff.fields.periodEnd')}
                    value={formatDate(staff.periodOfStayDateEnd)}
                    field="periodOfStayDateEnd"
                    type="date"
                    isEditMode={isEditMode}
                    isMobile={isMobile}
                    staff={staff}
                    onFieldChange={onFieldChange}
                    getFieldError={getFieldError}
                />
            </Section>

            {/* Qualifications and Language */}
            <Section
                title={_t('detailPages.staff.sections.qualificationsLanguage')}
                isMobile={isMobile}
                isTablet={isTablet}
            >
                <FieldDisplay
                    label={_t('detailPages.staff.fields.qualificationsAndLicenses')}
                    value={staff.qualificationsAndLicenses}
                    field="qualificationsAndLicenses"
                    type="textarea"
                    className="col-span-full"
                    isEditMode={isEditMode}
                    isMobile={isMobile}
                    staff={staff}
                    onFieldChange={onFieldChange}
                    getFieldError={getFieldError}
                />
                <FieldDisplay
                    label={_t('detailPages.staff.fields.japaneseProficiency')}
                    value={staff.japaneseProficiency}
                    field="japaneseProficiency"
                    type="textarea"
                    className="col-span-full"
                    isEditMode={isEditMode}
                    isMobile={isMobile}
                    staff={staff}
                    onFieldChange={onFieldChange}
                    getFieldError={getFieldError}
                />
                <FieldDisplay
                    label={_t('detailPages.staff.fields.japaneseProficiencyRemarks')}
                    value={staff.japaneseProficiencyRemarks}
                    field="japaneseProficiencyRemarks"
                    type="textarea"
                    className="col-span-full"
                    isEditMode={isEditMode}
                    isMobile={isMobile}
                    staff={staff}
                    onFieldChange={onFieldChange}
                    getFieldError={getFieldError}
                />
            </Section>

            {/* Education History */}
            <ArraySection
                title={_t('detailPages.staff.sections.educationHistory')}
                items={education}
                renderItem={(item) => (
                    <dl className={cn('grid gap-3', isMobile ? 'grid-cols-1' : 'grid-cols-2')}>
                        <FieldDisplay
                            label={_t('detailPages.staff.fields.institutionName')}
                            value={item.name as string}
                            isEditMode={false}
                            isMobile={isMobile}
                            staff={staff}
                        />
                        <FieldDisplay
                            label={_t('detailPages.staff.fields.educationType')}
                            value={formatEnumValue(item.type as string)}
                            isEditMode={false}
                            isMobile={isMobile}
                            staff={staff}
                        />
                    </dl>
                )}
            />

            {/* Work History */}
            <ArraySection
                title={_t('detailPages.staff.sections.workHistory')}
                items={workHistory}
                renderItem={(item) => (
                    <dl
                        className={cn(
                            'grid gap-3',
                            isMobile ? 'grid-cols-1' : isTablet ? 'grid-cols-2' : 'grid-cols-3'
                        )}
                    >
                        <FieldDisplay
                            label={_t('detailPages.staff.fields.companyName')}
                            value={item.name as string}
                            isEditMode={false}
                            isMobile={isMobile}
                            staff={staff}
                        />
                        <FieldDisplay
                            label={_t('detailPages.staff.fields.position')}
                            value={item.position as string}
                            isEditMode={false}
                            isMobile={isMobile}
                            staff={staff}
                        />
                        <FieldDisplay
                            label={_t('detailPages.staff.fields.employmentType')}
                            value={formatEnumValue(item.employmentType as string)}
                            isEditMode={false}
                            isMobile={isMobile}
                            staff={staff}
                        />
                        <FieldDisplay
                            label={_t('detailPages.staff.fields.startDate')}
                            value={formatDate(item.dateStart as Date)}
                            isEditMode={false}
                            isMobile={isMobile}
                            staff={staff}
                        />
                        <FieldDisplay
                            label={_t('detailPages.staff.fields.endDate')}
                            value={formatDate(item.dateEnd as Date)}
                            isEditMode={false}
                            isMobile={isMobile}
                            staff={staff}
                        />
                        <FieldDisplay
                            label={_t('detailPages.staff.fields.country')}
                            value={item.countryLocation as string}
                            isEditMode={false}
                            isMobile={isMobile}
                            staff={staff}
                        />
                        <FieldDisplay
                            label={_t('detailPages.staff.fields.city')}
                            value={item.cityLocation as string}
                            isEditMode={false}
                            isMobile={isMobile}
                            staff={staff}
                        />
                        <FieldDisplay
                            label={_t('detailPages.staff.fields.description')}
                            value={item.description as string}
                            type="textarea"
                            className="col-span-full"
                            isEditMode={false}
                            isMobile={isMobile}
                            staff={staff}
                        />
                    </dl>
                )}
            />

            {/* Personal Details */}
            <Section
                title={_t('detailPages.staff.sections.personalDetails')}
                isMobile={isMobile}
                isTablet={isTablet}
            >
                <FieldDisplay
                    label={_t('detailPages.staff.fields.reasonForApplying')}
                    value={staff.reasonForApplying}
                    field="reasonForApplying"
                    type="textarea"
                    className="col-span-full"
                    isEditMode={isEditMode}
                    isMobile={isMobile}
                    staff={staff}
                    onFieldChange={onFieldChange}
                    getFieldError={getFieldError}
                />
                <FieldDisplay
                    label={_t('detailPages.staff.fields.motivationToComeJapan')}
                    value={staff.motivationToComeJapan}
                    field="motivationToComeJapan"
                    type="textarea"
                    className="col-span-full"
                    isEditMode={isEditMode}
                    isMobile={isMobile}
                    staff={staff}
                    onFieldChange={onFieldChange}
                    getFieldError={getFieldError}
                />
                <FieldDisplay
                    label={_t('detailPages.staff.fields.hasSpouse')}
                    value={isEditMode ? staff.familySpouse : formatBoolean(staff.familySpouse)}
                    field="familySpouse"
                    type="select"
                    options={[
                        { value: '', label: _t('detailPages.common.selectOption') },
                        { value: 'true', label: _t('detailPages.common.yes') },
                        { value: 'false', label: _t('detailPages.common.no') },
                    ]}
                    isEditMode={isEditMode}
                    isMobile={isMobile}
                    staff={staff}
                    onFieldChange={onFieldChange}
                    getFieldError={getFieldError}
                />
                <FieldDisplay
                    label={_t('detailPages.staff.fields.numberOfChildren')}
                    value={staff.familyChildren}
                    field="familyChildren"
                    type="number"
                    isEditMode={isEditMode}
                    isMobile={isMobile}
                    staff={staff}
                    onFieldChange={onFieldChange}
                    getFieldError={getFieldError}
                />
                <FieldDisplay
                    label={_t('detailPages.staff.fields.hobbiesAndInterests')}
                    value={staff.hobbyAndInterests}
                    field="hobbyAndInterests"
                    type="textarea"
                    className="col-span-full"
                    isEditMode={isEditMode}
                    isMobile={isMobile}
                    staff={staff}
                    onFieldChange={onFieldChange}
                    getFieldError={getFieldError}
                />
            </Section>

            {/* Emergency Contacts */}
            <Section
                title={_t('detailPages.staff.sections.emergencyContacts')}
                isMobile={isMobile}
                isTablet={isTablet}
            >
                <div className="col-span-full space-y-6">
                    {/* Primary Contact */}
                    <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                        <h5 className="text-sm font-medium text-blue-900 mb-3">
                            {_t('detailPages.staff.fields.primaryContact')}
                        </h5>
                        <dl className={cn('grid gap-3', isMobile ? 'grid-cols-1' : 'grid-cols-2')}>
                            <FieldDisplay
                                label={_t('detailPages.staff.fields.contactName')}
                                value={staff.emergencyContactPrimaryName}
                                field="emergencyContactPrimaryName"
                                isEditMode={isEditMode}
                                isMobile={isMobile}
                                staff={staff}
                                onFieldChange={onFieldChange}
                                getFieldError={getFieldError}
                            />
                            <FieldDisplay
                                label={_t('detailPages.staff.fields.relationship')}
                                value={staff.emergencyContactPrimaryRelationship}
                                field="emergencyContactPrimaryRelationship"
                                isEditMode={isEditMode}
                                isMobile={isMobile}
                                staff={staff}
                                onFieldChange={onFieldChange}
                                getFieldError={getFieldError}
                            />
                            <FieldDisplay
                                label={_t('detailPages.staff.fields.phoneNumber')}
                                value={staff.emergencyContactPrimaryNumber}
                                field="emergencyContactPrimaryNumber"
                                type="tel"
                                isEditMode={isEditMode}
                                isMobile={isMobile}
                                staff={staff}
                                onFieldChange={onFieldChange}
                                getFieldError={getFieldError}
                            />
                            <FieldDisplay
                                label={_t('detailPages.staff.fields.email')}
                                value={staff.emergencyContactPrimaryEmail}
                                field="emergencyContactPrimaryEmail"
                                type="email"
                                isEditMode={isEditMode}
                                isMobile={isMobile}
                                staff={staff}
                                onFieldChange={onFieldChange}
                                getFieldError={getFieldError}
                            />
                        </dl>
                    </div>

                    {/* Secondary Contact */}
                    <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                        <h5 className="text-sm font-medium text-green-900 mb-3">
                            {_t('detailPages.staff.fields.secondaryContact')}
                        </h5>
                        <dl className={cn('grid gap-3', isMobile ? 'grid-cols-1' : 'grid-cols-2')}>
                            <FieldDisplay
                                label={_t('detailPages.staff.fields.contactName')}
                                value={staff.emergencyContactSecondaryName}
                                field="emergencyContactSecondaryName"
                                isEditMode={isEditMode}
                                isMobile={isMobile}
                                staff={staff}
                                onFieldChange={onFieldChange}
                                getFieldError={getFieldError}
                            />
                            <FieldDisplay
                                label={_t('detailPages.staff.fields.relationship')}
                                value={staff.emergencyContactSecondaryRelationship}
                                field="emergencyContactSecondaryRelationship"
                                isEditMode={isEditMode}
                                isMobile={isMobile}
                                staff={staff}
                                onFieldChange={onFieldChange}
                                getFieldError={getFieldError}
                            />
                            <FieldDisplay
                                label={_t('detailPages.staff.fields.phoneNumber')}
                                value={staff.emergencyContactSecondaryNumber}
                                field="emergencyContactSecondaryNumber"
                                type="tel"
                                isEditMode={isEditMode}
                                isMobile={isMobile}
                                staff={staff}
                                onFieldChange={onFieldChange}
                                getFieldError={getFieldError}
                            />
                            <FieldDisplay
                                label={_t('detailPages.staff.fields.email')}
                                value={staff.emergencyContactSecondaryEmail}
                                field="emergencyContactSecondaryEmail"
                                type="email"
                                isEditMode={isEditMode}
                                isMobile={isMobile}
                                staff={staff}
                                onFieldChange={onFieldChange}
                                getFieldError={getFieldError}
                            />
                        </dl>
                    </div>
                </div>
            </Section>

            {/* Remarks */}
            <Section title={_t('detailPages.staff.sections.remarks')} isMobile={isMobile} isTablet={isTablet}>
                <FieldDisplay
                    label={_t('detailPages.staff.fields.additionalNotes')}
                    value={staff.remarks}
                    field="remarks"
                    type="textarea"
                    className="col-span-full"
                    isEditMode={isEditMode}
                    isMobile={isMobile}
                    staff={staff}
                    onFieldChange={onFieldChange}
                    getFieldError={getFieldError}
                />
            </Section>
        </div>
    );
};
