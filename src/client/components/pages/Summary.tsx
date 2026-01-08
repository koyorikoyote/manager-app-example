import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, Users, Clock, BarChart3 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { Button } from '../ui/Button';
import { BackButton } from '../ui/BackButton';
import { PullToRefresh } from '../ui/PullToRefresh';
import { LoadingOverlay } from '../ui';
import { useLanguage } from '../../contexts/LanguageContext';
import { useFormatting } from '../../hooks/useFormatting';
import { useMobileDetection } from '../../hooks/useTouch';
import { useInitialDataForRoute } from '../../contexts/SSRDataContext';
import { useToast } from '../../contexts/ToastContext';

export const Summary: React.FC = () => {
    const { t } = useLanguage();
    const navigate = useNavigate();
    const { formatDashboardDate } = useFormatting();
    const { isMobile } = useMobileDetection();
    const { showError } = useToast();
    const [currentDate, setCurrentDate] = useState(new Date());
    const [isRefreshing, setIsRefreshing] = useState(false);

    // Get initial data from SSR context
    const initialData = useInitialDataForRoute('dashboard');

    // Use initial data from SSR or fallback to default values
    const getInitialData = () => {
        if (initialData) {
            return {
                systemStats: initialData.stats
            };
        }

        // Try to get data from window if available (client-side hydration)
        if (typeof window !== 'undefined') {
            const w = window as unknown as {
                __INITIAL_DATA__?: { stats?: { users: number; staff: number; properties: number } };
            };
            const stats = w.__INITIAL_DATA__?.stats;
            if (stats) {
                return {
                    systemStats: stats
                };
            }
        }

        // Fallback to default values
        return {
            systemStats: {
                users: 0,
                staff: 0,
                properties: 0
            }
        };
    };

    const [summaryData] = useState(getInitialData());

    const handleRefresh = async () => {
        setIsRefreshing(true);

        try {
            // Simulate data refresh with API call
            await new Promise(resolve => setTimeout(resolve, 1500));

            // Update current date
            setCurrentDate(new Date());

        } catch {
            showError(t('common.feedback.operationFailed'), t('common.feedback.tryAgainLater'));
        } finally {
            setIsRefreshing(false);
        }
    };

    return (
        <PullToRefresh onRefresh={handleRefresh} disabled={!isMobile}>
            <LoadingOverlay loading={isRefreshing} label={t('common.status.refreshing')}>
                <div className="mobile-spacing mobile-container">
                    {/* Header */}
                    <div className="mobile-spacing">
                        <div className="flex items-center space-x-4">
                            <BackButton onBack={() => navigate('/complaint-details')} />
                            <h1 className="text-2xl md:text-3xl font-bold text-secondary-900">
                                {t('menu.summary')}
                            </h1>
                        </div>
                        <div className="flex items-center space-x-4 text-secondary-600">
                            <div className="flex items-center space-x-2">
                                <Calendar className="h-4 w-4" />
                                <span className="text-sm">
                                    {t('dashboard.currentDate')}: {formatDashboardDate(currentDate)}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Today's Overview */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <Card className="mobile-card">
                            <CardHeader>
                                <CardTitle className="flex items-center space-x-2">
                                    <Users className="h-5 w-5 text-primary-600" />
                                    <span>{t('sidebar.todaysOverview')}</span>
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="mobile-spacing space-y-4">
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-secondary-600">{t('sidebar.activeStaff')}</span>
                                    <span className="text-sm font-medium text-secondary-900">24</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-secondary-600">{t('sidebar.newComplaints')}</span>
                                    <span className="text-sm font-medium text-red-600">3</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-secondary-600">{t('sidebar.pendingTasks')}</span>
                                    <span className="text-sm font-medium text-yellow-600">7</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-secondary-600">{t('sidebar.completedToday')}</span>
                                    <span className="text-sm font-medium text-green-600">12</span>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="mobile-card">
                            <CardHeader>
                                <CardTitle className="flex items-center space-x-2">
                                    <BarChart3 className="h-5 w-5 text-primary-600" />
                                    <span>{t('sidebar.systemStatus')}</span>
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="mobile-spacing space-y-4">
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-secondary-600">{t('sidebar.totalUsers')}</span>
                                    <span className="text-sm font-medium text-secondary-900">
                                        {summaryData.systemStats.users}
                                    </span>
                                </div>

                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-secondary-600">{t('sidebar.activeStaff')}</span>
                                    <span className="text-sm font-medium text-secondary-900">
                                        {summaryData.systemStats.staff}
                                    </span>
                                </div>

                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-secondary-600">{t('sidebar.propertiesManaged')}</span>
                                    <span className="text-sm font-medium text-secondary-900">
                                        {summaryData.systemStats.properties}
                                    </span>
                                </div>

                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-secondary-600">{t('sidebar.pendingReviews')}</span>
                                    <span className="text-sm font-medium text-yellow-600">8</span>
                                </div>

                                <div className="pt-4">
                                    <Button variant="outline" className="w-full touch-target">
                                        {t('sidebar.viewDetailedReports')}
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Recent Activities - Merged Component */}
                    <div className="grid grid-cols-1">
                        <Card className="mobile-card">
                            <CardHeader>
                                <CardTitle className="flex items-center space-x-2">
                                    <Clock className="h-5 w-5 text-primary-600" />
                                    <span>{t('sidebar.recentActivity')}</span>
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="mobile-spacing space-y-3">
                                {/* Recent Staff Activities */}
                                {initialData?.recentActivities?.recentStaff?.map((staff) => (
                                    <div key={`staff-${staff.id}`} className="flex items-start space-x-3 p-3 bg-secondary-50 rounded-lg touch-manipulation">
                                        <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-secondary-900">
                                                {t('sidebar.newStaffMember')}: {staff.name} ({staff.position})
                                            </p>
                                            <p className="text-xs text-secondary-600">
                                                {new Date(staff.createdAt).toLocaleDateString()}
                                            </p>
                                        </div>
                                    </div>
                                ))}

                                {/* Recent Property Activities */}
                                {initialData?.recentActivities?.recentProperties?.map((property) => (
                                    <div key={`property-${property.id}`} className="flex items-start space-x-3 p-3 bg-secondary-50 rounded-lg touch-manipulation">
                                        <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-secondary-900">
                                                {t('sidebar.propertyUpdated')}: {property.name} ({property.propertyType})
                                            </p>
                                            <p className="text-xs text-secondary-600">
                                                {new Date(property.updatedAt).toLocaleDateString()}
                                            </p>
                                        </div>
                                    </div>
                                ))}

                                {/* Additional Recent Activities from Sidebar */}
                                <div className="flex items-start space-x-3 p-3 bg-secondary-50 rounded-lg touch-manipulation">
                                    <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between mb-1">
                                            <span className="text-sm font-medium text-secondary-900">{t('sidebar.staffRegistration')}</span>
                                            <span className="text-xs text-secondary-600">2 {t('sidebar.minAgo')}</span>
                                        </div>
                                        <p className="text-xs text-secondary-500">{t('sidebar.newStaffMemberAdded')}</p>
                                    </div>
                                </div>

                                <div className="flex items-start space-x-3 p-3 bg-secondary-50 rounded-lg touch-manipulation">
                                    <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between mb-1">
                                            <span className="text-sm font-medium text-secondary-900">{t('sidebar.contractUpdate')}</span>
                                            <span className="text-xs text-secondary-600">15 {t('sidebar.minAgo')}</span>
                                        </div>
                                        <p className="text-xs text-secondary-500">{t('sidebar.propertyContractRenewed')}</p>
                                    </div>
                                </div>

                                <div className="flex items-start space-x-3 p-3 bg-secondary-50 rounded-lg touch-manipulation">
                                    <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between mb-1">
                                            <span className="text-sm font-medium text-secondary-900">{t('sidebar.complaintResolved')}</span>
                                            <span className="text-xs text-secondary-600">1 {t('sidebar.hourAgo')}</span>
                                        </div>
                                        <p className="text-xs text-secondary-500">{t('sidebar.customerComplaintResolved')}</p>
                                    </div>
                                </div>

                                {/* Empty state when no activities */}
                                {(!initialData?.recentActivities?.recentStaff?.length && !initialData?.recentActivities?.recentProperties?.length) && (
                                    <div className="flex items-start space-x-3 p-3 bg-secondary-50 rounded-lg touch-manipulation">
                                        <div className="w-2 h-2 bg-gray-500 rounded-full mt-2 flex-shrink-0"></div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-secondary-900">
                                                {t('sidebar.noRecentActivities')}
                                            </p>
                                            <p className="text-xs text-secondary-600">{t('sidebar.checkBackLater')}</p>
                                        </div>
                                    </div>
                                )}

                                {/* View All Activities Button */}
                                <div className="pt-4">
                                    <Button
                                        variant="outline"
                                        className="w-full touch-target"
                                        onClick={() => {/* TODO: Implement view all activities */ }}
                                    >
                                        {t('sidebar.viewAllActivities')}
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </LoadingOverlay>
        </PullToRefresh>
    );
};