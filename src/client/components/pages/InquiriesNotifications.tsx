import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageSquare, Search } from 'lucide-react';
import { Card, CardContent } from '../ui/Card';
import { Button } from '../ui/Button';
import { MobileAwareButton } from '../ui/MobileAwareButton';
import { BackButton } from '../ui/BackButton';
import { Input } from '../ui/Input';
import { createLazyComponent, preloadComponent } from '../../utils/lazyLoading';
import { ViewModeToggle } from '../ui/ViewModeToggle';
import { CardSkeleton } from '../ui/CardSkeleton';
import { CardsPagination } from '../ui/CardsPagination';
import { ConfirmDialog } from '../ui/Dialog';
import { MobileAwareSearchSection } from '../ui/MobileAwareSearchSection';
import { InquiryDetailDialog } from '../ui/InquiryDetailDialog';
import { InquiryFormDialog } from '../ui/InquiryFormDialog';
import { useLanguage } from '../../contexts/LanguageContext';
import { useGlassBlue } from '../../hooks/useGlassBlue';
import { useConfirmDialog } from '../../hooks/useConfirmDialog';
import { useViewMode } from '../../hooks/useViewMode';
import { usePagination } from '../../hooks/usePagination';
import { useInquiries } from '../../hooks/useInquiries';
import { useInitialDataForRoute } from '../../contexts/SSRDataContext';

import { useInquiryColumns, transformInquiryListForTable, type InquiryTableData } from '../tables/inquiryColumns';
import type { InquiryWithRelations } from '../../../shared/types';
import type { RowSelectionState } from '@tanstack/react-table';
import { inquiryService } from '../../services/inquiryService';
import { companyService } from '../../services/companyService';
import { staffService } from '../../services/staffService';
import { interactionService } from '../../services/interactionService';
import { useMemoizedDataTransform } from '../../utils/memoizationUtils';
import { formatDateForTable } from '../../utils/localization';

const LazyDataTable = createLazyComponent(
  () => import('../ui/DataTable').then(module => ({ default: module.DataTable })),
  'DataTable'
);
const LazyInquiryCard = createLazyComponent(
  () => import('../ui/InquiryCard').then(module => ({ default: module.InquiryCard })),
  'InquiryCard'
);

// Enhanced inquiry type with calculated fields for performance optimization
type OptimizedInquiry = InquiryWithRelations & {
  formattedDateOfInquiry?: string;
  formattedResolutionDate?: string;
  daysSinceInquiry?: number;
  daysSinceResolution?: number;
  companyName?: string;
  responderName?: string;
  recorderName?: string;
  inquiryTypeNormalized?: string;
  progressStatusNormalized?: string;
};

