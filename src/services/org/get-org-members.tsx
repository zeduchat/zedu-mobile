import { ACTIONS } from '@/store/types';
import { useDataContext } from '@/store/useDataContext';
import { GetRequest } from '@/utils/requests';
import { useEffect, useState, useCallback } from 'react';

const UseGetOrgMembers = () => {
  const { state, dispatch } = useDataContext();
  const { orgId } = state;
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  const getOrgMembers = useCallback(
    async (pageNum: number) => {
      if (!orgId || loading || (!hasMore && pageNum > 1)) return;

      setLoading(true);
      const { data, error } = await GetRequest(
        `/organisations/${orgId}/users?page=${pageNum}&limit=100`,
      );

      if (!error) {
        const members = data?.data || [];
        // If we get fewer items than the limit, we've reached the end
        if (members.length < 20) setHasMore(false);

        dispatch({
          type: ACTIONS.ORG_MEMBERS,
          payload: { data: members, page: pageNum },
        });
      }
      setLoading(false);
    },
    [orgId, hasMore, loading, dispatch],
  );

  // Initial fetch
  useEffect(() => {
    if (orgId) {
      setPage(1);
      setHasMore(true);
      getOrgMembers(1);
    }
  }, [orgId]);

  const loadMore = () => {
    if (!loading && hasMore) {
      const nextPage = page + 1;
      setPage(nextPage);
      getOrgMembers(nextPage);
    }
  };

  return { loading, loadMore };
};

export default UseGetOrgMembers;
