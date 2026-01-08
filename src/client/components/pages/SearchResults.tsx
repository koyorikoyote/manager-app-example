import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Search, X, Edit, Trash2, Eye, AlertTriangle, RefreshCw, WifiOff, MessageSquare, Calendar, FileText } from 'lucide-react';
import { Card, CardContent } from '../ui/Card';
import { Button } from '../ui/Button';
import { BackButton } from '../ui/BackButton';
import { SwipeableCard } from '../ui/SwipeableCard';
import { PullToRefresh } from '../ui/PullToRefresh';
import { Input } from '../ui/Input';
import { SearchFilter, getDefaultFilterOptions } from '../search/SearchFilter';
import { SearchResultCard } from '../search/SearchResultCard';
import { InteractionDetailDialog } from '../ui/InteractionDetailDialog';
import { DailyRecordDetailDialog } from '../ui/DailyRecordDetailDialog';
import { InquiryDetailDialog } from '../ui/InquiryDetailDialog';
import { InteractionFormDialog } from '../ui/InteractionFormDialog';
import { DailyRecordFormDialog } from '../ui/DailyRecordFormDialog';
import { InquiryFormDialog } from '../ui/InquiryFormDialog';
import { useLanguage } from '../../contexts/LanguageContext';
import { useGlassBlue } from '../../hooks/useGlassBlue';
import { useMobileDetection } from '../../hooks/useTouch';
import { useResponsiveNavigation } from '../../hooks/useResponsiveNavigation';

import { searchService } from '../../services/searchService';
import { interactionService, UpdateInteractionData } from '../../services/interactionService';
import { dailyRecordService } from '../../services/dailyRecordService';
import { inquiryService } from '../../services/inquiryService';
import { companyService } from '../../services/companyService';
import { staffService } from '../../services/staffService';
import type { SearchResult, SearchError } from '../../services/searchService';
import type { InteractionRecord, DailyRecordWithRelations, InquiryWithRelations } from '../../../shared/types';