export const InquiriesNotifications: React.FC = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const isGlassBlue = useGlassBlue();
  const { dialogState, isLoading: isDialogLoading, showConfirmDialog, hideConfirmDialog, handleConfirm } = useConfirmDialog();

  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedRows, setSelectedRows] = useState<RowSelectionState>({});

  // Dialog state management
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [isFormDialogOpen, setIsFormDialogOpen] = useState(false);
  const [selectedInquiry, setSelectedInquiry] = useState<OptimizedInquiry | null>(null);
  const [editingInquiry, setEditingInquiry] = useState<OptimizedInquiry | null>(null);

  // Dropdown data for form
  const [availableCompanies, setAvailableCompanies] = useState<Array<{ id: number; name: string }>>([]);
  const [availableUsers, setAvailableUsers] = useState<Array<{ id: number; name: string }>>([]);
  const [availableStaff, setAvailableStaff] = useState<Array<{ id: number; name: string; employeeId: string | null }>>([]);

  // Create filter updater (removed as filters were removed from this page)

  // Get initial data from SSR context
  const initialData = useInitialDataForRoute('inquiries-notifications');

  // Simple state management for local filtering with optimized data types
  const [data, setData] = useState<OptimizedInquiry[]>([]);
  const [filteredData, setFilteredData] = useState<OptimizedInquiry[]>([]);

  // View mode and pagination for card view
  const { viewMode, setViewMode } = useViewMode('inquiries-notifications');

  // Preload active view to disable lazy loading for it; keep inactive view lazy
  useEffect(() => {
    if (viewMode === 'table') {
      preloadComponent(
        () => import('../ui/DataTable').then(module => ({ default: module.DataTable })),
        'DataTable'
      );
    } else {
      preloadComponent(
        () => import('../ui/InquiryCard').then(module => ({ default: module.InquiryCard })),
        'InquiryCard'
      );
    }
  }, [viewMode]);
  const pagination = usePagination({
    totalItems: filteredData.length,
    initialItemsPerPage: 10,
  });
  const { resetToFirstPage } = pagination;

  const { inquiries, loading, error, refetch } = useInquiries({
    page: 1,
    limit: 1000, // Fetch all records for client-side pagination
  }, {
    // Pass initial data to avoid duplicate requests
    initialInquiries: initialData?.inquiries || [],
    initialTotal: initialData?.total || 0
  });

  // Memoized helper functions for date calculations
  const formatInquiryDate = useCallback((date: string | Date | null | undefined) => {
    if (!date) return '';
    return formatDateForTable(date);
  }, []);

  const formatResolutionDate = useCallback((date: string | Date | null | undefined) => {
    if (!date) return '';
    return formatDateForTable(date);
  }, []);

  const calculateDaysSinceInquiry = useCallback((date: string | Date | null | undefined): number => {
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

  const calculateDaysSinceResolution = useCallback((date: string | Date | null | undefined): number => {
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

  // Memoized data transformation with calculated fields for performance optimization
  const transformedData = useMemoizedDataTransform(
    (inquiries: InquiryWithRelations[]) => inquiries.map(inquiry => ({
      ...inquiry,
      // Pre-calculate formatted dates for better performance
      formattedDateOfInquiry: formatInquiryDate(inquiry.dateOfInquiry),
      formattedResolutionDate: formatResolutionDate(inquiry.resolutionDate),
      // Pre-calculate days since inquiry for sorting/filtering
      daysSinceInquiry: calculateDaysSinceInquiry(inquiry.dateOfInquiry),
      // Pre-calculate days since resolution for sorting/filtering
      daysSinceResolution: calculateDaysSinceResolution(inquiry.resolutionDate),
      // Pre-calculate company name for filtering
      companyName: inquiry.company?.name || '',
      // Pre-calculate responder name for filtering
      responderName: inquiry.responder?.name || '',
      // Pre-calculate recorder name for filtering
      recorderName: inquiry.recorder?.name || '',
      // Pre-calculate inquiry type for consistent filtering
      inquiryTypeNormalized: inquiry.typeOfInquiry?.toLowerCase() || '',
      // Pre-calculate progress status for consistent filtering
      progressStatusNormalized: inquiry.progressStatus?.toLowerCase() || '',
    })),
    inquiries,
    [inquiries, formatInquiryDate, formatResolutionDate, calculateDaysSinceInquiry, calculateDaysSinceResolution],
    {
      debugName: "inquiry-data-transform",
      enableLogging: process.env.NODE_ENV === "development",
    }
  );

  // Enhanced search filter with translated labels (EN/JA) for enum-like fields
  const filterInquiries = useCallback((inquiries: OptimizedInquiry[], query: string) => {
    const term = query.trim().toLowerCase();
    if (!term) return inquiries;

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
      // Try common status namespaces
      if (s === 'open' || s === 'opened') return [...translateBoth('status.open'), ...translateBoth('interactions.open')];
      if (s === 'closed') return translateBoth('status.closed');
      if (s === 'on_hold' || s === 'on-hold') return translateBoth('status.onHold');
      if (s === 'resolved') return translateBoth('interactions.resolved');
      if (s === 'in_progress' || s === 'in-progress') return translateBoth('interactions.inProgress');
      return [];
    };

    const getInquiryTypeLabels = (type?: string | null): string[] => {
      if (!type) return [];
      const tval = String(type);
      // Probe multiple likely key locations
      const keys = [
        `inquiriesNotifications.types.${tval}`,
        `inquiries.types.${tval}`,
        `inquiries.type.${tval}`,
      ];
      const labels: string[] = [];
      for (const key of keys) {
        for (const v of translateBoth(key)) {
          if (!labels.includes(v)) labels.push(v);
        }
      }
      return labels;
    };

    const includes = (value?: string | number | null): boolean => {
      if (value === null || value === undefined) return false;
      return value.toString().toLowerCase().includes(term);
    };

    return inquiries.filter(inquiry =>
      // Raw fields
      includes(inquiry.inquirerName) ||
      includes(inquiry.inquirerContact) ||
      includes(inquiry.inquiryContent) ||
      includes(inquiry.companyName) ||
      includes(inquiry.responderName) ||
      includes(inquiry.recorderName) ||
      includes(inquiry.progressStatusNormalized) ||
      includes(inquiry.inquiryTypeNormalized) ||
      // Translated labels
      getProgressStatusLabels(inquiry.progressStatusNormalized).some(v => v.includes(term)) ||
      getInquiryTypeLabels(inquiry.inquiryTypeNormalized).some(v => v.includes(term))
    );
  }, [t]);

  // Update data when transformed inquiries change
  useEffect(() => {
    setData(transformedData);
  }, [transformedData]);

  // Fetch dropdown data for form
  useEffect(() => {
    const fetchDropdownData = async () => {
      try {
        const [companies, users, staff] = await Promise.all([
          companyService.getAllCompanies(),
          staffService.getAvailableUsers(),
          interactionService.getAvailableStaff()
        ]);

        setAvailableCompanies(companies.map(company => ({ id: company.id, name: company.name })));
        setAvailableUsers(users);
        setAvailableStaff(staff);
      } catch (error) {
        console.error('Failed to fetch dropdown data:', error);
      }
    };

    fetchDropdownData();
  }, []);

  // Immediate search effect using optimized filtering with transformed data
  useEffect(() => {
    const filtered = filterInquiries(transformedData, searchTerm);
    setFilteredData(filtered);
    // Reset pagination when search changes
    resetToFirstPage();
  }, [transformedData, searchTerm, filterInquiries, resetToFirstPage]);

  const handleSearch = (value: string) => {
    setSearchTerm(value);
    // Reset pagination when search changes
    resetToFirstPage();
  };

  const handleSearchConfirm = (value: string) => {
    setSearchTerm(value);
    // Reset pagination when search changes
    resetToFirstPage();
  };





  const handleTableRowClick = useCallback((inquiryData: InquiryTableData) => {
    const inquiry = data.find(i => i.id === inquiryData.id);
    if (inquiry) {
      setSelectedInquiry(inquiry);
      setIsDetailDialogOpen(true);
    }
  }, [data]);

  // Handle card click to open detail dialog
  const handleInquiryClick = useCallback((inquiry: OptimizedInquiry) => {
    setSelectedInquiry(inquiry);
    setIsDetailDialogOpen(true);
  }, []);

  // Create optimized table columns with navigation handler
  const columns = useInquiryColumns(handleTableRowClick, t, true);

  // Transform inquiry data for table display (use filtered data)
  const tableData = useMemo(() => transformInquiryListForTable(filteredData), [filteredData]);

  // Check if filters are active
  const filtersActive = false; // No filters in this simplified version

  const handleClearFilters = useCallback(() => {
    // No filters to clear in this simplified version
  }, []);



  // Handle row selection change
  const handleRowSelectionChange = useCallback((selection: RowSelectionState) => {
    setSelectedRows(selection);
  }, []);

  // Get selected inquiry IDs
  const selectedInquiryIds = useMemo(() => {
    return Object.keys(selectedRows)
      .filter(key => selectedRows[key])
      .map(key => tableData[parseInt(key)]?.id)
      .filter(Boolean);
  }, [selectedRows, tableData]);

  // Handle bulk delete
  const handleBulkDelete = useCallback(async () => {
    if (selectedInquiryIds.length === 0) {
      return;
    }

    showConfirmDialog({
      title: t('common.actions.delete'),
      message: t('common.feedback.bulkDeleteConfirm', { count: selectedInquiryIds.length }),
      variant: 'destructive',
      confirmText: t('common.actions.delete'),
      cancelText: t('common.actions.cancel'),
      onConfirm: async () => {
        await inquiryService.bulkDelete(selectedInquiryIds as number[]);
        // Clear selection and refresh data
        setSelectedRows({});
        refetch();
      },
    });
  }, [selectedInquiryIds, t, refetch, showConfirmDialog]);

  // Dialog handlers
  const handleCloseDetailDialog = useCallback(() => {
    setIsDetailDialogOpen(false);
    setSelectedInquiry(null);
  }, []);

  const handleCloseFormDialog = useCallback(() => {
    setIsFormDialogOpen(false);
    setEditingInquiry(null);
  }, []);

  const handleEditInquiry = useCallback((inquiry: OptimizedInquiry) => {
    setEditingInquiry(inquiry);
    setIsDetailDialogOpen(false);
    setIsFormDialogOpen(true);
  }, []);

  const handleDeleteInquiry = useCallback(async (id: string) => {
    showConfirmDialog({
      title: t('common.actions.delete'),
      message: 'Are you sure you want to delete this inquiry?',
      variant: 'destructive',
      confirmText: t('common.actions.delete'),
      cancelText: t('common.actions.cancel'),
      onConfirm: async () => {
        await inquiryService.bulkDelete([parseInt(id)]);
        setIsDetailDialogOpen(false);
        setSelectedInquiry(null);
        refetch();
      },
    });
  }, [t, refetch, showConfirmDialog]);

  const handleCreateInquiry = useCallback(() => {
    setEditingInquiry(null);
    setIsFormDialogOpen(true);
  }, []);

  const handleSubmitInquiry = useCallback(async (data: Partial<InquiryWithRelations>) => {
    if (editingInquiry) {
      await inquiryService.update(editingInquiry.id, data);
    } else {
      await inquiryService.create(data as Omit<InquiryWithRelations, "id" | "createdAt" | "updatedAt">);
    }
    setIsFormDialogOpen(false);
    setEditingInquiry(null);
    refetch();
  }, [editingInquiry, refetch]);

  if (error) {
    return (
      <div className="space-y-6 pb-20 md:pb-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl md:text-3xl font-bold text-secondary-900">
            {t('inquiriesNotifications.title')}
          </h1>
        </div>
        <Card>
          <CardContent className="p-6">
            <div className="text-center text-red-600">
              <p>Error: {error}</p>
              <Button onClick={refetch} className="mt-4">
                Try Again
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-20 md:pb-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <BackButton onBack={() => navigate('/complaint-details')} />
          <h1 className="text-2xl md:text-3xl font-bold text-secondary-900">
            {t('inquiriesNotifications.title')}
          </h1>
        </div>
      </div>


      {/* Controls with inline Search */}
      <div className="flex items-center gap-2 justify-between">
        <div className="flex items-center space-x-4">
          <ViewModeToggle mode={viewMode} onChange={setViewMode} />
        </div>

        <MobileAwareSearchSection pageName="inquiries-notifications" className="flex-1">
          <Card className="search-component-spacing">
            <CardContent className="p-2">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-secondary-400" />
                  <Input
                    placeholder={t('inquiriesNotifications.searchPlaceholder')}
                    value={searchTerm}
                    onChange={(e) => handleSearch(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearchConfirm(searchTerm)}
                    className="pl-10"
                    size="compact"
                  />
                </div>
                <Button
                  onClick={() => handleSearchConfirm(searchTerm)}
                  size="sm"
                  className={isGlassBlue ? 'glass-blue-search-button' : ''}
                  aria-label="Search inquiries"
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
            disabled={selectedInquiryIds.length === 0}
            size="sm"
            viewMode={viewMode}
            count={selectedInquiryIds.length}
            className={selectedInquiryIds.length === 0 ? 'opacity-50' : ''}
          />
          <MobileAwareButton
            variant="new"
            onClick={handleCreateInquiry}
            size="sm"
            viewMode={viewMode}
          />
        </div>
      </div>

      {/* Inquiries List - Conditional rendering with smooth transitions */}
      <div className="transition-all duration-300 ease-in-out">
        {viewMode === 'table' ? (
          <div>
            <LazyDataTable
              columns={columns}
              data={tableData}
              loading={loading}
              error={error}
              onRowClick={handleTableRowClick}
              searchQuery={searchTerm}
              emptyStateMessage={
                filtersActive
                  ? t('common.emptyStates.adjustFilters')
                  : t('common.emptyStates.startByAdding')
              }
              onClearFilters={handleClearFilters}
              hasActiveFilters={filtersActive}
              totalCount={data.length}
              enableColumnFiltering={true}
              tableName="inquiries"
              showScrollButtons={true}
              resultsSummary={t('common.pagination.showing', { current: filteredData.length, total: data.length })}
              loadingText={t('inquiriesNotifications.loading')}
              enableRowSelection={true}
              rowSelectionMode="multiple"
              rowSelection={selectedRows}
              onRowSelectionChange={handleRowSelectionChange}
            />
          </div>
        ) : (
          <div>
            {/* Responsive card grid layout */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
              {loading ? (
                Array.from({ length: pagination.itemsPerPage }).map((_, index) => (
                  <CardSkeleton key={index} variant="inquiry" />
                ))
              ) : error ? (
                <div className="col-span-full text-sm text-red-600 bg-red-50 p-3 rounded border border-red-200">
                  {error}
                  <Button onClick={refetch} className="mt-2 ml-2" size="sm">
                    {t('common.actions.retry')}
                  </Button>
                </div>
              ) : filteredData.length === 0 ? (
                <div className="col-span-full text-center py-8 text-muted-foreground">
                  {data.length === 0
                    ? t('inquiriesNotifications.noInquiriesFound')
                    : searchTerm.trim()
                      ? t('inquiriesNotifications.adjustSearchCriteria')
                      : t('inquiriesNotifications.noInquiriesFound')
                  }
                </div>
              ) : (
                pagination.getPaginatedData(filteredData).map((inquiry: OptimizedInquiry) => (
                  <LazyInquiryCard
                    key={inquiry.id}
                    inquiry={inquiry}
                    onClick={handleInquiryClick}
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

      {/* Empty State - Only show when no data and not loading */}
      {
        !loading && data.length === 0 && (
          <Card>
            <CardContent className="p-12 text-center">
              <MessageSquare className="h-12 w-12 text-secondary-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-secondary-900 mb-2">
                {t('inquiriesNotifications.noInquiriesFound')}
              </h3>
              <p className="text-secondary-600 mb-4">
                {filtersActive
                  ? t('inquiriesNotifications.adjustSearchCriteria')
                  : t('inquiriesNotifications.getStartedMessage')}
              </p>
            </CardContent>
          </Card>
        )
      }

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

      {/* Inquiry Detail Dialog */}
      <InquiryDetailDialog
        isOpen={isDetailDialogOpen}
        onClose={handleCloseDetailDialog}
        record={selectedInquiry}
        onEdit={handleEditInquiry}
        onDelete={handleDeleteInquiry}
      />

      {/* Inquiry Form Dialog */}
      <InquiryFormDialog
        isOpen={isFormDialogOpen}
        onClose={handleCloseFormDialog}
        record={editingInquiry}
        onSubmit={handleSubmitInquiry}
        isLoading={loading}
        availableCompanies={availableCompanies}
        availableUsers={availableUsers}
        availableStaff={availableStaff}
      />
    </div >
  );
};
