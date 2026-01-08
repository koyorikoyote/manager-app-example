import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Download, Printer, ZoomIn, ZoomOut } from 'lucide-react';
import { Button } from './Button';
import { Card, CardContent } from './Card';
import { useLocalization } from '../../hooks/useLocalization';

// Dynamically import PDF.js only in browser environment
let Document: any, Page: any, pdfjs: any;

if (typeof window !== 'undefined') {
  const pdfModule = require('react-pdf');
  Document = pdfModule.Document;
  Page = pdfModule.Page;
  pdfjs = pdfModule.pdfjs;

  // Set up PDF.js worker only in browser
  pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;
}

interface PDFViewerProps {
  fileUrl: string;
  fileName?: string;
  className?: string;
}

export const PDFViewer: React.FC<PDFViewerProps> = ({
  fileUrl,
  fileName = 'document.pdf',
  className = ''
}) => {
  const { t } = useLocalization();
  const [numPages, setNumPages] = useState<number>(0);
  const [pageNumber, setPageNumber] = useState<number>(1);
  const [scale, setScale] = useState<number>(1.0);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
    setLoading(false);
    setError(null);
  };

  const onDocumentLoadError = (error: Error) => {
    setError('Failed to load PDF document');
    setLoading(false);
    console.error('PDF load error:', error);
  };

  const goToPrevPage = () => {
    setPageNumber(prev => Math.max(1, prev - 1));
  };

  const goToNextPage = () => {
    setPageNumber(prev => Math.min(numPages, prev + 1));
  };

  const zoomIn = () => {
    setScale(prev => Math.min(3.0, prev + 0.2));
  };

  const zoomOut = () => {
    setScale(prev => Math.max(0.5, prev - 0.2));
  };

  const handleDownload = async () => {
    try {
      const response = await fetch(fileUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Download failed:', error);
    }
  };

  const handlePrint = () => {
    window.open(fileUrl, '_blank');
  };

  // Server-side rendering fallback
  if (typeof window === 'undefined' || !Document || !Page) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <div className="text-center">
            <p className="text-lg font-medium">{t('documents.viewerTitle')}</p>
            <p className="text-sm mt-2 text-gray-600">{t('documents.loadingViewer')}</p>
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => window?.open(fileUrl, '_blank')}
            >
              <Download className="h-4 w-4 mr-1" />
              {t('documents.openPdf')}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <div className="text-center text-red-600">
            <p className="text-lg font-medium">{t('documents.errorLoadingPdf')}</p>
            <p className="text-sm mt-2">{error}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardContent className="p-0">
        {/* PDF Controls */}
        <div className="flex items-center justify-between p-4 border-b bg-gray-50">
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={goToPrevPage}
              disabled={pageNumber <= 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm font-medium">
              {loading ? t('common.status.loading') : `${pageNumber} / ${numPages}`}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={goToNextPage}
              disabled={pageNumber >= numPages}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={zoomOut}
              disabled={scale <= 0.5}
            >
              <ZoomOut className="h-4 w-4" />
            </Button>
            <span className="text-sm font-medium">
              {Math.round(scale * 100)}%
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={zoomIn}
              disabled={scale >= 3.0}
            >
              <ZoomIn className="h-4 w-4" />
            </Button>
          </div>

          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownload}
            >
              <Download className="h-4 w-4 mr-1" />
              {t('documents.download')}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handlePrint}
            >
              <Printer className="h-4 w-4 mr-1" />
              {t('documents.print')}
            </Button>
          </div>
        </div>

        {/* PDF Document */}
        <div className="flex justify-center p-4 bg-gray-100 min-h-[600px]">
          {loading && (
            <div className="flex items-center justify-center h-96">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto mb-2"></div>
                <p className="text-sm text-gray-600">{t('documents.loadingPdf')}</p>
              </div>
            </div>
          )}

          <Document
            file={fileUrl}
            onLoadSuccess={onDocumentLoadSuccess}
            onLoadError={onDocumentLoadError}
            loading=""
            className="shadow-lg"
          >
            <Page
              pageNumber={pageNumber}
              scale={scale}
              renderTextLayer={false}
              renderAnnotationLayer={false}
            />
          </Document>
        </div>
      </CardContent>
    </Card>
  );
};
