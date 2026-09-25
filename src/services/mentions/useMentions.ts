import { useState, useCallback, useEffect, useRef } from 'react';
import { GetRequest } from '@/utils/requests';
import { useDataContext } from '@/store/useDataContext';
import { ACTIONS } from '@/store/types';
import { ThreadListItem } from '@/types/thread';
import { parseOrganisationThreadsResponse } from './parse-organisation-threads';

export type MentionApiItem = ThreadListItem;

export const useMentions = (orgId: string | null, limit: number = 20) => {
  const { state, dispatch } = useDataContext();
  const { mentionsList } = state;

  const [isLoading, setIsLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [isFetchingMore, setIsFetchingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const mentionsRef = useRef(mentionsList);
  useEffect(() => {
    mentionsRef.current = mentionsList;
  }, [mentionsList]);

  const fetchMentions = useCallback(
    async (isInitial: boolean = true) => {
      if (!orgId) return;

      if (isInitial) {
        setIsLoading(true);
      } else {
        if (isFetchingMore || !hasMore) return;
        setIsFetchingMore(true);
      }

      const pageNum = isInitial ? 1 : page + 1;

      try {
        const { data, error } = await GetRequest(
          `/threads/organisations/${orgId}?page=${pageNum}&limit=${limit}`,
        );

        if (!error && data?.data) {
          const { threads: newList, unseenThreadCount } =
            parseOrganisationThreadsResponse(data);
          const pagination = data.pagination?.[0] || data.pagination;

          let updatedList: ThreadListItem[];
          if (isInitial) {
            updatedList = newList;
          } else {
            const existingIds = new Set(
              mentionsRef.current.map(item => item.thread_id),
            );
            const uniqueNewItems = newList.filter(
              item => !existingIds.has(item.thread_id),
            );
            updatedList = [...mentionsRef.current, ...uniqueNewItems];
          }

          dispatch({
            type: ACTIONS.MENTIONS_LIST,
            payload: updatedList,
          });

          if (isInitial) {
            dispatch({
              type: ACTIONS.UNSEEN_THREAD_COUNT,
              payload: unseenThreadCount,
            });
          }

          setPage(pageNum);

          const totalPages = pagination?.total_pages_count || 1;
          setHasMore(pageNum < totalPages && newList.length === limit);
        }
      } catch (error) {
        console.error('Error fetching mentions:', error);
      } finally {
        setIsLoading(false);
        setIsFetchingMore(false);
        setRefreshing(false);
      }
    },
    [orgId, limit, page, hasMore, isFetchingMore, dispatch],
  );

  useEffect(() => {
    fetchMentions(true);
  }, [
    orgId,
    state?.callback,
    state?.channelCallback,
    state?.loadThreadCallback,
  ]);

  const handleLoadMore = () => {
    fetchMentions(false);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchMentions(true);
  };

  return {
    mentionList: mentionsList,
    isLoading,
    isFetchingMore,
    hasMore,
    refreshing,
    handleLoadMore,
    onRefresh,
  };
};
