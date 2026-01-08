import React, { useState, useCallback } from 'react';
import { useResponsive } from '../../hooks/useResponsive';
import { useLanguage } from '../../contexts/LanguageContext';
import { useGlassBlue } from '../../hooks/useGlassBlue';
import { cn } from '../../utils/cn';

import type { Company } from '../../../shared/types';
import { JobInformationTab } from './JobInformationTab';
import { CompanyInteractionTab } from './CompanyInteractionTab';
import { CompanyProceduresTab } from './CompanyProceduresTab';

export interface CompanyTabbedInterfaceProps {
    company: Company;
    isEditMode: boolean;
    onFieldChange?: (field: keyof Company, value: unknown) => void;
    getFieldError?: (field: string) => string | undefined;
}

export type CompanyTabId = 'job-information' | 'interaction' | 'procedures';

export interface CompanyTabConfig {
    id: CompanyTabId;
    label: string;
    component: React.ComponentType<{
        company: Company;
        isEditMode: boolean;
        onFieldChange?: (field: keyof Company, value: unknown) => void;
        getFieldError?: (field: string) => string | undefined;
    }>;
}

export const CompanyTabbedInterface: React.FC<CompanyTabbedInterfaceProps> = ({
    company,
    isEditMode,
    onFieldChange,
    getFieldError,
}) => {
    const { t: _t } = useLanguage();
    const { isMobile, isTablet } = useResponsive();
    const isGlassBlue = useGlassBlue();
    const [activeTab, setActiveTab] = useState<CompanyTabId>('job-information');



    // Tab configuration with direct imports (no lazy loading)
    const tabs: CompanyTabConfig[] = [
        {
            id: 'job-information',
            label: _t('detailPages.destination.tabs.jobInformation'),
            component: JobInformationTab,
        },
        {
            id: 'interaction',
            label: _t('detailPages.destination.tabs.interaction'),
            component: CompanyInteractionTab,
        },
        {
            id: 'procedures',
            label: _t('detailPages.destination.tabs.procedures'),
            component: CompanyProceduresTab,
        },
    ];

    // Handle tab change
    const handleTabChange = useCallback((tabId: CompanyTabId) => {
        setActiveTab(tabId);
    }, []);

    // Get tab button classes
    const getTabButtonClasses = useCallback((tabId: CompanyTabId, isActive: boolean) => {
        const baseClasses = cn(
            'font-medium rounded-lg transition-all duration-200',
            'focus:outline-none focus:ring-2 focus:ring-primary-500/20',
            'min-h-[44px] flex items-center justify-center',
            'touch:min-h-[48px] touch:min-w-[48px]',
            // Enhanced mobile sizing and spacing
            isMobile ? 'text-xs px-4 py-2.5 min-w-[90px]' :
                isTablet ? 'text-sm px-4 py-2.5 min-w-[100px]' :
                    'text-sm px-5 py-2.5'
        );

        if (isActive) {
            if (isGlassBlue) {
                return cn(
                    baseClasses,
                    'glass-blue-tab active glass-blue-glow glass-blue-shine',
                    'touch:shadow-lg touch:active:shadow-sm'
                );
            }
            return cn(
                baseClasses,
                'bg-primary-600 text-white shadow-md',
                'hover:bg-primary-700 active:bg-primary-800',
                // Enhanced touch feedback
                'touch:shadow-lg touch:active:shadow-sm'
            );
        }

        if (isGlassBlue) {
            return cn(
                baseClasses,
                'glass-blue-tab text-neutral-700',
                // Enhanced touch feedback for inactive tabs
                'touch:hover:bg-blue-100/30 touch:active:bg-blue-200/30'
            );
        }

        return cn(
            baseClasses,
            'bg-white text-gray-700 border border-gray-300',
            'hover:bg-gray-50 hover:border-gray-400 hover:shadow-sm',
            'active:bg-gray-100',
            // Enhanced touch feedback for inactive tabs
            'touch:hover:bg-gray-100 touch:active:bg-gray-200'
        );
    }, [isMobile, isTablet, isGlassBlue]);

    // Render tab navigation
    const renderTabNavigation = () => {
        return (
            <div className={cn(
                'border-b border-gray-200 bg-white sticky top-0 z-10',
                'shadow-sm', // Add subtle shadow for better separation
                isMobile || isTablet ? 'px-4 py-3' : 'px-6 py-4'
            )}>
                <div className={cn(
                    'flex gap-2',
                    isMobile ? 'overflow-x-auto scrollbar-hide pb-1 -mx-1 px-1' : 'flex-wrap',
                    isMobile && 'snap-x snap-mandatory'
                )}>
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => handleTabChange(tab.id)}
                            className={cn(
                                getTabButtonClasses(tab.id, activeTab === tab.id),
                                isMobile && 'flex-shrink-0 snap-start',
                                // Enhanced touch feedback
                                'touch:active:scale-95 transition-all duration-150'
                            )}
                            type="button"
                            role="tab"
                            aria-selected={activeTab === tab.id}
                            aria-controls={`tabpanel-${tab.id}`}
                            id={`tab-${tab.id}`}
                        >
                            <span className={cn(
                                'whitespace-nowrap font-medium',
                                isMobile && 'text-xs'
                            )}>
                                {isMobile ? tab.label.split(' ')[0] : tab.label}
                            </span>
                        </button>
                    ))}
                </div>

                {/* Scroll indicator for mobile */}
                {isMobile && (
                    <div className="flex justify-center mt-2">
                        <div className="flex space-x-1">
                            {tabs.map((tab, _index) => (
                                <div
                                    key={tab.id}
                                    className={cn(
                                        'w-1.5 h-1.5 rounded-full transition-colors duration-200',
                                        activeTab === tab.id ? 'bg-primary-600' : 'bg-gray-300'
                                    )}
                                />
                            ))}
                        </div>
                    </div>
                )}
            </div>
        );
    };

    // Render all tab content (no lazy loading) but only show active tab
    const renderTabContent = () => {
        return (
            <div className={cn(
                'flex-1 bg-gray-50 overflow-y-auto',
                // Enhanced mobile padding with safe area support
                isMobile ? 'p-3 pb-safe-bottom' :
                    isTablet ? 'p-4 pb-4' :
                        'p-6',
                // Smooth scrolling for better mobile experience
                'scroll-smooth'
            )}
                style={{
                    // Ensure proper touch scrolling on iOS
                    WebkitOverflowScrolling: 'touch'
                }}>
                {tabs.map((tab) => {
                    const TabComponent = tab.component;
                    const isActive = activeTab === tab.id;

                    return (
                        <div
                            key={tab.id}
                            role="tabpanel"
                            id={`tabpanel-${tab.id}`}
                            aria-labelledby={`tab-${tab.id}`}
                            className={isActive ? 'block' : 'hidden'}
                        >
                            <TabComponent
                                company={company}
                                isEditMode={isEditMode}
                                onFieldChange={onFieldChange}
                                getFieldError={getFieldError}
                            />
                        </div>
                    );
                })}
            </div>
        );
    };

    return (
        <div className="flex flex-col h-full bg-white rounded-lg shadow-sm border border-gray-200">
            {renderTabNavigation()}
            {renderTabContent()}
        </div>
    );
};