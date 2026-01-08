import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, FileText, Download, Printer, Edit, Trash2, Calendar, User, Building } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { Button } from '../ui/Button';
import { PDFViewer } from '../ui/PDFViewer';
import { useLanguage } from '../../contexts/LanguageContext';
import { useDocument } from '../../hooks/useDocuments';
import { documentService } from '../../services/documentService';

export const DocumentDetail: React.FC = () => {
  const { t: _t } = useLanguage();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [showPDF, setShowPDF] = useState(false);

  const { document, loading, error, refetch: _refetch } = useDocument(id || '');

  const handleDownload = async () => {
    if (document?.filePath) {
      try {
        await documentService.downloadDocument(document.filePath, `${document.title}.pdf`);
      } catch (error) {
        console.error('Download failed:', error);
      }
    }
  };

  const handlePrint = () => {
    if (document?.filePath) {
      const documentUrl = documentService.getDocumentUrl(document.filePath);
      window.open(documentUrl, '_blank');
    }
  };

  const handleDelete = async () => {
    if (document && window.confirm('Are you sure you want to delete this document?')) {
      try {
        await documentService.deleteDocument(String(document.id));
        navigate('/destinations');
      } catch (error) {
        console.error('Delete failed:', error);
      }
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

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'staff':
        return <User className="h-5 w-5 text-primary-600" />;
      case 'property':
        return <Building className="h-5 w-5 text-primary-600" />;
      default:
        return <FileText className="h-5 w-5 text-primary-600" />;
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 pb-20 md:pb-6">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto mb-2"></div>
          <p className="text-gray-600">Loading document...</p>
        </div>
      </div>
    );
  }

  if (error || !document) {
    return (
      <div className="space-y-6 pb-20 md:pb-6">
        <div className="text-center py-12">
          <p className="text-red-600 text-lg">{error || 'Document not found'}</p>
          <Button onClick={() => navigate('/destinations')} className="mt-4">
            Back
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-20 md:pb-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            onClick={() => navigate('/destinations')}
            className="text-secondary-600"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <h1 className="text-2xl md:text-3xl font-bold text-secondary-900">
            Document Details
          </h1>
        </div>

        <div className="flex items-center space-x-2">
          {document.filePath && (
            <>
              <Button
                variant="outline"
                onClick={() => setShowPDF(!showPDF)}
              >
                <FileText className="h-4 w-4 mr-2" />
                {showPDF ? 'Hide PDF' : 'View PDF'}
              </Button>
              <Button
                variant="outline"
                onClick={handleDownload}
              >
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>
              <Button
                variant="outline"
                onClick={handlePrint}
              >
                <Printer className="h-4 w-4 mr-2" />
                Print
              </Button>
            </>
          )}
          <Button
            variant="outline"
            onClick={() => navigate(`/destinations/${document.id}/edit`)}
          >
            <Edit className="h-4 w-4 mr-2" />
            Edit
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
          </Button>
        </div>
      </div>

      {/* Document Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              {getTypeIcon(document.type)}
              <span>{document.title}</span>
            </div>
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(document.status)}`}>
              {document.status.charAt(0).toUpperCase() + document.status.slice(1)}
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div>
              <label className="text-sm font-medium text-gray-600">Document Type</label>
              <p className="text-lg text-secondary-900 capitalize">{document.type}</p>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-600">Related Entity ID</label>
              <p className="text-lg text-secondary-900">{document.relatedEntityId}</p>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-600">Status</label>
              <p className="text-lg text-secondary-900 capitalize">{document.status}</p>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-600">Start Date</label>
              <div className="flex items-center space-x-2">
                <Calendar className="h-4 w-4 text-gray-400" />
                <p className="text-lg text-secondary-900">
                  {new Date(document.startDate).toLocaleDateString()}
                </p>
              </div>
            </div>

            {document.endDate && (
              <div>
                <label className="text-sm font-medium text-gray-600">End Date</label>
                <div className="flex items-center space-x-2">
                  <Calendar className="h-4 w-4 text-gray-400" />
                  <p className="text-lg text-secondary-900">
                    {new Date(document.endDate).toLocaleDateString()}
                  </p>
                </div>
              </div>
            )}

            <div>
              <label className="text-sm font-medium text-gray-600">Created</label>
              <p className="text-lg text-secondary-900">
                {new Date(document.createdAt).toLocaleDateString()}
              </p>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-600">Last Updated</label>
              <p className="text-lg text-secondary-900">
                {new Date(document.updatedAt).toLocaleDateString()}
              </p>
            </div>

            {document.filePath && (
              <div>
                <label className="text-sm font-medium text-gray-600">Document File</label>
                <p className="text-lg text-secondary-900">
                  {document.filePath.split('/').pop()}
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* PDF Viewer */}
      {showPDF && document.filePath && (
        <PDFViewer
          fileUrl={documentService.getDocumentUrl(document.filePath)}
          fileName={`${document.title}.pdf`}
          className="w-full"
        />
      )}
    </div>
  );
};