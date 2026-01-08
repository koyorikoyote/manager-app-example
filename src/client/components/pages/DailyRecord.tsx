import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Calendar, Search } from "lucide-react";
import { Card, CardContent } from "../ui/Card";
import { Button } from "../ui/Button";
import { MobileAwareButton } from "../ui/MobileAwareButton";
import { BackButton } from "../ui/BackButton";
import { Input } from "../ui/Input";
import { createLazyComponent, preloadComponent } from "../../utils/lazyLoading";
import { ViewModeToggle } from "../ui/ViewModeToggle";
import { CardSkeleton } from "../ui/CardSkeleton";
import { CardsPagination } from "../ui/CardsPagination";
import { ConfirmDialog } from "../ui/Dialog";
import { MobileAwareSearchSection } from "../ui/MobileAwareSearchSection";
import { DailyRecordDetailDialog } from "../ui/DailyRecordDetailDialog";
import { DailyRecordFormDialog } from "../ui/DailyRecordFormDialog";
import { useLanguage } from "../../contexts/LanguageContext";
import { useGlassBlue } from "../../hooks/useGlassBlue";
import { useConfirmDialog } from "../../hooks/useConfirmDialog";
import { useViewMode } from "../../hooks/useViewMode";
import { usePagination } from "../../hooks/usePagination";
import { useDailyRecords } from "../../hooks/useDailyRecords";
import { useInitialDataForRoute } from "../../contexts/SSRDataContext";

import {
  createDailyRecordColumns,
  transformDailyRecordListForTable,
  type DailyRecordTableData,
} from "../tables/dailyRecordColumns";
import type { DailyRecordWithRelations } from "../../../shared/types";
import type { RowSelectionState } from "@tanstack/react-table";
import { dailyRecordService } from "../../services/dailyRecordService";
import { staffService } from "../../services/staffService";
import { formatDateForInput } from "../../utils/dateUtils";

const LazyDataTable = createLazyComponent(
  () => import("../ui/DataTable").then(module => ({ default: module.DataTable })),
  "DataTable"
);
const LazyDailyRecordCard = createLazyComponent(
  () => import("../ui/DailyRecordCard").then(module => ({ default: module.DailyRecordCard })),
  "DailyRecordCard"
);

