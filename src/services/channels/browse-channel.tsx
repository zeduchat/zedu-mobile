import { useState, useCallback, useEffect, useRef } from 'react';
import { GetRequest } from '@/utils/requests';
import { useDataContext } from '@/store/useDataContext';
import { ACTIONS } from '@/store/types';

export const useBrowseChannels = (
  orgId: string | null,
  search: string = '',
  limit: number = 50,
) => {
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const { state, dispatch } = useDataContext();
  const { allChannels: channels, channelCallback } = state;

  const channelsRef = useRef(channels);
  useEffect(() => {
    channelsRef.current = channels;
  }, [channels]);

  const fetchChannels = useCallback(
    async (isInitial: boolean = true, searchQuery: string = search) => {
      if (!orgId) return;

      if (isInitial) {
        setLoading(true);
        dispatch({ type: ACTIONS.CHANNEL_LOADING, payload: true });
      } else {
        if (loadingMore || !hasMore) return;
        setLoadingMore(true);
      }

      const currentPage = isInitial ? 1 : page;
      const url = `/organisations/${orgId}/channels?page=${currentPage}&limit=${limit}&search=${searchQuery}`;

      const { data: response, error } = await GetRequest(url);

      if (!error && response) {
        const newList = response.data || [];
        const pagination = response.pagination?.[0];

        let updatedList;
        if (isInitial) {
          updatedList = newList;
        } else {
          const existingIds = new Set(
            channelsRef.current.map(item => item.channels_id),
          );
          const filteredNewList = newList.filter(
            (item: any) => !existingIds.has(item.channels_id),
          );
          updatedList = [...channelsRef.current, ...filteredNewList];
        }

        dispatch({
          type: ACTIONS.ALL_CHANNELS,
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
      dispatch({ type: ACTIONS.CHANNEL_LOADING, payload: false });
    },
    [orgId, page, hasMore, loadingMore, limit, dispatch, search],
  );

  useEffect(() => {
    if (search) {
      setLoading(true);
      // dispatch({ type: ACTIONS.ALL_CHANNELS, payload: [] });
    }
    const delayDebounceFn = setTimeout(() => {
      fetchChannels(true, search);
    }, 500);
    return () => clearTimeout(delayDebounceFn);
  }, [search, orgId, channelCallback]);

  const refresh = () => fetchChannels(true);

  const loadMore = () => {
    if (!loading && !loadingMore && hasMore && channels.length >= limit) {
      fetchChannels(false);
    }
  };

  return { channels, loading, loadingMore, refresh, loadMore };
};
