import { useState, useCallback, useEffect } from 'react';
import { GetRequest } from '@/utils/requests';

export const useOrgAgents = (
  orgId: string | null,
  callback: boolean,
  limit: number = 50,
) => {
  const [agents, setAgents] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const fetchAgents = useCallback(
    async (isInitial: boolean = true) => {
      if (
        !orgId ||
        loading ||
        (loadingMore && !isInitial) ||
        (!hasMore && !isInitial)
      )
        return;

      if (isInitial) {
        setLoading(true);
        setPage(1);
      } else {
        setLoadingMore(true);
      }

      const currentPage = isInitial ? 1 : page;
      const url = `/organisations/${orgId}/fetch-bots?page=${currentPage}&limit=${limit}`;

      const { data: response, error } = await GetRequest(url);

      if (!error && response) {
        const newList = response.data || [];
        const pagination = response.pagination?.[0];

        setAgents(prev => (isInitial ? newList : [...prev, ...newList]));

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
    [orgId, page, hasMore, loading, loadingMore, limit],
  );

  const refresh = () => fetchAgents(true);
  const loadMore = () => fetchAgents(false);

  useEffect(() => {
    refresh();
  }, [orgId, callback]);

  return { agents, loading, loadingMore, hasMore, refresh, loadMore };
};
