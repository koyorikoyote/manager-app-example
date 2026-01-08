import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, FileText, Plus, Download } from 'lucide-react';
import { Card, CardContent } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/Select';
import { useLanguage } from '../../contexts/LanguageContext';
import { useDocuments } from '../../hooks/useDocuments';
import { documentService } from '../../services/documentService';
import { Document } from '../../../shared/types';
import { formatDateForTable } from '../../utils/localization';


export const DocumentList: React.FC = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Use confirmed search term for API calls
  const [confirmedSearchTerm, setConfirmedSearchTerm] = useState(searchTerm);

  const { documents, total, loading, error, refetch } = useDocuments({
    search: confirmedSearchTerm,
    type: typeFilter || undefined,
    status: statusFilter || undefined,
    page: currentPage,
    limit: itemsPerPage,
  });

  const totalPages = Math.ceil(total / itemsPerPage);

  const handleSearch = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1);
  };

  const handleSearchConfirm = (value: string) => {
    setConfirmedSearchTerm(value);
    setSearchTerm(value);
    setCurrentPage(1);
  };

  const handleTypeFilter = (value: string) => {
    setTypeFilter(value === 'all' ? '' : value);
    setCurrentPage(1);
  };

  const handleStatusFilter = (value: string) => {
    setStatusFilter(value === 'all' ? '' : value);
    setCurrentPage(1);
  };

  const handleDownload = async (document: Document) => {
    if (!document.filePath) {
      console.error('No file path available for download');
      return;
    }

    try {
      await documentService.downloadDocument(document.filePath, `${document.title}.pdf`);
    } catch (error) {
      console.error('Download failed:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'expired':
        return 'bg-red-100 text-red-800';
      case 'terminated':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeIcon = (_type: string) => {
    return <FileText className="h-4 w-4 text-primary-600" />;
  };

  if (error) {
    return (
      <div className="space-y-6 pb-20 md:pb-6">
        <div className="text-center py-12">
          <p className="text-red-600 text-lg">{error}</p>
          <Button onClick={refetch} className="mt-4">
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-20 md:pb-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
        <h1 className="text-2xl md:text-3xl font-bold text-secondary-900">
          {t('documents.title')} Management
        </h1>
        <Button
          onClick={() => navigate('/destinations/new')}
          className="w-full md:w-auto"
        >
          <Plus className="h-4 w-4 mr-2" />
          New Document
        </Button>
      </div>

      {/* Search and Filters */}
      <Card className="search-component-spacing">
        <CardContent className="p-2">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
            <div className="md:col-span-2">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search documents..."
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
                  aria-label="Search documents"
                  disabled={loading}
                >
                  {loading ? (
                    <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full" />
                  ) : (
                    <Search className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
            <Select value={typeFilter} onValueChange={handleTypeFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Document Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="staff">Staff Document</SelectItem>
                <SelectItem value="property">Property Document</SelectItem>
                <SelectItem value="company">Company Document</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={handleStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="expired">Expired</SelectItem>
                <SelectItem value="terminated">Terminated</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Document List */}
      <div className="space-y-4">
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto mb-2"></div>
            <p className="text-gray-600">Loading documents...</p>
          </div>
        ) : documents.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 text-lg">No documents found</p>
              <p className="text-gray-500 text-sm mt-2">
                {confirmedSearchTerm || typeFilter || statusFilter
                  ? 'Try adjusting your search criteria'
                  : 'Create your first document to get started'}
              </p>
            </CardContent>
          </Card>
        ) : (
          documents.map((document) => (
            <Card key={document.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      {getTypeIcon(document.type)}
                      <h3 className="text-lg font-semibold text-secondary-900">
                        {document.title}
                      </h3>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(document.status)}`}>
                        {document.status.charAt(0).toUpperCase() + document.status.slice(1)}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600 mb-4">
                      <div>
                        <span className="font-medium">Type:</span> {document.type}
                      </div>
                      <div>
                        <span className="font-medium">Start Date:</span>{' '}
                        {document.startDate ? formatDateForTable(document.startDate) : ''}
                      </div>
                      {document.endDate && (
                        <div>
                          <span className="font-medium">End Date:</span>{' '}
                          {formatDateForTable(document.endDate)}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 ml-4">
                    {document.filePath && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDownload(document)}
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigate(`/destination/${document.id}`)}
                    >
                      View Details
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center space-x-2">
          <Button
            variant="outline"
            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
          >
            Previous
          </Button>
          <span className="text-sm text-gray-600">
            Page {currentPage} of {totalPages}
          </span>
          <Button
            variant="outline"
            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
            disabled={currentPage === totalPages}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
};