import React from 'react';
import { Dialog } from './Dialog';
import { ResponsiveComplaintDisplay } from './ResponsiveComplaintDisplay';
import { Button } from './Button';
import { useLanguage } from '../../contexts/LanguageContext';
import type { ComplaintDetailWithRelations } from '../../../shared/types';
import type { ResponsiveColumnDef } from '../../utils/columnHelpers';

interface HighPriorityComplaintsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  complaints: ComplaintDetailWithRelations[];
  loading: boolean;
  error: string | null;
  columns: ResponsiveColumnDef<ComplaintDetailWithRelations & Record<string, unknown>>[];
  onComplaintClick?: (complaint: ComplaintDetailWithRelations) => void;
  onRetry?: () => void;
}

/**
 * HighPriorityComplaintsDialog - Displays high-priority complaints in a dialog
 * 
 * Features:
 * - Follows StandardDetailDialog pattern with header, content, and footer sections
 * - Includes 'X' and 'Close' buttons for dialog dismissal
 * - Integrates ResponsiveComplaintDisplay component for content area
 * - Automatically switches between DataTable (desktop) and ComplaintCard (mobile) views
 * - Supports multi-language translations
 */
export const HighPriorityComplaintsDialog: React.FC<HighPriorityComplaintsDialogProps> = ({
  isOpen,
  onClose,
  complaints,
  loading,
  error,
  columns,
  onComplaintClick,
  onRetry
}) => {
  const { t } = useLanguage();

  // Loading state content
  const loadingContent = (
    <div className="text-center py-8">
      <div className="flex items-center justify-center mb-4">
        <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
      <p className="text-sm text-neutral-600">{t('highPriorityDialog.loading')}</p>
    </div>
  );

  // Error state content with retry functionality
  const errorContent = (
    <div className="text-center py-8">
      <div className="rounded-full bg-red-100 flex items-center justify-center h-12 w-12 mx-auto mb-4">
        <svg
          className="h-6 w-6 text-red-600"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          aria-hidden="true"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16c-.77.833.192 2.5 1.732 2.5z" />
        </svg>
      </div>
      <p className="text-sm font-medium text-red-800 mb-2">{t('highPriorityDialog.error')}</p>
      <p className="text-xs text-red-600 mb-4">{error}</p>
      {onRetry && (
        <Button
          onClick={onRetry}
          variant="outline"
          size="sm"
          className="border-red-300 text-red-700 hover:bg-red-100 focus:ring-red-500"
        >
          <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          {t('common.actions.retry')}
        </Button>
      )}
    </div>
  );

  // Empty state content
  const emptyContent = (
    <div className="text-center py-8">
      <div className="rounded-full bg-green-100 flex items-center justify-center h-12 w-12 mx-auto mb-4">
        <svg
          className="h-6 w-6 text-green-500"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          aria-hidden="true"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>
      <p className="text-sm font-medium text-neutral-900 mb-2">{t('highPriorityDialog.noUrgentComplaints')}</p>
      <p className="text-xs text-neutral-500">{t('highPriorityDialog.allComplaintsHandled')}</p>
    </div>
  );

  // Dialog content based on state
  const getDialogContent = () => {
    if (loading) {
      return loadingContent;
    }

    if (error) {
      return errorContent;
    }

    if (!complaints || complaints.length === 0) {
      return emptyContent;
    }

    const filteredColumns = (columns || []).filter((c) => {
      const key = (c as any).accessorKey || (c as any).id;
      return key !== 'select' && key !== 'urgencyLevel';
    });

    return (
      <ResponsiveComplaintDisplay
        complaints={complaints}
        loading={loading}
        error={error}
        columns={filteredColumns}
        onComplaintClick={onComplaintClick}
        className="min-h-[200px]"
      />
    );
  };

  // Dialog footer with close button
  const footer = (
    <Button
      variant="outline"
      onClick={onClose}
      className="min-w-[100px]"
    >
      {t('highPriorityDialog.close')}
    </Button>
  );

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title={t('highPriorityDialog.title')}
      footer={footer}
      size="xl"
      className="max-w-6xl"
      scrollable={true}
      maxHeight="85vh"
    >
      <div className="space-y-4">
        {/* Dialog description */}
        <div className="text-sm text-neutral-600 mb-6">
          {t('highPriorityDialog.description')}
        </div>

        {/* Main content area */}
        <div className="min-h-[300px]">
          {getDialogContent()}
        </div>
      </div>
    </Dialog>
  );
};
