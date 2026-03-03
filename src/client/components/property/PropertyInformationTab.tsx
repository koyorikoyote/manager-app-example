import React, { memo, useMemo, useCallback } from 'react';
import { FormField, FormSelect } from '../ui/StandardFormDialog';
import { AddressClickableField } from '../ui/AddressClickableField';
import { useResponsive } from '../../hooks/useResponsive';
import { useLanguage } from '../../contexts/LanguageContext';
import { cn } from '../../utils/cn';
import { getDisplayValue } from '../ui/cardUtils';
import type { Property } from '../../../shared/types';
import { formatDateForInput, parseDateFromInput } from '../../utils/dateUtils';
import { TOKYO_TZ } from '../../../shared/utils/timezone';

export interface PropertyInformationTabProps {
    property: Property;
    isEditMode: boolean;
    onFieldChange?: (field: keyof Property, value: unknown) => void;
    getFieldError?: (field: string) => string | undefined;
}

// Extended property interface for new fields
interface ExtendedProperty extends Property {
    postalCode?: string | null;
    country?: string | null;
    region?: string | null;
    prefecture?: string | null;
    city?: string | null;
    owner?: string | null;
    ownerPhone?: string | null;
    ownerEmail?: string | null;
    ownerFax?: string | null;
}

const PropertyInformationTabComponent: React.FC<PropertyInformationTabProps> = ({
    property,
    isEditMode,
    onFieldChange,
    getFieldError,
}) => {
    const { t } = useLanguage();
    const { isMobile } = useResponsive();

    const extendedProperty = property as ExtendedProperty;

    // Memoized property type options
    const propertyTypeOptions = useMemo(() => [
        { value: '', label: t('detailPages.property.fields.propertyType') },
        { value: 'RESIDENTIAL', label: t('detailPages.property.propertyTypeValues.RESIDENTIAL') },
        { value: 'COMMERCIAL', label: t('detailPages.property.propertyTypeValues.COMMERCIAL') },
        { value: 'INDUSTRIAL', label: t('detailPages.property.propertyTypeValues.INDUSTRIAL') },
        { value: 'MIXED_USE', label: t('detailPages.property.propertyTypeValues.MIXED_USE') }
    ], [t]);

    // Memoized property status options
    const statusOptions = useMemo(() => [
        { value: '', label: t('detailPages.property.fields.propertyStatus') },
        { value: 'ACTIVE', label: t('detailPages.property.propertyStatusValues.ACTIVE') },
        { value: 'INACTIVE', label: t('detailPages.property.propertyStatusValues.INACTIVE') },
        { value: 'UNDER_CONSTRUCTION', label: t('detailPages.property.propertyStatusValues.UNDER_CONSTRUCTION') },
        { value: 'SOLD', label: t('detailPages.property.propertyStatusValues.SOLD') }
    ], [t]);

    // Memoized postal code formatting
    const formatPostalCode = useMemo(() => (postalCode: string | null | undefined): string => {
        if (!postalCode) return '';

        // If already formatted with symbol, return as is
        if (postalCode.startsWith('〒')) return postalCode;

        // Remove existing symbols and format
        const cleaned = postalCode.replace(/[^\d]/g, '');
        if (cleaned.length === 7) {
            return `〒${cleaned.slice(0, 3)}-${cleaned.slice(3)}`;
        }
        return postalCode;
    }, []);

    // Memoized get property type label
    const getPropertyTypeLabel = useCallback((type: unknown): string => {
        switch (type) {
            case 'RESIDENTIAL': return t('detailPages.property.propertyTypeValues.RESIDENTIAL');
            case 'COMMERCIAL': return t('detailPages.property.propertyTypeValues.COMMERCIAL');
            case 'INDUSTRIAL': return t('detailPages.property.propertyTypeValues.INDUSTRIAL');
            case 'MIXED_USE': return t('detailPages.property.propertyTypeValues.MIXED_USE');
            default: return String(type);
        }
    }, [t]);

    // Memoized get status label
    const getStatusLabel = useCallback((status: unknown): string => {
        switch (status) {
            case 'ACTIVE': return t('detailPages.property.propertyStatusValues.ACTIVE');
            case 'INACTIVE': return t('detailPages.property.propertyStatusValues.INACTIVE');
            case 'UNDER_CONSTRUCTION': return t('detailPages.property.propertyStatusValues.UNDER_CONSTRUCTION');
            case 'SOLD': return t('detailPages.property.propertyStatusValues.SOLD');
            default: return String(status);
        }
    }, [t]);

    // Memoized render field group
    const renderFieldGroup = useCallback((title: string, children: React.ReactNode) => {
        return (
            <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-4">
                <h3 className="text-lg font-medium text-gray-900 border-b border-gray-200 pb-2">
                    {title}
                </h3>
                <div className={cn(
                    'grid gap-4',
                    isMobile ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-2'
                )}>
                    {children}
                </div>
            </div>
        );
    }, [isMobile]);

    // Memoized render display field
    const renderDisplayField = useCallback((label: string, value: string | null | undefined, formatter?: (value: unknown) => string) => {
        const displayValue = formatter ? formatter(value) : getDisplayValue(value);

        return (
            <div>
                <span className="block text-sm font-medium text-gray-700 mb-1">{label}</span>
                <span className="text-gray-900">{displayValue}</span>
            </div>
        );
    }, []);

    if (isEditMode && onFieldChange) {
        return (
            <div className="space-y-6">
                {/* Basic Information */}
                {renderFieldGroup(t('detailPages.property.sections.basicInformation'), (
                    <>
                        <FormField label={t('detailPages.property.fields.propertyName')} error={getFieldError?.('name')}>
                            <input
                                type="text"
                                value={property.name || ''}
                                onChange={(e) => onFieldChange('name', e.target.value || null)}
                                className={cn(
                                    'w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm',
                                    'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500',
                                    getFieldError?.('name') && 'border-red-300 focus:ring-red-500 focus:border-red-500'
                                )}
                                placeholder="Enter property name"
                                maxLength={255}
                            />
                        </FormField>

                        <FormField label={t('detailPages.property.fields.propertyType')} error={getFieldError?.('propertyType')}>
                            <FormSelect
                                value={property.propertyType || ''}
                                onChange={(e) => onFieldChange('propertyType', e.target.value || null)}
                                error={!!getFieldError?.('propertyType')}
                                options={propertyTypeOptions}
                            />
                        </FormField>

                        <FormField label={t('detailPages.property.fields.propertyCode')} error={getFieldError?.('propertyCode')}>
                            <input
                                type="text"
                                value={property.propertyCode || ''}
                                onChange={(e) => onFieldChange('propertyCode', e.target.value || null)}
                                className={cn(
                                    'w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm',
                                    'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500',
                                    getFieldError?.('propertyCode') && 'border-red-300 focus:ring-red-500 focus:border-red-500'
                                )}
                                placeholder="Enter property code"
                                maxLength={50}
                            />
                        </FormField>

                        <FormField label={t('detailPages.property.fields.status')} error={getFieldError?.('status')}>
                            <FormSelect
                                value={property.status || ''}
                                onChange={(e) => onFieldChange('status', e.target.value || null)}
                                error={!!getFieldError?.('status')}
                                options={statusOptions}
                            />
                        </FormField>

                        <FormField label={t('detailPages.leftColumn.property.established')} error={getFieldError?.('establishmentDate')}>
                            <input
                                type="date"
                                value={formatDateForInput(property.establishmentDate as Date | string | null | undefined)}
                                onChange={(e) => {
                                    const value = e.target.value;
                                    onFieldChange('establishmentDate', value ? parseDateFromInput(value) : null);
                                }}
                                className={cn(
                                    'w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm',
                                    'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500',
                                    getFieldError?.('establishmentDate') && 'border-red-300 focus:ring-red-500 focus:border-red-500'
                                )}
                            />
                        </FormField>

                        <div className="md:col-span-2">
                            <FormField label={t('detailPages.property.fields.description')} error={getFieldError?.('description')}>
                                <textarea
                                    value={property.description || ''}
                                    onChange={(e) => onFieldChange('description', e.target.value || null)}
                                    className={cn(
                                        'w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm',
                                        'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500',
                                        getFieldError?.('description') && 'border-red-300 focus:ring-red-500 focus:border-red-500'
                                    )}
                                    placeholder="Enter property description"
                                    rows={3}
                                    maxLength={1000}
                                />
                            </FormField>
                        </div>
                    </>
                ))}

                {/* Location Details */}
                {renderFieldGroup(t('detailPages.property.sections.locationDetails'), (
                    <>
                        <div className="md:col-span-2">
                            <div className="flex flex-col md:flex-row gap-4 items-start">
                                <div className="w-32 shrink-0">
                                    <FormField label={t('detailPages.property.fields.postalCode')} error={getFieldError?.('postalCode')}>
                                        <input
                                            type="text"
                                            value={extendedProperty.postalCode || ''}
                                            onChange={(e) => onFieldChange('postalCode' as keyof Property, e.target.value || null)}
                                            className={cn(
                                                'w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm',
                                                'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500',
                                                getFieldError?.('postalCode') && 'border-red-300 focus:ring-red-500 focus:border-red-500'
                                            )}
                                            placeholder="e.g., 123-4567"
                                        />
                                    </FormField>
                                </div>
                                <div className="flex-1">
                                    <FormField label={t('detailPages.property.fields.address')} error={getFieldError?.('address')}>
                                        <input
                                            type="text"
                                            value={property.address || ''}
                                            onChange={(e) => onFieldChange('address', e.target.value || null)}
                                            className={cn(
                                                'w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm',
                                                'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500',
                                                getFieldError?.('address') && 'border-red-300 focus:ring-red-500 focus:border-red-500'
                                            )}
                                            placeholder="Enter full address"
                                            maxLength={500}
                                        />
                                    </FormField>
                                </div>
                            </div>
                        </div>

                        <FormField label={t('detailPages.property.fields.country')} error={getFieldError?.('country')}>
                            <input
                                type="text"
                                value={extendedProperty.country || ''}
                                onChange={(e) => onFieldChange('country' as keyof Property, e.target.value || null)}
                                className={cn(
                                    'w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm',
                                    'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500',
                                    getFieldError?.('country') && 'border-red-300 focus:ring-red-500 focus:border-red-500'
                                )}
                                placeholder="Enter country"
                            />
                        </FormField>

                        <FormField label={t('detailPages.property.fields.region')} error={getFieldError?.('region')}>
                            <input
                                type="text"
                                value={extendedProperty.region || ''}
                                onChange={(e) => onFieldChange('region' as keyof Property, e.target.value || null)}
                                className={cn(
                                    'w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm',
                                    'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500',
                                    getFieldError?.('region') && 'border-red-300 focus:ring-red-500 focus:border-red-500'
                                )}
                                placeholder="Enter region"
                            />
                        </FormField>

                        <FormField label={t('detailPages.property.fields.prefecture')} error={getFieldError?.('prefecture')}>
                            <input
                                type="text"
                                value={extendedProperty.prefecture || ''}
                                onChange={(e) => onFieldChange('prefecture' as keyof Property, e.target.value || null)}
                                className={cn(
                                    'w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm',
                                    'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500',
                                    getFieldError?.('prefecture') && 'border-red-300 focus:ring-red-500 focus:border-red-500'
                                )}
                                placeholder="Enter prefecture"
                            />
                        </FormField>

                        <FormField label={t('detailPages.property.fields.city')} error={getFieldError?.('city')}>
                            <input
                                type="text"
                                value={extendedProperty.city || ''}
                                onChange={(e) => onFieldChange('city' as keyof Property, e.target.value || null)}
                                className={cn(
                                    'w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm',
                                    'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500',
                                    getFieldError?.('city') && 'border-red-300 focus:ring-red-500 focus:border-red-500'
                                )}
                                placeholder="Enter city"
                            />
                        </FormField>
                    </>
                ))}

                {/* Ownership Information */}
                {renderFieldGroup(t('detailPages.property.sections.ownerInformation'), (
                    <>
                        <FormField label={t('detailPages.property.fields.owner')} error={getFieldError?.('owner')}>
                            <input
                                type="text"
                                value={extendedProperty.owner || ''}
                                onChange={(e) => onFieldChange('owner' as keyof Property, e.target.value || null)}
                                className={cn(
                                    'w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm',
                                    'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500',
                                    getFieldError?.('owner') && 'border-red-300 focus:ring-red-500 focus:border-red-500'
                                )}
                                placeholder="Enter owner name"
                            />
                        </FormField>

                        <FormField label={t('detailPages.property.fields.ownerPhone')} error={getFieldError?.('ownerPhone')}>
                            <input
                                type="tel"
                                value={extendedProperty.ownerPhone || ''}
                                onChange={(e) => onFieldChange('ownerPhone' as keyof Property, e.target.value || null)}
                                className={cn(
                                    'w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm',
                                    'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500',
                                    getFieldError?.('ownerPhone') && 'border-red-300 focus:ring-red-500 focus:border-red-500'
                                )}
                                placeholder="Enter phone number"
                            />
                        </FormField>

                        <FormField label={t('detailPages.property.fields.ownerEmail')} error={getFieldError?.('ownerEmail')}>
                            <input
                                type="email"
                                value={extendedProperty.ownerEmail || ''}
                                onChange={(e) => onFieldChange('ownerEmail' as keyof Property, e.target.value || null)}
                                className={cn(
                                    'w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm',
                                    'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500',
                                    getFieldError?.('ownerEmail') && 'border-red-300 focus:ring-red-500 focus:border-red-500'
                                )}
                                placeholder="Enter email address"
                            />
                        </FormField>

                        <FormField label={t('detailPages.property.fields.ownerFax')} error={getFieldError?.('ownerFax')}>
                            <input
                                type="tel"
                                value={extendedProperty.ownerFax || ''}
                                onChange={(e) => onFieldChange('ownerFax' as keyof Property, e.target.value || null)}
                                className={cn(
                                    'w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm',
                                    'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500',
                                    getFieldError?.('ownerFax') && 'border-red-300 focus:ring-red-500 focus:border-red-500'
                                )}
                                placeholder="Enter fax number"
                            />
                        </FormField>
                    </>
                ))}

                {/* Management Details */}
                {renderFieldGroup(t('detailPages.property.sections.propertyDetails'), (
                    <>
                        <FormField label={t('detailPages.property.fields.personInCharge')} error={getFieldError?.('managerId')}>
                            <select
                                value={property.managerId || ''}
                                onChange={(e) => {
                                    const value = e.target.value;
                                    onFieldChange('managerId', value ? parseInt(value) : null);
                                }}
                                className={cn(
                                    'w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm',
                                    'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500',
                                    getFieldError?.('managerId') && 'border-red-300 focus:ring-red-500 focus:border-red-500'
                                )}
                            >
                                <option value="">Select manager</option>
                                {/* TODO: Add available managers from props or service */}
                            </select>
                        </FormField>

                        <FormField label={t('detailPages.property.fields.contractDate')} error={getFieldError?.('contractDate')}>
                            <input
                                type="date"
                                value={formatDateForInput(property.contractDate as Date | string | null | undefined)}
                                onChange={(e) => {
                                    const value = e.target.value;
                                    onFieldChange('contractDate', value ? parseDateFromInput(value) : null);
                                }}
                                className={cn(
                                    'w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm',
                                    'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500',
                                    getFieldError?.('contractDate') && 'border-red-300 focus:ring-red-500 focus:border-red-500'
                                )}
                            />
                        </FormField>
                    </>
                ))}
            </div>
        );
    }

    // View mode - display all fields in organized groups
    return (
        <div className="space-y-6">
            {/* Basic Information */}
            {renderFieldGroup(t('detailPages.property.sections.basicInformation'), (
                <>
                    {renderDisplayField(t('detailPages.property.fields.propertyName'), property.name)}
                    {renderDisplayField(t('detailPages.property.fields.propertyType'), property.propertyType, getPropertyTypeLabel)}
                    {renderDisplayField(t('detailPages.property.fields.propertyCode'), property.propertyCode)}
                    {renderDisplayField(t('detailPages.property.fields.propertyStatus'), property.status, getStatusLabel)}
                    {renderDisplayField(t('detailPages.leftColumn.property.established'), property.establishmentDate ? String(property.establishmentDate) : '', (date) =>
                        date ? new Date(String(date)).toLocaleDateString('ja-JP', { timeZone: TOKYO_TZ }) : ''
                    )}
                    <div className="md:col-span-2">
                        {renderDisplayField(t('detailPages.property.fields.description'), property.description)}
                    </div>
                </>
            ))}

            {/* Location Details */}
            {renderFieldGroup(t('detailPages.property.sections.locationDetails'), (
                <>
                    <div className="md:col-span-2">
                        <div className="flex flex-col md:flex-row gap-4 items-baseline">
                            <div className="w-24 shrink-0">
                                <span className="block text-sm font-medium text-gray-700 whitespace-nowrap">{t('detailPages.property.fields.postalCode')}</span>
                                <span className="text-gray-900 inline-block align-baseline">{formatPostalCode(String(extendedProperty.postalCode || ''))}</span>
                            </div>
                            <div className="flex-1 min-w-0">
                                <span className="block text-sm font-medium text-gray-700 whitespace-nowrap">{t('detailPages.property.fields.address')}</span>
                                <span className="text-gray-900 inline-block align-baseline">
                                    <AddressClickableField address={property.address} />
                                </span>
                            </div>
                        </div>
                    </div>
                    {renderDisplayField(t('detailPages.property.fields.country'), extendedProperty.country)}
                    {renderDisplayField(t('detailPages.property.fields.region'), extendedProperty.region)}
                    {renderDisplayField(t('detailPages.property.fields.prefecture'), extendedProperty.prefecture)}
                    {renderDisplayField(t('detailPages.property.fields.city'), extendedProperty.city)}
                </>
            ))}

            {/* Ownership Information */}
            {renderFieldGroup(t('detailPages.property.sections.ownerInformation'), (
                <>
                    {renderDisplayField(t('detailPages.property.fields.owner'), extendedProperty.owner)}
                    {renderDisplayField(t('detailPages.property.fields.ownerPhone'), extendedProperty.ownerPhone)}
                    {renderDisplayField(t('detailPages.property.fields.ownerEmail'), extendedProperty.ownerEmail)}
                    {renderDisplayField(t('detailPages.property.fields.ownerFax'), extendedProperty.ownerFax)}
                </>
            ))}

            {/* Management Details */}
            {renderFieldGroup(t('detailPages.property.sections.propertyDetails'), (
                <>
                    {renderDisplayField(t('detailPages.property.fields.personInCharge'), property.manager?.name)}
                    {renderDisplayField(t('detailPages.property.fields.contractDate'), property.contractDate ? String(property.contractDate) : '', (date) =>
                        date ? new Date(String(date)).toLocaleDateString('ja-JP', { timeZone: TOKYO_TZ }) : ''
                    )}
                </>
            ))}
        </div>
    );
};

PropertyInformationTabComponent.displayName = 'PropertyInformationTab';

export const PropertyInformationTab = memo(PropertyInformationTabComponent);
