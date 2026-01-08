import React, { useState, useCallback, lazy, Suspense, memo, useMemo } from 'react';
import { useResponsive } from '../../hooks/useResponsive';
import { useLanguage } from '../../contexts/LanguageContext';
import { useGlassBlue } from '../../hooks/useGlassBlue';
import { cn } from '../../utils/cn';
import type { Property } from '../../../shared/types';

// Lazy load tab components for better performance
const PropertyInformationTab = lazy(() => import('./PropertyInformationTab').then(module => ({ default: module.PropertyInformationTab })));
const TenantsTab = lazy(() => import('./TenantsTab').then(module => ({ default: module.TenantsTab })));
const ContractsTab = lazy(() => import('./ContractsTab').then(module => ({ default: module.ContractsTab })));

export interface PropertyTabbedInterfaceProps {
    property: Property;
    isEditMode: boolean;
    onFieldChange?: (field: keyof Property, value: unknown) => void;
    getFieldError?: (field: string) => string | undefined;
}

export type PropertyTabId = 'property-information' | 'tenants' | 'contracts';

export interface PropertyTabConfig {
    id: PropertyTabId;
    label: string;
    component: React.ComponentType<{
        property: Property;
        isEditMode: boolean;
        onFieldChange?: (field: keyof Property, value: unknown) => void;
        getFieldError?: (field: string) => string | undefined;
    }>;
}

const PropertyTabbedInterfaceComponent: React.FC<PropertyTabbedInterfaceProps> = ({
    property,
    isEditMode,
    onFieldChange,
    getFieldError,
}) => {
    const { t: _t } = useLanguage();
    const { isMobile, isTablet } = useResponsive();
    const isGlassBlue = useGlassBlue();
    const [activeTab, setActiveTab] = useState<PropertyTabId>('property-information');

    // Memoized tab configuration with lazy-loaded components
    const tabs: PropertyTabConfig[] = useMemo(() => [
        {
            id: 'property-information',
            label: _t('detailPages.property.tabs.propertyInformation'),
            component: PropertyInformationTab,
        },
        {
            id: 'tenants',
            label: _t('detailPages.property.tabs.tenants'),
            component: TenantsTab,
        },
        {
            id: 'contracts',
            label: _t('detailPages.property.tabs.contracts'),
            component: ContractsTab,
        },
    ], [_t]);

    // Handle tab change
    const handleTabChange = useCallback((tabId: PropertyTabId) => {
        setActiveTab(tabId);
    }, []);

    // Get tab button classes
    const getTabButtonClasses = useCallback((tabId: PropertyTabId, isActive: boolean) => {
        const baseClasses = cn(
            'font-medium rounded-lg transition-all duration-200',
            'focus:outline-none focus:ring-2 focus:ring-primary-500/20',
            'min-h-[44px] flex items-center justify-center',
            'touch:min-h-[48px] touch:min-w-[48px]',
            isMobile ? 'text-xs px-3 py-2 min-w-[80px]' :
                isTablet ? 'text-sm px-3 py-2' :
                    'text-sm px-4 py-2'
        );

        if (isActive) {
            if (isGlassBlue) {
                return cn(
                    baseClasses,
                    'glass-blue-tab active glass-blue-glow glass-blue-shine',
                    'touch:active:scale-95'
                );
            }
            return cn(
                baseClasses,
                'bg-primary-600 text-white shadow-sm',
                'hover:bg-primary-700 active:bg-primary-800',
                'touch:active:scale-95'
            );
        }

        if (isGlassBlue) {
            return cn(
                baseClasses,
                'glass-blue-tab text-neutral-700',
                'touch:active:scale-95'
            );
        }

        return cn(
            baseClasses,
            'bg-white text-gray-700 border border-gray-300',
            'hover:bg-gray-50 hover:border-gray-400',
            'active:bg-gray-100 touch:active:scale-95'
        );
    }, [isMobile, isTablet, isGlassBlue]);

    // Memoized render tab navigation
    const renderTabNavigation = useMemo(() => {
        return (
            <div className={cn(
                'border-b border-gray-200 bg-white sticky top-0 z-10',
                isMobile || isTablet ? 'px-4 py-3' : 'px-6 py-4'
            )}>
                <div className={cn(
                    'flex gap-2',
                    isMobile ? 'overflow-x-auto scrollbar-hide pb-1' : 'flex-wrap',
                    isMobile && 'snap-x snap-mandatory'
                )}>
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => handleTabChange(tab.id)}
                            className={cn(
                                getTabButtonClasses(tab.id, activeTab === tab.id),
                                isMobile && 'flex-shrink-0 snap-start'
                            )}
                            type="button"
                            role="tab"
                            aria-selected={activeTab === tab.id}
                            aria-controls={`tabpanel-${tab.id}`}
                            id={`tab-${tab.id}`}
                        >
                            <span className={cn(
                                'whitespace-nowrap',
                                isMobile && 'text-xs'
                            )}>
                                {isMobile ? tab.label.split(' ')[0] : tab.label}
                            </span>
                        </button>
                    ))}
                </div>
            </div>
        );
    }, [tabs, isMobile, isTablet, activeTab, handleTabChange, getTabButtonClasses]);

    // Memoized render active tab content with lazy loading and suspense
    const renderTabContent = useMemo(() => {
        const activeTabConfig = tabs.find(tab => tab.id === activeTab);
        if (!activeTabConfig) return null;

        const TabComponent = activeTabConfig.component;

        return (
            <div
                role="tabpanel"
                id={`tabpanel-${activeTab}`}
                aria-labelledby={`tab-${activeTab}`}
                className={cn(
                    'flex-1 bg-gray-50 overflow-y-auto',
                    isMobile ? 'p-3 pb-safe-bottom' :
                        isTablet ? 'p-4' :
                            'p-6'
                )}
            >
                <Suspense fallback={
                    <div className="flex items-center justify-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                        <span className="ml-3 text-gray-600">Loading...</span>
                    </div>
                }>
                    <TabComponent
                        property={property}
                        isEditMode={isEditMode}
                        onFieldChange={onFieldChange}
                        getFieldError={getFieldError}
                    />
                </Suspense>
            </div>
        );
    }, [tabs, activeTab, isMobile, isTablet, property, isEditMode, onFieldChange, getFieldError]);

    return (
        <div className="flex flex-col h-full bg-white rounded-lg shadow-sm border border-gray-200">
            {renderTabNavigation}
            {renderTabContent}
        </div>
    );
};

PropertyTabbedInterfaceComponent.displayName = 'PropertyTabbedInterface';

export const PropertyTabbedInterface = memo(PropertyTabbedInterfaceComponent);