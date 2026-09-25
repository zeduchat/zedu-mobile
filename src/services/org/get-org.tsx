import { ACTIONS } from '@/store/types';
import { useDataContext } from '@/store/useDataContext';
import { orderResponseAlphabetically } from '@/utils';
import { GetRequest } from '@/utils/requests';
import { useEffect } from 'react';

const UseGetOrg = () => {
  const { state, dispatch } = useDataContext();
  const { orgId } = state;

  useEffect(() => {
    if (orgId) {
      const fetchOrg = async () => {
        const { data, error } = await GetRequest(`/users/organisations`);
        const result: any = orderResponseAlphabetically(data?.data);

        if (!error) {
          dispatch({ type: ACTIONS.ORG, payload: result });
        }
        dispatch({ type: ACTIONS.DM_LOADING, payload: false });
      };
      fetchOrg();
      getOrgMembers();
    }
  }, [orgId, dispatch]);

  const getOrgMembers = async () => {
    const { data, error } = await GetRequest(
      `/organisations/${orgId}/users?page=1&limit=50`,
    );

    if (!error) {
      dispatch({
        type: ACTIONS.ORG_MEMBERS,
        payload: { data: data.data, page: 1 },
      });
    }
  };

  return <></>;
};

export default UseGetOrg;
