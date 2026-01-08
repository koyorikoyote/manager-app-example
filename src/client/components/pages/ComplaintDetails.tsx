import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Search } from 'lucide-react';
import { Card, CardContent } from '../ui/Card';
import { Button } from '../ui/Button';
import { MobileAwareButton } from '../ui/MobileAwareButton';
import { Input } from '../ui/Input';
import { createLazyComponent, preloadComponent } from '../../utils/lazyLoading';
import { ViewModeToggle } from '../ui/ViewModeToggle';
import { ComplaintDetailDialog } from '../ui/ComplaintDetailDialog';
import { ComplaintFormDialog } from '../ui/ComplaintFormDialog';
import { HighPriorityComplaintsDialog } from '../ui/HighPriorityComplaintsDialog';
import { CardSkeleton } from '../ui/CardSkeleton';
import { CardsPagination } from '../ui/CardsPagination';
import { Checkbox } from '../ui/Checkbox';
import { ConfirmDialog } from '../ui/Dialog';
import { MobileAwareSearchSection } from '../ui/MobileAwareSearchSection';
import { TruncatedText } from '../ui/TruncatedText';
import { useLanguage } from '../../contexts/LanguageContext';
import { useGlassBlue } from '../../hooks/useGlassBlue';
import { useConfirmDialog } from '../../hooks/useConfirmDialog';
import { useViewMode } from '../../hooks/useViewMode';
import { usePagination } from '../../hooks/usePagination';
import { useFirstNavigation } from '../../hooks/useFirstNavigation';
import { complaintService } from '../../services/complaintService';
import { staffService } from '../../services/staffService';
import { companyService } from '../../services/companyService';
import type { ResponsiveColumnDef } from '../../utils/columnHelpers';
import { ColumnPriority } from '../../utils/columnHelpers';

const LazyDataTable = createLazyComponent(
  () => import('../ui/DataTable').then(module => ({ default: module.DataTable })),
  'DataTable'
);
const LazyComplaintCard = createLazyComponent(
  () => import('../ui/ComplaintCard').then(module => ({ default: module.ComplaintCard })),
  'ComplaintCard'
);
import type { ComplaintDetailWithRelations } from '../../../shared/types';
import type { RowSelectionState } from '@tanstack/react-table';
import { formatDateForTable } from '../../utils/localization';
import { useMemoizedDataTransform, useMemoizedFilter } from '../../utils/memoizationUtils';
import { createOptimizedColumns } from '../../utils/optimizedColumnHelpers';

type Complaint = ComplaintDetailWithRelations & Record<string, unknown> & {
  progressStatusColorClass?: string;
  progressStatusText?: string;
  formattedOccurrenceDate?: string;
  daysPassed?: number;
  responderName?: string;
  companyName?: string;
  urgencyLevelNormalized?: string;
};

