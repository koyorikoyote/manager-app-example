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
import { Property } from '../../../shared/types';
import { propertyService } from '../../services/propertyService';
import type { ResponsiveColumnDef } from '../../utils/columnHelpers';
import type { RowSelectionState } from '@tanstack/react-table';
import { formatDateForTable } from '../../utils/localization';
import { useMemoizedDataTransform, useMemoizedFilter } from '../../utils/memoizationUtils';
import { createOptimizedColumns } from '../../utils/optimizedColumnHelpers';
import { ColumnPriority } from '../../utils/columnHelpers';

const LazyDataTable = createLazyComponent(
  () => import('../ui/DataTable').then(module => ({ default: module.DataTable })),
  'DataTable'
);
const LazyPropertyCard = createLazyComponent(
  () => import('../ui/PropertyCard').then(module => ({ default: module.PropertyCard })),
  'PropertyCard'
);



export const PropertyList: React.FC = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const isGlassBlue = useGlassBlue();
  const { navigateToDetail, navigateToNew } = useResponsiveNavigation();
  const { dialogState, isLoading: isDialogLoading, showConfirmDialog, hideConfirmDialog, handleConfirm } = useConfirmDialog();

  // Simple state management (following Sales Assistant pattern)
  const [data, setData] = useState<Property[]>([]);
  const [filteredData, setFilteredData] = useState<Property[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const { viewMode, setViewMode } = useViewMode('properties');

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
        () => import('../ui/PropertyCard').then(module => ({ default: module.PropertyCard })),
        'PropertyCard'
      );
    }
  }, [viewMode]);
  const [selectedRows, setSelectedRows] = useState<RowSelectionState>({});



  // Pagination for Cards view
  const pagination = usePagination({
    totalItems: filteredData.length,
    initialItemsPerPage: 10,
  });
  const { resetToFirstPage } = pagination;

  // Memoized helper functions for calculated fields
  const getPropertyTypeColorClass = useCallback((type: string) => {
    const normalized = String(type || '').toUpperCase();
    switch (normalized) {
      case 'RESIDENTIAL':
        return 'bg-blue-100 text-blue-800';
      case 'COMMERCIAL':
        return 'bg-purple-100 text-purple-800';
      case 'INDUSTRIAL':
        return 'bg-orange-100 text-orange-800';
      case 'MIXED_USE':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }, []);

  const getPropertyStatusColorClass = useCallback((status: string) => {
    const normalized = String(status || '').toUpperCase();
    switch (normalized) {
      case 'ACTIVE':
        return 'bg-green-100 text-green-800';
      case 'INACTIVE':
        return 'bg-gray-100 text-gray-800';
      case 'UNDER_CONSTRUCTION':
        return 'bg-yellow-100 text-yellow-800';
      case 'SOLD':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }, []);

  const formatContractDate = useCallback((contractDate: string | Date | null | undefined) => {
    if (!contractDate) return '';
    return formatDateForTable(contractDate);
  }, []);

  // Memoized filter functions for columns
  const propertyTypeFilter = useMemoizedFilter(
    () => (row: Property, id: string, value: string[]) => {
      if (!value || value.length === 0) return true;
      const propertyType = row.propertyType?.toLowerCase() || '';
      return value.some(v => propertyType.includes(v.toLowerCase()));
    },
    {
      dependencies: [],
      debugName: "property-type-filter",
      enableLogging: process.env.NODE_ENV === "development",
    }
  );

  const propertyStatusFilter = useMemoizedFilter(
    () => (row: Property, id: string, value: string[]) => {
      if (!value || value.length === 0) return true;
      return value.includes(row.status);
    },
    {
      dependencies: [],
      debugName: "property-status-filter",
      enableLogging: process.env.NODE_ENV === "development",
    }
  );

  const contractDateFilter = useMemoizedFilter(
    () => (row: Property, id: string, value: [string, string]) => {
      if (!value || !Array.isArray(value) || value.length !== 2) return true;
      const [startDate, endDate] = value;
      if (!startDate && !endDate) return true;

      const contractDate = row.contractDate;
      if (!contractDate) return false;

      const date = new Date(contractDate);
      if (isNaN(date.getTime())) return false;

      const start = startDate ? new Date(startDate) : null;
      const end = endDate ? new Date(endDate) : null;

      if (start && date < start) return false;
      if (end && date > end) return false;

      return true;
    },
    {
      dependencies: [],
      debugName: "contract-date-filter",
      enableLogging: process.env.NODE_ENV === "development",
    }
  );

  // Memoized data transformation with calculated fields
  const transformedData = useMemoizedDataTransform(
    (properties: Property[]) => properties.map(property => ({
      ...property,
      // Pre-calculate type color class for better performance
      typeColorClass: getPropertyTypeColorClass(property.propertyType),
      // Pre-calculate status color class for better performance
      statusColorClass: getPropertyStatusColorClass(property.status),
      // Pre-calculate formatted contract date
      formattedContractDate: formatContractDate(property.contractDate),
      // Pre-calculate document count for sorting/filtering
      documentCount: property.documentIds?.length || 0,
      // Pre-calculate occupancy status
      occupancyStatus: (property.occupantCount || 0) > 0 ? 'occupied' : 'vacant',
      // Pre-calculate property age if created date exists
      propertyAge: property.createdAt ?
        Math.floor((Date.now() - new Date(property.createdAt).getTime()) / (1000 * 60 * 60 * 24)) : 0,
    })),
    data,
    [data, getPropertyTypeColorClass, getPropertyStatusColorClass, formatContractDate],
    {
      debugName: "property-data-transform",
      enableLogging: process.env.NODE_ENV === "development",
    }
  );

  // Memoized columns definition with performance optimization
  const columns: ResponsiveColumnDef<Property & Record<string, unknown>>[] = createOptimizedColumns(
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
        accessorKey: "name",
        header: t("properties.propertyName"),
        priority: ColumnPriority.ESSENTIAL,
        cell: ({ row }) => (
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              navigateToDetail(row.original.id.toString(), 'property');
            }}
            className="text-blue-600 hover:underline font-medium text-left"
          >
            {row.original.name}
          </button>
        ),
      },
      {
        accessorKey: "address",
        header: t("company.address"),
        priority: ColumnPriority.HIGH,
        cell: ({ row }) => <span>{row.original.address || "--"}</span>
      },
      {
        accessorKey: "propertyType",
        header: t("residences.type"),
        priority: ColumnPriority.HIGH,
        cell: ({ row }) => {
          const propertyType = row.original.propertyType;
          const propertyTypeColorClass = (row.original as any).typeColorClass || 'bg-gray-100 text-gray-800';

          // Try dynamic translation key first (properties.<status>)
          const dynamicKey = propertyType ? `properties.${propertyType}` : '';
          const dynamic = propertyType ? (t as any)(dynamicKey) : undefined;

          const labelMap: Record<string, string> = {
            'RESIDENTIAL': t('properties.residential') || 'Residential',
            'COMMERCIAL': t('properties.commercial') || 'Commercial',
            'INDUSTRIAL': t('properties.industrial') || 'Industrial',
            'MIXED_USE': t('properties.mixedUse') || 'Mixed Use',
          };

          const label = propertyType
            ? (dynamic && typeof dynamic === 'string' && dynamic !== dynamicKey ? dynamic : (propertyType in labelMap ? labelMap[propertyType] : propertyType))
            : '--';

          return (
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${propertyTypeColorClass}`}>
              {label}
            </span>
          );
        },
        filterFn: propertyTypeFilter,
      },
      {
        accessorKey: "status",
        header: t("properties.propertyStatus"),
        priority: ColumnPriority.HIGH,
        cell: ({ row }) => {
          const status = row.original.status;
          const statusColorClass = (row.original as any).statusColorClass || 'bg-gray-100 text-gray-800';

          // Try dynamic translation key first (properties.<status>)
          const dynamicKey = status ? `properties.${status}` : '';
          const dynamic = status ? (t as any)(dynamicKey) : undefined;

          const labelMap: Record<string, string> = {
            'ACTIVE': t('properties.active') || 'Active',
            'INACTIVE': t('properties.inactive') || 'Inactive',
            'UNDER_CONSTRUCTION': t('properties.underConstruction') || 'Under Construction',
            'SOLD': t('properties.sold') || 'Sold',
          };

          const label = status
            ? (dynamic && typeof dynamic === 'string' && dynamic !== dynamicKey ? dynamic : (status in labelMap ? labelMap[status] : status))
            : '--';

          return (
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColorClass}`}>
              {label}
            </span>
          );
        },
        filterFn: propertyStatusFilter,
      },
      {
        accessorKey: "occupantCount",
        header: t("properties.numberOfOccupants"),
        priority: ColumnPriority.MEDIUM,
        cell: ({ row }) => <span>{row.original.occupantCount || 0}</span>
      },
      {
        accessorKey: "contractDate",
        header: t("residences.contractDate"),
        priority: ColumnPriority.MEDIUM,
        cell: ({ row }) => {
          const formattedDate = formatContractDate(row.original.contractDate);
          return <span>{formattedDate || "--"}</span>;
        },
        filterFn: contractDateFilter,
      },
      {
        accessorKey: "documentIds",
        header: t("residences.documents"),
        priority: ColumnPriority.MEDIUM,
        cell: ({ row }) => <span>{row.original.documentIds?.length || 0}</span>
      },
    ],
    [t, navigateToDetail, getPropertyStatusColorClass, formatContractDate, propertyTypeFilter, propertyStatusFilter, contractDateFilter],
    {
      debugName: "property-list-columns",
      enableLogging: process.env.NODE_ENV === "development",
    }
  );

  // Optimized search filter with memoization (supports translated labels EN/JA)
  const filterProperties = useCallback((properties: Property[], query: string) => {
    const term = query.trim().toLowerCase();
    if (!term) return properties;

    const translateBoth = (key: string): string[] => {
      if (!key) return [];
      const en = (t as any)(key, { lng: 'en' }) as string;
      const ja = (t as any)(key, { lng: 'ja' }) as string;
      const out: string[] = [];
      if (en && typeof en === 'string' && en !== key) out.push(en.toLowerCase());
      if (ja && typeof ja === 'string' && ja !== key && ja.toLowerCase() !== en?.toLowerCase()) out.push(ja.toLowerCase());
      return out;
    };

    const getStatusLabels = (status?: string | null): string[] => {
      if (!status) return [];
      const s = String(status);
      const labels = new Set<string>();

      // Dynamic attempts for common casings
      [s, s.toLowerCase(), s.toUpperCase()].forEach(v => {
        translateBoth(`properties.${v}`).forEach(x => labels.add(x));
      });

      // Explicit known enum labels
      const upper = s.toUpperCase().replace(/[-\s]/g, '_');
      switch (upper) {
        case 'ACTIVE':
          translateBoth('properties.active').forEach(x => labels.add(x));
          break;
        case 'INACTIVE':
          translateBoth('properties.inactive').forEach(x => labels.add(x));
          break;
        case 'UNDER_CONSTRUCTION':
          translateBoth('properties.underConstruction').forEach(x => labels.add(x));
          break;
        case 'SOLD':
          translateBoth('properties.sold').forEach(x => labels.add(x));
          break;
        case 'MAINTENANCE':
          translateBoth('properties.maintenance').forEach(x => labels.add(x));
          break;
        case 'OCCUPIED':
          translateBoth('properties.occupied').forEach(x => labels.add(x));
          break;
        case 'VACANT':
          translateBoth('properties.vacant').forEach(x => labels.add(x));
          break;
      }
      return Array.from(labels);
    };

    const getPropertyTypeLabels = (type?: string | null): string[] => {
      if (!type) return [];
      const s = String(type);
      const labels = new Set<string>();

      [s, s.toLowerCase(), s.toUpperCase()].forEach(v => {
        translateBoth(`properties.${v}`).forEach(x => labels.add(x));
      });

      const upper = s.toUpperCase().replace(/[-\s]/g, '_');
      switch (upper) {
        case 'RESIDENTIAL':
          translateBoth('properties.residential').forEach(x => labels.add(x));
          break;
        case 'COMMERCIAL':
          translateBoth('properties.commercial').forEach(x => labels.add(x));
          break;
        case 'INDUSTRIAL':
          translateBoth('properties.industrial').forEach(x => labels.add(x));
          break;
        case 'MIXED_USE':
          translateBoth('properties.mixedUse').forEach(x => labels.add(x));
          break;
      }
      return Array.from(labels);
    };

    const includes = (value?: string | number | null): boolean => {
      if (value === null || value === undefined) return false;
      return value.toString().toLowerCase().includes(term);
    };

    return properties.filter(property =>
      // Raw values
      includes(property.name) ||
      includes(property.address) ||
      includes(property.propertyType) ||
      includes(property.status) ||
      // Translated labels for enums
      getPropertyTypeLabels(property.propertyType).some(v => v.includes(term)) ||
      getStatusLabels(property.status).some(v => v.includes(term))
    );
  }, [t]);


  const handleSearchChange = useCallback((query: string) => {
    setSearchQuery(query);
  }, []);

  // Enhanced fetch function with AbortController for proper request cancellation
  const fetchProperties = useCallback(async (signal?: AbortSignal) => {
    try {
      setLoading(true);
      setError(null);

      const result = await propertyService.getAll({ status: 'ALL' }, signal);

      // Only update state if request wasn't cancelled
      if (!signal?.aborted) {
        setData(result.data);
      }
    } catch (error) {
      // Only set error if component is still mounted and request wasn't cancelled
      if (!signal?.aborted && error instanceof Error && error.name !== 'AbortError') {
        console.error('Failed to fetch properties:', error);
        setError('Failed to fetch properties');
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
      await fetchProperties(controller.signal);
    };

    loadData();

    return () => {
      controller.abort();
    };
  }, [fetchProperties]);

  // Listen for cross-tab refresh events (when records are deleted from other tabs)
  useCrossTabRefresh('property', () => fetchProperties());

  // Initialize filtered data when transformed data changes
  useEffect(() => {
    setFilteredData(filterProperties(transformedData, searchQuery));
    // Reset pagination when data changes
    resetToFirstPage();
  }, [transformedData, searchQuery, filterProperties, resetToFirstPage]);

  // Navigation handlers
  const handlePropertyClick = (property: Property) => {
    navigateToDetail(property.id.toString(), 'property');
  };

  const handleNewProperty = () => {
    navigateToNew('property');
  };

  // Handle row selection change
  const handleRowSelectionChange = useCallback((selection: RowSelectionState) => {
    setSelectedRows(selection);
  }, []);

  // Get selected property IDs
  const selectedPropertyIds = useMemo(() => {
    return Object.keys(selectedRows)
      .filter(key => selectedRows[key])
      .map(key => filteredData[parseInt(key)]?.id)
      .filter(Boolean) as number[];
  }, [selectedRows, filteredData]);

  // Handle bulk delete
  const handleBulkDelete = useCallback(async () => {
    if (selectedPropertyIds.length === 0) {
      return;
    }

    showConfirmDialog({
      title: t('common.actions.delete'),
      message: t('common.feedback.bulkDeleteConfirm', { count: selectedPropertyIds.length }),
      variant: 'destructive',
      confirmText: t('common.actions.delete'),
      cancelText: t('common.actions.cancel'),
      onConfirm: async () => {
        await propertyService.bulkDelete(selectedPropertyIds);
        // Clear selection and refresh data
        setSelectedRows({});
        fetchProperties();
      },
    });
  }, [selectedPropertyIds, t, fetchProperties, showConfirmDialog]);

  return (
    <div className="space-y-4 pb-20 md:pb-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <BackButton onBack={() => navigate('/complaint-details')} />
          <h1 className="text-2xl md:text-3xl font-bold text-secondary-900">
            {t('residences.title')}
          </h1>
        </div>
      </div>


      {/* Controls with inline Search */}
      <div className="flex items-center gap-2 justify-between">
        <div className="flex items-center space-x-4">
          <ViewModeToggle mode={viewMode} onChange={setViewMode} />
        </div>

        <MobileAwareSearchSection pageName="properties" className="flex-1">
          <Card className="search-component-spacing">
            <CardContent className="p-2">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-secondary-400" />
                  <Input
                    placeholder={t('residences.searchPlaceholder')}
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
                  aria-label="Search properties"
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
            disabled={selectedPropertyIds.length === 0}
            size="sm"
            viewMode={viewMode}
            count={selectedPropertyIds.length}
            className={selectedPropertyIds.length === 0 ? 'opacity-50' : ''}
          />
          <MobileAwareButton
            variant="new"
            onClick={handleNewProperty}
            size="sm"
            viewMode={viewMode}
          />
        </div>
      </div>

      {/* Property List - Conditional rendering with smooth transitions */}
      <div className="transition-all duration-300 ease-in-out">
        {viewMode === 'table' ? (
          <div>
            <LazyDataTable
              columns={columns}
              data={filteredData as (Property & Record<string, unknown>)[]}
              loading={loading}
              error={error}
              totalCount={data.length}
              enableColumnFiltering={true}
              tableName="properties"
              searchQuery={searchQuery}
              enableRowSelection={true}
              rowSelectionMode="multiple"
              rowSelection={selectedRows}
              onRowSelectionChange={handleRowSelectionChange}
              onRowClick={handlePropertyClick}
            />
          </div>
        ) : (
          <div>
            {/* Responsive card grid layout */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
              {loading ? (
                Array.from({ length: pagination.itemsPerPage }).map((_, index) => (
                  <CardSkeleton key={index} variant="property" />
                ))
              ) : filteredData.length === 0 ? (
                <div className="col-span-full text-center py-8 text-muted-foreground">
                  {data.length === 0
                    ? 'No properties found'
                    : searchQuery.trim()
                      ? 'No properties match your search'
                      : 'No properties found'
                  }
                </div>
              ) : (
                pagination.getPaginatedData(filteredData).map((property: Property) => (
                  <LazyPropertyCard
                    key={property.id}
                    property={property}
                    onClick={handlePropertyClick}
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
          <Button onClick={() => fetchProperties()} className="mt-2 ml-2" size="sm">
            {t('common.actions.retry')}
          </Button>
        </div>
      )}

      {/* Empty states */}
      {!loading && !error && data.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          No properties found
        </div>
      )}
      {!loading && !error && data.length > 0 && filteredData.length === 0 && searchQuery.trim() && (
        <div className="text-center py-8 text-muted-foreground">
          No properties match your search
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
