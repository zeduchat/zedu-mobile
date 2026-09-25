import { useState, useCallback, useEffect, useRef } from 'react';
import { ACTIONS } from '@/store/types';
import { useDataContext } from '@/store/useDataContext';
import { GetRequest } from '@/utils/requests';

interface Props {
  channel_id: string;
  thread_id: string;
}

const UseReplyChat = ({ channel_id, thread_id }: Props) => {
  const { state, dispatch } = useDataContext();
  const [page, setPage] = useState(1);
  const [isFetchingMore, setIsFetchingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  const initialFetched = useRef(false);

  const getChat = useCallback(async () => {
    const { data, error } = await GetRequest(
      `/threads/${thread_id}/channels/${channel_id}?page=1&limit=50`,
    );

    if (!error) {
      dispatch({
        type: ACTIONS.REPLY_CHAT,
        payload: {
          data: data.data,
          page: 1,
        },
      });
      setPage(1);
      if (data.data.length < 50) setHasMore(false);
    }
  }, [channel_id, thread_id, dispatch]);

  useEffect(() => {
    initialFetched.current = false;
    setHasMore(true);
    setPage(1);
  }, [channel_id, thread_id]);

  useEffect(() => {
    if (!initialFetched.current) {
      getChat();
      initialFetched.current = true;
    }
  }, [getChat, channel_id, thread_id]);

  const loadMore = useCallback(async () => {
    // Guard: Don't fetch if already fetching, no more data, or list is too short
    if (isFetchingMore || !hasMore || (state?.replyChat?.length || 0) < 20)
      return;

    setIsFetchingMore(true);
    const nextPage = page + 1;

    try {
      const { data, error } = await GetRequest(
        `/threads/channels/${channel_id}?page=${nextPage}&limit=50`,
      );

      if (!error && data?.data && data.data.length > 0) {
        const freshMessages = data.data;

        // --- SENIOR FIX: DEDUPLICATION ---
        // Get IDs currently in your global state
        const currentIds = new Set(
          state.replyChat.map((m: any) => m.id ?? m.message_id),
        );

        const uniqueNewMessages = freshMessages.filter((m: any) => {
          const id = m.id ?? m.message_id;
          return id && !currentIds.has(id);
        });

        if (uniqueNewMessages.length > 0) {
          dispatch({
            type: ACTIONS.REPLY_CHAT,
            payload: {
              data: uniqueNewMessages,
              page: nextPage,
            },
          });
          setPage(nextPage);
        }

        // Pagination check
        const paginationDetails = data.pagination?.[0];
        if (
          !paginationDetails ||
          nextPage >= paginationDetails.total_pages_count
        ) {
          setHasMore(false);
        }
      } else {
        setHasMore(false);
      }
    } catch (err) {
      console.error('LoadMore Error:', err);
    } finally {
      setIsFetchingMore(false);
    }
  }, [
    channel_id,
    thread_id,
    page,
    isFetchingMore,
    hasMore,
    dispatch,
    state?.replyChat,
  ]);

  return { loadMore, isFetchingMore };
};

export default UseReplyChat;
