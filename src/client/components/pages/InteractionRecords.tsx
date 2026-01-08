import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search } from 'lucide-react';
import { InteractionRecord, InteractionStatus } from '../../../shared/types';
import { interactionService } from '../../services/interactionService';
import { useLanguage } from '../../contexts/LanguageContext';
import { useGlassBlue } from '../../hooks/useGlassBlue';
import { Button } from '../ui/Button';
import { MobileAwareButton } from '../ui/MobileAwareButton';
import { BackButton } from '../ui/BackButton';
import { Card, CardContent } from '../ui/Card';
import { Input } from '../ui/Input';
import { createLazyComponent, preloadComponent } from '../../utils/lazyLoading';
import { ViewModeToggle } from '../ui/ViewModeToggle';
import { InteractionDetailDialog } from '../ui/InteractionDetailDialog';
import { CardSkeleton } from '../ui/CardSkeleton';
import { MobileAwareSearchSection } from '../ui/MobileAwareSearchSection';
import { useViewMode } from '../../hooks/useViewMode';
import { CardsPagination } from '../ui/CardsPagination';
import { InteractionFormDialog } from '../ui/InteractionFormDialog';
import { usePagination } from '../../hooks/usePagination';
import { formatDateForTable } from '../../utils/localization';
import type { ResponsiveColumnDef } from '../../utils/columnHelpers';
import { useMemoizedDataTransform } from '../../utils/memoizationUtils';

const LazyDataTable = createLazyComponent(
  () => import('../ui/DataTable').then(module => ({ default: module.DataTable })),
  'DataTable'
);
const LazyInteractionCard = createLazyComponent(
  () => import('../ui/InteractionCard').then(module => ({ default: module.InteractionCard })),
  'InteractionCard'
);
import { createOptimizedColumns } from '../../utils/optimizedColumnHelpers';
import type { RowSelectionState } from '@tanstack/react-table';
import { Checkbox } from '../ui/Checkbox';

// Extended type for transformed interaction records with calculated fields
type TransformedInteractionRecord = InteractionRecord & {
  typeColorClass: string;
  statusColorClass: string;
  formattedDate: string;
  daysPassed: number;
  daysPassedPriority: 'high' | 'medium' | 'low';
  userInChargeName: string;
  personInvolvedName: string;
  creatorName: string;
  searchText: string;
};

