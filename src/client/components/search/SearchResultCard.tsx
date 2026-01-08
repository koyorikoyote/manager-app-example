import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, User, Building, FileText, MessageSquare, Calendar, Building2 } from 'lucide-react';
import { Card, CardContent } from '../ui/Card';
import { useLanguage } from '../../contexts/LanguageContext';
import { useMobileDetection } from '../../hooks/useTouch';
import type { SearchResult } from '../../services/searchService';

interface SearchResultCardProps {
  result: SearchResult;
  onClick?: (result: SearchResult) => void;
  className?: string;
  disabled?: boolean;
}

export const SearchResultCard: React.FC<SearchResultCardProps> = ({
  result,
  onClick,
  className,
  disabled = false
}) => {
  const { t } = useLanguage();
  const { isMobile } = useMobileDetection();
  const navigate = useNavigate();

  const getIcon = () => {
    switch (result.type) {
      case 'staff':
        return <User className="h-5 w-5 text-primary-600" />;
      case 'destinations':
        return <Building2 className="h-5 w-5 text-primary-600" />;
      case 'interactions':
        return <MessageSquare className="h-5 w-5 text-primary-600" />;
      case 'residences':
        return <Building className="h-5 w-5 text-primary-600" />;
      case 'attendance':
        return <Calendar className="h-5 w-5 text-primary-600" />;
      case 'manual':
        return <FileText className="h-5 w-5 text-primary-600" />;
      case 'dailyRecord':
        return <FileText className="h-5 w-5 text-primary-600" />;
      case 'inquiriesNotifications':
        return <MessageSquare className="h-5 w-5 text-primary-600" />;
      default:
        return <FileText className="h-5 w-5 text-primary-600" />;
    }
  };

  const getTypeLabel = () => {
    switch (result.type) {
      case 'staff':
        return t('navigation.staff');
      case 'destinations':
        return t('navigation.destinations');
      case 'interactions':
        return t('navigation.interactions');
      case 'residences':
        return t('navigation.residences');
      case 'attendance':
        return t('navigation.attendance');
      case 'manual':
        return t('navigation.manual');
      case 'dailyRecord':
        return t('navigation.dailyRecord');
      case 'inquiriesNotifications':
        return t('navigation.inquiriesNotifications');
      default:
        return result.type;
    }
  };

  const getRelevantMetadata = (): [string, string][] => {
    if (!result.metadata) return [];

    const entries = Object.entries(result.metadata);

    // Define priority metadata fields for each data type
    const priorityFields: Record<string, string[]> = {
      staff: ['Department', 'Position', 'Status', 'Phone', 'Email'],
      destinations: ['Industry', 'Status', 'Address', 'Phone', 'Email'],
      interactions: ['Type', 'Status', 'Date', 'Created By'],
      residences: ['Type', 'Status', 'Address', 'Manager'],
      attendance: ['Status', 'Date', 'Hours Worked', 'Staff ID'],
      manual: ['Type', 'Status', 'Start Date', 'End Date'],
      dailyRecord: ['Staff Name', 'Condition Status', 'Date of Record', 'Contact Number'],
      inquiriesNotifications: ['Progress Status', 'Type of Inquiry', 'Company Name', 'Responder Name']
    };

    const priorities = priorityFields[result.type] || [];

    // Sort entries by priority, then take first 3
    const sortedEntries = entries.sort(([keyA], [keyB]) => {
      const priorityA = priorities.indexOf(keyA);
      const priorityB = priorities.indexOf(keyB);

      // If both are in priority list, sort by priority order
      if (priorityA !== -1 && priorityB !== -1) {
        return priorityA - priorityB;
      }
      // If only one is in priority list, prioritize it
      if (priorityA !== -1) return -1;
      if (priorityB !== -1) return 1;
      // If neither is in priority list, maintain original order
      return 0;
    });

    return sortedEntries.slice(0, 3);
  };

  const getTypeBadgeStyle = (): string => {
    switch (result.type) {
      case 'staff':
        return 'text-blue-700 bg-blue-100';
      case 'destinations':
        return 'text-green-700 bg-green-100';
      case 'interactions':
        return 'text-purple-700 bg-purple-100';
      case 'residences':
        return 'text-orange-700 bg-orange-100';
      case 'attendance':
        return 'text-indigo-700 bg-indigo-100';
      case 'manual':
        return 'text-gray-700 bg-gray-100';
      case 'dailyRecord':
        return 'text-teal-700 bg-teal-100';
      case 'inquiriesNotifications':
        return 'text-pink-700 bg-pink-100';
      default:
        return 'text-primary-600 bg-primary-50';
    }
  };

  const getStatusBadge = (): string | null => {
    const status = result.metadata?.Status || result.metadata?.['Progress Status'] || result.metadata?.['Condition Status'];
    if (!status) return null;

    // Return status for certain types where it's particularly relevant
    if (['staff', 'destinations', 'residences', 'attendance', 'dailyRecord', 'inquiriesNotifications'].includes(result.type)) {
      return status;
    }

    return null;
  };

  const getEnhancedDescription = (): string => {
    if (!result.description) return '';

    // For certain types, enhance the description with additional context
    switch (result.type) {
      case 'attendance': {
        const date = result.metadata?.Date;
        const status = result.metadata?.Status;
        return date && status ? `${status} on ${date} - ${result.description}` : result.description;
      }

      case 'interactions': {
        const type = result.metadata?.Type;
        const interactionDate = result.metadata?.Date;
        return type && interactionDate ? `${type} interaction on ${interactionDate} - ${result.description}` : result.description;
      }

      case 'manual': {
        const docType = result.metadata?.Type;
        const startDate = result.metadata?.['Start Date'];
        return docType && startDate ? `${docType} document from ${startDate} - ${result.description}` : result.description;
      }

      default:
        return result.description;
    }
  };

  const handleClick = () => {
    if (disabled) return;

    if (onClick) {
      onClick(result);
    } else {
      // Default navigation based on type
      switch (result.type) {
        case 'staff':
          navigate(`/staff/${result.id}`);
          break;
        case 'destinations':
          navigate(`/destination/${result.id}`);
          break;
        case 'interactions':
          navigate(`/interaction/${result.id}`);
          break;
        case 'residences':
          navigate(`/residence/${result.id}`);
          break;
        case 'attendance':
          // Navigate to attendance dashboard with filter for this record
          navigate(`/attendance?recordId=${result.id}`);
          break;
        case 'manual':
          // Navigate to manual page with filter for this document
          navigate(`/manual?documentId=${result.id}`);
          break;
        case 'dailyRecord':
          // Navigate to daily record page with filter for this record
          navigate(`/daily-record?recordId=${result.id}`);
          break;
        case 'inquiriesNotifications':
          // Navigate to inquiries page with filter for this inquiry
          navigate(`/inquiries-notifications?inquiryId=${result.id}`);
          break;
        default:
          break;
      }
    }
  };

  return (
    <Card
      variant="interactive"
      padding="none"
      className={`${disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'} touch-manipulation focus-within:ring-2 focus-within:ring-primary-500/20 ${className || ''}`}
      onClick={handleClick}
      role="button"
      tabIndex={disabled ? -1 : 0}
      aria-label={`View ${getTypeLabel()}: ${result.title}${result.subtitle ? ` - ${result.subtitle}` : ''}`}
      aria-disabled={disabled}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleClick();
        }
      }}
    >
      <CardContent className={`p-4 ${isMobile ? 'p-4 min-h-[80px]' : ''}`}>
        <div className="flex items-start space-x-3">
          <div className="flex-shrink-0 mt-1">
            {getIcon()}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <div className={`flex items-center flex-wrap gap-2 mb-2 ${isMobile ? 'mb-3' : ''}`}>
                  <span
                    className={`text-xs font-medium px-2 py-1 rounded-full ${getTypeBadgeStyle()} ${isMobile ? 'px-3 py-1.5' : ''}`}
                    aria-label={`Type: ${getTypeLabel()}`}
                  >
                    {getTypeLabel()}
                  </span>
                  {result.nationality && (
                    <span
                      className={`text-xs text-secondary-500 bg-secondary-100 px-2 py-1 rounded-full ${isMobile ? 'px-3 py-1.5' : ''}`}
                      aria-label={`Nationality: ${result.nationality}`}
                    >
                      {result.nationality}
                    </span>
                  )}
                  {getStatusBadge() && (
                    <span
                      className={`text-xs text-secondary-600 bg-secondary-100 px-2 py-1 rounded-full ${isMobile ? 'px-3 py-1.5' : ''}`}
                      aria-label={`Status: ${getStatusBadge()}`}
                    >
                      {getStatusBadge()}
                    </span>
                  )}
                </div>

                <h3 className={`text-sm font-semibold text-secondary-900 ${isMobile ? 'text-base' : ''}`}>
                  {result.title}
                </h3>

                {result.subtitle && (
                  <p className={`text-sm text-secondary-600 mt-1 ${isMobile ? 'text-base line-clamp-2' : 'truncate'}`}>
                    {result.subtitle}
                  </p>
                )}

                {result.description && (
                  <p className={`text-xs text-secondary-500 mt-2 line-clamp-2 ${isMobile ? 'text-sm line-clamp-3' : ''}`}>
                    {getEnhancedDescription()}
                  </p>
                )}

                {result.metadata && Object.keys(result.metadata).length > 0 && (
                  <div className={`flex flex-wrap gap-2 mt-2 ${isMobile ? 'gap-2 mt-3' : ''}`}>
                    {getRelevantMetadata().map(([key, value]) => (
                      <span
                        key={key}
                        className={`text-xs text-secondary-600 bg-secondary-50 px-2 py-1 rounded ${isMobile ? 'text-xs px-2.5 py-1.5' : ''}`}
                        aria-label={`${key}: ${value}`}
                      >
                        <span className="sr-only">{key}: </span>
                        <span className="font-medium">{key}:</span> {value}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <ChevronRight
                className={`h-4 w-4 text-secondary-400 flex-shrink-0 ml-2 ${isMobile ? 'h-5 w-5 mt-1' : ''}`}
                aria-hidden="true"
              />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};