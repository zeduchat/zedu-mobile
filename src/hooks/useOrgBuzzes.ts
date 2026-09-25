import { useState, useCallback, useEffect, useRef } from 'react';
import BuzzService from '@/services/buzz.service';
import { OrgBuzz } from '@/types/buzz';
import { normalizeOrgBuzzPagination, OrgBuzzFilter } from '@/utils/org-buzz';

const PAGE_LIMIT = 20;

interface UseOrgBuzzesOptions {
  search?: string;
  filter?: OrgBuzzFilter;
}

export const useOrgBuzzes = ({
  search = '',
  filter = 'all',
}: UseOrgBuzzesOptions = {}) => {
  const [buzzes, setBuzzes] = useState<OrgBuzz[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const buzzesRef = useRef<OrgBuzz[]>([]);
  useEffect(() => {
    buzzesRef.current = buzzes;
  }, [buzzes]);

  const fetchBuzzes = useCallback(
    async (isInitial: boolean) => {
      if (isInitial) {
        setLoading(true);
      } else {
        if (loadingMore || !hasMore) {
          return;
        }
        setLoadingMore(true);
      }

      const currentPage = isInitial ? 1 : page;
      const {
        buzzes: newBuzzes,
        pagination,
        error: fetchError,
      } = await BuzzService.getOrgBuzzes(currentPage, PAGE_LIMIT, {
        search,
        filter,
      });

      if (!fetchError) {
        const paginationMeta = normalizeOrgBuzzPagination(pagination);
        const currentPageNum = Number(
          paginationMeta?.current_page ?? currentPage,
        );
        const totalPages = Number(paginationMeta?.total_pages_count ?? 0);

        let updatedList: OrgBuzz[];
        if (isInitial) {
          updatedList = newBuzzes;
        } else {
          const existingIds = new Set(
            buzzesRef.current.map(item => item.buzz_id),
          );
          const filteredNewList = newBuzzes.filter(
            item => !existingIds.has(item.buzz_id),
          );
          updatedList = [...buzzesRef.current, ...filteredNewList];
        }

        setBuzzes(updatedList);
        setTotalCount(
          Number(paginationMeta?.total_items ?? updatedList.length),
        );
        setError(null);

        if (paginationMeta && totalPages > 0) {
          setHasMore(currentPageNum < totalPages);
          setPage(currentPageNum + 1);
        } else {
          setHasMore(newBuzzes.length >= PAGE_LIMIT);
          setPage(isInitial ? 2 : page + 1);
        }
      } else {
        setError(fetchError);
        if (isInitial) {
          setBuzzes([]);
          setTotalCount(0);
          setHasMore(false);
        }
      }

      setLoading(false);
      setLoadingMore(false);
    },
    [filter, hasMore, loadingMore, page, search],
  );

  useEffect(() => {
    setPage(1);
    setHasMore(true);
    fetchBuzzes(true);
  }, [search, filter]);

  const refresh = useCallback(() => {
    setPage(1);
    setHasMore(true);
    fetchBuzzes(true);
  }, [fetchBuzzes]);

  const loadMore = useCallback(() => {
    if (!loading && !loadingMore && hasMore && buzzes.length >= PAGE_LIMIT) {
      fetchBuzzes(false);
    }
  }, [buzzes.length, fetchBuzzes, hasMore, loading, loadingMore]);

  return {
    buzzes,
    loading,
    loadingMore,
    totalCount,
    hasMore,
    error,
    refresh,
    loadMore,
  };
};