export const InteractionRecords: React.FC = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const isGlassBlue = useGlassBlue();
  const [isFormDialogOpen, setIsFormDialogOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<InteractionRecord | null>(null);
  const [formLoading, setFormLoading] = useState(false);
  const [formErrors, setFormErrors] = useState<Array<{ field?: string; message: string }>>([]);
  const [availableStaff, setAvailableStaff] = useState<Array<{ id: number; name: string; employeeId: string | null }>>([]);
  const [availableUsers, setAvailableUsers] = useState<Array<{ id: number; name: string }>>([]);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<InteractionRecord | null>(null);

  // Simple state management (following Sales Assistant pattern)
  const [data, setData] = useState<InteractionRecord[]>([]);
  const [filteredData, setFilteredData] = useState<InteractionRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedRows, setSelectedRows] = useState<RowSelectionState>({});
  const { viewMode, setViewMode } = useViewMode('interactions');

  // Preload the active view to disable lazy loading for it; keep inactive view lazy
  useEffect(() => {
    if (viewMode === 'table') {
      preloadComponent(
        () => import('../ui/DataTable').then(module => ({ default: module.DataTable })),
        'DataTable'
      );
    } else {
      preloadComponent(
        () => import('../ui/InteractionCard').then(module => ({ default: module.InteractionCard })),
        'InteractionCard'
      );
    }
  }, [viewMode]);



  // Pagination for Cards view
  const pagination = usePagination({
    totalItems: filteredData.length,
    initialItemsPerPage: 10,
  });

  // Memoized helper functions for calculated fields
  const getTypeColor = useCallback((type: string) => {
    switch (type) {
      case 'discussion':
      case 'DISCUSSION':
        return 'bg-blue-100 text-blue-800';
      case 'interview':
      case 'INTERVIEW':
        return 'bg-purple-100 text-purple-800';
      case 'consultation':
      case 'CONSULTATION':
        return 'bg-green-100 text-green-800';
      case 'other':
      case 'OTHER':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }, []);

  const getStatusColor = useCallback((status: string) => {
    const normalized = String(status || '').toLowerCase().replace('_', '-');
    switch (normalized) {
      case 'open':
        return 'bg-yellow-100 text-yellow-800';
      case 'in-progress':
        return 'bg-blue-100 text-blue-800';
      case 'resolved':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }, []);

  const calculateDaysPassed = useCallback((date: string | Date | null | undefined) => {
    if (!date) return 0;
    try {
      const dateObj = new Date(date);
      if (isNaN(dateObj.getTime())) return 0;
      const now = new Date();
      const diffTime = now.getTime() - dateObj.getTime();
      return Math.floor(diffTime / (1000 * 60 * 60 * 24));
    } catch {
      return 0;
    }
  }, []);

  const handleEdit = useCallback((record: InteractionRecord) => {
    setEditingRecord(record);
    setIsFormDialogOpen(true);
    setFormErrors([]);
  }, []);

  const handleCardClick = useCallback((record: InteractionRecord) => {
    setSelectedRecord(record);
    setShowDetailDialog(true);
  }, []);

  const handleRowClick = useCallback((record: InteractionRecord) => {
    setSelectedRecord(record);
    setShowDetailDialog(true);
  }, []);

  // Memoized data transformation with calculated fields
  const transformedData = useMemoizedDataTransform(
    (interactions: InteractionRecord[]): TransformedInteractionRecord[] => interactions.map(interaction => {
      const daysPassed = calculateDaysPassed(interaction.date);

      return {
        ...interaction,
        // Pre-calculate type color class for better performance
        typeColorClass: getTypeColor(interaction.type),
        // Pre-calculate status color class for better performance
        statusColorClass: getStatusColor(interaction.status || ''),
        // Pre-calculate formatted date
        formattedDate: interaction.date ? formatDateForTable(interaction.date) : '',
        // Pre-calculate days passed for sorting/filtering
        daysPassed,
        // Pre-calculate days passed priority for visual indicators
        daysPassedPriority: daysPassed > 30 ? 'high' as const : daysPassed > 7 ? 'medium' as const : 'low' as const,
        // Pre-calculate user in charge name for filtering/sorting
        userInChargeName: interaction.userInCharge?.name || "--",
        // Pre-calculate person involved name for filtering/sorting
        personInvolvedName: interaction.personInvolved?.name || "--",
        // Pre-calculate creator name for filtering/sorting
        creatorName: interaction.creator?.name || "--",
        // Pre-calculate search text for optimized searching
        searchText: [
          interaction.description,
          interaction.name,
          interaction.title,
          interaction.type,
          interaction.status,
          interaction.personConcerned,
          interaction.creator?.name,
          interaction.personInvolved?.name,
          interaction.userInCharge?.name,
        ].filter(Boolean).join(' ').toLowerCase(),
      };
    }),
    data,
    [data, getTypeColor, getStatusColor, calculateDaysPassed],
    {
      debugName: "interaction-data-transform",
      enableLogging: process.env.NODE_ENV === "development",
    }
  );

  // Simple fetch function (following Sales Assistant pattern)
  const fetchInteractions = useCallback(async (signal?: AbortSignal) => {
    try {
      setLoading(true);
      setError(null);

      const result = await interactionService.getAllInteractions(signal);

      // Only update state if request wasn't cancelled
      if (!signal?.aborted) {
        setData(result);
      }
    } catch (error) {
      // Only set error if component is still mounted and request wasn't cancelled
      if (!signal?.aborted && error instanceof Error && error.name !== 'AbortError') {
        console.error('Failed to fetch interactions:', error);
        setError('Failed to fetch interactions');
        setData([]);
      }
    } finally {
      // Only update loading state if request wasn't cancelled
      if (!signal?.aborted) {
        setLoading(false);
      }
    }
  }, []);

  const handleDelete = useCallback(async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this interaction?')) {
      return;
    }

    try {
      await interactionService.deleteInteraction(id);
      fetchInteractions();
    } catch (err) {
      console.error('Failed to delete interaction:', err);
    }
  }, [fetchInteractions]);

  // Get selected interaction IDs
  const selectedInteractionIds = useMemo(() => {
    return Object.keys(selectedRows)
      .filter((key) => selectedRows[key])
      .map((key) => filteredData[parseInt(key)]?.id)
      .filter(Boolean) as number[];
  }, [selectedRows, filteredData]);

  // Handle bulk delete
  const handleBulkDelete = useCallback(async () => {
    if (selectedInteractionIds.length === 0) {
      return;
    }

    if (!window.confirm(`Are you sure you want to delete ${selectedInteractionIds.length} interaction(s)?`)) {
      return;
    }

    try {
      // Delete each selected interaction
      await Promise.all(
        selectedInteractionIds.map(id => interactionService.deleteInteraction(String(id)))
      );
      // Clear selection and refresh data
      setSelectedRows({});
      fetchInteractions();
    } catch (error) {
      console.error('Bulk delete error:', error);
    }
  }, [selectedInteractionIds, fetchInteractions]);

  // Helper functions for rendering with translations
  const getTypeLabel = useCallback((type: InteractionRecord['type']): string => {
    const normalized = String(type || '').toUpperCase();
    switch (normalized) {
      case 'DISCUSSION':
      case 'discussion':
        return t('interactions.types.DISCUSSION');
      case 'INTERVIEW':
      case 'interview':
        return t('interactions.types.INTERVIEW');
      case 'CONSULTATION':
      case 'consultation':
        return t('interactions.types.CONSULTATION');
      case 'OTHER':
      case 'other':
        return t('interactions.types.OTHER');
      default:
        return String(type || '');
    }
  }, [t]);

  const getStatusLabel = useCallback((status: InteractionRecord['status']): string => {
    const normalized = String(status || '').toUpperCase().replace('-', '_');
    switch (normalized) {
      case 'OPEN':
      case 'open':
        return t('interactions.open');
      case 'IN_PROGRESS':
      case 'IN-PROGRESS':
      case 'in-progress':
        return t('interactions.inProgress');
      case 'RESOLVED':
      case 'resolved':
        return t('interactions.resolved');
      default:
        return String(status || '');
    }
  }, [t]);

  // Memoized columns definition with performance optimization
  const columns: ResponsiveColumnDef<InteractionRecord & Record<string, unknown>>[] = createOptimizedColumns(
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
      },
      {
        accessorKey: "date",
        header: t("interactions.columns.date"),
        cell: ({ row }) => {
          const formattedDate = (row.original as TransformedInteractionRecord).formattedDate;
          return <span>{formattedDate || "--"}</span>;
        }
      },
      {
        accessorKey: "type",
        header: t("interactions.columns.type"),
        cell: ({ row }) => {
          const type = row.original.type;
          const typeColorClass = (row.original as TransformedInteractionRecord).typeColorClass;
          return (
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${typeColorClass}`}>
              {getTypeLabel(type)}
            </span>
          );
        }
      },
      {
        accessorKey: "name",
        header: t("interactions.columns.name"),
        cell: ({ row }) => <span>{row.original.name || "--"}</span>
      },
      {
        accessorKey: "personInvolved",
        header: t("interactions.columns.personInvolved"),
        accessorFn: (row: InteractionRecord) => (row as TransformedInteractionRecord).personInvolvedName, // Use pre-calculated value for filtering
        cell: ({ row }) => {
          const personInvolvedName = (row.original as TransformedInteractionRecord).personInvolvedName;
          return <span>{personInvolvedName}</span>;
        }
      },
      {
        accessorKey: "personConcerned",
        header: t("interactions.columns.personConcerned"),
        cell: ({ row }) => <span>{row.original.personConcerned || "--"}</span>
      },
      {
        accessorKey: "title",
        header: t("interactions.columns.title"),
        cell: ({ row }) => <span>{row.original.title || "--"}</span>
      },
      {
        accessorKey: "status",
        header: t("interactions.columns.status"),
        cell: ({ row }) => {
          const status = row.original.status;
          const statusColorClass = (row.original as TransformedInteractionRecord).statusColorClass;
          return (
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColorClass}`}>
              {getStatusLabel(status) || t('status.unknown')}
            </span>
          );
        }
      },
      {
        accessorKey: "daysPassed",
        header: t("interactions.columns.daysPassed"),
        accessorFn: (row: InteractionRecord) => (row as TransformedInteractionRecord).daysPassed || 0, // Use pre-calculated value for filtering
        cell: ({ row }) => {
          const transformedRow = row.original as TransformedInteractionRecord;
          const daysPassed = transformedRow.daysPassed;
          const priority = transformedRow.daysPassedPriority;

          if (daysPassed === undefined || daysPassed === 0) {
            return <span>--</span>;
          }

          const colorClass = priority === 'high'
            ? 'text-red-600 font-semibold'
            : priority === 'medium'
              ? 'text-yellow-600 font-medium'
              : 'text-green-600';

          return <span className={`font-mono ${colorClass}`}>{daysPassed}</span>;
        }
      },
      {
        accessorKey: "userInCharge",
        header: t("interactions.columns.userInCharge"),
        accessorFn: (row: InteractionRecord) => (row as TransformedInteractionRecord).userInChargeName, // Use pre-calculated value for filtering
        cell: ({ row }) => {
          const userInChargeName = (row.original as TransformedInteractionRecord).userInChargeName;
          return <span>{userInChargeName}</span>;
        }
      },
    ],
    [t, handleEdit, handleDelete, getTypeLabel, getStatusLabel],
    {
      debugName: "interaction-records-columns",
      enableLogging: process.env.NODE_ENV === "development",
    }
  );

  // Optimized search filter using pre-calculated search text + translated labels (EN/JA)
  const filterInteractions = useCallback((interactions: TransformedInteractionRecord[], query: string) => {
    const term = query.trim().toLowerCase();
    if (!term) return interactions;

    const translateBoth = (key: string): string[] => {
      if (!key) return [];
      const en = (t as any)(key, { lng: 'en' }) as string;
      const ja = (t as any)(key, { lng: 'ja' }) as string;
      const out: string[] = [];
      if (en && typeof en === 'string' && en !== key) out.push(en.toLowerCase());
      if (ja && typeof ja === 'string' && ja !== key && ja.toLowerCase() !== en?.toLowerCase()) out.push(ja.toLowerCase());
      return out;
    };

    const getTypeLabels = (type?: string | null): string[] => {
      if (!type) return [];
      const norm = String(type).toUpperCase();
      switch (norm) {
        case 'DISCUSSION':
          return translateBoth('interactions.types.DISCUSSION');
        case 'INTERVIEW':
          return translateBoth('interactions.types.INTERVIEW');
        case 'CONSULTATION':
          return translateBoth('interactions.types.CONSULTATION');
        case 'OTHER':
          return translateBoth('interactions.types.OTHER');
        default:
          return [];
      }
    };

    const getStatusLabels = (status?: string | null): string[] => {
      if (!status) return [];
      const s = String(status).toLowerCase();
      if (s === 'open') return translateBoth('interactions.open');
      if (s === 'in-progress' || s === 'in_progress') return translateBoth('interactions.inProgress');
      if (s === 'resolved') return translateBoth('interactions.resolved');
      return [];
    };

    const includes = (value?: string | number | null): boolean => {
      if (value === null || value === undefined) return false;
      return value.toString().toLowerCase().includes(term);
    };

    return interactions.filter(interaction => {
      // Use pre-calculated search text for better performance
      if ((interaction.searchText || '').includes(term)) return true;

      // Current-language labels
      if (includes(getTypeLabel(interaction.type))) return true;
      if (includes(getStatusLabel(interaction.status))) return true;

      // Cross-language labels
      if (getTypeLabels(interaction.type).some(v => v.includes(term))) return true;
      if (getStatusLabels(interaction.status).some(v => v.includes(term))) return true;

      return false;
    });
  }, [t, getTypeLabel, getStatusLabel]);

  // Immediate search effect
  useEffect(() => {
    const filtered = filterInteractions(transformedData, searchQuery);
    setFilteredData(filtered);
  }, [transformedData, searchQuery, filterInteractions]);

  const handleSearchChange = useCallback((query: string) => {
    setSearchQuery(query);
    // Reset pagination when search changes
    pagination.resetToFirstPage();
  }, [pagination]);

  // Handle row selection change
  const handleRowSelectionChange = useCallback(
    (selection: RowSelectionState) => {
      setSelectedRows(selection);
    },
    []
  );



  // Load form data
  const fetchFormData = useCallback(async () => {
    try {
      // Load available staff
      const staffResponse = await fetch('/api/interactions/available-staff');
      const staffResult = await staffResponse.json();
      if (staffResult.success) {
        setAvailableStaff(staffResult.data);
      }

      // Load available users
      const usersResponse = await fetch('/api/interactions/available-users');
      const usersResult = await usersResponse.json();
      if (usersResult.success) {
        setAvailableUsers(usersResult.data);
      }
    } catch (error) {
      console.error('Failed to fetch form data:', error);
    }
  }, []);

  // Initial fetch with proper AbortController cleanup
  useEffect(() => {
    const controller = new AbortController();

    const loadData = async () => {
      await fetchInteractions(controller.signal);
      await fetchFormData();
    };

    loadData();

    return () => {
      controller.abort();
    };
  }, [fetchInteractions, fetchFormData]);



  const handleAddNew = () => {
    setEditingRecord(null);
    setIsFormDialogOpen(true);
    setFormErrors([]);
  };

  const handleFormClose = useCallback(() => {
    setIsFormDialogOpen(false);
    setEditingRecord(null);
    setFormErrors([]);
  }, []);

  const handleFormSubmit = useCallback(async (data: Partial<InteractionRecord>) => {
    try {
      setFormLoading(true);
      setFormErrors([]);

      if (editingRecord) {
        // Update existing record
        const updateData = {
          type: data.type,
          date: data.date,
          description: data.description,
          status: data.status,
          name: data.name || undefined,
          title: data.title || undefined,
          personInvolvedStaffId: data.personInvolvedStaffId ? String(data.personInvolvedStaffId) : undefined,
          userInChargeId: data.userInChargeId || undefined,
          personConcerned: data.personConcerned || undefined,
          // Include communication method and response details in updates
          means: data.means || undefined,
          responseDetails: data.responseDetails || undefined,
        };
        await interactionService.updateInteraction(String(editingRecord.id), updateData);
      } else {
        // Create new record
        const createData = {
          type: data.type!,
          date: data.date!,
          description: data.description!,
          status: (data.status as InteractionStatus) || 'OPEN',
          name: data.name || undefined,
          title: data.title || undefined,
          personInvolvedStaffId: data.personInvolvedStaffId ? String(data.personInvolvedStaffId) : undefined,
          userInChargeId: data.userInChargeId || undefined,
          personConcerned: data.personConcerned || undefined,
          // Include communication method and response details on create
          means: data.means || undefined,
          responseDetails: data.responseDetails || undefined,
          createdBy: 1, // This should come from auth context - using admin user ID for now
        };
        await interactionService.createInteraction(createData);
      }

      setIsFormDialogOpen(false);
      setEditingRecord(null);
      fetchInteractions();
    } catch (error) {
      setFormErrors([{
        message: error instanceof Error ? error.message : 'Failed to save record'
      }]);
    } finally {
      setFormLoading(false);
    }
  }, [editingRecord, fetchInteractions]);



  return (
    <div className="space-y-4 pb-20 md:pb-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <BackButton onBack={() => navigate('/complaint-details')} />
          <h1 className="text-2xl md:text-3xl font-bold text-secondary-900">
            {t('interactions.management')}
          </h1>
        </div>
      </div>


      {/* Controls with inline Search */}
      <div className="flex items-center gap-2 justify-between">
        <div className="flex items-center space-x-4">
          <ViewModeToggle mode={viewMode} onChange={setViewMode} />
        </div>

        <MobileAwareSearchSection pageName="interactions" className="flex-1">
          <Card className="search-component-spacing">
            <CardContent className="p-2">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-secondary-400" />
                  <Input
                    placeholder={t('interactions.searchPlaceholder')}
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
                  aria-label="Search interactions"
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
            disabled={selectedInteractionIds.length === 0}
            size="sm"
            viewMode={viewMode}
            count={selectedInteractionIds.length}
            className={selectedInteractionIds.length === 0 ? "opacity-50" : ""}
          />
          <MobileAwareButton
            variant="new"
            onClick={handleAddNew}
            size="sm"
            viewMode={viewMode}
          />
        </div>
      </div>

      {/* Interaction List - Conditional rendering with smooth transitions */}
      <div className="transition-all duration-300 ease-in-out">
        {viewMode === 'table' ? (
          <div>
            <LazyDataTable
              key={`interaction-records-table-${t('interactions.columns.type')}`}
              columns={columns}
              data={filteredData as (InteractionRecord & Record<string, unknown>)[]}
              loading={loading}
              error={error}
              totalCount={data.length}
              enableColumnFiltering={true}
              tableName="interaction_records"
              searchQuery={searchQuery}
              showScrollButtons={true}
              onRowClick={(row: InteractionRecord) => handleRowClick(row)}
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
                  <CardSkeleton key={index} variant="interaction" />
                ))
              ) : filteredData.length === 0 ? (
                <div className="col-span-full text-center py-8 text-muted-foreground">
                  {data.length === 0
                    ? 'No interactions found'
                    : searchQuery.trim()
                      ? 'No interactions match your search'
                      : 'No interactions found'
                  }
                </div>
              ) : (
                pagination.getPaginatedData(filteredData).map((record) => (
                  <LazyInteractionCard
                    key={record.id}
                    record={record}
                    onClick={handleCardClick}
                    getTypeLabel={getTypeLabel}
                    getStatusLabel={getStatusLabel}
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
          <div className="text-sm text-muted-foreground">Loading...</div>
        </div>
      )}

      {/* Error state */}
      {error && (
        <div className="text-sm text-red-600 bg-red-50 p-3 rounded border border-red-200">
          {error}
          <Button onClick={() => fetchInteractions()} className="mt-2 ml-2" size="sm">
            Retry
          </Button>
        </div>
      )}

      {/* Empty states */}
      {!loading && !error && data.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          No interactions found
        </div>
      )}
      {!loading && !error && data.length > 0 && filteredData.length === 0 && searchQuery.trim() && (
        <div className="text-center py-8 text-muted-foreground">
          No interactions match your search
        </div>
      )}

      {/* Interaction Detail Dialog */}
      <InteractionDetailDialog
        isOpen={showDetailDialog}
        onClose={() => setShowDetailDialog(false)}
        record={selectedRecord}
        onEdit={handleEdit}
        onDelete={handleDelete}
        getTypeLabel={getTypeLabel}
        getStatusLabel={getStatusLabel}
      />

      {/* Interaction Form Dialog */}
      <InteractionFormDialog
        isOpen={isFormDialogOpen}
        onClose={handleFormClose}
        record={editingRecord}
        onSubmit={handleFormSubmit}
        isLoading={formLoading}
        errors={formErrors}
        availableStaff={availableStaff}
        availableUsers={availableUsers}
      />

    </div>
  );
};
