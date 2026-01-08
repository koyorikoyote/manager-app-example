import { useState, useEffect, useCallback } from "react";
import { Document } from "../../shared/types";
import { documentService } from "../services/documentService";

export const useDocuments = (params?: {
  search?: string;
  type?: string;
  status?: string;
  page?: number;
  limit?: number;
}) => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDocuments = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await documentService.getDocuments(params);
      setDocuments(result.documents);
      setTotal(result.total);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to fetch documents"
      );
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    params?.search,
    params?.type,
    params?.status,
    params?.page,
    params?.limit,
  ]);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  const refetch = useCallback(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  return {
    documents,
    total,
    loading,
    error,
    refetch,
  };
};

export const useDocument = (id: string) => {
  const [document, setDocument] = useState<Document | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDocument = async () => {
      try {
        setLoading(true);
        setError(null);
        const result = await documentService.getDocument(id);
        setDocument(result);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to fetch document"
        );
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchDocument();
    }
  }, [id]);

  const refetch = async () => {
    if (id) {
      try {
        setLoading(true);
        setError(null);
        const result = await documentService.getDocument(id);
        setDocument(result);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to fetch document"
        );
      } finally {
        setLoading(false);
      }
    }
  };

  return {
    document,
    loading,
    error,
    refetch,
  };
};
