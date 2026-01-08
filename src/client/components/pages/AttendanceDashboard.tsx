import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, BarChart3, Users, Clock, TrendingUp, TrendingDown } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { Button } from '../ui/Button';
import { BackButton } from '../ui/BackButton';
import { useAttendance, useAttendanceStatistics } from '../../hooks/useAttendance';
import { useStaff } from '../../hooks/useStaff';
import { useLanguage } from '../../contexts/LanguageContext';
import { AttendanceSearch } from './AttendanceSearch';

export const AttendanceDashboard: React.FC = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'overview' | 'search'>('overview');

  // Use useState to create stable date range (calculated once on mount)
  const [dateRange] = useState(() => ({
    start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
    end: new Date()
  }));

  const { staff } = useStaff();

  // Memoize the filters to prevent infinite re-renders
  const attendanceFilters = useMemo(() => ({
    startDate: dateRange.start,
    endDate: dateRange.end
  }), [dateRange.start, dateRange.end]);

  const { attendanceRecords, loading } = useAttendance(attendanceFilters);
  const { statistics } = useAttendanceStatistics(undefined, dateRange.start, dateRange.end);

  // Calculate additional metrics
  const metrics = useMemo(() => {
    if (!statistics || !staff.length) return null;

    const totalStaff = staff.length;
    const attendanceRate = statistics.totalRecords > 0
      ? ((statistics.presentDays + statistics.lateDays) / statistics.totalRecords * 100)
      : 0;

    const avgHoursPerDay = statistics.averageHours;

    // Calculate trends (mock data for demo)
    const attendanceTrend = 2.5; // +2.5% from last period
    const hoursTrend = -0.3; // -0.3 hours from last period

    return {
      totalStaff,
      attendanceRate,
      avgHoursPerDay,
      attendanceTrend,
      hoursTrend,
      ...statistics
    };
  }, [statistics, staff]);

  const _getStatusColor = (status: string) => {
    const colors = {
      present: 'text-green-600',
      absent: 'text-red-600',
      late: 'text-yellow-600',
      'half-day': 'text-blue-600',
      sick: 'text-purple-600',
      vacation: 'text-indigo-600',
    };
    return colors[status as keyof typeof colors] || 'text-gray-600';
  };

  const renderOverview = () => (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-secondary-600">{t('attendanceDashboard.totalStaff')}</p>
                <p className="text-2xl font-bold text-secondary-900">{metrics?.totalStaff || 0}</p>
              </div>
              <Users className="h-8 w-8 text-primary-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-secondary-600">{t('attendanceDashboard.attendanceRate')}</p>
                <p className="text-2xl font-bold text-secondary-900">
                  {metrics?.attendanceRate.toFixed(1) || 0}%
                </p>
                {metrics?.attendanceTrend && (
                  <div className="flex items-center mt-1">
                    {metrics.attendanceTrend > 0 ? (
                      <TrendingUp className="h-4 w-4 text-green-600 mr-1" />
                    ) : (
                      <TrendingDown className="h-4 w-4 text-red-600 mr-1" />
                    )}
                    <span className={`text-sm ${metrics.attendanceTrend > 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {Math.abs(metrics.attendanceTrend)}%
                    </span>
                  </div>
                )}
              </div>
              <BarChart3 className="h-8 w-8 text-primary-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-secondary-600">{t('attendanceDashboard.avgHoursPerDay')}</p>
                <p className="text-2xl font-bold text-secondary-900">
                  {metrics?.avgHoursPerDay.toFixed(1) || 0}h
                </p>
                {metrics?.hoursTrend && (
                  <div className="flex items-center mt-1">
                    {metrics.hoursTrend > 0 ? (
                      <TrendingUp className="h-4 w-4 text-green-600 mr-1" />
                    ) : (
                      <TrendingDown className="h-4 w-4 text-red-600 mr-1" />
                    )}
                    <span className={`text-sm ${metrics.hoursTrend > 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {Math.abs(metrics.hoursTrend)}h
                    </span>
                  </div>
                )}
              </div>
              <Clock className="h-8 w-8 text-primary-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-secondary-600">{t('attendanceDashboard.totalRecords')}</p>
                <p className="text-2xl font-bold text-secondary-900">{metrics?.totalRecords || 0}</p>
              </div>
              <Calendar className="h-8 w-8 text-primary-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Status Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>{t('attendanceDashboard.statusBreakdown')}</CardTitle>
          </CardHeader>
          <CardContent>
            {metrics?.statusCounts && (
              <div className="space-y-4">
                {Object.entries(metrics.statusCounts).map(([status, count]) => {
                  const percentage = metrics.totalRecords > 0
                    ? (count / metrics.totalRecords * 100).toFixed(1)
                    : '0';

                  return (
                    <div key={status} className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className={`w-3 h-3 rounded-full ${status === 'present' ? 'bg-green-500' :
                          status === 'absent' ? 'bg-red-500' :
                            status === 'late' ? 'bg-yellow-500' :
                              status === 'half-day' ? 'bg-blue-500' :
                                status === 'sick' ? 'bg-purple-500' :
                                  status === 'vacation' ? 'bg-indigo-500' : 'bg-gray-500'
                          }`}></div>
                        <span className="text-sm font-medium text-secondary-900 capitalize">
                          {status === 'half-day' ? 'Half Day' : status}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-sm font-medium text-secondary-900">{count}</span>
                        <span className="text-xs text-secondary-600 ml-2">({percentage}%)</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t('attendanceDashboard.recentActivity')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {attendanceRecords.slice(0, 5).map((record) => {
                const staffMember = staff.find(s => s.id.toString() === record.staffId);
                return (
                  <div key={record.id} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className={`w-2 h-2 rounded-full ${record.status === 'present' ? 'bg-green-500' :
                        record.status === 'absent' ? 'bg-red-500' :
                          record.status === 'late' ? 'bg-yellow-500' :
                            record.status === 'half-day' ? 'bg-blue-500' :
                              record.status === 'sick' ? 'bg-purple-500' :
                                record.status === 'vacation' ? 'bg-indigo-500' : 'bg-gray-500'
                        }`}></div>
                      <div>
                        <p className="text-sm font-medium text-secondary-900">
                          {staffMember?.name || 'Unknown Staff'}
                        </p>
                        <p className="text-xs text-secondary-600">
                          {record.date.toLocaleDateString()} - {record.status}
                        </p>
                      </div>
                    </div>
                    {record.hoursWorked && (
                      <span className="text-xs text-secondary-600">
                        {record.hoursWorked}h
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>{t('attendanceDashboard.quickActions')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            <Button onClick={() => setActiveTab('search')}>
              {t('attendanceDashboard.viewAllRecords')}
            </Button>
            <Button variant="outline">
              {t('attendanceDashboard.exportReport')}
            </Button>
            <Button variant="outline">
              {t('attendanceDashboard.addRecord')}
            </Button>
            <Button variant="outline">
              {t('attendanceDashboard.generateSummary')}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Clock className="h-8 w-8 text-primary-600 animate-spin mx-auto mb-2" />
          <p className="text-secondary-600">{t('attendanceDashboard.loadingAttendanceData')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <BackButton onBack={() => navigate('/complaint-details')} />
          <div>
            <h1 className="text-2xl font-bold text-secondary-900">
              {t('attendanceDashboard.title')}
            </h1>
            <p className="text-secondary-600 mt-1">
              {t('attendanceDashboard.subtitle')}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <Button
            variant={activeTab === 'overview' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setActiveTab('overview')}
          >
            <BarChart3 className="h-4 w-4 mr-2" />
            {t('attendanceDashboard.overview')}
          </Button>
          <Button
            variant={activeTab === 'search' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setActiveTab('search')}
          >
            <Calendar className="h-4 w-4 mr-2" />
            {t('attendanceDashboard.records')}
          </Button>
        </div>
      </div>

      {/* Content */}
      {activeTab === 'overview' ? renderOverview() : <AttendanceSearch />}
    </div>
  );
};