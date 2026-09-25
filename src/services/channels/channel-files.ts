import { useState, useCallback, useEffect } from 'react';
import { GetRequest, buildQueryString } from '@/utils/requests';

export type ChannelFileMediaItem = {
  id: string;
  file_name: string;
  file_type: string;
  mime_type: string;
  file_link: string;
  user_id: string;
  created_at: string;
  updated_at: string;
  url?: string;
  thread_id?: string;
  username?: string;
  avatar_url?: string;
};

export type ChannelFileThread = {
  thread_id: string;
  user_id: string;
  username: string;
  avatar_url: string;
  created_at: string;
  media: ChannelFileMediaItem[];
};

type ChannelFilesPagination = {
  current_page: number;
  page_size?: number;
  total_items: number;
  total_pages?: number;
  total_pages_count?: number;
};

type ChannelFilesResponse = {
  status: string;
  status_code: number;
  message: string;
  data: ChannelFileThread[];
  pagination?: ChannelFilesPagination;
};

const PAGE_LIMIT = 20;

const flattenChannelFiles = (
  threads: ChannelFileThread[],
): ChannelFileMediaItem[] => {
  return threads.flatMap(thread =>
    (thread.media || []).map(item => ({
      ...item,
      thread_id: thread.thread_id,
      username: thread.username,
      avatar_url: thread.avatar_url,
    })),
  );
};

const isThreadBatch = (items: unknown[]): boolean => {
  const first = items[0];
  if (!first || typeof first !== 'object') {
    return false;
  }
  return Array.isArray((first as ChannelFileThread).media);
};

const normalizeChannelFilesData = (data: unknown): ChannelFileMediaItem[] => {
  if (!Array.isArray(data) || data.length === 0) {
    return [];
  }
  if (isThreadBatch(data)) {
    return flattenChannelFiles(data as ChannelFileThread[]);
  }
  return data as ChannelFileMediaItem[];
};

export const useChannelFiles = (channelId?: string, fileCategory?: string) => {
  const [files, setFiles] = useState<ChannelFileMediaItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      setFiles([]);
      setError(null);
      setPage(1);
      setHasMore(false);

      const query = buildQueryString({
        page: 1,
        limit: PAGE_LIMIT,
        type: fileCategory || undefined,
      });

      const { data: response } = await GetRequest<ChannelFilesResponse>(
        `/channels/${channelId}/files?${query}`,
      );

      if (response) {
        const flattened = normalizeChannelFilesData(response.data);
        const pagination = response.pagination;
        const currentPageNum = Number(pagination?.current_page ?? 1);
        const totalPages = Number(
          pagination?.total_pages ?? pagination?.total_pages_count ?? 1,
        );

        setFiles(flattened);
        setPage(currentPageNum);
        setHasMore(currentPageNum < totalPages);

        setLoading(false);
      } else {
        setLoading(false);
      }
    };

    load();
  }, [channelId, fileCategory]);

  const loadMore = useCallback(async () => {
    if (!channelId || loading || loadingMore || !hasMore) {
      return;
    }

    setLoadingMore(true);

    const nextPage = page + 1;
    const query = buildQueryString({
      page: nextPage,
      limit: PAGE_LIMIT,
      type: fileCategory || undefined,
    });

    const { data: response, error: fetchError } =
      await GetRequest<ChannelFilesResponse>(
        `/channels/${channelId}/files?${query}`,
      );

    if (!fetchError && response) {
      const flattened = normalizeChannelFilesData(response.data);
      const pagination = response.pagination;
      const currentPageNum = Number(pagination?.current_page ?? nextPage);
      const totalPages = Number(
        pagination?.total_pages ?? pagination?.total_pages_count ?? 1,
      );

      setFiles(prev => [...prev, ...flattened]);
      setPage(currentPageNum);
      setHasMore(currentPageNum < totalPages);
      setLoadingMore(false);
    }
  }, [channelId, fileCategory, hasMore, loading, loadingMore, page]);

  return {
    files,
    loading,
    setLoading,
    loadingMore,
    hasMore,
    error,
    loadMore,
  };
};
