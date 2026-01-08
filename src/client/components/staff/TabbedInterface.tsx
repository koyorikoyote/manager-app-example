import React, { useState, useCallback } from 'react';
import { useResponsive } from '../../hooks/useResponsive';
import { useLanguage } from '../../contexts/LanguageContext';
import { useGlassBlue } from '../../hooks/useGlassBlue';
import { cn } from '../../utils/cn';
import { createLazyComponent } from '../../utils/lazyLoading';
import {
    BasicInformationTabSkeleton,
    DailyRecordTabSkeleton,
    InteractionTabSkeleton,
    ProceduresTabSkeleton
} from '../ui/StaffDetailSkeleton';
import type { Staff } from '../../../shared/types';

// Lazy load tab components for better performance with proper skeleton fallbacks
const LazyBasicInformationTab = createLazyComponent(
    () => import('./BasicInformationTab').then(module => ({ default: module.BasicInformationTab })),
    'BasicInformationTab',
    { fallback: <BasicInformationTabSkeleton /> }
);

const LazyDailyRecordTab = createLazyComponent(
    () => import('./DailyRecordTab').then(module => ({ default: module.DailyRecordTab })),
    'DailyRecordTab',
    { fallback: <DailyRecordTabSkeleton /> }
);

const LazyInteractionTab = createLazyComponent(
    () => import('./InteractionTab').then(module => ({ default: module.InteractionTab })),
    'InteractionTab',
    { fallback: <InteractionTabSkeleton /> }
);

const LazyProceduresTab = createLazyComponent(
    () => import('./ProceduresTab').then(module => ({ default: module.ProceduresTab })),
    'ProceduresTab',
    { fallback: <ProceduresTabSkeleton /> }
);

export interface TabbedInterfaceProps {
    staff: Staff;
    isEditMode: boolean;
    onFieldChange?: (field: keyof Staff, value: unknown) => void;
    getFieldError?: (field: string) => string | undefined;
    availableUsers?: Array<{ id: number; name: string }>;
    availableNationalities?: string[];
}

export type TabId = 'basic-information' | 'daily-record' | 'interaction' | 'procedures';

export interface TabConfig {
    id: TabId;
    label: string;
    component: React.ComponentType<{
        staff: Staff;
        isEditMode: boolean;
        onFieldChange?: (field: keyof Staff, value: unknown) => void;
        getFieldError?: (field: string) => string | undefined;
        availableUsers?: Array<{ id: number; name: string }>;
        availableNationalities?: string[];
    }>;
}

export const TabbedInterface: React.FC<TabbedInterfaceProps> = ({
    staff,
    isEditMode,
    onFieldChange,
    getFieldError,
    availableUsers = [],
    availableNationalities = [],
}) => {
    const { t: _t } = useLanguage();
    const { isMobile, isTablet } = useResponsive();
    const [activeTab, setActiveTab] = useState<TabId>('basic-information');
    const isGlassBlue = useGlassBlue();

    // Tab configuration with lazy loaded components
    const tabs: TabConfig[] = [
        {
            id: 'basic-information',
            label: _t('detailPages.staff.tabs.basicInformation'),
            component: LazyBasicInformationTab,
        },
        {
            id: 'daily-record',
            label: _t('detailPages.staff.tabs.dailyRecord'),
            component: LazyDailyRecordTab,
        },
        {
            id: 'interaction',
            label: _t('detailPages.staff.tabs.interaction'),
            component: LazyInteractionTab,
        },
        {
            id: 'procedures',
            label: _t('detailPages.staff.tabs.procedures'),
            component: LazyProceduresTab,
        },
    ];

    // Handle tab change
    const handleTabChange = useCallback((tabId: TabId) => {
        setActiveTab(tabId);
    }, []);

    // Get tab button classes
    const getTabButtonClasses = useCallback((tabId: TabId, isActive: boolean) => {
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
                'bg-primary-600 text-primary-50 shadow-sm border border-primary-600',
                'hover:bg-primary-700 hover:border-primary-700 active:bg-primary-800',
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
            'bg-white text-neutral-700 border border-neutral-300',
            'hover:bg-neutral-50 hover:border-neutral-400',
            'active:bg-neutral-100 touch:active:scale-95'
        );
    }, [isMobile, isTablet, isGlassBlue]);

    // Render tab navigation
    const renderTabNavigation = () => {
        return (
            <div className={cn(
                'border-b border-neutral-200 bg-white sticky top-0 z-10',
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
    };

    // Render active tab content
    const renderTabContent = () => {
        const activeTabConfig = tabs.find(tab => tab.id === activeTab);
        if (!activeTabConfig) return null;

        const TabComponent = activeTabConfig.component;

        return (
            <div
                role="tabpanel"
                id={`tabpanel-${activeTab}`}
                aria-labelledby={`tab-${activeTab}`}
                className={cn(
                    'flex-1 bg-neutral-50 overflow-y-auto',
                    isMobile ? 'p-3 pb-safe-bottom' :
                        isTablet ? 'p-4' :
                            'p-6'
                )}
            >
                <TabComponent
                    staff={staff}
                    isEditMode={isEditMode}
                    onFieldChange={onFieldChange}
                    getFieldError={getFieldError}
                    availableUsers={availableUsers}
                    availableNationalities={availableNationalities}
                />
            </div>
        );
    };

    return (
        <div className="flex flex-col h-full bg-white rounded-lg shadow-sm border border-neutral-200">
            {renderTabNavigation()}
            {renderTabContent()}
        </div>
    );
};

