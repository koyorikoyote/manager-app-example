import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageSquare, FileText, Bell, Calendar } from 'lucide-react';
import { Card, CardContent } from './ui/Card';
import { PullToRefresh } from './ui/PullToRefresh';
import { DashboardSkeleton, LoadingOverlay } from './ui';
import { useLanguage } from '../contexts/LanguageContext';
import { useFormatting } from '../hooks/useFormatting';
import { useMobileDetection } from '../hooks/useTouch';
import { useInitialDataForRoute } from '../contexts/SSRDataContext';
import { useToast } from '../contexts/ToastContext';

interface DashboardCardProps {
  icon: React.ReactNode;
  title: string;
  count: number;
  onClick: () => void;
}

const DashboardCard: React.FC<DashboardCardProps> = ({ icon, title, count, onClick }) => {
  const { t } = useLanguage();
  
  return (
    <Card 
      variant="interactive" 
      className="cursor-pointer h-full touch-manipulation"
      onClick={onClick}
    >
      <CardContent className="flex flex-col items-center justify-center p-4 md:p-6 text-center space-y-3 md:space-y-4 min-h-[140px] md:min-h-[160px]">
        <div className="w-12 h-12 md:w-16 md:h-16 bg-gradient-to-br from-primary-100 to-primary-200 rounded-full flex items-center justify-center">
          {icon}
        </div>
        <div className="space-y-1 md:space-y-2">
          <h3 className="text-base md:text-lg font-semibold text-secondary-900 leading-tight">
            {title}
          </h3>
          <div className="flex items-center justify-center space-x-2">
            <span className="text-xl md:text-2xl font-bold text-primary-600">
              {count}
            </span>
            <span className="text-xs md:text-sm text-secondary-600">
              {t('common.misc.items')}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export const Dashboard: React.FC = () => {
  const { t } = useLanguage();
  const { formatDashboardDate } = useFormatting();
  const navigate = useNavigate();
  const { isMobile } = useMobileDetection();
  const { showError } = useToast();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isInitialLoading] = useState(false);
  
  // Get initial data from SSR context
  const initialData = useInitialDataForRoute('dashboard');
  
  // Use initial data from SSR or fallback to default values
  const getInitialData = () => {
    if (initialData) {
      return {
        complaints: 3,
        dailyRecords: 12,
        inquiries: 7,
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
          complaints: 3,
          dailyRecords: 12,
          inquiries: 7,
          systemStats: stats
        };
      }
    }
    
    // Fallback to default values
    return {
      complaints: 3,
      dailyRecords: 12,
      inquiries: 7,
      systemStats: {
        users: 0,
        staff: 0,
        properties: 0
      }
    };
  };

  const [dashboardData, setDashboardData] = useState(getInitialData());

  const handleRefresh = async () => {
    setIsRefreshing(true);
    
    try {
      // Simulate data refresh with API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Update current date and simulate new data
      setCurrentDate(new Date());
      setDashboardData(prev => ({
        ...prev,
        complaints: prev.complaints + Math.floor(Math.random() * 2),
        dailyRecords: prev.dailyRecords + Math.floor(Math.random() * 3),
        inquiries: prev.inquiries + Math.floor(Math.random() * 2),
      }));
      
      // Removed toast notification to prevent unwanted messages during navigation
      // showSuccess(t('common.feedback.dataRefreshed'));
    } catch {
      showError(t('common.feedback.operationFailed'), t('common.feedback.tryAgainLater'));
    } finally {
      setIsRefreshing(false);
    }
  };

  const dashboardItems = [
    {
      icon: <MessageSquare className="h-6 w-6 md:h-8 md:w-8 text-primary-600" />,
      title: t('dashboard.complaintDetails'),
      count: dashboardData.complaints,
      onClick: () => navigate('/complaint-details')
    },
    {
      icon: <FileText className="h-6 w-6 md:h-8 md:w-8 text-primary-600" />,
      title: t('dashboard.dailyRecord'),
      count: dashboardData.dailyRecords,
      onClick: () => navigate('/daily-record')
    },
    {
      icon: <Bell className="h-6 w-6 md:h-8 md:w-8 text-primary-600" />,
      title: t('dashboard.inquiriesNotifications'),
      count: dashboardData.inquiries,
      onClick: () => navigate('/inquiries-notifications')
    }
  ];

  // Show skeleton during initial SSR loading
  if (isInitialLoading) {
    return <DashboardSkeleton />;
  }

  return (
    <PullToRefresh onRefresh={handleRefresh} disabled={!isMobile}>
      <LoadingOverlay loading={isRefreshing} label={t('common.status.refreshing')}>
        <div className="mobile-spacing mobile-container">
        
        {/* Header */}
        <div className="mobile-spacing mt-2 md:mt-0">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Calendar className="h-5 w-5 text-primary-600" />
              <span className="text-xs md:text-sm font-medium text-primary-600">
                {t('dashboard.currentDate')}: {formatDashboardDate(currentDate)}
              </span>
            </div>
          </div>
        </div>

        {/* Dashboard Cards - Complaint Details and Daily Record in first row, Inquiries and Notifications stretched in second row */}
        <div className="space-y-4 md:space-y-6 max-w-4xl mx-auto">
          {/* First row: Complaint Details and Daily Record */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
            <DashboardCard
              icon={dashboardItems[0].icon}
              title={dashboardItems[0].title}
              count={dashboardItems[0].count}
              onClick={dashboardItems[0].onClick}
            />
            <DashboardCard
              icon={dashboardItems[1].icon}
              title={dashboardItems[1].title}
              count={dashboardItems[1].count}
              onClick={dashboardItems[1].onClick}
            />
          </div>
          
          {/* Second row: Inquiries and Notifications stretched full width */}
          <div className="grid grid-cols-1">
            <DashboardCard
              icon={dashboardItems[2].icon}
              title={dashboardItems[2].title}
              count={dashboardItems[2].count}
              onClick={dashboardItems[2].onClick}
            />
          </div>
        </div>


        </div>
      </LoadingOverlay>
    </PullToRefresh>
  );
};
