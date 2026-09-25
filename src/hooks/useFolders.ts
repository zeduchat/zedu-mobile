import { useCallback, useEffect, useState } from 'react';
import { Folder } from '@/types/thread';
import { FileMode } from '@/utils/file-helpers';
import { fileModeToApiMode } from '@/types/files-api';
import { GetRequest } from '@/utils/requests';

type FoldersPagination = {
  current_page: number;
  page_count: number;
  total_pages_count: number;
  total_items: number;
};

type UseFoldersOptions = {
  mode: FileMode;
  limit?: number;
  enabled?: boolean;
};

const useFolders = ({
  mode,
  limit = 200,
  enabled = true,
}: UseFoldersOptions) => {
  const [folders, setFolders] = useState<Folder[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<FoldersPagination | null>(null);
  const [page, setPage] = useState(1);

  const fetchFolders = useCallback(
    async (pageNum: number, isRefresh = false) => {
      if (!enabled) return;

      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);

      const apiMode = fileModeToApiMode(mode);
      const { data, error: requestError } = await GetRequest<{
        data: { folders: Folder[]; pagination: FoldersPagination };
      }>(`/files/folders?mode=${apiMode}&limit=${limit}&page=${pageNum}`);

      if (requestError) {
        setError(
          typeof requestError === 'string'
            ? requestError
            : 'Failed to load folders',
        );
        if (isRefresh || pageNum === 1) {
          setFolders([]);
        }
      } else {
        const nextFolders = data?.data?.folders || [];
        setPagination(data?.data?.pagination || null);
        setFolders(prev =>
          pageNum === 1 ? nextFolders : [...prev, ...nextFolders],
        );
        setPage(pageNum);
      }

      setLoading(false);
      setRefreshing(false);
    },
    [enabled, limit, mode],
  );

  useEffect(() => {
    if (!enabled) {
      return;
    }
    setPage(1);
    fetchFolders(1);
  }, [enabled, fetchFolders, mode]);

  const refresh = useCallback(() => fetchFolders(1, true), [fetchFolders]);

  const loadMore = useCallback(() => {
    if (loading || refreshing || !pagination) return;
    const totalPages =
      pagination.page_count || pagination.total_pages_count || 1;
    if (page >= totalPages) return;
    fetchFolders(page + 1);
  }, [fetchFolders, loading, page, pagination, refreshing]);

  const hasMore = pagination
    ? page < (pagination.page_count || pagination.total_pages_count || 1)
    : false;

  return {
    folders,
    loading,
    refreshing,
    error,
    pagination,
    refresh,
    loadMore,
    hasMore,
  };
};

export default useFolders;
