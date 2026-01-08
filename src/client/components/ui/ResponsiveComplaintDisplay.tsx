import React from 'react';
import { DataTable } from './DataTable';
import { ComplaintCard } from './ComplaintCard';
import { useResponsive } from '../../hooks/useResponsive';
import { useMobileDetection } from '../../hooks/useTouch';
import { useLanguage } from '../../contexts/LanguageContext';
import { cn } from '../../utils/cn';
import type { ComplaintDetailWithRelations } from '../../../shared/types';
import type { ResponsiveColumnDef } from '../../utils/columnHelpers';

interface ResponsiveComplaintDisplayProps {
  complaints: ComplaintDetailWithRelations[];
  loading?: boolean;
  error?: string | null;
  columns: ResponsiveColumnDef<ComplaintDetailWithRelations & Record<string, unknown>>[];
  onComplaintClick?: (complaint: ComplaintDetailWithRelations) => void;
  className?: string;
}

/**
 * ResponsiveComplaintDisplay - Automatically switches between DataTable and ComplaintCard views
 * based on device type and screen size
 * 
 * - Desktop (≥768px): Shows DataTable component
 * - Mobile (<768px): Shows ComplaintCard grid layout
 * - Uses CSS media queries and React hooks for device detection
 */
export const ResponsiveComplaintDisplay: React.FC<ResponsiveComplaintDisplayProps> = ({
  complaints,
  loading = false,
  error = null,
  columns,
  onComplaintClick,
  className
}) => {
  const { isMobile } = useResponsive();
  const { isTouch } = useMobileDetection();
  const { t } = useLanguage();

  // Handle complaint click for DataTable (receives Record<string, unknown>)
  const handleDataTableClick = React.useCallback((row: Record<string, unknown>) => {
    onComplaintClick?.(row as unknown as ComplaintDetailWithRelations);
  }, [onComplaintClick]);

  // Handle complaint click for ComplaintCard (receives ComplaintDetailWithRelations)
  const handleComplaintClick = React.useCallback((complaint: ComplaintDetailWithRelations) => {
    onComplaintClick?.(complaint);
  }, [onComplaintClick]);

  // Desktop view: DataTable component
  if (!isMobile) {
    return (
      <div className={cn('animate-in fade-in-0 duration-300', className)}>
        <DataTable
          columns={columns}
          data={complaints as (ComplaintDetailWithRelations & Record<string, unknown>)[]}
          loading={loading}
          error={error}
          onRowClick={handleDataTableClick}
          enableResponsive={true}
          showScrollButtons={true}
          className="rounded-xl border border-neutral-200 bg-white shadow-soft"
        />
      </div>
    );
  }

  // Mobile view: ComplaintCard grid layout
  return (
    <div className={cn('animate-in fade-in-0 duration-300', className)}>
      {/* Loading state */}
      {loading && (
        <div className="grid grid-cols-1 gap-4">
          {Array.from({ length: 6 }).map((_, index) => (
            <div
              key={index}
              className="h-48 bg-neutral-100 rounded-xl animate-pulse"
            />
          ))}
        </div>
      )}

      {/* Error state */}
      {error && !loading && (
        <div className="text-center py-8">
          <div className="rounded-full bg-red-100 flex items-center justify-center h-12 w-12 mx-auto mb-4">
            <svg
              className="h-6 w-6 text-red-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <p className="text-sm font-medium text-red-800 mb-2">{t('highPriorityDialog.errorLoadingComplaints')}</p>
          <p className="text-xs text-red-600">{error}</p>
        </div>
      )}

      {/* Empty state */}
      {!loading && !error && complaints.length === 0 && (
        <div className="text-center py-8">
          <div className="rounded-full bg-neutral-100 flex items-center justify-center h-12 w-12 mx-auto mb-4">
            <svg
              className="h-6 w-6 text-neutral-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <p className="text-sm font-medium text-neutral-900 mb-2">{t('highPriorityDialog.noUrgentComplaints')}</p>
          <p className="text-xs text-neutral-500">{t('highPriorityDialog.allComplaintsHandled')}</p>
        </div>
      )}

      {/* Complaints grid */}
      {!loading && !error && complaints.length > 0 && (
        <div 
          className={cn(
            'grid gap-4',
            'grid-cols-1',
            // Optimize touch interactions for mobile
            isTouch && 'touch-manipulation'
          )}
        >
          {complaints.map((complaint) => (
            <ComplaintCard
              key={complaint.id}
              complaint={complaint}
              onClick={handleComplaintClick}
            />
          ))}
        </div>
      )}
    </div>
  );
};