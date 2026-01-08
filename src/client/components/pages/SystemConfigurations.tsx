import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Settings,
  Search,
  Filter,
  Plus,
  Edit,
  Trash2,
  ToggleLeft,
  ToggleRight,
  Loader2,
  AlertCircle
} from 'lucide-react';
import { Card, CardContent } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { useLanguage as _useLanguage } from '../../contexts/LanguageContext';
import { useGlassBlue } from '../../hooks/useGlassBlue';
import { useSystemConfigurations } from '../../hooks/useSystemConfigurations';
import { useInitialDataForRoute } from '../../contexts/SSRDataContext';
import { SystemConfiguration } from '../../../shared/types';

interface SystemConfigurationCardProps {
  config: SystemConfiguration;
  onEdit: (config: SystemConfiguration) => void;
  onDelete: (config: SystemConfiguration) => void;
  onToggle: (config: SystemConfiguration) => void;
}

const SystemConfigurationCard: React.FC<SystemConfigurationCardProps> = ({
  config,
  onEdit,
  onDelete,
  onToggle
}) => {

  const getDataTypeColor = (dataType: string) => {
    switch (dataType) {
      case 'STRING':
        return 'bg-blue-100 text-blue-800';
      case 'NUMBER':
        return 'bg-green-100 text-green-800';
      case 'BOOLEAN':
        return 'bg-purple-100 text-purple-800';
      case 'JSON':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatValue = (value: string, dataType: string) => {
    if (dataType === 'JSON') {
      try {
        return JSON.stringify(JSON.parse(value), null, 2);
      } catch {
        return value;
      }
    }
    return value;
  };

  return (
    <Card variant="interactive" padding="none">
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2 mb-2">
              <span className="text-sm font-medium text-secondary-900">
                {config.key}
              </span>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getDataTypeColor(config.dataType)}`}>
                {config.dataType}
              </span>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${config.isActive
                ? 'bg-green-100 text-green-800'
                : 'bg-red-100 text-red-800'
                }`}>
                {config.isActive ? 'Active' : 'Inactive'}
              </span>
            </div>

            <div className="mb-2">
              <span className="text-xs text-secondary-500 bg-secondary-100 px-2 py-1 rounded">
                {config.category}
              </span>
            </div>

            {config.description && (
              <p className="text-sm text-secondary-600 mb-2">
                {config.description}
              </p>
            )}

            <div className="bg-secondary-50 p-2 rounded text-sm font-mono text-secondary-800 mb-2">
              {formatValue(config.value, config.dataType)}
            </div>

            <div className="flex items-center space-x-4 text-xs text-secondary-500">
              <span>Created by: {config.creator?.name || 'Unknown'}</span>
              <span>Updated: {new Date(config.updatedAt).toLocaleDateString()}</span>
            </div>
          </div>

          <div className="flex items-center space-x-2 ml-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onToggle(config)}
              className="p-1"
            >
              {config.isActive ? (
                <ToggleRight className="h-4 w-4 text-green-600" />
              ) : (
                <ToggleLeft className="h-4 w-4 text-gray-400" />
              )}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onEdit(config)}
              className="p-1"
            >
              <Edit className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDelete(config)}
              className="p-1 text-red-600 hover:text-red-700"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export const SystemConfigurations: React.FC = () => {
  const navigate = useNavigate();
  const isGlassBlue = useGlassBlue();
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState<boolean | 'all'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 20;

  // Get initial data from SSR context
  const initialData = useInitialDataForRoute('system-configurations');

  const {
    configurations,
    loading,
    error,
    pagination,
    searchConfigurations,
    refreshConfigurations,
    deleteConfiguration,
    toggleConfiguration
  } = useSystemConfigurations({
    initialConfigurations: initialData?.systemConfigurations || [],
    initialSearch: {
      category: categoryFilter || undefined,
      isActive: statusFilter,
      page: currentPage,
      limit: pageSize,
    }
  });

  const handleSearch = () => {
    searchConfigurations({
      category: categoryFilter || undefined,
      isActive: statusFilter,
      page: 1,
      limit: pageSize,
    });
    setCurrentPage(1);
  };

  const handleEdit = (config: SystemConfiguration) => {
    navigate(`/system-configurations/${config.id}/edit`);
  };

  const handleDelete = async (config: SystemConfiguration) => {
    if (confirm(`Are you sure you want to delete the configuration "${config.key}"? This action cannot be undone.`)) {
      try {
        await deleteConfiguration(config.id);
      } catch (err) {
        alert('Failed to delete configuration: ' + (err instanceof Error ? err.message : 'Unknown error'));
      }
    }
  };

  const handleToggle = async (config: SystemConfiguration) => {
    try {
      await toggleConfiguration(config.id);
    } catch (err) {
      alert('Failed to toggle configuration: ' + (err instanceof Error ? err.message : 'Unknown error'));
    }
  };

  const handleClearFilters = () => {
    setSearchTerm('');
    setCategoryFilter('');
    setStatusFilter('all');
    setCurrentPage(1);
    refreshConfigurations();
  };

  const hasActiveFilters = searchTerm.trim() || categoryFilter || statusFilter !== 'all';

  if (error) {
    return (
      <div className="space-y-6 pb-20 md:pb-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl md:text-3xl font-bold text-secondary-900">
            System Configurations
          </h1>
        </div>
        <Card>
          <CardContent className="p-6">
            <div className="text-center text-red-600">
              <AlertCircle className="h-12 w-12 mx-auto mb-4" />
              <p className="mb-4">Error: {error}</p>
              <Button onClick={refreshConfigurations}>
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
        <h1 className="text-2xl md:text-3xl font-bold text-secondary-900">
          System Configurations
        </h1>
        <Button onClick={() => navigate('/system-configurations/new')}>
          <Plus className="h-4 w-4 mr-2" />
          Add Configuration
        </Button>
      </div>

      {/* Search and Filters */}
      <Card className="search-component-spacing">
        <CardContent className="p-2">
          <div className="space-y-2">
            {/* Search */}
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-secondary-400" />
                <Input
                  placeholder="Search configurations by key or description..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && setSearchTerm(searchTerm)}
                  className="pl-10"
                  size="compact"
                />
              </div>
              <Button
                onClick={() => setSearchTerm(searchTerm)}
                size="sm"
                aria-label="Search configurations"
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
            <div className="filter-section-consistent">
              <div className="filter-row">
                <div className="flex items-center space-x-2">
                  <Filter className="h-4 w-4 text-secondary-600" />
                  <span className="text-sm font-medium text-secondary-700">Filters:</span>
                </div>

                <Input
                  placeholder="Category"
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="w-40"
                />

                <select
                  value={statusFilter === 'all' ? 'all' : statusFilter.toString()}
                  onChange={(e) => {
                    const value = e.target.value;
                    setStatusFilter(value === 'all' ? 'all' : value === 'true');
                  }}
                  className="px-3 py-1 border border-secondary-300 rounded-md text-sm"
                >
                  <option value="all">All Status</option>
                  <option value="true">Active</option>
                  <option value="false">Inactive</option>
                </select>

                <Button onClick={handleSearch} size="sm" className={isGlassBlue ? 'glass-blue-search-button' : ''}>
                  Search
                </Button>

                <div className="clear-button-container">
                  {hasActiveFilters && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleClearFilters}
                    >
                      Clear Filters
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results Summary */}
      <div className="flex items-center justify-between text-sm text-secondary-600">
        <span>
          Showing {configurations.length} of {pagination?.total || 0}
        </span>
        {loading && (
          <div className="flex items-center space-x-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Loading...</span>
          </div>
        )}
      </div>

      {/* Configuration List */}
      <div className="space-y-4">
        {configurations.map((config) => (
          <SystemConfigurationCard
            key={config.id}
            config={config}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onToggle={handleToggle}
          />
        ))}
      </div>

      {/* Empty State */}
      {!loading && configurations.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <Settings className="h-12 w-12 text-secondary-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-secondary-900 mb-2">
              No configurations found
            </h3>
            <p className="text-secondary-600 mb-4">
              {hasActiveFilters
                ? 'Try adjusting your search criteria or filters.'
                : 'Get started by adding your first system configuration.'}
            </p>
            <Button onClick={() => navigate('/system-configurations/new')}>
              <Plus className="h-4 w-4 mr-2" />
              Add Configuration
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Pagination */}
      {pagination && pagination.pages > 1 && (
        <div className="flex items-center justify-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              const newPage = Math.max(1, currentPage - 1);
              setCurrentPage(newPage);
              searchConfigurations({
                category: categoryFilter || undefined,
                isActive: statusFilter,
                page: newPage,
                limit: pageSize,
              });
            }}
            disabled={currentPage === 1}
          >
            Previous
          </Button>

          <span className="text-sm text-secondary-600">
            Page {currentPage} of {pagination.pages}
          </span>

          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              const newPage = Math.min(pagination.pages, currentPage + 1);
              setCurrentPage(newPage);
              searchConfigurations({
                category: categoryFilter || undefined,
                isActive: statusFilter,
                page: newPage,
                limit: pageSize,
              });
            }}
            disabled={currentPage === pagination.pages}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
};