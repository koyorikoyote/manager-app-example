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
import { Company } from '../../../shared/types';

import { companyService } from '../../services/companyService';
import { type ResponsiveColumnDef, ColumnPriority } from '../../utils/columnHelpers';
import type { RowSelectionState, Row, SortingState } from '@tanstack/react-table';
import { createOptimizedColumns } from '../../utils/optimizedColumnHelpers';
import { useMemoizedDataTransform } from '../../utils/memoizationUtils';

const LazyDataTable = createLazyComponent(
    () => import('../ui/DataTable').then(module => ({ default: module.DataTable })),
    'DataTable'
);
const LazyCompanyCard = createLazyComponent(
    () => import('../ui/CompanyCard').then(module => ({ default: module.CompanyCard })),
    'CompanyCard'
);



export const DestinationList: React.FC = () => {
    const { t } = useLanguage();
    const navigate = useNavigate();
    const isGlassBlue = useGlassBlue();
    const { dialogState, isLoading: isDialogLoading, showConfirmDialog, hideConfirmDialog, handleConfirm } = useConfirmDialog();
    const { navigateToDetail, navigateToNew } = useResponsiveNavigation();

    // Simple state management (following Sales Assistant pattern)
    const [data, setData] = useState<Company[]>([]);
    const [filteredData, setFilteredData] = useState<Company[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState<string>("");
    const { viewMode, setViewMode } = useViewMode('destinations');

    // Preload active view to disable lazy loading for it; keep inactive view lazy
    useEffect(() => {
        if (viewMode === 'table') {
            preloadComponent(
                () => import('../ui/DataTable').then(module => ({ default: module.DataTable })),
                'DataTable'
            );
        } else {
            preloadComponent(
                () => import('../ui/CompanyCard').then(module => ({ default: module.CompanyCard })),
                'CompanyCard'
            );
        }
    }, [viewMode]);
    const [selectedRows, setSelectedRows] = useState<RowSelectionState>({});
    const [sorting, setSorting] = useState<SortingState>(() => [{ id: 'companyId', desc: true }]);

    // Pagination for Cards view
    const pagination = usePagination({
        totalItems: filteredData.length,
        initialItemsPerPage: 10,
    });

    // Destructure stable callback to avoid effect dependency on whole object
    const { resetToFirstPage } = pagination;

    // Memoized helper functions for calculated fields
    const getStatusText = useCallback((status: string) => {
        switch (status) {
            case 'active':
                return t('destinations.active');
            case 'inactive':
                return t('destinations.inactive');
            case 'suspended':
                return t('destinations.suspended');
            default:
                return t('status.unknown');
        }
    }, [t]);

    const getStatusColorClass = useCallback((status: string) => {
        switch (status) {
            case 'active':
                return 'bg-green-100 text-green-800';
            case 'inactive':
                return 'bg-gray-100 text-gray-800';
            case 'suspended':
                return 'bg-red-100 text-red-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    }, []);

    const calculateHiringVacancyStatus = useCallback((vacancies: number | null | undefined) => {
        const count = vacancies || 0;
        if (count === 0) return { text: t('destinations.noVacancies'), colorClass: 'text-gray-500' };
        if (count <= 5) return { text: `${count}` + t('destinations.someVacancies'), colorClass: 'text-blue-600 font-semibold' };
        return { text: `${count}` + t('destinations.manyVacancies'), colorClass: 'text-green-600 font-semibold' };
    }, [t]);

    // Memoized data transformation with calculated fields
    const transformedData = useMemoizedDataTransform(
        (companies: Company[]) => companies.map(company => ({
            ...company,
            // Pre-calculate status color class for better performance
            statusColorClass: getStatusColorClass(company.status),
            // Pre-calculate hiring vacancy status
            hiringVacancyStatus: calculateHiringVacancyStatus(company.hiringVacancies),
            // Pre-calculate user in charge name for filtering/sorting
            userInChargeName: company.userInCharge?.name || "--",
        })),
        data,
        [getStatusColorClass, calculateHiringVacancyStatus],
        {
            debugName: "destination-data-transform",
            enableLogging: process.env.NODE_ENV === "development",
        }
    );

    // Memoized columns definition with performance optimization
    const columns: ResponsiveColumnDef<Company & Record<string, unknown>>[] = createOptimizedColumns(
        () => [
            {
                id: "select",
                header: ({ table }: { table: any }) => (
                    <Checkbox
                        checked={
                            table.getIsAllPageRowsSelected() ||
                            (table.getIsSomePageRowsSelected() && "indeterminate")
                        }
                        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
                    />
                ),
                cell: ({ row }: { row: Row<Company & Record<string, unknown>> }) => (
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
                accessorKey: "companyId",
                header: t('company.companyId'),
                priority: ColumnPriority.HIGH,
                cell: ({ row }) => <span>{row.original.companyId || "--"}</span>,
            },
            {
                accessorKey: "name",
                header: t('company.companyName'),
                priority: ColumnPriority.ESSENTIAL,
                cell: ({ row }) => (
                    <button
                        onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            // Direct navigation without going through hook
                            const url = `/destinations/${row.original.id}?openedInNewTab=true`;
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
                sortingFn: (rowA: any, rowB: any) => {
                    const a = rowA.original.name || "";
                    const b = rowB.original.name || "";
                    return a.localeCompare(b);
                }
            },
            {
                accessorKey: "address",
                header: t('company.address'),
                priority: ColumnPriority.HIGH,
                cell: ({ row }) => <span>{row.original.address || "--"}</span>
            },
            {
                accessorKey: "industry",
                header: t('company.industry'),
                priority: ColumnPriority.HIGH,
                cell: ({ row }) => {
                    const industry = row.original.industry;
                    if (!industry) return <span>--</span>;

                    // Try several candidate keys to match translation entries (handles different enum casings)
                    const buildCandidates = (val?: string) => {
                        if (!val) return [];
                        const raw = String(val).trim();
                        const lower = raw.toLowerCase();
                        const upper = raw.toUpperCase();
                        const snake = lower.replace(/[\s-]+/g, '_').replace(/[^a-z0-9_]/gi, '');
                        const parts = snake.split('_').filter(Boolean);
                        const camel = parts.length > 0 ? parts[0] + parts.slice(1).map(p => p.charAt(0).toUpperCase() + p.slice(1)).join('') : lower;
                        const compact = lower.replace(/[\s_-]+/g, '');
                        return Array.from(new Set([raw, lower, upper, snake, camel, compact]));
                    };

                    const candidates = buildCandidates(industry);
                    let localized: string | undefined;
                    for (const c of candidates) {
                        const key = `destinations.${c}`;
                        const translated = (t as any)(key);
                        if (typeof translated === 'string' && translated !== key) {
                            localized = translated;
                            break;
                        }
                    }

                    // last resort: try top-level company industry key
                    if (!localized) {
                        const fallbackKey = `company.industry`;
                        const fallback = (t as any)(fallbackKey);
                        localized = fallback && fallback !== fallbackKey ? fallback : industry;
                    }

                    return <span>{localized}</span>;
                }
            },
            {
                accessorKey: "contactPerson",
                header: t("destinations.contactPerson"),
                priority: ColumnPriority.HIGH,
                cell: ({ row }) => <span>{row.original.contactPerson || "--"}</span>
            },
            {
                accessorKey: "hiringVacancies",
                header: t("destinations.hiringVacancies"),
                priority: ColumnPriority.MEDIUM,
                cell: ({ row }) => {
                    const vacancyStatus = (row.original as any).hiringVacancyStatus;
                    return (
                        <span className={vacancyStatus?.colorClass || 'text-gray-500'}>
                            {vacancyStatus?.text || (t as any)('destinations.noVacancies')}
                        </span>
                    );
                }
            },
            {
                accessorKey: "preferredNationality",
                header: t("destinations.preferredNationality"),
                priority: ColumnPriority.LOW,
                cell: ({ row }) => {
                    const value = row.original.preferredNationality;
                    if (!value) return <span>--</span>;
                    const key = `destinations.preferredNationalityType.${String(value).toLowerCase().replace(/\s+/g, "")}`;
                    const translated = (t as any)(key) as string;
                    const display = typeof translated === 'string' && translated !== key ? translated : value;
                    return <span>{display}</span>;
                }
            },
            {
                accessorKey: "status",
                header: t('company.status'),
                priority: ColumnPriority.ESSENTIAL,
                cell: ({ row }) => {
                    const status = row.original.status;
                    const statusColorClass = (row.original as any).statusColorClass || 'bg-gray-100 text-gray-800';
                    return (
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColorClass}`}>
                            {getStatusText(status || '')}
                        </span>
                    );
                }
            },
            {
                accessorKey: "phone",
                header: t('company.phone'),
                priority: ColumnPriority.LOW,
                cell: ({ row }) => <span>{row.original.phone || "--"}</span>
            },
            {
                accessorKey: "userInCharge",
                header: t("destinations.userInCharge"),
                priority: ColumnPriority.MEDIUM,
                accessorFn: (row: Company) => (row as any).userInChargeName || "--",
                cell: ({ row }) => <span>{(row.original as any).userInChargeName || "--"}</span>,
            },
        ],
        [navigate, t, getStatusText],
        {
            debugName: "destination-columns",
            enableLogging: process.env.NODE_ENV === "development",
        }
    );

    // Memoized search filter with performance optimization (supports translated labels EN/JA)
    const filterCompanies = useCallback((companies: Company[], query: string) => {
        const term = query.trim().toLowerCase();
        if (!term) return companies;

        const translateBoth = (key: string): string[] => {
            if (!key) return [];
            const en = (t as any)(key, { lng: 'en' }) as string;
            const ja = (t as any)(key, { lng: 'ja' }) as string;
            const out: string[] = [];
            if (en && typeof en === 'string' && en !== key) out.push(en.toLowerCase());
            if (ja && typeof ja === 'string' && ja !== key && ja.toLowerCase() !== en?.toLowerCase()) out.push(ja.toLowerCase());
            return out;
        };

        const buildCandidates = (val?: string) => {
            if (!val) return [] as string[];
            const raw = String(val).trim();
            const lower = raw.toLowerCase();
            const upper = raw.toUpperCase();
            const snake = lower.replace(/[\s-]+/g, '_').replace(/[^a-z0-9_]/gi, '');
            const parts = snake.split('_').filter(Boolean);
            const camel = parts.length > 0 ? parts[0] + parts.slice(1).map(p => p.charAt(0).toUpperCase() + p.slice(1)).join('') : lower;
            const compact = lower.replace(/[\s_-]+/g, '');
            return Array.from(new Set([raw, lower, upper, snake, camel, compact]));
        };

        const getIndustryLabels = (industry?: string): string[] => {
            if (!industry) return [];
            const candidates = buildCandidates(industry).map(c => `destinations.${c}`);
            const labels: string[] = [];
            for (const key of candidates) {
                for (const v of translateBoth(key)) {
                    if (!labels.includes(v)) labels.push(v);
                }
            }
            // Generic fallback
            for (const v of translateBoth('company.industry')) {
                if (!labels.includes(v)) labels.push(v);
            }
            return labels;
        };

        const getStatusLabels = (status?: string): string[] => {
            if (!status) return [];
            const s = String(status).toLowerCase();
            if (s === 'active') return translateBoth('destinations.active');
            if (s === 'inactive') return translateBoth('destinations.inactive');
            if (s === 'suspended') return translateBoth('destinations.suspended');
            return [];
        };

        const includes = (value?: string | number | null): boolean => {
            if (value === null || value === undefined) return false;
            return value.toString().toLowerCase().includes(term);
        };

        return companies.filter(company =>
            // Raw fields
            includes(company.name) ||
            includes(company.companyId) ||
            includes(company.address) ||
            includes(company.industry) ||
            includes(company.phone) ||
            includes(company.email) ||
            includes(company.status) ||
            includes(company.contactPerson) ||
            includes(company.preferredNationality) ||
            includes(company.userInCharge?.name) ||
            includes(company.hiringVacancies?.toString() || '0') ||
            // Translated labels
            getIndustryLabels(company.industry).some(v => v.includes(term)) ||
            getStatusLabels(company.status).some(v => v.includes(term))
        );
    }, [t]);

    // Immediate search effect using transformed data
    useEffect(() => {
        const filtered = filterCompanies(transformedData, searchQuery);
        setFilteredData(filtered);
    }, [transformedData, searchQuery, filterCompanies]);

    // Reset pagination only when search query or dataset size changes
    useEffect(() => {
        resetToFirstPage();
    }, [searchQuery, transformedData.length, resetToFirstPage]);

    const handleSearchChange = useCallback((query: string) => {
        setSearchQuery(query);
    }, []);

    // Enhanced fetch function with AbortController for proper request cancellation
    const fetchCompanies = useCallback(async (signal?: AbortSignal) => {
        try {
            setLoading(true);
            setError(null);

            const result = await companyService.getAllCompanies(signal);

            // Only update state if request wasn't cancelled
            if (!signal?.aborted) {
                setData(result);
            }
        } catch (error) {
            // Only set error if component is still mounted and request wasn't cancelled
            if (!signal?.aborted && error instanceof Error && error.name !== 'AbortError') {
                console.error('Failed to fetch companies:', error);
                setError('Failed to fetch companies');
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
            await fetchCompanies(controller.signal);
        };

        loadData();

        return () => {
            controller.abort();
        };
    }, [fetchCompanies]);

    // Listen for cross-tab refresh events (when records are deleted from other tabs)
    useCrossTabRefresh('destination', () => fetchCompanies());


    const handleCompanyClick = (company: Company) => {
        navigateToDetail(company.id.toString(), 'destination');
    };

    const handleNewDestination = () => {
        navigateToNew('destination');
    };

    // Handle row selection change
    const handleRowSelectionChange = useCallback((selection: RowSelectionState) => {
        setSelectedRows(selection);
    }, []);

    // Get selected company IDs
    const selectedCompanyIds = useMemo(() => {
        return Object.keys(selectedRows)
            .filter(key => selectedRows[key])
            .map(key => filteredData[parseInt(key)]?.id)
            .filter(Boolean) as number[];
    }, [selectedRows, filteredData]);

    // Handle bulk delete
    const handleBulkDelete = useCallback(async () => {
        if (selectedCompanyIds.length === 0) {
            return;
        }

        showConfirmDialog({
            title: t('common.actions.delete'),
            message: t('common.feedback.bulkDeleteConfirm', { count: selectedCompanyIds.length }),
            variant: 'destructive',
            confirmText: t('common.actions.delete'),
            cancelText: t('common.actions.cancel'),
            onConfirm: async () => {
                await companyService.bulkDeleteCompanies(selectedCompanyIds);
                // Clear selection and refresh data
                setSelectedRows({});
                fetchCompanies();
            },
        });
    }, [selectedCompanyIds, t, fetchCompanies, showConfirmDialog]);
    return (
        <div className="space-y-4 pb-20 md:pb-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                    <BackButton onBack={() => navigate('/complaint-details')} />
                    <h1 className="text-2xl md:text-3xl font-bold text-secondary-900">
                        {t('destinations.title')}
                    </h1>
                </div>
            </div>


            {/* Controls with inline Search */}
            <div className="flex items-center gap-2 justify-between">
                <div className="flex items-center space-x-4">
                    <ViewModeToggle mode={viewMode} onChange={setViewMode} />
                </div>

                <MobileAwareSearchSection pageName="destinations" className="flex-1">
                    <Card className="search-component-spacing">
                        <CardContent className="p-2">
                            <div className="flex gap-2">
                                <div className="relative flex-1">
                                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-secondary-400" />
                                    <Input
                                        placeholder={t('destinations.searchPlaceholder')}
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
                                    aria-label="Search destinations"
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
                        disabled={selectedCompanyIds.length === 0}
                        size="sm"
                        viewMode={viewMode}
                        count={selectedCompanyIds.length}
                        className={selectedCompanyIds.length === 0 ? 'opacity-50' : ''}
                    />
                    <MobileAwareButton
                        variant="new"
                        onClick={handleNewDestination}
                        size="sm"
                        viewMode={viewMode}
                    />
                </div>
            </div>

            {/* Company List - Conditional rendering with smooth transitions */}
            <div className="transition-all duration-300 ease-in-out">
                {viewMode === 'table' ? (
                    <div>
                        <LazyDataTable
                            columns={columns}
                            data={filteredData as (Company & Record<string, unknown>)[]}
                            loading={loading}
                            error={error}
                            totalCount={transformedData.length}
                            enableColumnFiltering={true}
                            tableName="destinations" externalSorting={{ sorting, onSortingChange: setSorting }}
                            searchQuery={searchQuery}
                            enableRowSelection={true}
                            rowSelectionMode="multiple"
                            rowSelection={selectedRows}
                            onRowSelectionChange={handleRowSelectionChange}
                            onRowClick={handleCompanyClick}
                        />
                    </div>
                ) : (
                    <div>
                        {/* Responsive card grid layout */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
                            {loading ? (
                                Array.from({ length: pagination.itemsPerPage }).map((_, index) => (
                                    <CardSkeleton key={index} variant="company" />
                                ))
                            ) : filteredData.length === 0 ? (
                                <div className="col-span-full text-center py-8 text-muted-foreground">
                                    {transformedData.length === 0
                                        ? t('destinations.noCompaniesFound')
                                        : searchQuery.trim()
                                            ? t('destinations.adjustSearchCriteria')
                                            : t('destinations.noCompaniesFound')
                                    }
                                </div>
                            ) : (
                                pagination.getPaginatedData(filteredData).map((company: Company) => (
                                    <LazyCompanyCard
                                        key={company.id}
                                        company={company}
                                        onClick={handleCompanyClick}
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
                    <div className="text-sm text-muted-foreground">{t('destinations.loading')}</div>
                </div>
            )}

            {/* Error state */}
            {error && (
                <div className="text-sm text-red-600 bg-red-50 p-3 rounded border border-red-200">
                    {error}
                    <Button onClick={() => fetchCompanies()} className="mt-2 ml-2" size="sm">
                        {t('common.actions.retry')}
                    </Button>
                </div>
            )}

            {/* Empty states */}
            {!loading && !error && transformedData.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                    {t('destinations.noCompaniesFound')}
                </div>
            )}
            {!loading && !error && transformedData.length > 0 && filteredData.length === 0 && searchQuery.trim() && (
                <div className="text-center py-8 text-muted-foreground">
                    {t('destinations.adjustSearchCriteria')}
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
