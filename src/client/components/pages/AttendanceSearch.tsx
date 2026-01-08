import React, { useState, useMemo, useEffect } from 'react';
import { Calendar, List, Filter, Users, Clock, CheckCircle, XCircle, AlertCircle, Coffee, Plane, Heart, ChevronLeft, ChevronRight } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/Select';
import { useAttendance } from '../../hooks/useAttendance';
import { useStaff } from '../../hooks/useStaff';
import { useLanguage } from '../../contexts/LanguageContext';
import { AttendanceRecord } from '../../../shared/types';
import { AttendanceFilters } from '../../services/attendanceService';

type ViewMode = 'list' | 'calendar';

const statusIcons = {
  present: <CheckCircle className="h-4 w-4 text-green-600" />,
  absent: <XCircle className="h-4 w-4 text-red-600" />,
  late: <AlertCircle className="h-4 w-4 text-yellow-600" />,
  'half-day': <Coffee className="h-4 w-4 text-blue-600" />,
  sick: <Heart className="h-4 w-4 text-purple-600" />,
  vacation: <Plane className="h-4 w-4 text-indigo-600" />,
};

const statusColors = {
  present: 'bg-green-100 text-green-800',
  absent: 'bg-red-100 text-red-800',
  late: 'bg-yellow-100 text-yellow-800',
  'half-day': 'bg-blue-100 text-blue-800',
  sick: 'bg-purple-100 text-purple-800',
  vacation: 'bg-indigo-100 text-indigo-800',
};