export const SearchResults: React.FC = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { isMobile } = useMobileDetection();
  const isGlassBlue = useGlassBlue();
  const { navigateToDetail } = useResponsiveNavigation();
  const searchInputRef = useRef<HTMLInputElement>(null);
  const transitioningToEditRef = useRef(false);

  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
  const [confirmedSearchQuery, setConfirmedSearchQuery] = useState(searchParams.get('q') || '');
  const [selectedFilters, setSelectedFilters] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(parseInt(searchParams.get('page') || '1', 10));

  // Handle search input changes (no automatic search)
  const handleSearchInputChange = (query: string) => {
    setSearchQuery(query);
  };

  // Handle search confirmation (Enter key, mobile done button, or search button)
  const handleSearchConfirm = (query?: string) => {
    const searchTerm = query !== undefined ? query : searchQuery;
    setSearchQuery(searchTerm);
    setCurrentPage(1); // Reset to first page when search changes
    // Trigger immediate search by updating confirmedSearchQuery
    setConfirmedSearchQuery(searchTerm);
  };

  // Handle Enter key press and mobile keyboard done button
  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const target = e.target as HTMLInputElement;
      handleSearchConfirm(target.value);
    }
  };
  const pageSize = 10;

  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [resultCounts, setResultCounts] = useState<Record<string, number>>({});
  const [totalResults, setTotalResults] = useState(0);
  const [totalPages, setTotalPages] = useState(0);


  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<SearchError | null>(null);
  const [_refreshing, _setRefreshing] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  // Detail dialog states
  const [isInteractionDetailOpen, setIsInteractionDetailOpen] = useState(false);
  const [isDailyRecordDetailOpen, setIsDailyRecordDetailOpen] = useState(false);
  const [isInquiryDetailOpen, setIsInquiryDetailOpen] = useState(false);

  // Selected items for detail dialogs
  const [selectedInteraction, setSelectedInteraction] = useState<InteractionRecord | null>(null);
  const [selectedDailyRecord, setSelectedDailyRecord] = useState<DailyRecordWithRelations | null>(null);
  const [selectedInquiry, setSelectedInquiry] = useState<InquiryWithRelations | null>(null);

  // Loading states for fetching detail data
  const [detailLoading, setDetailLoading] = useState(false);

  // Edit form dialog states
  const [isInteractionFormOpen, setIsInteractionFormOpen] = useState(false);
  const [isDailyRecordFormOpen, setIsDailyRecordFormOpen] = useState(false);
  const [isInquiryFormOpen, setIsInquiryFormOpen] = useState(false);

  // Form loading and error states
  const [formLoading, setFormLoading] = useState(false);
  const [formErrors, setFormErrors] = useState<Array<{ message: string }>>([]);

  // Dropdown data for forms
  const [availableCompanies, setAvailableCompanies] = useState<Array<{ id: number; name: string }>>([]);
  const [availableUsers, setAvailableUsers] = useState<Array<{ id: number; name: string }>>([]);
  const [availableStaff, setAvailableStaff] = useState<Array<{ id: number; name: string; employeeId: string | null }>>([]);

  // Build an expanded query including cross-language synonyms (EN/JA) for common enum labels
  const buildExpandedQuery = useCallback((q: string): string => {
    const term = (q || '').trim();
    if (!term) return term;

    const terms = new Set<string>([term.toLowerCase()]);

    const add = (s?: string) => {
      if (s && typeof s === 'string') {
        const v = s.trim();
        if (v) terms.add(v.toLowerCase());
      }
    };

    const translateBoth = (key: string): string[] => {
      const en = (t as any)(key, { lng: 'en' }) as string;
      const ja = (t as any)(key, { lng: 'ja' }) as string;
      const out: string[] = [];
      if (en && en !== key) out.push(en);
      if (ja && ja !== key && ja.toLowerCase() !== en?.toLowerCase()) out.push(ja);
      return out;
    };

    const candidateKeys: string[] = [
      // Interactions statuses
      'interactions.open', 'interactions.inProgress', 'interactions.resolved',
      'status.open', 'status.closed', 'status.onHold',
      // Interaction types
      'interactions.types.DISCUSSION', 'interactions.types.INTERVIEW', 'interactions.types.CONSULTATION', 'interactions.types.OTHER',
      // Complaint urgency
      'complaintDetails.urgencyLevel.high', 'complaintDetails.urgencyLevel.medium', 'complaintDetails.urgencyLevel.low',
      // Properties (status + types)
      'properties.active', 'properties.inactive', 'properties.underConstruction', 'properties.sold', 'properties.maintenance', 'properties.occupied', 'properties.vacant',
      'properties.residential', 'properties.commercial', 'properties.industrial', 'properties.mixedUse',
      // Destinations status
      'destinations.active', 'destinations.inactive', 'destinations.suspended',
      // Common roles
      'userManagement.roles.admin', 'userManagement.roles.manager', 'userManagement.roles.staff', 'userManagement.roles.user',
    ];

    // Add Staff Residence Status enum keys (used in StaffList) to support terms like '学生', '配偶者', etc.
    const RESIDENCE_STATUS_KEYS = [
      'STUDENT',
      'SPOUSE',
      'PERMANENT_RESIDENT',
      'LONG_TERM_RESIDENT',
      'TEMPORARY_VISITOR',
      'WORKING_HOLIDAY',
      'SPECIFIED_SKILLED_WORKER',
      'TECHNICAL_INTERN_TRAINEE',
      'ENGINEER',
      'HUMANITIES',
      'INTERN',
      'PART_TIME',
      'DEPENDENT',
      'UNKNOWN'
    ] as const;

    const residenceI18nKeys = RESIDENCE_STATUS_KEYS.map(k => `detailPages.staff.options.${k}`);
    const residenceTokens = new Set<string>();

    // If input resembles a known label (partial), include both EN/JA variants (including residence status labels)
    for (const key of [...candidateKeys, ...residenceI18nKeys]) {
      const labels = translateBoth(key);
      for (const lbl of labels) {
        const l = lbl.toLowerCase();
        if (l.includes(term.toLowerCase()) || term.toLowerCase().includes(l)) {
          for (const l2 of labels) add(l2);
        }
      }
    }

    // Also, when residence status label matches, add the raw enum key tokens and record preferred tokens for backend search
    for (const enumKey of RESIDENCE_STATUS_KEYS) {
      const labels = translateBoth(`detailPages.staff.options.${enumKey}`);
      const lowerTerm = term.toLowerCase();
      const match = labels.some(l => l.toLowerCase().includes(lowerTerm) || lowerTerm.includes(l.toLowerCase()));
      if (match) {
        const upper = enumKey.toUpperCase();
        const lower = enumKey.toLowerCase();
        // Prefer the raw enum key for backend search
        residenceTokens.add(upper);
        add(enumKey);
        add(lower);
        add(upper);
        // Include label variants as secondary tokens
        labels.forEach(l => residenceTokens.add(l));
      }
    }

    // Exact match fallback: add both variants if input exactly equals a label (including residence status labels)
    for (const key of [...candidateKeys, ...residenceI18nKeys]) {
      const labels = translateBoth(key).map(s => s.toLowerCase());
      if (labels.includes(term.toLowerCase())) {
        for (const l2 of labels) add(l2);
      }
    }

    // If a residence-status label matched, include BOTH enum tokens and the original/label terms.
    // Server splits on spaces and OR-matches tokens across fields, so this covers DB storing either
    // the raw token (e.g., "STUDENT") or localized label (e.g., "学生").
    if (residenceTokens.size > 0) {
      const merged = new Set<string>(terms);
      for (const tok of residenceTokens) {
        if (typeof tok === 'string' && tok.trim()) {
          merged.add(tok.toLowerCase());
        }
      }
      return Array.from(merged).join(' ');
    }
    // Join as whitespace-separated tokens so backend can match any token
    return Array.from(terms).join(' ');
  }, [t]);

  // Perform search when confirmed query, filters, or page change
  useEffect(() => {
    const performSearch = async () => {
      // Don't search if query is empty and no filters are selected
      if (!confirmedSearchQuery.trim() && selectedFilters.length === 0) {
        setSearchResults([]);
        setResultCounts({});
        setTotalResults(0);
        setTotalPages(0);
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const response = await searchService.searchAll(
          buildExpandedQuery(confirmedSearchQuery),
          selectedFilters,
          currentPage,
          pageSize
        );

        setSearchResults(response.results);
        setResultCounts(response.counts);
        setTotalResults(response.total);
        setTotalPages(response.totalPages || 0);

        // Reset retry count on success
        setRetryCount(0);
      } catch (err) {
        console.error('Search failed:', err);
        const searchError = err as SearchError;
        setError(searchError);
        setSearchResults([]);
        setResultCounts({});
        setTotalResults(0);
        setTotalPages(0);
      } finally {
        setLoading(false);
      }
    };

    performSearch();
  }, [confirmedSearchQuery, selectedFilters, currentPage, pageSize, buildExpandedQuery]);

  // Create filter options with counts
  const availableFilters = useMemo(() => {
    return getDefaultFilterOptions(t).map(option => ({
      ...option,
      count: resultCounts[option.id] || 0
    }));
  }, [resultCounts, t]);

  // Update URL params when confirmed search, filters, or page changes
  useEffect(() => {
    const params = new URLSearchParams();
    if (confirmedSearchQuery.trim()) {
      params.set('q', confirmedSearchQuery.trim());
    }
    if (selectedFilters.length > 0) {
      params.set('filters', selectedFilters.join(','));
    }
    if (currentPage > 1) {
      params.set('page', currentPage.toString());
    }
    setSearchParams(params, { replace: true });
  }, [confirmedSearchQuery, selectedFilters, currentPage, setSearchParams]);

  // Load filters and page from URL on mount
  useEffect(() => {
    const filtersParam = searchParams.get('filters');
    if (filtersParam) {
      setSelectedFilters(filtersParam.split(','));
    }

    const pageParam = searchParams.get('page');
    if (pageParam) {
      const page = parseInt(pageParam, 10);
      if (page > 0) {
        setCurrentPage(page);
      }
    }

    // Set confirmed search query from URL on mount
    const queryParam = searchParams.get('q') || '';
    setConfirmedSearchQuery(queryParam);

    // Ensure input is focusable after navigation
    if (searchInputRef.current) {
      // Small delay to ensure DOM is ready
      setTimeout(() => {
        if (searchInputRef.current) {
          searchInputRef.current.focus();
        }
      }, 100);
    }
  }, [searchParams]);

  // Cleanup search service on unmount
  useEffect(() => {
    return () => {
      searchService.cleanup();
    };
  }, []);

  // Fetch dropdown data for forms
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



  const handleFilterChange = (filters: string[]) => {
    setSelectedFilters(filters);
    setCurrentPage(1); // Reset to first page when filters change
    // Trigger immediate search when filters change
    setConfirmedSearchQuery(searchQuery);
  };

  const handleClearFilters = () => {
    setSelectedFilters([]);
    setSearchQuery('');
    setConfirmedSearchQuery('');
    setCurrentPage(1);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    // Scroll to top when page changes
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleRefresh = async () => {
    _setRefreshing(true);
    setError(null);

    try {
      if (confirmedSearchQuery.trim() || selectedFilters.length > 0) {
        const response = await searchService.searchAll(
          buildExpandedQuery(confirmedSearchQuery),
          selectedFilters,
          currentPage,
          pageSize
        );
        setSearchResults(response.results);
        setResultCounts(response.counts);
        setTotalResults(response.total);
        setTotalPages(response.totalPages || 0);

        // Reset retry count on success
        setRetryCount(0);
      }
    } catch (err) {
      console.error('Failed to refresh search results:', err);
      const searchError = err as SearchError;
      setError(searchError);
    } finally {
      _setRefreshing(false);
    }
  };

  const handleRetry = async () => {
    setRetryCount(prev => prev + 1);
    setError(null);

    // Trigger a new search
    if (confirmedSearchQuery.trim() || selectedFilters.length > 0) {
      setLoading(true);
      try {
        const response = await searchService.searchAll(
          buildExpandedQuery(confirmedSearchQuery),
          selectedFilters,
          currentPage,
          pageSize
        );
        setSearchResults(response.results);
        setResultCounts(response.counts);
        setTotalResults(response.total);
        setTotalPages(response.totalPages || 0);

        // Reset retry count on success
        setRetryCount(0);
      } catch (err) {
        console.error('Retry failed:', err);
        const searchError = err as SearchError;
        setError(searchError);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleResultAction = async (action: string, result: SearchResult) => {
    switch (action) {
      case 'view':
        await handleViewDetail(result);
        break;
      case 'edit':
        // Navigate to edit page
        navigate(`/${result.type}/${result.id}/edit`);
        break;
      case 'delete':
        // TODO: Implement delete action
        break;
    }
  };

  const handleViewDetail = async (result: SearchResult) => {
    setDetailLoading(true);
    try {
      switch (result.type) {
        case 'staff': {
          navigateToDetail(result.id, 'staff');
          break;
        }
        case 'destinations': {
          navigateToDetail(result.id, 'destination');
          break;
        }
        case 'residences': {
          navigateToDetail(result.id, 'property');
          break;
        }
        case 'interactions': {
          const interaction = await interactionService.getInteraction(result.id);
          setSelectedInteraction(interaction);
          setIsInteractionDetailOpen(true);
          break;
        }
        case 'dailyRecord': {
          const dailyRecord = await dailyRecordService.getById(result.id);
          setSelectedDailyRecord(dailyRecord);
          setIsDailyRecordDetailOpen(true);
          break;
        }
        case 'inquiriesNotifications': {
          const inquiry = await inquiryService.getById(result.id);
          setSelectedInquiry(inquiry);
          setIsInquiryDetailOpen(true);
          break;
        }
        case 'attendance':
          // For attendance, navigate to the attendance page with filter
          navigate(`/attendance?recordId=${result.id}`);
          break;
        case 'manual':
          // For manual documents, navigate to the document page
          navigate(`/document/${result.id}`);
          break;
        default:
          break;
      }
    } catch (error) {
      console.error('Failed to fetch detail data:', error);
      // Fallback to navigation if detail fetch fails
      switch (result.type) {
        case 'interactions':
          navigate(`/interaction/${result.id}`);
          break;
        case 'attendance':
          navigate(`/attendance/${result.id}`);
          break;
        case 'manual':
          navigate(`/document/${result.id}`);
          break;
        case 'dailyRecord':
          navigate(`/daily-record/${result.id}`);
          break;
        case 'inquiriesNotifications':
          navigate(`/inquiries-notifications/${result.id}`);
          break;
        default:
          break;
      }
    } finally {
      setDetailLoading(false);
    }
  };

  // Dialog close handlers
  const handleCloseInteractionDetail = () => {
    setIsInteractionDetailOpen(false);
    if (!transitioningToEditRef.current) {
      setSelectedInteraction(null);
    }
  };

  const handleCloseDailyRecordDetail = () => {
    setIsDailyRecordDetailOpen(false);
    if (!transitioningToEditRef.current) {
      setSelectedDailyRecord(null);
    }
  };

  const handleCloseInquiryDetail = () => {
    setIsInquiryDetailOpen(false);
    if (!transitioningToEditRef.current) {
      setSelectedInquiry(null);
    }
  };

  // Helper function to refresh search results after deletion
  const refreshSearchResults = async () => {
    if (confirmedSearchQuery.trim() || selectedFilters.length > 0) {
      try {
        const response = await searchService.searchAll(
          buildExpandedQuery(confirmedSearchQuery),
          selectedFilters,
          currentPage,
          pageSize
        );
        setSearchResults(response.results);
        setResultCounts(response.counts);
        setTotalResults(response.total);
        setTotalPages(response.totalPages || 0);
      } catch (error) {
        console.error('Failed to refresh search results:', error);
      }
    }
  };

  // Edit handlers - open form dialogs
  const handleEditInteraction = (_interaction: InteractionRecord) => {
    transitioningToEditRef.current = true;
    setFormErrors([]);
    setIsInteractionFormOpen(true); // Open form dialog first
    setIsInteractionDetailOpen(false); // Then close detail dialog
  };

  const handleEditDailyRecord = (_dailyRecord: DailyRecordWithRelations) => {
    transitioningToEditRef.current = true;
    setFormErrors([]);
    setIsDailyRecordFormOpen(true); // Open form dialog first
    setIsDailyRecordDetailOpen(false); // Then close detail dialog
  };

  const handleEditInquiry = (_inquiry: InquiryWithRelations) => {
    transitioningToEditRef.current = true;
    setFormErrors([]);
    setIsInquiryFormOpen(true); // Open form dialog first
    setIsInquiryDetailOpen(false); // Then close detail dialog
  };

  // Delete handlers - implement proper deletion with confirmation
  const handleDeleteInteraction = async (id: string) => {
    if (!confirm(t('search.confirmations.deleteInteraction'))) return;

    try {
      await interactionService.deleteInteraction(id);
      setIsInteractionDetailOpen(false);
      setSelectedInteraction(null);
      await refreshSearchResults();
    } catch (error) {
      console.error('Failed to delete interaction:', error);
      alert(t('search.errors.failedToDeleteInteraction'));
    }
  };

  const handleDeleteDailyRecord = async (id: string) => {
    if (!confirm(t('search.confirmations.deleteDailyRecord'))) return;

    try {
      await dailyRecordService.bulkDelete([parseInt(id)]);
      setIsDailyRecordDetailOpen(false);
      setSelectedDailyRecord(null);
      await refreshSearchResults();
    } catch (error) {
      console.error('Failed to delete daily record:', error);
      alert(t('search.errors.failedToDeleteDailyRecord'));
    }
  };

  const handleDeleteInquiry = async (id: string) => {
    if (!confirm(t('search.confirmations.deleteInquiry'))) return;

    try {
      await inquiryService.bulkDelete([parseInt(id)]);
      setIsInquiryDetailOpen(false);
      setSelectedInquiry(null);
      await refreshSearchResults();
    } catch (error) {
      console.error('Failed to delete inquiry:', error);
      alert(t('search.errors.failedToDeleteInquiry'));
    }
  };

  // Form close handlers
  const handleCloseInteractionForm = () => {
    setIsInteractionFormOpen(false);
    setSelectedInteraction(null); // Clear selected item when form closes
    setFormErrors([]);
    transitioningToEditRef.current = false;
  };

  const handleCloseDailyRecordForm = () => {
    setIsDailyRecordFormOpen(false);
    setSelectedDailyRecord(null); // Clear selected item when form closes
    setFormErrors([]);
    transitioningToEditRef.current = false;
  };

  const handleCloseInquiryForm = () => {
    setIsInquiryFormOpen(false);
    setSelectedInquiry(null); // Clear selected item when form closes
    setFormErrors([]);
    transitioningToEditRef.current = false;
  };

  // Form submit handlers
  const handleInteractionFormSubmit = async (formData: Partial<InteractionRecord>) => {
    if (!selectedInteraction) return;

    try {
      setFormLoading(true);
      setFormErrors([]);
      // Convert formData to match UpdateInteractionData interface
      const updateData: UpdateInteractionData = {
        ...formData,
        personInvolvedStaffId: formData.personInvolvedStaffId?.toString(),
      };
      await interactionService.updateInteraction(selectedInteraction.id.toString(), updateData);
      setIsInteractionFormOpen(false);
      transitioningToEditRef.current = false;
      await refreshSearchResults()
    } catch (error) {
      console.error('Failed to update interaction:', error);
      setFormErrors([{ message: error instanceof Error ? error.message : t('search.errors.failedToUpdateInteraction') }]);
    } finally {
      setFormLoading(false);
    }
  };

  const handleDailyRecordFormSubmit = async (formData: Partial<DailyRecordWithRelations>) => {
    if (!selectedDailyRecord) return;

    try {
      setFormLoading(true);
      setFormErrors([]);
      await dailyRecordService.update(selectedDailyRecord.id, formData);
      setIsDailyRecordFormOpen(false);
      transitioningToEditRef.current = false;
      await refreshSearchResults();
    } catch (error) {
      console.error('Failed to update daily record:', error);
      setFormErrors([{ message: error instanceof Error ? error.message : t('search.errors.failedToUpdateDailyRecord') }]);
    } finally {
      setFormLoading(false);
    }
  };

  const handleInquiryFormSubmit = async (formData: Partial<InquiryWithRelations>) => {
    if (!selectedInquiry) return;

    try {
      setFormLoading(true);
      setFormErrors([]);
      await inquiryService.update(selectedInquiry.id, formData);
      setIsInquiryFormOpen(false);
      transitioningToEditRef.current = false;
      await refreshSearchResults();
    } catch (error) {
      console.error('Failed to update inquiry:', error);
      setFormErrors([{ message: error instanceof Error ? error.message : t('search.errors.failedToUpdateInquiry') }]);
    } finally {
      setFormLoading(false);
    }
  };

  const hasActiveFilters = confirmedSearchQuery.trim() || selectedFilters.length > 0;

  const renderMobileResult = (result: SearchResult) => {
    const swipeActions = [
      {
        icon: <Eye className="h-4 w-4" />,
        label: t('search.swipeActions.view'),
        color: 'primary' as const,
        onAction: () => handleResultAction('view', result),
      },
      {
        icon: <Edit className="h-4 w-4" />,
        label: t('search.swipeActions.edit'),
        color: 'secondary' as const,
        onAction: () => handleResultAction('edit', result),
      },
      {
        icon: <Trash2 className="h-4 w-4" />,
        label: t('search.swipeActions.delete'),
        color: 'destructive' as const,
        onAction: () => handleResultAction('delete', result),
      },
    ];

    return (
      <SwipeableCard
        key={result.id}
        rightActions={swipeActions}
        className="touch-manipulation"
        padding="none"
      >
        <SearchResultCard
          result={result}
          onClick={(result) => handleResultAction('view', result)}
          className="border-0 shadow-none bg-transparent"
          disabled={detailLoading}
        />
      </SwipeableCard>
    );
  };

  const renderDesktopResult = (result: SearchResult) => (
    <SearchResultCard
      key={result.id}
      result={result}
      onClick={(result) => handleResultAction('view', result)}
      disabled={detailLoading}
    />
  );

  return (
    <PullToRefresh onRefresh={handleRefresh} disabled={!isMobile}>
      <div className="mobile-spacing mobile-container">
        {/* Header */}
        <div className="mobile-spacing">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <BackButton aria-label={t('search.goBackToPreviousPage')} />
              <h1 className="text-2xl md:text-3xl font-bold text-secondary-900" id="search-results-heading">
                {t('search.searchResults')}
              </h1>
            </div>
          </div>

          {/* Search and Filters */}
          <Card className="search-component-spacing">
            <CardContent className={`p-2 ${isMobile ? 'p-1' : ''}`}>
              <div className="space-y-2">
                {/* Search Input */}
                <div className="relative flex gap-2">
                  <div className="relative flex-1">
                    <Search
                      className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-secondary-400"
                      aria-hidden="true"
                    />
                    <Input
                      ref={searchInputRef}
                      placeholder={t('search.searchPlaceholder')}
                      value={searchQuery}
                      onChange={(e) => handleSearchInputChange(e.target.value)}
                      onKeyDown={handleSearchKeyDown}
                      className="pl-10"
                      size="compact"
                      aria-label={t('search.searchAcrossAllDataSources')}
                      autoComplete="off"
                    />
                  </div>
                  <Button
                    onClick={() => handleSearchConfirm()}
                    size="sm"
                    className={`touch-target ${isGlassBlue ? 'glass-blue-search-button' : ''}`}
                    aria-label="Search"
                    disabled={loading}
                  >
                    {loading ? (
                      <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full" />
                    ) : (
                      <Search className="h-4 w-4" />
                    )}
                  </Button>
                </div>

                {/* Filters */}
                <div className="flex items-center gap-2 flex-wrap">
                  <SearchFilter
                    selectedFilters={selectedFilters}
                    onSelectionChange={handleFilterChange}
                    availableFilters={availableFilters}
                  />

                  {hasActiveFilters && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleClearFilters}
                      className="text-secondary-600 hover:text-secondary-800"
                      aria-label={t('search.clearAllSearchFiltersAndQuery')}
                    >
                      <X className="h-4 w-4 mr-1" />
                      {t('search.clearAll')}
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Results */}
        <div className="space-y-4">
          {/* Results Summary */}
          <div
            className={`flex items-center justify-between text-sm text-secondary-600 ${isMobile ? 'flex-col items-start gap-2' : ''}`}
            role="status"
            aria-live="polite"
            aria-atomic="true"
          >
            <span>
              {loading ? t('search.loadingText') : t('search.itemsFound', { count: totalResults })}
              {confirmedSearchQuery.trim() && !loading && ` for "${confirmedSearchQuery}"`}
              {totalPages > 1 && !loading && ` (Page ${currentPage} of ${totalPages})`}
            </span>
            {loading && (
              <span className="flex items-center gap-2">
                <span className="animate-spin h-4 w-4 border-2 border-primary-500 border-t-transparent rounded-full" aria-hidden="true"></span>
                {t('search.searchingText')}
              </span>
            )}
          </div>

          {/* Error State */}
          {error && (
            <Card className="border-red-200 bg-red-50">
              <CardContent className="text-center py-12">
                <div className="text-red-600">
                  {error.type === 'network' ? (
                    <WifiOff className="h-12 w-12 mx-auto mb-4" />
                  ) : error.type === 'timeout' ? (
                    <RefreshCw className="h-12 w-12 mx-auto mb-4" />
                  ) : (
                    <AlertTriangle className="h-12 w-12 mx-auto mb-4" />
                  )}
                  <h3 className="text-lg font-medium mb-2 text-red-800">
                    {error.type === 'network' ? t('search.connectionError') :
                      error.type === 'timeout' ? t('search.requestTimeout') :
                        error.type === 'server' ? t('search.serverError') :
                          error.type === 'validation' ? t('search.invalidSearch') :
                            t('search.searchError')}
                  </h3>
                  <p className="mb-4 text-red-700 max-w-md mx-auto">{error.message}</p>
                  <div className="flex flex-col sm:flex-row gap-2 justify-center">
                    {error.retryable && (
                      <Button
                        onClick={handleRetry}
                        variant="outline"
                        className="text-red-800 border-red-300 hover:bg-red-100"
                        disabled={loading}
                      >
                        <RefreshCw className={`h-4 w-4 mr-1 ${loading ? 'animate-spin' : ''}`} />
                        {retryCount > 0 ? t('search.retryAttempt', { count: retryCount + 1 }) : t('search.tryAgain')}
                      </Button>
                    )}
                    <Button
                      onClick={() => setError(null)}
                      variant="ghost"
                      className="text-red-600 hover:bg-red-100"
                    >
                      {t('search.dismiss')}
                    </Button>
                  </div>
                  {error.type === 'network' && (
                    <p className="text-xs text-red-600 mt-4">
                      {t('search.checkInternetConnection')}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Results List */}
          {!error && (
            <>
              {loading ? (
                <Card>
                  <CardContent className={`text-center py-12 ${isMobile ? 'py-8' : ''}`}>
                    <div className="relative">
                      <Search
                        className="h-12 w-12 text-secondary-400 mx-auto mb-4"
                        aria-hidden="true"
                      />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="animate-spin rounded-full h-16 w-16 border-2 border-primary-200 border-t-primary-600"></div>
                      </div>
                    </div>
                    <h3 className="text-lg font-medium text-secondary-900 mb-2">
                      {retryCount > 0 ? t('search.retryingSearch', { count: retryCount + 1 }) : t('search.searchingText')}
                    </h3>
                    <p className="text-secondary-600 mb-4">
                      {retryCount > 0
                        ? t('search.attemptingToReconnect')
                        : t('search.pleaseWaitSearching')
                      }
                    </p>
                    {/* Loading progress indicators */}
                    <div className="flex justify-center space-x-2">
                      {['interactions', 'attendance', 'manual'].map((source, index) => (
                        <div
                          key={source}
                          className={`h-2 w-2 rounded-full transition-colors duration-300 ${(selectedFilters.length === 0 || selectedFilters.includes(source))
                            ? 'bg-primary-400 animate-pulse'
                            : 'bg-secondary-200'
                            }`}
                          style={{ animationDelay: `${index * 100}ms` }}
                          title={`Searching ${source}`}
                        />
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ) : searchResults.length > 0 ? (
                <div className="space-y-3" role="region" aria-labelledby="search-results-heading">
                  <div role="list" aria-label={t('search.searchResultsFound', { count: searchResults.length })}>
                    {searchResults.map((result) => (
                      <div key={result.id} role="listitem">
                        {isMobile ? renderMobileResult(result) : renderDesktopResult(result)}
                      </div>
                    ))}
                  </div>
                </div>
              ) : (confirmedSearchQuery.trim() || selectedFilters.length > 0) ? (
                <Card>
                  <CardContent className={`text-center py-12 ${isMobile ? 'py-8' : ''}`}>
                    <Search
                      className="h-12 w-12 text-secondary-400 mx-auto mb-4"
                      aria-hidden="true"
                    />
                    <h3 className="text-lg font-medium text-secondary-900 mb-2">
                      {t('search.noResults')}
                    </h3>
                    <div className="text-secondary-600 mb-6 space-y-2">
                      <p>{t('search.noResultsForCriteria')}</p>
                      {confirmedSearchQuery.trim() && (
                        <p className="text-sm">
                          {t('search.searchedFor')} <span className="font-medium">&ldquo;{confirmedSearchQuery}&rdquo;</span>
                        </p>
                      )}
                      {selectedFilters.length > 0 && (
                        <p className="text-sm">
                          {t('search.searchedIn')} <span className="font-medium">{selectedFilters.join(', ')}</span>
                        </p>
                      )}
                    </div>
                    <div className="space-y-3">
                      <div className="text-sm text-secondary-500">
                        <ul className="text-left max-w-xs mx-auto space-y-1">
                          <li>• {t('search.tryDifferentKeywords')}</li>
                          <li>• {t('search.checkSpelling')}</li>
                          <li>• {t('search.useBroaderTerms')}</li>
                          <li>• {t('search.removeFilters')}</li>
                        </ul>
                      </div>
                      {hasActiveFilters && (
                        <Button
                          variant="outline"
                          onClick={handleClearFilters}
                          className="touch-target"
                          aria-label={t('search.clearAllFiltersToStartOver')}
                        >
                          <X className="h-4 w-4 mr-1" />
                          {t('search.clearAllFilters')}
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardContent className={`text-center py-12 ${isMobile ? 'py-8' : ''}`}>
                    <Search
                      className="h-12 w-12 text-secondary-400 mx-auto mb-4"
                      aria-hidden="true"
                    />
                    <h3 className="text-lg font-medium text-secondary-900 mb-2">
                      {t('search.startYourSearch')}
                    </h3>
                    <p className="text-secondary-600 mb-6">
                      {t('search.enterSearchTermOrFilters')}
                    </p>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3 max-w-md mx-auto text-sm text-secondary-500">


                      <div className="flex items-center gap-2">
                        <MessageSquare className="h-4 w-4" />
                        <span>{t('search.dataSourceInteractions')}</span>
                      </div>

                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        <span>{t('search.dataSourceAttendance')}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        <span>{t('search.dataSourceManual')}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          )}

          {/* Pagination */}
          {!loading && !error && totalPages > 1 && (
            <nav
              className={`flex items-center justify-center space-x-2 mt-6 ${isMobile ? 'flex-col space-x-0 space-y-4' : ''}`}
              role="navigation"
              aria-label={t('search.searchResultsPagination')}
            >
              {isMobile ? (
                // Mobile pagination - simplified
                <div className="flex items-center justify-between w-full">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="touch-target flex-1 mr-2"
                    aria-label={t('search.goToPreviousPage', { page: currentPage - 1 })}
                  >
                    ← {t('common.navigation.previous')}
                  </Button>

                  <span className="text-sm text-secondary-600 px-4 whitespace-nowrap">
                    {t('search.currentPageOf', { current: currentPage, total: totalPages })}
                  </span>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="touch-target flex-1 ml-2"
                    aria-label={t('search.goToNextPage', { page: currentPage + 1 })}
                  >
                    {t('common.navigation.next')} →
                  </Button>
                </div>
              ) : (
                // Desktop pagination - full
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="touch-target"
                    aria-label={t('search.goToPreviousPage', { page: currentPage - 1 })}
                  >
                    {t('common.navigation.previous')}
                  </Button>

                  <div className="flex items-center space-x-1" role="group" aria-label={t('search.pageNumbers')}>
                    {totalPages <= 7 ? (
                      // Show all pages if 7 or fewer
                      Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                        <Button
                          key={`page-${page}`}
                          variant={page === currentPage ? "default" : "ghost"}
                          size="sm"
                          onClick={() => handlePageChange(page)}
                          className="w-8 h-8 p-0 touch-target"
                          aria-label={t('search.goToPage', { page })}
                          aria-current={page === currentPage ? "page" : undefined}
                        >
                          {page}
                        </Button>
                      ))
                    ) : (
                      // Show condensed pagination for many pages
                      <>
                        {currentPage > 3 && (
                          <>
                            <Button
                              key="page-1-first"
                              variant="ghost"
                              size="sm"
                              onClick={() => handlePageChange(1)}
                              className="w-8 h-8 p-0 touch-target"
                              aria-label={t('search.goToPage', { page: 1 })}
                            >
                              1
                            </Button>
                            {currentPage > 4 && (
                              <span className="text-secondary-400" aria-hidden="true">...</span>
                            )}
                          </>
                        )}

                        {Array.from(
                          { length: Math.min(5, totalPages) },
                          (_, i) => {
                            const start = Math.max(1, Math.min(currentPage - 2, totalPages - 4));
                            return start + i;
                          }
                        )
                          .filter((page) => page >= 1 && page <= totalPages)
                          .filter((page, index, array) => array.indexOf(page) === index) // Remove duplicates
                          .map((page) => (
                            <Button
                              key={`page-${page}`}
                              variant={page === currentPage ? "default" : "ghost"}
                              size="sm"
                              onClick={() => handlePageChange(page)}
                              className="w-8 h-8 p-0 touch-target"
                              aria-label={t('search.goToPage', { page })}
                              aria-current={page === currentPage ? "page" : undefined}
                            >
                              {page}
                            </Button>
                          ))}

                        {currentPage < totalPages - 2 && (
                          <>
                            {currentPage < totalPages - 3 && (
                              <span className="text-secondary-400" aria-hidden="true">...</span>
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handlePageChange(totalPages)}
                              className="w-8 h-8 p-0 touch-target"
                              aria-label={t('search.goToPage', { page: totalPages })}
                            >
                              {totalPages}
                            </Button>
                          </>
                        )}
                      </>
                    )}
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="touch-target"
                    aria-label={t('search.goToNextPage', { page: currentPage + 1 })}
                  >
                    {t('common.navigation.next')}
                  </Button>
                </>
              )}
            </nav>
          )}
        </div>
      </div>

      {/* Detail Dialogs */}
      {selectedInteraction && (
        <InteractionDetailDialog
          isOpen={isInteractionDetailOpen}
          onClose={handleCloseInteractionDetail}
          record={selectedInteraction}
          onEdit={handleEditInteraction}
          onDelete={(id) => handleDeleteInteraction(id)}
          getTypeLabel={(type) => type} // Simple label function
          getStatusLabel={(status) => status || 'Unknown'} // Simple label function
        />
      )}

      {selectedDailyRecord && (
        <DailyRecordDetailDialog
          isOpen={isDailyRecordDetailOpen}
          onClose={handleCloseDailyRecordDetail}
          record={selectedDailyRecord}
          onEdit={handleEditDailyRecord}
          onDelete={(id) => handleDeleteDailyRecord(id)}
        />
      )}

      {selectedInquiry && (
        <InquiryDetailDialog
          isOpen={isInquiryDetailOpen}
          onClose={handleCloseInquiryDetail}
          record={selectedInquiry}
          onEdit={handleEditInquiry}
          onDelete={(id) => handleDeleteInquiry(id)}
        />
      )}

      {/* Edit Form Dialogs - Always render but control visibility */}
      <InteractionFormDialog
        isOpen={isInteractionFormOpen && selectedInteraction !== null}
        onClose={handleCloseInteractionForm}
        onSubmit={handleInteractionFormSubmit}
        record={selectedInteraction}
        isLoading={formLoading}
        errors={formErrors}
        availableStaff={availableStaff}
        availableUsers={availableUsers}
      />

      <DailyRecordFormDialog
        isOpen={isDailyRecordFormOpen && selectedDailyRecord !== null}
        onClose={handleCloseDailyRecordForm}
        onSubmit={handleDailyRecordFormSubmit}
        record={selectedDailyRecord}
        isLoading={formLoading}
        errors={formErrors}
      />

      <InquiryFormDialog
        isOpen={isInquiryFormOpen && selectedInquiry !== null}
        onClose={handleCloseInquiryForm}
        onSubmit={handleInquiryFormSubmit}
        record={selectedInquiry}
        isLoading={formLoading}
        errors={formErrors}
        availableCompanies={availableCompanies}
        availableUsers={availableUsers}
        availableStaff={availableStaff}
      />
    </PullToRefresh>
  );
};