export const DailyRecord: React.FC = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const isGlassBlue = useGlassBlue();
  const {
    dialogState,
    isLoading: isDialogLoading,
    showConfirmDialog,
    hideConfirmDialog,
    handleConfirm,
  } = useConfirmDialog();

  // Dialog states
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [isFormDialogOpen, setIsFormDialogOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] =
    useState<DailyRecordWithRelations | null>(null);
  const [editingRecord, setEditingRecord] =
    useState<DailyRecordWithRelations | null>(null);
  const [availableStaff, setAvailableStaff] = useState<
    Array<{ id: number; name: string; employeeId: string | null }>
  >([]);

  const [searchTerm, setSearchTerm] = useState<string>("");
  const [selectedRows, setSelectedRows] = useState<RowSelectionState>({});

  // Get initial data from SSR context
  const initialData = useInitialDataForRoute("daily-record");

  // Simple state management for local filtering
  const [data, setData] = useState<DailyRecordWithRelations[]>([]);
  const [filteredData, setFilteredData] = useState<DailyRecordWithRelations[]>(
    []
  );

  // View mode and pagination for card view
  const { viewMode, setViewMode } = useViewMode("daily-record");

  // Preload the active view (disable lazy for active, keep inactive view lazy)
  useEffect(() => {
    if (viewMode === "table") {
      preloadComponent(
        () => import("../ui/DataTable").then(module => ({ default: module.DataTable })),
        "DataTable"
      );
    } else {
      preloadComponent(
        () => import("../ui/DailyRecordCard").then(module => ({ default: module.DailyRecordCard })),
        "DailyRecordCard"
      );
    }
  }, [viewMode]);
  const pagination = usePagination({
    totalItems: filteredData.length,
    initialItemsPerPage: 10,
  });

  const { dailyRecords, loading, error, refetch } = useDailyRecords(
    {
      page: 1,
      limit: 1000, // Fetch all records for client-side pagination
    },
    {
      // Pass initial data to avoid duplicate requests
      initialDailyRecords: initialData?.dailyRecords || [],
      initialTotal: initialData?.total || 0,
    }
  );

  // Enhanced search filter including major data columns
  const filterDailyRecords = useCallback(
    (records: DailyRecordWithRelations[], query: string) => {
      if (!query.trim()) {
        return records;
      }

      const searchTerm = query.toLowerCase();
      return records.filter(
        (record) =>
          record.staff?.name?.toLowerCase().includes(searchTerm) ||
          record.conditionStatus?.toLowerCase().includes(searchTerm) ||
          record.feedbackContent?.toLowerCase().includes(searchTerm) ||
          record.contactNumber?.toLowerCase().includes(searchTerm) ||
          (record.dateOfRecord &&
            formatDateForInput(record.dateOfRecord as Date | string | null | undefined)
              .replace(/-/g, "/")
              .toLowerCase()
              .includes(searchTerm))
      );
    },
    []
  );

  // Update data when dailyRecords change
  useEffect(() => {
    setData(dailyRecords);
  }, [dailyRecords]);

  // Immediate search effect
  useEffect(() => {
    const filtered = filterDailyRecords(data, searchTerm);
    setFilteredData(filtered);
  }, [data, searchTerm, filterDailyRecords]);

  const handleSearch = (value: string) => {
    setSearchTerm(value);
    // Reset pagination when search changes
    pagination.resetToFirstPage();
  };

  const handleSearchConfirm = (value: string) => {
    setSearchTerm(value);
    // Reset pagination when search changes
    pagination.resetToFirstPage();
  };

  // Load available staff for form
  useEffect(() => {
    const loadAvailableStaff = async () => {
      try {
        const staff = await staffService.getAllStaff();
        setAvailableStaff(
          staff.map((s) => ({
            id: s.id,
            name: s.name,
            employeeId: s.employeeId ?? null,
          }))
        );
      } catch (error) {
        console.error("Failed to load available staff:", error);
      }
    };

    loadAvailableStaff();
  }, []);

  // Dialog handlers
  const handleOpenDetail = useCallback(
    (dailyRecord: DailyRecordWithRelations) => {
      setSelectedRecord(dailyRecord);
      setIsDetailDialogOpen(true);
    },
    []
  );

  const handleCloseDetail = useCallback(() => {
    setIsDetailDialogOpen(false);
    setSelectedRecord(null);
  }, []);

  const handleOpenForm = useCallback(
    (dailyRecord?: DailyRecordWithRelations) => {
      setEditingRecord(dailyRecord || null);
      setIsFormDialogOpen(true);
    },
    []
  );

  const handleCloseForm = useCallback(() => {
    setIsFormDialogOpen(false);
    setEditingRecord(null);
  }, []);

  const handleEdit = useCallback(
    (dailyRecord: DailyRecordWithRelations) => {
      handleCloseDetail();
      handleOpenForm(dailyRecord);
    },
    [handleCloseDetail, handleOpenForm]
  );

  const handleDelete = useCallback(
    async (id: string) => {
      showConfirmDialog({
        title: t("common.actions.delete"),
        message: "Are you sure you want to delete this daily record?",
        variant: "destructive",
        confirmText: t("common.actions.delete"),
        cancelText: t("common.actions.cancel"),
        onConfirm: async () => {
          await dailyRecordService.bulkDelete([parseInt(id)]);
          refetch();
          handleCloseDetail();
        },
      });
    },
    [t, refetch, showConfirmDialog, handleCloseDetail]
  );

  const handleSubmit = useCallback(
    async (data: Partial<DailyRecordWithRelations>) => {
      if (editingRecord) {
        await dailyRecordService.update(editingRecord.id, data);
      } else {
        await dailyRecordService.create(
          data as Omit<
            DailyRecordWithRelations,
            "id" | "createdAt" | "updatedAt"
          >
        );
      }
      refetch();
      handleCloseForm();
    },
    [editingRecord, refetch, handleCloseForm]
  );

  const handleTableRowClick = useCallback(
    (dailyRecordData: DailyRecordTableData) => {
      const dailyRecord = filteredData.find((d) => d.id === dailyRecordData.id);
      if (dailyRecord) {
        handleOpenDetail(dailyRecord);
      }
    },
    [filteredData, handleOpenDetail]
  );

  // Handle card click to open detail dialog
  const handleDailyRecordClick = useCallback(
    (dailyRecord: DailyRecordWithRelations) => {
      handleOpenDetail(dailyRecord);
    },
    [handleOpenDetail]
  );

  // Create table columns with navigation handler
  const columns = useMemo(
    () => createDailyRecordColumns(handleTableRowClick, t, true),
    [handleTableRowClick, t]
  );

  // Transform daily record data for table display (use filtered data)
  const tableData = useMemo(
    () => transformDailyRecordListForTable(filteredData),
    [filteredData]
  );

  // Check if filters are active
  const filtersActive = false; // No filters in this simplified version

  const handleClearFilters = useCallback(() => {
    // No filters to clear in this simplified version
  }, []);

  // Handle row selection change
  const handleRowSelectionChange = useCallback(
    (selection: RowSelectionState) => {
      setSelectedRows(selection);
    },
    []
  );

  // Get selected daily record IDs
  const selectedDailyRecordIds = useMemo(() => {
    return Object.keys(selectedRows)
      .filter((key) => selectedRows[key])
      .map((key) => tableData[parseInt(key)]?.id)
      .filter(Boolean) as number[];
  }, [selectedRows, tableData]);

  // Handle bulk delete
  const handleBulkDelete = useCallback(async () => {
    if (selectedDailyRecordIds.length === 0) {
      return;
    }

    showConfirmDialog({
      title: t("common.actions.delete"),
      message: t("common.feedback.bulkDeleteConfirm", {
        count: selectedDailyRecordIds.length,
      }),
      variant: "destructive",
      confirmText: t("common.actions.delete"),
      cancelText: t("common.actions.cancel"),
      onConfirm: async () => {
        try {
          await dailyRecordService.bulkDelete(selectedDailyRecordIds);
          // Clear selection and refresh data
          setSelectedRows({});
          refetch();
        } catch (error) {
          console.error('Bulk delete error:', error);
        }
      },
    });
  }, [selectedDailyRecordIds, t, refetch, showConfirmDialog]);

  if (error) {
    return (
      <div className="space-y-6 pb-20 md:pb-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl md:text-3xl font-bold text-secondary-900">
            {t("dailyRecord.title")}
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
    <div className="space-y-6 pb-20 md:pb-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <BackButton onBack={() => navigate("/complaint-details")} />
          <h1 className="text-2xl md:text-3xl font-bold text-secondary-900">
            {t("dailyRecord.title")}
          </h1>
        </div>
      </div>


      {/* Controls with inline Search */}
      <div className="flex items-center gap-2 justify-between">
        <div className="flex items-center space-x-4">
          <ViewModeToggle mode={viewMode} onChange={setViewMode} />
        </div>

        <MobileAwareSearchSection pageName="daily-record" className="flex-1">
          <Card className="search-component-spacing">
            <CardContent className="p-2">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-secondary-400" />
                  <Input
                    placeholder={t("dailyRecord.searchPlaceholder")}
                    value={searchTerm}
                    onChange={(e) => handleSearch(e.target.value)}
                    onKeyDown={(e) =>
                      e.key === "Enter" && handleSearchConfirm(searchTerm)
                    }
                    className="pl-10"
                    size="compact"
                  />
                </div>
                <Button
                  onClick={() => handleSearchConfirm(searchTerm)}
                  size="sm"
                  className={isGlassBlue ? 'glass-blue-search-button' : ''}
                  aria-label="Search daily records"
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
            disabled={selectedDailyRecordIds.length === 0}
            size="sm"
            viewMode={viewMode}
            count={selectedDailyRecordIds.length}
            className={selectedDailyRecordIds.length === 0 ? "opacity-50" : ""}
          />
          <MobileAwareButton
            variant="new"
            onClick={() => handleOpenForm()}
            size="sm"
            viewMode={viewMode}
          />
        </div>
      </div>

      {/* Daily Record List - Conditional rendering with smooth transitions */}
      <div className="transition-all duration-300 ease-in-out">
        {viewMode === "table" ? (
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
                  ? t("common.emptyStates.adjustFilters")
                  : t("common.emptyStates.startByAdding")
              }
              onClearFilters={handleClearFilters}
              hasActiveFilters={filtersActive}
              totalCount={data.length}
              enableColumnFiltering={true}
              tableName="daily_record"
              showScrollButtons={true}
              resultsSummary={t("common.pagination.showing", {
                current: filteredData.length,
                total: data.length,
              })}
              loadingText={t("dailyRecord.loading")}
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
                Array.from({ length: pagination.itemsPerPage }).map(
                  (_, index) => (
                    <CardSkeleton key={index} variant="dailyRecord" />
                  )
                )
              ) : error ? (
                <div className="col-span-full text-sm text-red-600 bg-red-50 p-3 rounded border border-red-200">
                  {error}
                  <Button onClick={refetch} className="mt-2 ml-2" size="sm">
                    {t("common.actions.retry")}
                  </Button>
                </div>
              ) : filteredData.length === 0 ? (
                <div className="col-span-full text-center py-8 text-muted-foreground">
                  {data.length === 0
                    ? t("dailyRecord.noDailyRecordsFound")
                    : searchTerm.trim()
                      ? t("dailyRecord.adjustSearchCriteria")
                      : t("dailyRecord.noDailyRecordsFound")}
                </div>
              ) : (
                pagination
                  .getPaginatedData(filteredData)
                  .map((dailyRecord: DailyRecordWithRelations) => (
                    <LazyDailyRecordCard
                      key={dailyRecord.id}
                      dailyRecord={dailyRecord}
                      onClick={handleDailyRecordClick}
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
      {!loading && data.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <Calendar className="h-12 w-12 text-secondary-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-secondary-900 mb-2">
              {t("dailyRecord.noDailyRecordsFound")}
            </h3>
            <p className="text-secondary-600 mb-4">
              {filtersActive
                ? t("dailyRecord.adjustSearchCriteria")
                : t("dailyRecord.getStartedMessage")}
            </p>
          </CardContent>
        </Card>
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

      {/* Daily Record Detail Dialog */}
      <DailyRecordDetailDialog
        isOpen={isDetailDialogOpen}
        onClose={handleCloseDetail}
        record={selectedRecord}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />

      {/* Daily Record Form Dialog */}
      <DailyRecordFormDialog
        isOpen={isFormDialogOpen}
        onClose={handleCloseForm}
        record={editingRecord}
        onSubmit={handleSubmit}
        availableStaff={availableStaff}
      />
    </div>
  );
};
