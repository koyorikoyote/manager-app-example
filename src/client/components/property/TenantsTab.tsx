import React, { useState, useEffect, useCallback, memo, useMemo } from 'react';
import { AccordionList } from '../ui/AccordionList';
import { useResponsive } from '../../hooks/useResponsive';
import { useLanguage } from '../../contexts/LanguageContext';
import { cn } from '../../utils/cn';
import { propertyStaffAssignmentService } from '../../services';
import type { Property } from '../../../shared/types';

export interface TenantsTabProps {
    property: Property;
    isEditMode: boolean;
}

interface TenantRecord {
    id: number;
    room: string;
    staffNames: string[];
    staffIds: number[];
    rentPriceHigh: number | null;
    rentPriceLow: number | null;
    startDate: Date;
    endDate: Date | null;
    isActive: boolean;
    staff: Array<{
        id: number;
        name: string;
        employeeId: string | null;
        position: string | null;
        department: string | null;
        email?: string | null;
        phone?: string | null;
    }>;
}

const TenantsTabComponent: React.FC<TenantsTabProps> = ({
    property,
    isEditMode: _isEditMode,
}) => {
    const { t: _t } = useLanguage();
    const { isMobile } = useResponsive();
    const [tenants, setTenants] = useState<TenantRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Fetch tenant data with AbortController support
    const fetchTenants = useCallback(async (signal?: AbortSignal) => {
        if (!property || typeof property.id !== 'number') {
            setError('Invalid property id');
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            setError(null);

            // Use the service to fetch tenant records (ensure numeric id)
            const tenantData = await propertyStaffAssignmentService.getTenantsByPropertyId(
                Number(property.id),
                false,
                signal
            );

            // Only update state if request wasn't cancelled
            if (!signal?.aborted) {
                // Defensive: ensure we received an array and normalize missing nested fields
                const normalized = Array.isArray(tenantData)
                    ? tenantData.map((t) => ({
                        ...t,
                        staff: Array.isArray(t.staff) ? t.staff : [],
                    }))
                    : [];

                setTenants(normalized);
            }
        } catch (err) {
            // Only set error if component is still mounted and request wasn't cancelled
            if (!signal?.aborted && err instanceof Error && err.name !== 'AbortError') {
                console.error('Failed to fetch tenants:', err);
                setError(err instanceof Error ? err.message : 'Failed to fetch tenant information');
            }
        } finally {
            // Only update loading state if request wasn't cancelled
            if (!signal?.aborted) {
                setLoading(false);
            }
        }
    }, [property]);

    // Fetch data on component mount with proper AbortController cleanup
    useEffect(() => {
        const controller = new AbortController();

        const loadData = async () => {
            await fetchTenants(controller.signal);
        };

        loadData();

        return () => {
            controller.abort();
        };
    }, [fetchTenants]);

    // Memoized formatting functions
    const formatRentPriceRange = useMemo(() => (high: number | null, low: number | null): string => {
        if (!high && !low) return '未指定 / Not specified';
        if (high && low && high !== low) {
            return `¥${low.toLocaleString()} - ¥${high.toLocaleString()}`;
        }
        if (high) return `¥${high.toLocaleString()}`;
        if (low) return `¥${low.toLocaleString()}`;
        return '未指定 / Not specified';
    }, []);

    const formatPeriod = useMemo(() => (startDate: Date, endDate: Date | null): string => {
        const start = new Date(startDate).toLocaleDateString('ja-JP');
        if (!endDate) return `${start} - Present`;
        const end = new Date(endDate).toLocaleDateString('ja-JP');
        return `${start} - ${end}`;
    }, []);

    // Memoized render accordion summary for each tenant record
    const renderTenantSummary = useCallback((tenant: TenantRecord) => {
        const staffNamesStr = tenant.staffNames.join(', ');
        const period = formatPeriod(tenant.startDate, tenant.endDate);

        return (
            <div className="flex items-center justify-between w-full">
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3">
                        <div className={cn(
                            'font-medium text-gray-900',
                            isMobile ? 'text-sm' : 'text-base'
                        )}>
                            Room {tenant.room}
                        </div>
                        <div className={cn(
                            'px-2 py-1 rounded-full text-xs font-medium',
                            tenant.isActive
                                ? 'bg-green-100 text-green-800 border border-green-200'
                                : 'bg-gray-100 text-gray-800 border border-gray-200'
                        )}>
                            {tenant.isActive ? 'Active' : 'Inactive'}
                        </div>
                    </div>
                    <div className={cn(
                        'text-gray-600 mt-1 min-w-0 overflow-hidden',
                        isMobile ? 'text-xs' : 'text-sm'
                    )}>
                        <div className="truncate">
                            {staffNamesStr}
                        </div>
                    </div>
                    <div className={cn(
                        'text-gray-500 mt-1',
                        isMobile ? 'text-xs' : 'text-sm'
                    )}>
                        {period}
                    </div>
                </div>
            </div>
        );
    }, [isMobile, formatPeriod]);

    // Memoized render accordion details for each tenant record
    const renderTenantDetails = useCallback((tenant: TenantRecord) => {
        const rentPriceRange = formatRentPriceRange(tenant.rentPriceHigh, tenant.rentPriceLow);

        return (
            <div className="space-y-4">
                {/* Tenant Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <span className="block text-sm font-medium text-gray-700 mb-1">{_t('detailPages.accordionLabels.tenants.roomNumber')}</span>
                        <span className="text-gray-900">{tenant.room}</span>
                    </div>
                    <div>
                        <span className="block text-sm font-medium text-gray-700 mb-1">{_t('detailPages.accordionLabels.tenants.status')}</span>
                        <span className={cn(
                            'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
                            tenant.isActive
                                ? 'bg-green-100 text-green-800 border border-green-200'
                                : 'bg-gray-100 text-gray-800 border border-gray-200'
                        )}>
                            {tenant.isActive ? _t('detailPages.accordionLabels.tenants.active') : _t('detailPages.accordionLabels.tenants.inactive')}
                        </span>
                    </div>
                    <div>
                        <span className="block text-sm font-medium text-gray-700 mb-1">{_t('detailPages.accordionLabels.tenants.rentPrice')}</span>
                        <span className="text-gray-900">{rentPriceRange}</span>
                    </div>
                    <div>
                        <span className="block text-sm font-medium text-gray-700 mb-1">{_t('detailPages.accordionLabels.tenants.period')}</span>
                        <span className="text-gray-900">{formatPeriod(tenant.startDate, tenant.endDate)}</span>
                    </div>
                </div>

                {/* Staff Information */}
                {tenant.staff.length > 0 && (
                    <div>
                        <span className="block text-sm font-medium text-gray-700 mb-3">
                            {_t('detailPages.accordionLabels.tenants.staffMembers')} ({tenant.staff.length})
                        </span>
                        <div className="space-y-3">
                            {tenant.staff.map((staff) => (
                                <div key={staff.id} className="bg-gray-50 rounded-lg p-3">
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <div className="font-medium text-gray-900">
                                                {staff.name}
                                            </div>
                                            <div className="text-sm text-gray-600 mt-1">
                                                {staff.employeeId} • {staff.position}
                                            </div>
                                            <div className="text-sm text-gray-500">
                                                {staff.department}
                                            </div>
                                        </div>
                                    </div>
                                    {(staff.email || staff.phone) && (
                                        <div className="mt-2 pt-2 border-t border-gray-200">
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                                                {staff.email && (
                                                    <div>
                                                        <span className="text-gray-500">Email:</span>
                                                        <a
                                                            href={`mailto:${staff.email}`}
                                                            className="ml-1 text-blue-600 hover:text-blue-700 underline"
                                                        >
                                                            {staff.email}
                                                        </a>
                                                    </div>
                                                )}
                                                {staff.phone && (
                                                    <div>
                                                        <span className="text-gray-500">Phone:</span>
                                                        <a
                                                            href={`tel:${staff.phone}`}
                                                            className="ml-1 text-blue-600 hover:text-blue-700 underline"
                                                        >
                                                            {staff.phone}
                                                        </a>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        );
    }, [formatRentPriceRange, formatPeriod]);

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900">
                    Tenant Information
                </h3>
                <div className="text-sm text-gray-500">
                    {tenants.length} {tenants.length === 1 ? 'tenant' : 'tenants'}
                </div>
            </div>

            {/* Tenant List */}
            <AccordionList
                items={tenants}
                renderSummary={renderTenantSummary}
                renderDetails={renderTenantDetails}
                keyExtractor={(tenant) => tenant.id}
                loading={loading}
                error={error}
                emptyMessage="No tenant information available for this property"
                className="space-y-2"
            />
        </div>
    );
};

TenantsTabComponent.displayName = 'TenantsTab';

export const TenantsTab = memo(TenantsTabComponent);
