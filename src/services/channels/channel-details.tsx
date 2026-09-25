import { ACTIONS } from '@/store/types';
import { useDataContext } from '@/store/useDataContext';
import { GetRequest } from '@/utils/requests';
import { useEffect } from 'react';

interface Props {
  channel_id: string;
}

const UseChannelDetails = ({ channel_id }: Props) => {
  const { state, dispatch } = useDataContext();

  // get persisted data
  useEffect(() => {
    if (channel_id) {
      const fetchChannelById = async () => {
        const { data, error } = await GetRequest(`/channels/${channel_id}`);
        if (!error) {
          dispatch({
            type: ACTIONS.CHANNEL_DETAILS,
            payload: data?.data,
          });
        }
        dispatch({
          type: ACTIONS.CHANNEL_LOADING,
          payload: false,
        });
      };
      fetchChannelById();
    }
  }, [dispatch, channel_id, state?.channelCallback]);

  return <></>;
};

export default UseChannelDetails;
