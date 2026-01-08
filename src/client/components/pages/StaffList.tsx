import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search } from 'lucide-react';
import { Card, CardContent } from '../ui/Card';
import { Button } from '../ui/Button';
import { MobileAwareButton } from '../ui/MobileAwareButton';
import { BackButton } from '../ui/BackButton';
import { Input } from '../ui/Input';
import { createLazyComponent, preloadComponent } from '../../utils/lazyLoading';
import { ViewModeToggle } from '../ui/ViewModeToggle';
import { CardSkeleton } from '../ui/CardSkeleton';
import { MobileAwareSearchSection } from '../ui/MobileAwareSearchSection';
import { useViewMode } from '../../hooks/useViewMode';
import { CardsPagination } from '../ui/CardsPagination';
import { Checkbox } from '../ui/Checkbox';
import { ConfirmDialog } from '../ui/Dialog';
import { useLanguage } from '../../contexts/LanguageContext';
import { useGlassBlue } from '../../hooks/useGlassBlue';
import { useConfirmDialog } from '../../hooks/useConfirmDialog';
import { useResponsiveNavigation } from '../../hooks/useResponsiveNavigation';
import { usePagination } from '../../hooks/usePagination';
import { useCrossTabRefresh } from '../../hooks/useCrossTabRefresh';
import { Staff } from '../../../shared/types';
import { staffService } from '../../services/staffService';
import type { ResponsiveColumnDef } from '../../utils/columnHelpers';
import type { RowSelectionState } from '@tanstack/react-table';
import { formatDateForTable } from '../../utils/localization';
import { useMemoizedDataTransform } from '../../utils/memoizationUtils';
import { createOptimizedColumns } from '../../utils/optimizedColumnHelpers';
import { ColumnPriority } from '../../utils/columnHelpers';

const LazyDataTable = createLazyComponent(
  () => import('../ui/DataTable').then(module => ({ default: module.DataTable })),
  'DataTable'
);
const LazyStaffCard = createLazyComponent(
  () => import('../ui/StaffCard').then(module => ({ default: module.StaffCard })),
  'StaffCard'
);



