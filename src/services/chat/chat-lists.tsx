import { useState, useCallback, useEffect, useRef } from 'react';
import { GetRequest } from '@/utils/requests';
import { useDataContext } from '@/store/useDataContext';
import { ACTIONS } from '@/store/types';

export const useDMs = (
  orgId: string | null,
  search: string = '',
  limit: number = 50,
) => {
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const { state, dispatch } = useDataContext();
  const { dms, callback } = state;

  const dmsRef = useRef(dms);
  useEffect(() => {
    dmsRef.current = dms;
  }, [dms, callback]);

  const fetchDMs = useCallback(
    async (isInitial: boolean = true, searchQuery: string = search) => {
      if (!orgId) return;

      // if (isInitial) {
      //     setLoading(true);
      //     dispatch({ type: ACTIONS.DM_LOADING, payload: true });
      // } else {
      //     if (loadingMore || !hasMore) return;
      //     setLoadingMore(true);
      // }

      const currentPage = isInitial ? 1 : page;
      const url = `/organisations/${orgId}/dms?page=${currentPage}&limit=${limit}&search=${searchQuery}`;

      const { data: response, error } = await GetRequest(url);

      if (!error && response) {
        const newList = response.data || [];
        const pagination = response.pagination?.[0];

        let updatedList;
        if (isInitial) {
          updatedList = newList;
        } else {
          const existingIds = new Set(
            dmsRef.current.map(item => item.channel_id),
          );
          const filteredNewList = newList.filter(
            (item: any) => !existingIds.has(item.channel_id),
          );
          updatedList = [...dmsRef.current, ...filteredNewList];
        }

        dispatch({
          type: ACTIONS.DMS,
          payload: updatedList,
        });

        if (pagination) {
          setHasMore(pagination.current_page < pagination.total_pages);
          setPage(pagination.current_page + 1);
        } else {
          setHasMore(newList.length === limit);
          setPage(isInitial ? 2 : page + 1);
        }
      }

      setLoading(false);
      setLoadingMore(false);
      dispatch({ type: ACTIONS.DM_LOADING, payload: false });
    },
    [orgId, page, hasMore, loadingMore, limit, dispatch, search],
  );

  useEffect(() => {
    if (search) {
      setLoading(true);
      // dispatch({ type: ACTIONS.DMS, payload: [] });
    }

    const delayDebounceFn = setTimeout(() => {
      fetchDMs(true, search);
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [search, orgId, callback]);

  const refresh = () => fetchDMs(true);

  const loadMore = () => {
    if (!loading && !loadingMore && hasMore && dms.length >= limit) {
      fetchDMs(false);
    }
  };

  return { loading, loadingMore, refresh, loadMore };
};