export const ComplaintDetails: React.FC = () => {
  const { t } = useLanguage();
  const isGlassBlue = useGlassBlue();
  const { dialogState, isLoading: isDialogLoading, showConfirmDialog, hideConfirmDialog, handleConfirm } = useConfirmDialog();

  // Simple state management (following Sales Assistant pattern)
  const [data, setData] = useState<Complaint[]>([]);
  const [filteredData, setFilteredData] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedRows, setSelectedRows] = useState<RowSelectionState>({});

  // Dialog state management
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [isFormDialogOpen, setIsFormDialogOpen] = useState(false);
  const [selectedComplaint, setSelectedComplaint] = useState<ComplaintDetailWithRelations | null>(null);
  const [editingComplaint, setEditingComplaint] = useState<ComplaintDetailWithRelations | null>(null);
  const [formLoading, setFormLoading] = useState(false);

  // High-priority complaints dialog state
  const [showHighPriorityDialog, setShowHighPriorityDialog] = useState(false);
  const [highPriorityComplaints, setHighPriorityComplaints] = useState<ComplaintDetailWithRelations[]>([]);
  const [highPriorityLoading, setHighPriorityLoading] = useState(false);
  const [highPriorityError, setHighPriorityError] = useState<string | null>(null);
  const [highPriorityFetched, setHighPriorityFetched] = useState(false);

  // Dropdown data for form
  const [availableUsers, setAvailableUsers] = useState<Array<{ id: number; name: string }>>([]);
  const [availableCompanies, setAvailableCompanies] = useState<Array<{ id: number; name: string }>>([]);
  const [availableStaff, setAvailableStaff] = useState<Array<{ id: number; name: string; employeeId?: string }>>([]);

  // View mode and pagination for card view
  const { viewMode, setViewMode } = useViewMode('complaint-details');

  // Preload the active view to disable lazy loading for it while keeping the inactive view lazy.
  useEffect(() => {
    if (viewMode === 'table') {
      preloadComponent(
        () => import('../ui/DataTable').then(module => ({ default: module.DataTable })),
        'DataTable'
      );
    } else {
      preloadComponent(
        () => import('../ui/ComplaintCard').then(module => ({ default: module.ComplaintCard })),
        'ComplaintCard'
      );
    }
  }, [viewMode]);
  const pagination = usePagination({
    totalItems: filteredData.length,
    initialItemsPerPage: 10,
  });
  const { resetToFirstPage } = pagination;

  // Navigation tracking for first-time navigation from login
  const { isFirstNavigation, markNavigationComplete } = useFirstNavigation('/login', '/');

  // Simple fetch function (following Sales Assistant pattern)
  const fetchComplaints = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const result = await complaintService.getAll({ limit: 100 });
      setData(result.data as Complaint[]);
    } catch (error) {
      console.error('Failed to fetch complaints:', error);
      setError(t('complaintDetails.loading'));
      setData([]);
    } finally {
      setLoading(false);
    }
  }, [t]);

  // Fetch high-priority complaints for dialog
  const fetchHighPriorityComplaints = useCallback(async () => {
    try {
      setHighPriorityLoading(true);
      setHighPriorityError(null);
      setHighPriorityFetched(false);

      const result = await complaintService.getHighPriorityComplaints();
      setHighPriorityComplaints(result.data);
    } catch (error) {
      console.error('Failed to fetch high-priority complaints:', error);
      setHighPriorityError(t('highPriorityDialog.error'));
      setHighPriorityComplaints([]);
    } finally {
      setHighPriorityLoading(false);
      setHighPriorityFetched(true);
    }
  }, [t]);

  // Dialog handlers
  const handleComplaintClick = useCallback((complaint: ComplaintDetailWithRelations) => {
    setSelectedComplaint(complaint);
    setIsDetailDialogOpen(true);
  }, []);

  const handleEditComplaint = useCallback((complaint: ComplaintDetailWithRelations) => {
    setEditingComplaint(complaint);
    setIsFormDialogOpen(true);
  }, []);

  const handleDeleteComplaint = useCallback(async (id: string) => {
    try {
      await complaintService.bulkDelete([parseInt(id)]);
      fetchComplaints(); // Refresh data
    } catch (error) {
      console.error('Failed to delete complaint:', error);
    }
  }, [fetchComplaints]);

  const handleNewComplaint = useCallback(() => {
    setEditingComplaint(null);
    setIsFormDialogOpen(true);
  }, []);

  const handleFormSubmit = useCallback(async (data: Partial<ComplaintDetailWithRelations>) => {
    try {
      setFormLoading(true);

      if (editingComplaint) {
        await complaintService.update(editingComplaint.id, data);
      } else {
        // For new complaints, ensure required fields are present
        const createData = {
          ...data,
          // recorderId should come from the form data, not hardcoded
          recorderId: data.recorderId || 1, // Fallback to 1 if not provided
        } as Omit<ComplaintDetailWithRelations, "id" | "createdAt" | "updatedAt">;

        await complaintService.create(createData);
      }

      setIsFormDialogOpen(false);
      setEditingComplaint(null);
      fetchComplaints(); // Refresh data
    } catch (error) {
      console.error('Failed to save complaint:', error);
      throw error; // Let the form dialog handle the error
    } finally {
      setFormLoading(false);
    }
  }, [editingComplaint, fetchComplaints]);

  const handleCloseDetailDialog = useCallback(() => {
    setIsDetailDialogOpen(false);
    setSelectedComplaint(null);
  }, []);

  const handleCloseFormDialog = useCallback(() => {
    setIsFormDialogOpen(false);
    setEditingComplaint(null);
  }, []);

  const handleCloseHighPriorityDialog = useCallback(() => {
    setShowHighPriorityDialog(false);
    markNavigationComplete();
  }, [markNavigationComplete]);

  const handleRetryHighPriorityComplaints = useCallback(() => {
    fetchHighPriorityComplaints();
  }, [fetchHighPriorityComplaints]);

  // Memoized helper functions for calculated fields
  const getProgressStatusColorClass = useCallback((status: string) => {
    switch (status?.toLowerCase()) {
      case 'open':
        return 'bg-red-100 text-red-800';
      case 'closed':
        return 'bg-green-100 text-green-800';
      case 'on_hold':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }, []);

  const getUrgencyLevelColorClass = useCallback((level: string) => {
    switch (level?.toLowerCase()) {
      case 'high':
        return 'bg-red-100 text-red-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }, []);

  const getProgressStatusText = useCallback((status: string) => {
    switch (status?.toLowerCase()) {
      case 'open':
        return t('status.open');
      case 'closed':
        return t('status.closed');
      case 'on_hold':
        return t('status.onHold');
      default:
        return status || '--';
    }
  }, [t]);

  const formatOccurrenceDate = useCallback((date: string | Date | null | undefined) => {
    if (!date) return '';
    return formatDateForTable(date);
  }, []);

  // Memoized filter functions for columns
  const urgencyLevelFilter = useMemoizedFilter(
    () => (row: Complaint, id: string, value: string[]) => {
      if (!value || value.length === 0) return true;
      const urgency = row.urgencyLevel?.toLowerCase() || '';
      return value.some(v => urgency.includes(v.toLowerCase()));
    },
    {
      dependencies: [],
      debugName: "urgency-level-filter",
      enableLogging: process.env.NODE_ENV === "development",
    }
  );

  const progressStatusFilter = useMemoizedFilter(
    () => (row: Complaint, id: string, value: string[]) => {
      if (!value || value.length === 0) return true;
      return value.includes(row.progressStatus);
    },
    {
      dependencies: [],
      debugName: "progress-status-filter",
      enableLogging: process.env.NODE_ENV === "development",
    }
  );

  const responderNameFilter = useMemoizedFilter(
    () => (row: Complaint, id: string, value: string[]) => {
      if (!value || value.length === 0) return true;
      const responderName = row.responder?.name?.toLowerCase() || '';
      return value.some(v => responderName.includes(v.toLowerCase()));
    },
    {
      dependencies: [],
      debugName: "responder-name-filter",
      enableLogging: process.env.NODE_ENV === "development",
    }
  );

  const dateOfOccurrenceFilter = useMemoizedFilter(
    () => (row: Complaint, id: string, value: [string, string]) => {
      if (!value || !Array.isArray(value) || value.length !== 2) return true;
      const [startDate, endDate] = value;
      if (!startDate && !endDate) return true;

      const occurrenceDate = row.dateOfOccurrence;
      if (!occurrenceDate) return false;

      const date = new Date(occurrenceDate);
      if (isNaN(date.getTime())) return false;

      const start = startDate ? new Date(startDate) : null;
      const end = endDate ? new Date(endDate) : null;

      if (start && date < start) return false;
      if (end && date > end) return false;

      return true;
    },
    {
      dependencies: [],
      debugName: "date-occurrence-filter",
      enableLogging: process.env.NODE_ENV === "development",
    }
  );

  // Memoized columns definition with performance optimization
  const columns: ResponsiveColumnDef<Complaint & Record<string, unknown>>[] = createOptimizedColumns(
    () => [
      {
        id: "select",
        header: ({ table }) => (
          <Checkbox
            checked={
              table.getIsAllPageRowsSelected() ||
              (table.getIsSomePageRowsSelected() && "indeterminate")
            }
            onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          />
        ),
        cell: ({ row }) => (
          <div onClick={(e) => e.stopPropagation()}>
            <Checkbox
              checked={row.getIsSelected()}
              onCheckedChange={(value) => row.toggleSelected(!!value)}
            />
          </div>
        ),
        enableSorting: false,
        enableHiding: false,
        priority: ColumnPriority.ESSENTIAL,
      },
      {
        accessorKey: "dateOfOccurrence",
        header: t('complaintDetails.columns.dateOfOccurrence'),
        priority: ColumnPriority.HIGH,
        cell: ({ row }) => {
          return <span>{row.original.formattedOccurrenceDate || "--"}</span>;
        },
        filterFn: dateOfOccurrenceFilter,
      },
      {
        accessorKey: "complainerName",
        header: t('complaintDetails.columns.complainerName'),
        priority: ColumnPriority.ESSENTIAL,
        cell: ({ row }) => (
          <button
            onClick={() => handleComplaintClick(row.original as ComplaintDetailWithRelations)}
            className="text-blue-600 hover:underline font-medium text-left"
          >
            {row.original.complainerName}
          </button>
        ),
      },
      {
        accessorKey: "company",
        header: t('complaintDetails.columns.companyName'),
        priority: ColumnPriority.HIGH,
        cell: ({ row }) => row.original.company?.name || "--",
      },
      {
        accessorKey: "progressStatus",
        header: t('complaintDetails.columns.progressStatus'),
        priority: ColumnPriority.HIGH,
        cell: ({ row }) => {
          return (
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${row.original.progressStatusColorClass}`}>
              {row.original.progressStatusText}
            </span>
          );
        },
        filterFn: progressStatusFilter,
      },
      {
        accessorKey: "urgencyLevel",
        header: t('complaintDetails.columns.urgencyLevel'),
        priority: ColumnPriority.HIGH,
        cell: ({ row }) => {
          if (!row.original.urgencyLevel) return <span>--</span>;
          return (
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${row.original.urgencyLevelColorClass}`}>
              {row.original.urgencyLevelText || row.original.urgencyLevel}
            </span>
          );
        },
        filterFn: urgencyLevelFilter,
      },
      {
        accessorKey: "complainerContact",
        header: t('complaintDetails.columns.contactInfo'),
        priority: ColumnPriority.MEDIUM,
        cell: ({ row }) => row.original.complainerContact || "--",
      },
      {
        accessorKey: "daysPassed",
        header: t('complaintDetails.columns.daysPassed'),
        priority: ColumnPriority.MEDIUM,
        cell: ({ row }) => {
          const days = row.original.daysPassed || 0;
          const colorClass = days > 30 ? 'text-red-600 font-semibold' :
            days > 7 ? 'text-yellow-600 font-medium' :
              'text-green-600';
          return (
            <span className={`font-mono ${colorClass}`}>
              {days > 0 ? `${days} ` + t('common.labels.days') : "--"}
            </span>
          );
        },
      },
      {
        accessorKey: "responder",
        header: t('complaintDetails.columns.responderName'),
        priority: ColumnPriority.MEDIUM,
        cell: ({ row }) => row.original.responder?.name || "--",
        filterFn: responderNameFilter,
      },
      {
        accessorKey: "complaintContent",
        header: t('complaintDetails.columns.complaintContent'),
        priority: ColumnPriority.LOW,
        cell: ({ row }) => (
          <TruncatedText text={row.original.complaintContent || ""} maxLength={50} />
        )
      },
      {
        accessorKey: "resolutionDate",
        header: t('complaintDetails.columns.resolutionDate'),
        priority: ColumnPriority.LOW,
        cell: ({ row }) => {
          const value = row.original.resolutionDate as Date | string | null | undefined;
          return <span>{value ? formatDateForTable(value) : "--"}</span>;
        },
      },
    ],
    [t, handleComplaintClick, getProgressStatusColorClass, getProgressStatusText, formatOccurrenceDate, urgencyLevelFilter, progressStatusFilter, responderNameFilter, dateOfOccurrenceFilter],
    {
      debugName: "complaint-details-columns",
      enableLogging: process.env.NODE_ENV === "development",
    }
  );

  // Memoized helper function for daysPassed calculation
  const calculateDaysPassed = useCallback((date: string | Date | null | undefined): number => {
    if (!date) return 0;

    try {
      const dateObj = new Date(date);
      if (isNaN(dateObj.getTime())) return 0;

      const now = new Date();
      const diffTime = now.getTime() - dateObj.getTime();
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

      return Math.max(0, diffDays);
    } catch {
      return 0;
    }
  }, []);

  // Memoized data transformation with calculated fields
  const transformedData = useMemoizedDataTransform(
    (complaints: Complaint[]) => complaints.map(complaint => ({
      ...complaint,
      // Pre-calculate status color class for better performance
      progressStatusColorClass: getProgressStatusColorClass(complaint.progressStatus || ''),
      // Pre-calculate status text
      progressStatusText: getProgressStatusText(complaint.progressStatus || ''),
      // Pre-calculate formatted occurrence date
      formattedOccurrenceDate: formatOccurrenceDate(complaint.dateOfOccurrence),
      // Pre-calculate days passed for sorting/filtering
      daysPassed: calculateDaysPassed(complaint.dateOfOccurrence),
      // Pre-calculate responder name for filtering
      responderName: complaint.responder?.name || '',
      // Pre-calculate company name for filtering
      companyName: complaint.company?.name || '',
      // Pre-calculate urgency level for consistent filtering
      urgencyLevelNormalized: complaint.urgencyLevel?.toLowerCase() || '',
      // Pre-calculate localized urgency level text (follows progressStatus pattern)
      urgencyLevelText: (function () {
        const level = complaint.urgencyLevel;
        if (!level) return '';
        const normalized = String(level).toLowerCase();
        if (normalized === 'high') return t('complaintDetails.urgencyLevel.high');
        if (normalized === 'medium') return t('complaintDetails.urgencyLevel.medium');
        if (normalized === 'low') return t('complaintDetails.urgencyLevel.low');
        return String(level);
      })(),
      // Pre-calculate urgency level color class (follows progressStatus pattern)
      urgencyLevelColorClass: getUrgencyLevelColorClass(complaint.urgencyLevel || ''),
    })),
    data,
    [data, getProgressStatusColorClass, getProgressStatusText, formatOccurrenceDate, calculateDaysPassed, getUrgencyLevelColorClass],
    {
      debugName: "complaint-data-transform",
      enableLogging: process.env.NODE_ENV === "development",
    }
  );

  // Enhanced search filter including translated labels (EN/JA) for enum-like fields
  const filterComplaints = useCallback((complaints: Complaint[], query: string) => {
    const term = query.trim().toLowerCase();
    if (!term) return complaints;

    const translateBoth = (key: string): string[] => {
      if (!key) return [];
      const en = (t as any)(key, { lng: 'en' }) as string;
      const ja = (t as any)(key, { lng: 'ja' }) as string;
      const out: string[] = [];
      if (en && typeof en === 'string' && en !== key) out.push(en.toLowerCase());
      if (ja && typeof ja === 'string' && ja !== key && ja.toLowerCase() !== en?.toLowerCase()) out.push(ja.toLowerCase());
      return out;
    };

    const getProgressStatusLabels = (status?: string | null): string[] => {
      if (!status) return [];
      const s = String(status).toLowerCase();
      if (s === 'open') return translateBoth('status.open');
      if (s === 'closed') return translateBoth('status.closed');
      if (s === 'on_hold' || s === 'on-hold') return translateBoth('status.onHold');
      return [];
    };

    const getUrgencyLabels = (level?: string | null): string[] => {
      if (!level) return [];
      const l = String(level).toLowerCase();
      if (l === 'high') return translateBoth('complaintDetails.urgencyLevel.high');
      if (l === 'medium') return translateBoth('complaintDetails.urgencyLevel.medium');
      if (l === 'low') return translateBoth('complaintDetails.urgencyLevel.low');
      return [];
    };

    const includes = (value?: string | number | null): boolean => {
      if (value === null || value === undefined) return false;
      return value.toString().toLowerCase().includes(term);
    };

    return complaints.filter(complaint =>
      // Raw values
      includes(complaint.complainerName) ||
      includes(complaint.complainerContact) ||
      includes(complaint.complaintContent) ||
      includes(complaint.companyName) ||
      includes(complaint.responderName) ||
      includes(complaint.progressStatus) ||
      includes(complaint.urgencyLevelNormalized) ||
      includes(complaint.personInvolved) ||
      // Localized fields already computed in transformed data
      includes((complaint as any).progressStatusText) ||
      includes((complaint as any).urgencyLevelText) ||
      // Cross-language label matching
      getProgressStatusLabels(complaint.progressStatus).some(v => v.includes(term)) ||
      getUrgencyLabels((complaint as any).urgencyLevel).some(v => v.includes(term))
    );
  }, [t]);


  const handleSearchChange = useCallback((query: string) => {
    setSearchQuery(query);
    // Reset pagination when search changes
    resetToFirstPage();
  }, [resetToFirstPage]);

  // Fetch dropdown data
  const fetchDropdownData = useCallback(async () => {
    try {
      const [users, companies, staff] = await Promise.all([
        staffService.getAvailableUsers(),
        companyService.getAllCompanies(),
        staffService.getAllStaff()
      ]);
      setAvailableUsers(users);
      setAvailableCompanies(companies.map(company => ({ id: company.id, name: company.name })));
      setAvailableStaff(staff.map(staffMember => ({
        id: staffMember.id,
        name: staffMember.name,
        employeeId: staffMember.employeeId || undefined
      })));
    } catch (error) {
      console.error('Failed to fetch dropdown data:', error);
    }
  }, []);

  // Initial fetch
  useEffect(() => {
    fetchComplaints();
    fetchDropdownData();
  }, [fetchComplaints, fetchDropdownData]);

  // Handle automatic dialog display on first navigation from login
  useEffect(() => {
    if (isFirstNavigation) {
      // Fetch high-priority complaints first
      fetchHighPriorityComplaints();
    }
  }, [isFirstNavigation, fetchHighPriorityComplaints]);

  // Show dialog only when high-priority complaints are loaded and exist
  useEffect(() => {
    // Only proceed if we're on first navigation AND the fetch is complete
    if (isFirstNavigation && highPriorityFetched && !highPriorityLoading) {
      if (highPriorityError) {
        markNavigationComplete();
      } else if (highPriorityComplaints.length > 0) {
        setShowHighPriorityDialog(true);
      } else {
        // Mark navigation as complete if no high-priority complaints exist
        markNavigationComplete();
      }
    }
  }, [isFirstNavigation, highPriorityLoading, highPriorityFetched, highPriorityError, highPriorityComplaints.length, markNavigationComplete]);

  // Initialize filtered data when transformed data changes
  useEffect(() => {
    setFilteredData(filterComplaints(transformedData, searchQuery));
    // Reset pagination when data changes
    resetToFirstPage();
  }, [transformedData, searchQuery, filterComplaints, resetToFirstPage]);

  // Handle row selection change
  const handleRowSelectionChange = useCallback((selection: RowSelectionState) => {
    setSelectedRows(selection);
  }, []);

  // Get selected complaint IDs
  const selectedComplaintIds = useMemo(() => {
    return Object.keys(selectedRows)
      .filter(key => selectedRows[key])
      .map(key => filteredData[parseInt(key)]?.id)
      .filter(Boolean);
  }, [selectedRows, filteredData]);

  // Handle bulk delete
  const handleBulkDelete = useCallback(async () => {
    if (selectedComplaintIds.length === 0) {
      return;
    }

    showConfirmDialog({
      title: t('common.actions.delete'),
      message: t('common.feedback.bulkDeleteConfirm', { count: selectedComplaintIds.length }),
      variant: 'destructive',
      confirmText: t('common.actions.delete'),
      cancelText: t('common.actions.cancel'),
      onConfirm: async () => {
        await complaintService.bulkDelete(selectedComplaintIds as number[]);
        // Clear selection and refresh data
        setSelectedRows({});
        fetchComplaints();
      },
    });
  }, [selectedComplaintIds, t, fetchComplaints, showConfirmDialog]);
  return (
    <div className="space-y-6 pb-20 md:pb-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <h1 className="text-2xl md:text-3xl font-bold text-secondary-900">
            {t('complaintDetails.title')}
          </h1>
        </div>
      </div>


      {/* Controls with inline Search */}
      <div className="flex items-center gap-2 justify-between">
        <div className="flex items-center space-x-4">
          <ViewModeToggle mode={viewMode} onChange={setViewMode} />
        </div>

        <MobileAwareSearchSection pageName="complaint-details" className="flex-1">
          <Card className="search-component-spacing">
            <CardContent className="p-2">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-secondary-400" />
                  <Input
                    placeholder={t('complaintDetails.searchPlaceholder')}
                    value={searchQuery}
                    onChange={(e) => handleSearchChange(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearchChange(searchQuery)}
                    className="pl-10"
                    size="compact"
                  />
                </div>
                <Button
                  onClick={() => handleSearchChange(searchQuery)}
                  size="sm"
                  className={isGlassBlue ? 'glass-blue-search-button' : ''}
                  aria-label="Search complaints"
                  disabled={loading}
                >
                  {loading ? (
                    <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full" />
                  ) : (
                    <Search className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </MobileAwareSearchSection>

        <div className="flex items-center gap-2">
          <MobileAwareButton
            variant="delete"
            onClick={handleBulkDelete}
            disabled={selectedComplaintIds.length === 0}
            size="sm"
            viewMode={viewMode}
            count={selectedComplaintIds.length}
            className={selectedComplaintIds.length === 0 ? 'opacity-50' : ''}
          />
          <MobileAwareButton
            variant="new"
            onClick={handleNewComplaint}
            size="sm"
            viewMode={viewMode}
          />
        </div>
      </div>

      {/* Complaints List - Conditional rendering with smooth transitions */}
      <div className="transition-all duration-300 ease-in-out">
        {viewMode === 'table' ? (
          <div>
            <LazyDataTable
              columns={columns}
              data={filteredData as (Complaint & Record<string, unknown>)[]}
              loading={loading}
              error={error}
              totalCount={data.length}
              enableColumnFiltering={true}
              tableName="complaint_details"
              searchQuery={searchQuery}
              enableRowSelection={true}
              rowSelectionMode="multiple"
              rowSelection={selectedRows}
              onRowSelectionChange={handleRowSelectionChange}
              onRowClick={handleComplaintClick}
            />
          </div>
        ) : (
          <div>
            {/* Responsive card grid layout */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
              {loading ? (
                Array.from({ length: pagination.itemsPerPage }).map((_, index) => (
                  <CardSkeleton key={index} variant="complaint" />
                ))
              ) : error ? (
                <div className="col-span-full text-sm text-red-600 bg-red-50 p-3 rounded border border-red-200">
                  {error}
                  <Button onClick={fetchComplaints} className="mt-2 ml-2" size="sm">
                    {t('common.actions.retry')}
                  </Button>
                </div>
              ) : filteredData.length === 0 ? (
                <div className="col-span-full text-center py-8 text-muted-foreground">
                  {data.length === 0
                    ? t('complaintDetails.noComplaintsFound')
                    : searchQuery.trim()
                      ? t('complaintDetails.adjustSearchCriteria')
                      : t('complaintDetails.noComplaintsFound')
                  }
                </div>
              ) : (
                pagination.getPaginatedData(filteredData).map((complaint: Complaint) => (
                  <LazyComplaintCard
                    key={complaint.id}
                    complaint={complaint}
                    onClick={handleComplaintClick}
                  />
                ))
              )}
            </div>

            {/* Cards Pagination */}
            {!loading && !error && filteredData.length > 0 && (
              <div className="mt-6">
                <CardsPagination
                  currentPage={pagination.currentPage}
                  totalItems={filteredData.length}
                  itemsPerPage={pagination.itemsPerPage}
                  onPageChange={pagination.setPage}
                  onItemsPerPageChange={pagination.setItemsPerPage}
                />
              </div>
            )}
          </div>
        )}
      </div>



      {/* Confirm Dialog */}
      <ConfirmDialog
        isOpen={dialogState.isOpen}
        onClose={hideConfirmDialog}
        onConfirm={handleConfirm}
        title={dialogState.title}
        message={dialogState.message}
        confirmText={dialogState.confirmText}
        cancelText={dialogState.cancelText}
        variant={dialogState.variant}
        isLoading={isDialogLoading}
      />

      {/* Complaint Detail Dialog */}
      <ComplaintDetailDialog
        isOpen={isDetailDialogOpen}
        onClose={handleCloseDetailDialog}
        record={selectedComplaint}
        onEdit={handleEditComplaint}
        onDelete={handleDeleteComplaint}
      />

      {/* Complaint Form Dialog */}
      <ComplaintFormDialog
        isOpen={isFormDialogOpen}
        onClose={handleCloseFormDialog}
        record={editingComplaint}
        onSubmit={handleFormSubmit}
        isLoading={formLoading}
        availableUsers={availableUsers}
        availableCompanies={availableCompanies}
        availableStaff={availableStaff}
      />

      {/* High Priority Complaints Dialog */}
      {/* Use a trimmed columns set (remove selection checkbox) and transform the raw complaints
          so the dialog's columns (which expect formatted fields) render correctly. */}
      {(() => {
        const highPriorityColumns = columns.filter(
          (c) => {
            const key = (c as any).id || (c as any).accessorKey;
            return key !== 'select' && key !== 'urgencyLevel';
          }
        );

        const highPriorityTransformed = (highPriorityComplaints || []).map(complaint => ({
          ...complaint,
          progressStatusColorClass: getProgressStatusColorClass(complaint.progressStatus || ''),
          progressStatusText: getProgressStatusText(complaint.progressStatus || ''),
          formattedOccurrenceDate: formatOccurrenceDate(complaint.dateOfOccurrence),
          daysPassed: calculateDaysPassed(complaint.dateOfOccurrence),
          responderName: complaint.responder?.name || '',
          companyName: complaint.company?.name || '',
          urgencyLevelNormalized: complaint.urgencyLevel?.toLowerCase() || '',
          urgencyLevelText: (function () {
            const level = complaint.urgencyLevel;
            if (!level) return '';
            const normalized = String(level).toLowerCase();
            if (normalized === 'high') return t('complaintDetails.urgencyLevel.high');
            if (normalized === 'medium') return t('complaintDetails.urgencyLevel.medium');
            if (normalized === 'low') return t('complaintDetails.urgencyLevel.low');
            return String(level);
          })(),
          urgencyLevelColorClass: getUrgencyLevelColorClass(complaint.urgencyLevel || ''),
        }));

        return (
          <HighPriorityComplaintsDialog
            isOpen={showHighPriorityDialog}
            onClose={handleCloseHighPriorityDialog}
            complaints={highPriorityTransformed as unknown as ComplaintDetailWithRelations[]}
            loading={highPriorityLoading}
            error={highPriorityError}
            columns={highPriorityColumns as unknown as ResponsiveColumnDef<Complaint & Record<string, unknown>>[]}
            onComplaintClick={handleComplaintClick}
            onRetry={handleRetryHighPriorityComplaints}
          />
        );
      })()}
    </div>
  );
};