export const StaffList: React.FC = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const isGlassBlue = useGlassBlue();
  const { dialogState, isLoading: isDialogLoading, showConfirmDialog, hideConfirmDialog, handleConfirm } = useConfirmDialog();
  const { navigateToDetail, navigateToNew } = useResponsiveNavigation();

  // Simple state management (following Sales Assistant pattern)
  const [data, setData] = useState<Staff[]>([]);
  const [filteredData, setFilteredData] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const { viewMode, setViewMode } = useViewMode('staff');

  // Preload the active view to "disable" lazy loading for it,
  // while keeping the inactive view lazy until switched.
  useEffect(() => {
    if (viewMode === 'table') {
      preloadComponent(
        () => import('../ui/DataTable').then(module => ({ default: module.DataTable })),
        'DataTable'
      );
    } else {
      preloadComponent(
        () => import('../ui/StaffCard').then(module => ({ default: module.StaffCard })),
        'StaffCard'
      );
    }
  }, [viewMode]);
  const [selectedRows, setSelectedRows] = useState<RowSelectionState>({});

  // Pagination for Cards view
  const pagination = usePagination({
    totalItems: filteredData.length,
    initialItemsPerPage: 10,
  });

  // Memoized helper functions for calculated fields
  const getStatusColorClass = useCallback((status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'bg-green-100 text-green-800';
      case 'INACTIVE':
        return 'bg-gray-100 text-gray-800';
      case 'TERMINATED':
        return 'bg-red-100 text-red-800';
      case 'ON_LEAVE':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }, []);

  const calculateDaysSinceHire = useCallback((hireDate: string | Date | null | undefined) => {
    if (!hireDate) return 0;
    const dateObj = new Date(hireDate);
    if (isNaN(dateObj.getTime())) return 0;
    const now = new Date();
    const diffTime = now.getTime() - dateObj.getTime();
    return Math.floor(diffTime / (1000 * 60 * 60 * 24));
  }, []);

  // Memoized data transformation with calculated fields
  const transformedData = useMemoizedDataTransform(
    (staff: Staff[]) => staff.map(staffMember => ({
      ...staffMember,
      // Pre-calculate status color class for better performance
      statusColorClass: getStatusColorClass(staffMember.status),
      // Pre-calculate formatted hire date
      formattedHireDate: staffMember.hireDate ? formatDateForTable(staffMember.hireDate) : '',
      // Pre-calculate days since hire for sorting/filtering
      daysSinceHire: calculateDaysSinceHire(staffMember.hireDate),
    })),
    data,
    [data, getStatusColorClass, calculateDaysSinceHire],
    {
      debugName: "staff-data-transform",
      enableLogging: process.env.NODE_ENV === "development",
    }
  );

  // Memoized columns definition with performance optimization
  const columns: ResponsiveColumnDef<Staff & Record<string, any>>[] = createOptimizedColumns(
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
        accessorKey: "employeeId",
        header: t("staff.employeeId"),
        cell: ({ row }) => <span>{row.original.employeeId || "--"}</span>,
        priority: ColumnPriority.HIGH,
      },
      {
        accessorKey: "name",
        header: t("staff.name"),
        cell: ({ row }) => (
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              // Direct navigation without going through hook
              const url = `/staff/${row.original.id}?openedInNewTab=true`;
              const link = document.createElement('a');
              link.href = url;
              link.target = '_blank';
              link.rel = 'noopener noreferrer';
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);
            }}
            className="text-blue-600 hover:underline font-medium text-left"
          >
            {row.original.name}
          </button>
        ),
        priority: ColumnPriority.ESSENTIAL,
      },
      {
        accessorKey: "age",
        header: t("staff.age"),
        cell: ({ row }) => <span>{row.original.age || "--"}</span>,
        priority: ColumnPriority.LOW,
      },
      {
        accessorKey: "residenceStatus",
        header: t("staff.residenceStatus"),
        cell: ({ row }) => <span>{row.original.residenceStatus ? t(`detailPages.staff.options.${row.original.residenceStatus}` as any) : "--"}</span>,
        priority: ColumnPriority.MEDIUM,
      },
      {
        accessorKey: "destinationName",
        header: t("staff.destinationName"),
        cell: ({ row }) => <span>{row.original.company?.name || "--"}</span>,
        sortingFn: (rowA: any, rowB: any) => {
          const a = rowA.original.company?.name || "";
          const b = rowB.original.company?.name || "";
          return a.localeCompare(b);
        },
        priority: ColumnPriority.HIGH,
      },
      {
        accessorKey: "status",
        header: t("staff.statusLabel" as any),
        cell: ({ row }) => {
          const status = row.original.status as string | undefined;
          const statusColorClass = (row.original as any).statusColorClass || 'bg-gray-100 text-gray-800';
          // Map internal enum keys to localized labels if available (use any-cast to avoid strict translation key typing)
          const label = status
            ? (() => {
              // try dynamic key first (may not be typed as TranslationKey)
              const dynamicKey = `staff.status.${status}`;
              const dynamic = (t as any)(dynamicKey);
              if (dynamic && typeof dynamic === 'string' && dynamic !== dynamicKey) return dynamic;
              // fallback to explicit keys
              switch (status) {
                case 'ACTIVE':
                  return (t as any)('staff.status.active') || 'Active';
                case 'INACTIVE':
                  return (t as any)('staff.status.inactive') || 'Inactive';
                case 'ON_LEAVE':
                  return (t as any)('staff.status.on_leave') || 'On Leave';
                case 'TERMINATED':
                  return (t as any)('staff.status.terminated') || 'Terminated';
                default:
                  return status;
              }
            })()
            : '--';
          return (
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColorClass}`}>
              {label}
            </span>
          );
        },
        priority: ColumnPriority.HIGH,
      },
      {
        accessorKey: "nationality",
        header: t("staff.nationality"),
        cell: ({ row }) => <span>{row.original.nationality ? t(`staff.countries.${row.original.nationality}` as any) : "--"}</span>,
        priority: ColumnPriority.LOW,
      },
      {
        accessorKey: "phone",
        header: t("staff.phone"),
        cell: ({ row }) => <span>{row.original.phone || "--"}</span>,
        priority: ColumnPriority.MEDIUM,
      },
      {
        accessorKey: "userInCharge",
        header: t("staff.userInCharge"),
        accessorFn: (row: Staff) => row.userInCharge?.name || "--",
        cell: ({ row }) => <span>{row.original.userInCharge?.name || "--"}</span>,
        sortingFn: (rowA: any, rowB: any) => {
          const a = rowA.original.userInCharge?.name || "";
          const b = rowB.original.userInCharge?.name || "";
          return a.localeCompare(b);
        },
        priority: ColumnPriority.HIGH,
      },
      {
        accessorKey: "hireDate",
        header: t("staff.hireDate"),
        cell: ({ row }) => {
          const formattedDate = (row.original as any).formattedHireDate || '';
          return <span>{formattedDate}</span>;
        },
        sortingFn: (rowA: any, rowB: any) => {
          const daysA = (rowA.original as any).daysSinceHire || 0;
          const daysB = (rowB.original as any).daysSinceHire || 0;
          return daysB - daysA; // Most recent first
        },
        priority: ColumnPriority.MEDIUM,
      },
    ],
    [t, navigate],
    {
      enableMemoization: true,
      debugName: "staff-list-columns",
      enableLogging: process.env.NODE_ENV === "development",
    }
  );

  // Optimized search filter with memoization (supports translated values in EN/JA)
  const filterStaff = useCallback((staff: Staff[], query: string) => {
    const term = query.trim().toLowerCase();
    if (!term) return staff;

    const translateBoth = (key: string): string[] => {
      if (!key) return [];
      // Force translation in both languages so users can search by EN or JA regardless of current UI language
      const en = (t as any)(key, { lng: 'en' }) as string;
      const ja = (t as any)(key, { lng: 'ja' }) as string;
      const out: string[] = [];
      if (en && typeof en === 'string' && en !== key) out.push(en.toLowerCase());
      if (ja && typeof ja === 'string' && ja !== key && ja.toLowerCase() !== en?.toLowerCase()) out.push(ja.toLowerCase());
      return out;
    };

    const getStatusLabels = (status?: string): string[] => {
      if (!status) return [];
      const dynamicKey = `staff.status.${status}`;
      const dynamic = translateBoth(dynamicKey);
      if (dynamic.length) return dynamic;

      switch (status) {
        case 'ACTIVE':
          return translateBoth('staff.status.active');
        case 'INACTIVE':
          return translateBoth('staff.status.inactive');
        case 'ON_LEAVE':
          return translateBoth('staff.status.on_leave');
        case 'TERMINATED':
          return translateBoth('staff.status.terminated');
        default:
          return [];
      }
    };

    const getResidenceStatusLabels = (residenceStatus?: string): string[] => {
      if (!residenceStatus) return [];
      return translateBoth(`detailPages.staff.options.${residenceStatus}`);
    };

    const includes = (value?: string | number | null): boolean => {
      if (value === null || value === undefined) return false;
      return value.toString().toLowerCase().includes(term);
    };

    return staff.filter(s =>
      // Raw values
      includes(s.name) ||
      includes(s.employeeId) ||
      includes(s.position) ||
      includes(s.department) ||
      includes(s.email) ||
      includes(s.phone) ||
      includes(s.status) ||
      includes(s.residenceStatus) ||
      includes(s.nationality) ||
      includes(s.userInCharge?.name) ||
      includes(s.company?.name) ||
      includes(s.age) ||
      // Translated enum labels (EN/JA)
      getStatusLabels(s.status).some(v => v.includes(term)) ||
      getResidenceStatusLabels(s.residenceStatus).some(v => v.includes(term))
    );
  }, [t]);

  // Immediate search effect with transformed data
  useEffect(() => {
    const filtered = filterStaff(transformedData, searchQuery);
    setFilteredData(filtered);
  }, [transformedData, searchQuery, filterStaff]);

  const handleSearchChange = useCallback((query: string) => {
    setSearchQuery(query);
    // Reset pagination when search changes
    pagination.resetToFirstPage();
  }, [pagination]);

  // Enhanced fetch function with AbortController for proper request cancellation
  const fetchStaff = useCallback(async (signal?: AbortSignal) => {
    try {
      setLoading(true);
      setError(null);

      const result = await staffService.getAllStaff(signal);

      // Only update state if request wasn't cancelled
      if (!signal?.aborted) {
        setData(result);
      }
    } catch (error) {
      // Only set error if component is still mounted and request wasn't cancelled
      if (!signal?.aborted && error instanceof Error && error.name !== 'AbortError') {
        console.error('Failed to fetch staff:', error);
        setError('Failed to fetch staff');
        setData([]);
      }
    } finally {
      // Only update loading state if request wasn't cancelled
      if (!signal?.aborted) {
        setLoading(false);
      }
    }
  }, []);

  // Initial fetch with proper AbortController cleanup
  useEffect(() => {
    const controller = new AbortController();

    const loadData = async () => {
      await fetchStaff(controller.signal);
    };

    loadData();

    return () => {
      controller.abort();
    };
  }, [fetchStaff]);

  // Listen for cross-tab refresh events (when records are deleted from other tabs)
  useCrossTabRefresh('staff', () => fetchStaff());

  // Navigation handlers
  const handleStaffClick = (staff: Staff) => {
    navigateToDetail(staff.id.toString(), 'staff');
  };

  const handleNewStaff = () => {
    navigateToNew('staff');
  };

  // Handle row selection change
  const handleRowSelectionChange = useCallback((selection: RowSelectionState) => {
    setSelectedRows(selection);
  }, []);

  // Get selected staff IDs
  const selectedStaffIds = useMemo(() => {
    return Object.keys(selectedRows)
      .filter(key => selectedRows[key])
      .map(key => filteredData[parseInt(key)]?.id)
      .filter(Boolean) as number[];
  }, [selectedRows, filteredData]);

  // Handle bulk delete
  const handleBulkDelete = useCallback(async () => {
    if (selectedStaffIds.length === 0) {
      return;
    }

    showConfirmDialog({
      title: t('common.actions.delete'),
      message: t('common.feedback.bulkDeleteConfirm', { count: selectedStaffIds.length }),
      variant: 'destructive',
      confirmText: t('common.actions.delete'),
      cancelText: t('common.actions.cancel'),
      onConfirm: async () => {
        await staffService.bulkDeleteStaff(selectedStaffIds);
        // Clear selection and refresh data
        setSelectedRows({});
        fetchStaff();
      },
    });
  }, [selectedStaffIds, t, fetchStaff, showConfirmDialog]);

  return (
    <div className="space-y-4 pb-20 md:pb-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <BackButton onBack={() => navigate('/complaint-details')} />
          <h1 className="text-2xl md:text-3xl font-bold text-secondary-900">
            {t('staff.management')}
          </h1>
        </div>
      </div>


      {/* Controls with inline Search */}
      <div className="flex items-center gap-2 justify-between">
        <div className="flex items-center space-x-4">
          <ViewModeToggle mode={viewMode} onChange={setViewMode} />
        </div>

        <MobileAwareSearchSection pageName="staff" className="flex-1">
          <Card className="search-component-spacing">
            <CardContent className="p-2">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-secondary-400" />
                  <Input
                    placeholder={t('staff.searchStaff')}
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
                  aria-label="Search staff"
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
            disabled={selectedStaffIds.length === 0}
            size="sm"
            viewMode={viewMode}
            count={selectedStaffIds.length}
            className={selectedStaffIds.length === 0 ? 'opacity-50' : ''}
          />
          <MobileAwareButton
            variant="new"
            onClick={handleNewStaff}
            size="sm"
            viewMode={viewMode}
          />
        </div>
      </div>

      {/* Staff List - Conditional rendering with smooth transitions */}
      <div className="transition-all duration-300 ease-in-out">
        {viewMode === 'table' ? (
          <div>
            <LazyDataTable
              columns={columns}
              data={filteredData as (Staff & Record<string, unknown>)[]}
              loading={loading}
              error={error}
              totalCount={transformedData.length}
              enableColumnFiltering={true}
              tableName="staff"
              searchQuery={searchQuery}
              enableRowSelection={true}
              rowSelectionMode="multiple"
              rowSelection={selectedRows}
              onRowSelectionChange={handleRowSelectionChange}
              onRowClick={handleStaffClick}
              onFiltersChange={(filters: Record<string, string[]>) => {
                // Handle filter changes - this will be called when filters are applied
                console.log('Filters changed:', filters);
              }}
            />
          </div>
        ) : (
          <div>
            {/* Responsive card grid layout */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
              {loading ? (
                Array.from({ length: pagination.itemsPerPage }).map((_, index) => (
                  <CardSkeleton key={index} variant="staff" />
                ))
              ) : filteredData.length === 0 ? (
                <div className="col-span-full text-center py-8 text-muted-foreground">
                  {transformedData.length === 0
                    ? 'No staff members found'
                    : searchQuery.trim()
                      ? 'No staff members match your search'
                      : 'No staff members found'
                  }
                </div>
              ) : (
                pagination.getPaginatedData(filteredData).map((staffMember: Staff) => (
                  <LazyStaffCard
                    key={staffMember.id}
                    staff={staffMember}
                    onClick={handleStaffClick}
                  />
                ))
              )}
            </div>

            {/* Cards Pagination */}
            {!loading && filteredData.length > 0 && (
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

      {/* Loading state */}
      {loading && (
        <div className="flex items-center justify-center py-8">
          <div className="text-sm text-muted-foreground">{t('common.status.loading')}</div>
        </div>
      )}

      {/* Error state */}
      {error && (
        <div className="text-sm text-red-600 bg-red-50 p-3 rounded border border-red-200">
          {error}
          <Button onClick={() => fetchStaff()} className="mt-2 ml-2" size="sm">
            {t('common.actions.retry')}
          </Button>
        </div>
      )}

      {/* Empty states */}
      {!loading && !error && transformedData.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          No staff members found
        </div>
      )}
      {!loading && !error && transformedData.length > 0 && filteredData.length === 0 && searchQuery.trim() && (
        <div className="text-center py-8 text-muted-foreground">
          No staff members match your search
        </div>
      )}

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
    </div>
  );
};
