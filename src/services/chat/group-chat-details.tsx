import { useState, useCallback } from 'react';
import { ACTIONS } from '@/store/types';
import { useDataContext } from '@/store/useDataContext';
import { GetRequest } from '@/utils/requests';
import { useFocusEffect } from '@react-navigation/native';

interface Props {
  channel_id: string;
}

const UseGroupChatDetails = ({ channel_id }: Props) => {
  const { state, dispatch } = useDataContext();
  const [page, setPage] = useState(1);
  const [isFetchingMore, setIsFetchingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  const fetchFirstPage = useCallback(async () => {
    const { data } = await GetRequest(
      `/group-dms/channels/${channel_id}/threads?page=1&limit=50`,
    );
    if (data) {
      dispatch({
        type: ACTIONS.DMS_CHAT,
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
  }, [channel_id, dispatch]);

  useFocusEffect(
    useCallback(() => {
      fetchFirstPage();
    }, [fetchFirstPage, state?.callback]),
  );

  const loadMore = useCallback(async () => {
    if (isFetchingMore || !hasMore || state?.dmsChat?.length < 50) return;

    setIsFetchingMore(true);
    const nextPage = page + 1;

    try {
      const { data, error } = await GetRequest(
        `/group-dms/channels/${channel_id}/threads?page=${nextPage}&limit=50`,
      );

      if (!error && data?.data) {
        const freshMessages = data.data;
        const paginationDetails = data.pagination[0];

        dispatch({
          type: ACTIONS.DMS_CHAT,
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
  }, [channel_id, page, isFetchingMore, hasMore, dispatch, state?.dmsChat]);

  return { loadMore, isFetchingMore };
};

export default UseGroupChatDetails;
