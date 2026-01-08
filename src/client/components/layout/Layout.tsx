import React, { useState, useEffect, useMemo } from 'react';
import { Header } from './Header';
import { LeftSidebar } from './LeftSidebar';
import { MobileBottomNav } from './MobileBottomNav';
import { HighPriorityComplaintsDialog } from '../ui/HighPriorityComplaintsDialog';
import { cn } from '../../utils/cn';
import { useMobileDetection } from '../../hooks/useTouch';
import { useHighPriorityComplaints } from '../../contexts/HighPriorityComplaintsContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { formatDateForTable } from '../../utils/localization';
import type { ResponsiveColumnDef } from '../../utils/columnHelpers';
import { ColumnPriority } from '../../utils/columnHelpers';
import type { ComplaintDetailWithRelations } from '../../../shared/types';

interface LayoutProps {
  children: React.ReactNode;
  className?: string;
}

export const Layout: React.FC<LayoutProps> = ({ children, className }) => {
  const [isLeftSidebarOpen, setIsLeftSidebarOpen] = useState(false);
  const { isMobile } = useMobileDetection();
  const { t } = useLanguage();

  // Set localized default document title on mount and when language changes
  useEffect(() => {
    if (typeof document === 'undefined') return;
    const translated = t('header.managerApp');
    const current = document.title;
    if (!current || current === 'Manager App' || current === 'Crew System') {
      document.title = translated;
    }
  }, [t]);
  const {
    showHighPriorityDialog,
    highPriorityComplaints,
    highPriorityLoading,
    highPriorityError,
    fetchAndShowHighPriorityComplaints,
    closeHighPriorityDialog
  } = useHighPriorityComplaints();

  // Basic columns for high-priority complaints dialog
  const columns: ResponsiveColumnDef<ComplaintDetailWithRelations & Record<string, unknown>>[] = useMemo(() => [
    {
      accessorKey: "dateOfOccurrence",
      header: t('complaintDetails.columns.dateOfOccurrence'),
      priority: ColumnPriority.HIGH,
      cell: ({ row }) => {
        const date = row.original.dateOfOccurrence;
        const formatted = formatDateForTable(date);
        return <span>{formatted ? formatted : "--"}</span>;
      },
    },
    {
      accessorKey: "complainerName",
      header: t('complaintDetails.columns.complainerName'),
      priority: ColumnPriority.ESSENTIAL,
      cell: ({ row }) => (
        <span className="font-medium">{row.original.complainerName}</span>
      ),
    },
    {
      accessorKey: "progressStatus",
      header: t('complaintDetails.columns.progressStatus'),
      priority: ColumnPriority.ESSENTIAL,
      cell: ({ row }) => {
        const raw = row.original.progressStatus as string | undefined;
        const status = raw || (row.original as any).progressStatusText || '';
        if (!status) return <span>--</span>;
        const normalized = String(status).toUpperCase();
        const colorClass =
          normalized === 'OPEN'
            ? 'bg-red-100 text-red-800 border-red-200'
            : normalized === 'CLOSED'
              ? 'bg-green-100 text-green-800 border-green-200'
              : 'bg-yellow-100 text-yellow-800 border-yellow-200';
        const label = (status === 'OPEN' || status === 'CLOSED' || status === 'ON_HOLD') ? status : (row.original as any).progressStatusText || status;
        return (
          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${colorClass}`}>
            {label}
          </span>
        );
      },
    },
    {
      accessorKey: "company",
      header: t('complaintDetails.columns.companyName'),
      priority: ColumnPriority.HIGH,
      cell: ({ row }) => row.original.company?.name || "--",
    },
  ], [t]);

  // Handle responsive behavior
  useEffect(() => {
    // Auto-close sidebar on mobile when switching to desktop
    if (!isMobile) {
      setIsLeftSidebarOpen(false);
    }
  }, [isMobile]);

  // Close sidebar when clicking outside on mobile
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsLeftSidebarOpen(false);
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, []);

  const toggleLeftSidebar = () => {
    setIsLeftSidebarOpen(prev => !prev);
  };

  const closeLeftSidebar = () => setIsLeftSidebarOpen(false);

  return (
    <div className={cn('min-h-screen bg-secondary-50 mobile-viewport', className)}>
      {/* Header */}
      <Header
        onLeftSidebarToggle={toggleLeftSidebar}
        isLeftSidebarOpen={isLeftSidebarOpen}
      />

      <div className={cn(
        'flex',
        isMobile
          ? 'h-[calc(100vh-64px-80px)]' // Account for header (64px) and bottom nav (80px) on mobile
          : 'h-[calc(100vh-64px)]' // Just header on desktop
      )}>
        {/* Left Sidebar */}
        <LeftSidebar
          isOpen={isLeftSidebarOpen || (!isMobile && false)} // Always closed on desktop for now
          onClose={closeLeftSidebar}
        />

        {/* Main Content Area */}
        <main className={cn(
          'flex-1 overflow-auto transition-all duration-300 ease-in-out smooth-scroll',
          'mobile-container',
          isMobile ? 'pb-4' : 'p-4 lg:p-6'
        )}>
          {children}
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      {isMobile && (
        <MobileBottomNav />
      )}

      {/* Global High Priority Complaints Dialog */}
      <HighPriorityComplaintsDialog
        isOpen={showHighPriorityDialog}
        onClose={closeHighPriorityDialog}
        complaints={highPriorityComplaints}
        loading={highPriorityLoading}
        error={highPriorityError}
        columns={columns}
        onRetry={fetchAndShowHighPriorityComplaints}
      />
    </div>
  );
};

// Export individual components for flexibility
export { Header } from './Header';
export { LeftSidebar } from './LeftSidebar';
export { MobileBottomNav } from './MobileBottomNav';
