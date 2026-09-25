import { useCallback, useEffect, useRef, useState } from 'react';
import { Media } from '@/types/thread';
import { FileMode } from '@/utils/file-helpers';
import { GetRequest } from '@/utils/requests';
import {
  FilesListQueryFilters,
  buildFilesListQuery,
  mapFilesFiltersToRequest,
} from '@/types/files-api';

type FilesPagination = {
  current_page: number;
  page_count: number;
  total_pages_count: number;
  total_items: number;
};

type UseFilesOptions = {
  mode: FileMode;
  folderId?: string | null;
  limit?: number;
  enabled?: boolean;
  filters?: FilesListQueryFilters;
};

const useFiles = ({
  mode,
  folderId = null,
  limit = 200,
  enabled = true,
  filters,
}: UseFilesOptions) => {
  const [files, setFiles] = useState<Media[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<FilesPagination | null>(null);
  const [page, setPage] = useState(1);

  const filtersRef = useRef(filters);
  useEffect(() => {
    filtersRef.current = filters;
  }, [filters]);

  const fetchFiles = useCallback(
    async (pageNum: number, isRefresh = false) => {
      if (!enabled) return;

      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);

      const query = buildFilesListQuery(
        mapFilesFiltersToRequest(
          mode,
          pageNum,
          limit,
          folderId,
          filtersRef.current,
        ),
      );

      const { data, error: requestError } = await GetRequest<{
        data: { files: Media[]; pagination: FilesPagination };
      }>(`/files?${query}`);

      if (requestError) {
        setError(
          typeof requestError === 'string'
            ? requestError
            : 'Failed to load files',
        );
        if (isRefresh || pageNum === 1) {
          setFiles([]);
        }
      } else {
        const nextFiles = data?.data?.files || [];
        setPagination(data?.data?.pagination || null);
        setFiles(prev => (pageNum === 1 ? nextFiles : [...prev, ...nextFiles]));
        setPage(pageNum);
      }

      setLoading(false);
      setRefreshing(false);
    },
    [enabled, folderId, limit, mode],
  );

  useEffect(() => {
    setPage(1);
    fetchFiles(1);
  }, [fetchFiles, filters, mode, folderId]);

  const refresh = useCallback(() => fetchFiles(1, true), [fetchFiles]);

  const loadMore = useCallback(() => {
    if (loading || refreshing || !pagination) return;
    const totalPages =
      pagination.total_pages_count || pagination.page_count || 1;
    if (page >= totalPages) return;
    fetchFiles(page + 1);
  }, [fetchFiles, loading, page, pagination, refreshing]);

  const hasMore = pagination
    ? page < (pagination.total_pages_count || pagination.page_count || 1)
    : false;

  return {
    files,
    loading,
    refreshing,
    error,
    pagination,
    refresh,
    loadMore,
    hasMore,
  };
};

export const fetchFileById = async (fileId: string) => {
  const { data, error } = await GetRequest<{ data: Media }>(
    `/files/file/${fileId}`,
  );
  if (error) {
    return { file: null, error };
  }
  return { file: data?.data || null, error: null };
};

export default useFiles;
