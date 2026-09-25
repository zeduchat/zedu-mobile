import { useState, useCallback, useEffect } from 'react';
import { ACTIONS } from '@/store/types';
import { useDataContext } from '@/store/useDataContext';
import { GetRequest } from '@/utils/requests';

interface Props {
  channel_id: string;
}

const UseChannelChat = ({ channel_id }: Props) => {
  const { state, dispatch } = useDataContext();
  const [page, setPage] = useState(1);
  const [isFetchingMore, setIsFetchingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    const getChat = async () => {
      const { data, error } = await GetRequest(
        `/threads/channels/${channel_id}?page=1&limit=50`,
      );
      if (!error) {
        dispatch({
          type: ACTIONS.CHANNELS_CHAT,
          payload: {
            data: data.data,
            page: 1,
          },
        });
        setPage(1);
        const paginationDetails = data.pagination?.[0];
        if (paginationDetails?.total_pages_count) {
          setHasMore(paginationDetails.total_pages_count > 1);
        } else {
          setHasMore((data.data?.length || 0) >= 50);
        }
      }
    };
    getChat();
  }, [state?.channelCallback]);

  const loadMore = useCallback(async () => {
    if (isFetchingMore || !hasMore || (state?.channelsChat?.length || 0) < 50)
      return;

    setIsFetchingMore(true);
    const nextPage = page + 1;

    try {
      const { data, error } = await GetRequest(
        `/threads/channels/${channel_id}?page=${nextPage}&limit=50`,
      );

      if (!error && data?.data) {
        const freshMessages = data.data;
        const paginationDetails = data.pagination[0];

        dispatch({
          type: ACTIONS.CHANNELS_CHAT,
          payload: {
            data: freshMessages,
            page: nextPage,
          },
        });

        setPage(nextPage);

        if (nextPage >= (paginationDetails?.total_pages_count || 0)) {
          setHasMore(false);
        }
      } else {
        setHasMore(false);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsFetchingMore(false);
    }
  }, [
    channel_id,
    page,
    isFetchingMore,
    hasMore,
    dispatch,
    state?.channelsChat,
  ]);

  return { loadMore, isFetchingMore };
};

export default UseChannelChat;