export const AttendanceSearch: React.FC = () => {
  const { t } = useLanguage();
  const [searchParams] = useSearchParams();
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [filters, setFilters] = useState<AttendanceFilters>({});
  const [selectedStaffIds, setSelectedStaffIds] = useState<string[]>([]);
  const [selectedStatuses, setSelectedStatuses] = useState<AttendanceRecord['status'][]>([]);
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [currentCalendarDate, setCurrentCalendarDate] = useState<Date>(new Date());

  // Initialize filters from URL parameters
  useEffect(() => {
    const staffIdParam = searchParams.get('staffId');
    if (staffIdParam) {
      setSelectedStaffIds([staffIdParam]);
    }
  }, [searchParams]);

  const { staff } = useStaff();
  const { attendanceRecords, loading, error } = useAttendance(filters);

  // Apply filters
  const appliedFilters = useMemo(() => {
    const newFilters: AttendanceFilters = {};
    
    if (selectedStaffIds.length > 0) {
      newFilters.staffIds = selectedStaffIds;
    }
    
    if (selectedStatuses.length > 0) {
      newFilters.status = selectedStatuses;
    }
    
    if (startDate) {
      newFilters.startDate = new Date(startDate);
    }
    
    if (endDate) {
      newFilters.endDate = new Date(endDate);
    }
    
    return newFilters;
  }, [selectedStaffIds, selectedStatuses, startDate, endDate]);

  // Update filters when applied filters change
  React.useEffect(() => {
    setFilters(appliedFilters);
  }, [appliedFilters]);

  const getStaffName = (staffId: string) => {
    const staffMember = staff.find(s => s.id.toString() === staffId);
    return staffMember?.name || 'Unknown Staff';
  };

  const formatTime = (date?: Date) => {
    if (!date) return '--:--';
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: false 
    });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      weekday: 'short'
    });
  };

  const clearFilters = () => {
    setSelectedStaffIds([]);
    setSelectedStatuses([]);
    setStartDate('');
    setEndDate('');
  };

  const renderListView = () => (
    <div className="space-y-4">
      {attendanceRecords.map((record) => (
        <Card key={record.id} className="hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="flex-shrink-0">
                  {statusIcons[record.status]}
                </div>
                <div>
                  <h3 className="font-medium text-secondary-900">
                    {getStaffName(record.staffId)}
                  </h3>
                  <p className="text-sm text-secondary-600">
                    {formatDate(record.date)}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center space-x-4">
                <div className="text-right">
                  <div className="text-sm font-medium text-secondary-900">
                    {formatTime(record.checkInTime)} - {formatTime(record.checkOutTime)}
                  </div>
                  {record.hoursWorked && (
                    <div className="text-xs text-secondary-600">
                      {record.hoursWorked}h worked
                    </div>
                  )}
                </div>
                
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[record.status]}`}>
                  {record.status}
                </span>
              </div>
            </div>
            
            {record.notes && (
              <div className="mt-3 pt-3 border-t border-secondary-200">
                <p className="text-sm text-secondary-600">{record.notes}</p>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
      
      {attendanceRecords.length === 0 && !loading && (
        <Card>
          <CardContent className="p-8 text-center">
            <Users className="h-12 w-12 text-secondary-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-secondary-900 mb-2">
              No attendance records found
            </h3>
            <p className="text-secondary-600">
              Try adjusting your filters or date range to see more results.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );

  const renderCalendarView = () => {
    const year = currentCalendarDate.getFullYear();
    const month = currentCalendarDate.getMonth();
    
    // Get first day of month and number of days
    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);
    const daysInMonth = lastDayOfMonth.getDate();
    const startingDayOfWeek = firstDayOfMonth.getDay();
    
    // Create calendar grid
    const calendarDays = [];
    
    // Add empty cells for days before month starts
    for (let i = 0; i < startingDayOfWeek; i++) {
      calendarDays.push(null);
    }
    
    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      calendarDays.push(day);
    }
    
    // Get attendance records for current month
    const monthStart = new Date(year, month, 1);
    const monthEnd = new Date(year, month + 1, 0);
    const monthRecords = attendanceRecords.filter(record => {
      const recordDate = new Date(record.date);
      return recordDate >= monthStart && recordDate <= monthEnd;
    });
    
    // Group records by date
    const recordsByDate = monthRecords.reduce((acc, record) => {
      const dateKey = record.date.getDate();
      if (!acc[dateKey]) {
        acc[dateKey] = [];
      }
      acc[dateKey].push(record);
      return acc;
    }, {} as Record<number, AttendanceRecord[]>);
    
    const navigateMonth = (direction: 'prev' | 'next') => {
      const newDate = new Date(currentCalendarDate);
      if (direction === 'prev') {
        newDate.setMonth(month - 1);
      } else {
        newDate.setMonth(month + 1);
      }
      setCurrentCalendarDate(newDate);
    };
    
    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl font-semibold">
              {monthNames[month]} {year}
            </CardTitle>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigateMonth('prev')}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentCalendarDate(new Date())}
              >
                Today
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigateMonth('next')}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-7 gap-1 mb-4">
            {dayNames.map(day => (
              <div key={day} className="p-2 text-center text-sm font-medium text-secondary-600 border-b">
                {day}
              </div>
            ))}
          </div>
          
          <div className="grid grid-cols-7 gap-1">
            {calendarDays.map((day, index) => {
              if (day === null) {
                return <div key={index} className="h-24 p-1"></div>;
              }
              
              const dayRecords = recordsByDate[day] || [];
              const isToday = new Date().toDateString() === new Date(year, month, day).toDateString();
              
              return (
                <div
                  key={day}
                  className={`h-24 p-1 border border-secondary-200 rounded-lg ${
                    isToday ? 'bg-primary-50 border-primary-300' : 'bg-white hover:bg-secondary-50'
                  } transition-colors`}
                >
                  <div className={`text-sm font-medium mb-1 ${
                    isToday ? 'text-primary-700' : 'text-secondary-900'
                  }`}>
                    {day}
                  </div>
                  
                  <div className="space-y-1">
                    {dayRecords.slice(0, 3).map((record, recordIndex) => {
                      const staffName = getStaffName(record.staffId);
                      const shortName = staffName.split(' ')[0]; // First name only
                      
                      return (
                        <div
                          key={recordIndex}
                          className={`text-xs px-1 py-0.5 rounded flex items-center space-x-1 ${statusColors[record.status]}`}
                          title={`${staffName} - ${record.status}${record.notes ? ': ' + record.notes : ''}`}
                        >
                          <div className="flex-shrink-0">
                            {React.cloneElement(statusIcons[record.status], { className: 'h-2.5 w-2.5' })}
                          </div>
                          <span className="truncate">{shortName}</span>
                        </div>
                      );
                    })}
                    
                    {dayRecords.length > 3 && (
                      <div className="text-xs text-secondary-500 px-1">
                        +{dayRecords.length - 3} more
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          
          {/* Legend */}
          <div className="mt-6 pt-4 border-t border-secondary-200">
            <h4 className="text-sm font-medium text-secondary-900 mb-3">{t('attendanceCalendar.statusLegend')}</h4>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
              {Object.entries(statusIcons).map(([status, icon]) => (
                <div key={status} className="flex items-center space-x-2">
                  <div className="flex-shrink-0">
                    {icon}
                  </div>
                  <span className="text-sm text-secondary-700">
                    {status === 'half-day' ? t('attendance.status.halfDay') : 
                     status === 'present' ? t('attendance.status.present') :
                     status === 'absent' ? t('attendance.status.absent') :
                     status === 'late' ? t('attendance.status.late') :
                     status === 'sick' ? t('attendance.status.sick') :
                     status === 'vacation' ? t('attendance.status.vacation') : status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Clock className="h-8 w-8 text-primary-600 animate-spin mx-auto mb-2" />
          <p className="text-secondary-600">Loading attendance records...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <XCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-secondary-900 mb-2">
            Error Loading Attendance
          </h3>
          <p className="text-red-600 mb-4">{error}</p>
          <Button onClick={() => window.location.reload()}>
            Try Again
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-secondary-900">
            {t('attendance.title')}
          </h1>
          <p className="text-secondary-600 mt-1">
            {t('attendance.subtitle')}
          </p>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button
            variant={viewMode === 'list' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('list')}
          >
            <List className="h-4 w-4 mr-2" />
            {t('attendance.listView')}
          </Button>
          <Button
            variant={viewMode === 'calendar' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('calendar')}
          >
            <Calendar className="h-4 w-4 mr-2" />
            {t('attendance.calendarView')}
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Filter className="h-5 w-5 mr-2" />
            {t('attendance.filters')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Staff Filter */}
            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-2">
                Staff Members
              </label>
              <Select
                value={selectedStaffIds.length === 1 ? selectedStaffIds[0] : ''}
                onValueChange={(value) => {
                  if (value) {
                    setSelectedStaffIds([value]);
                  } else {
                    setSelectedStaffIds([]);
                  }
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t('attendanceCalendar.allStaff')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">{t('attendanceCalendar.allStaff')}</SelectItem>
                  {staff.map((staffMember) => (
                    <SelectItem key={staffMember.id} value={staffMember.id.toString()}>
                      {staffMember.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Status Filter */}
            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-2">
                {t('attendanceCalendar.status')}
              </label>
              <Select
                value={selectedStatuses.length === 1 ? selectedStatuses[0] : ''}
                onValueChange={(value) => {
                  if (value) {
                    setSelectedStatuses([value as AttendanceRecord['status']]);
                  } else {
                    setSelectedStatuses([]);
                  }
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t('attendanceCalendar.allStatuses')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">{t('attendanceCalendar.allStatuses')}</SelectItem>
                  <SelectItem value="present">{t('attendance.status.present')}</SelectItem>
                  <SelectItem value="absent">{t('attendance.status.absent')}</SelectItem>
                  <SelectItem value="late">{t('attendance.status.late')}</SelectItem>
                  <SelectItem value="half-day">{t('attendance.status.halfDay')}</SelectItem>
                  <SelectItem value="sick">{t('attendance.status.sick')}</SelectItem>
                  <SelectItem value="vacation">{t('attendance.status.vacation')}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Start Date */}
            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-2">
                Start Date
              </label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>

            {/* End Date */}
            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-2">
                End Date
              </label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-secondary-200">
            <div className="text-sm text-secondary-600">
              Showing {attendanceRecords.length} records
            </div>
            <Button variant="outline" size="sm" onClick={clearFilters}>
              {t('attendance.clearFilters')}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Content */}
      {viewMode === 'list' ? renderListView() : renderCalendarView()}
    </div>
  );
};