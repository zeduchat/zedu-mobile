import { useState, useCallback } from 'react';
import { GetRequest } from '@/utils/requests';

export const useMarketplace = <T>(endpoint: string, limit: number = 50) => {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const fetchData = useCallback(
    async (isInitial: boolean = true) => {
      if (loading || (loadingMore && !isInitial) || (!hasMore && !isInitial))
        return;

      if (isInitial) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }

      const currentPage = isInitial ? 1 : page;
      const url = `${endpoint}${
        endpoint.includes('?') ? '&' : '?'
      }page=${currentPage}&limit=${limit}`;

      const { data: response, error } = await GetRequest(url);

      if (!error && response) {
        const newList = response.data || [];
        const pagination = response.pagination?.[0];

        setData(prev => (isInitial ? newList : [...prev, ...newList]));

        // Check if current page is less than total pages
        if (pagination) {
          setHasMore(pagination.current_page < pagination.total_pages);
          setPage(pagination.current_page + 1);
        } else {
          setHasMore(false);
        }
      }

      setLoading(false);
      setLoadingMore(false);
    },
    [endpoint, page, limit, loading, loadingMore, hasMore],
  );

  const refresh = () => fetchData(true);
  const loadMore = () => fetchData(false);

  return { data, loading, loadingMore, hasMore, refresh, loadMore };
};
