import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, Download, Trash2, Search, FileText } from 'lucide-react';
import { Button } from '../ui/Button';
import { BackButton } from '../ui/BackButton';
import { Card, CardContent, CardHeader } from '../ui/Card';
import { Input } from '../ui/Input';
import { useLanguage } from '../../contexts/LanguageContext';
import { useToast } from '../../contexts/ToastContext';


interface Document {
  id: number;
  title: string;
  type: string;
  filePath: string | null;
  status: string;
  startDate: string;
  endDate: string | null;
  createdAt: string;
  updatedAt: string;
}

export const Manual: React.FC = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { showError, showSuccess } = useToast();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [confirmedSearchTerm, setConfirmedSearchTerm] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const loadDocuments = useCallback(async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('authToken');
      const response = await fetch('/api/documents?type=MANUAL', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        setDocuments(data.data || []);
      } else {
        throw new Error('Failed to load manuals');
      }
    } catch (error) {
      console.error('Error loading manuals:', error);
      showError(t('manual.errorLoadingManuals'));
    } finally {
      setLoading(false);
    }
  }, [showError, t]);

  // Load documents on component mount
  useEffect(() => {
    loadDocuments();
  }, [loadDocuments]);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type and size
      const maxSize = 10 * 1024 * 1024; // 10MB
      const allowedTypes = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'text/plain',
        'image/jpeg',
        'image/png'
      ];

      if (!allowedTypes.includes(file.type)) {
        showError(t('manual.invalidFileType'));
        return;
      }

      if (file.size > maxSize) {
        showError(t('manual.fileTooLarge'));
        return;
      }

      setSelectedFile(file);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    try {
      setUploading(true);
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('type', 'MANUAL');
      formData.append('title', selectedFile.name);
      formData.append('relatedEntityId', `MANUAL-${Date.now()}`);

      const token = localStorage.getItem('authToken');
      const response = await fetch('/api/documents/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      if (response.ok) {
        await response.json();
        showSuccess(t('manual.uploadSuccess'));
        setSelectedFile(null);
        const fileInput = window.document.getElementById('file-input') as HTMLInputElement;
        if (fileInput) fileInput.value = '';
        await loadDocuments();
      } else {
        throw new Error('Upload failed');
      }
    } catch (error) {
      console.error('Error uploading document:', error);
      showError(t('manual.uploadError'));
    } finally {
      setUploading(false);
    }
  };

  const handleDownload = async (document: Document) => {
    try {
      if (!document.filePath) {
        showError(t('manual.noFileAvailable'));
        return;
      }
      window.open(document.filePath, '_blank');
      showSuccess(t('manual.downloadSuccess'));
    } catch (error) {
      console.error('Error downloading document:', error);
      showError(t('manual.downloadError'));
    }
  };

  const handleDelete = async (document: Document) => {
    if (!window.confirm(t('manual.confirmDelete', { name: document.title }))) {
      return;
    }

    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`/api/documents/${document.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        showSuccess(t('manual.deleteSuccess'));
        await loadDocuments();
      } else {
        throw new Error('Delete failed');
      }
    } catch (error) {
      console.error('Error deleting document:', error);
      showError(t('manual.deleteError'));
    }
  };

  const filteredDocuments = documents.filter(doc =>
    doc.title.toLowerCase().includes(confirmedSearchTerm.toLowerCase())
  );

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center space-x-4">
          <BackButton onBack={() => navigate('/complaint-details')} />
          <div>
            <h1 className="text-2xl font-bold text-secondary-900">
              {t('manual.title')}
            </h1>
            <p className="text-secondary-600 mt-1">
              {t('manual.subtitle')}
            </p>
          </div>
        </div>
      </div>

      {/* Upload Section */}
      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold text-secondary-900">
            {t('manual.uploadManual')}
          </h2>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <label htmlFor="file-input" className="sr-only">
                  {t('manual.selectFile')}
                </label>
                <input
                  id="file-input"
                  type="file"
                  onChange={handleFileSelect}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png"
                  aria-describedby="file-input-help"
                />
                <div className="flex items-center justify-between w-full px-3 py-2 border border-secondary-300 rounded-md bg-white hover:bg-secondary-50 cursor-pointer focus-within:ring-2 focus-within:ring-primary-500 focus-within:border-primary-500">
                  <span className="text-sm text-secondary-500 truncate">
                    {selectedFile ? selectedFile.name : t('manual.noFileSelected')}
                  </span>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="ml-2 flex-shrink-0 pointer-events-none"
                  >
                    {t('manual.selectFile')}
                  </Button>
                </div>
              </div>
            </div>
            <Button
              onClick={handleUpload}
              disabled={!selectedFile || uploading}
              className="flex items-center gap-2"
            >
              <Upload className="h-4 w-4" />
              {uploading ? t('common.status.processing') : t('manual.upload')}
            </Button>
          </div>

          {selectedFile && (
            <div className="flex items-center gap-2 p-3 bg-primary-50 rounded-md">
              <FileText className="h-4 w-4 text-primary-600" />
              <span className="text-sm text-primary-700">
                {selectedFile.name}
              </span>
            </div>
          )}

          <div id="file-input-help" className="text-xs text-secondary-500">
            {t('manual.uploadInstructions')}
          </div>
          <p className="text-xs text-secondary-500 mt-2">
            {t('manual.fileSizeLimit')}: 10MB
          </p>
        </CardContent>
      </Card>

      {/* Search and Documents List */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <h2 className="text-lg font-semibold text-secondary-900">
              {t('manual.manualList')}
            </h2>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-secondary-400" />
                <Input
                  id="manual-search"
                  placeholder={t('manual.searchManuals')}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && setConfirmedSearchTerm(searchTerm)}
                  className="pl-10"
                  size="compact"
                  aria-label={t('manual.searchManuals')}
                />
              </div>
              <Button
                onClick={() => setConfirmedSearchTerm(searchTerm)}
                size="sm"
                aria-label="Search manuals"
              >
                <Search className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-secondary-500">{t('common.status.loading')}</div>
            </div>
          ) : filteredDocuments.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 text-secondary-300 mx-auto mb-4" />
              <p className="text-secondary-500">
                {confirmedSearchTerm ? t('manual.noSearchResults') : t('manual.noManuals')}
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredDocuments.map((document) => (
                <div
                  key={document.id}
                  className="flex items-center justify-between p-4 border border-secondary-200 rounded-lg hover:bg-secondary-50"
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <FileText className="h-5 w-5 text-secondary-400 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-secondary-900 truncate">
                        {document.title}
                      </h3>
                      <p className="text-sm text-secondary-500">
                        {formatDate(document.createdAt)} • {document.status}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDownload(document)}
                      className="flex items-center gap-1"
                    >
                      <Download className="h-4 w-4" />
                      {t('manual.download')}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(document)}
                      className="flex items-center gap-1 text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                      {t('common.actions.delete')}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};