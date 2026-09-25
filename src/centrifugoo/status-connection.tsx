import { useEffect } from 'react';
import { Centrifuge } from 'centrifuge';
import axios from 'axios';
import { ACTIONS } from '@/store/types';
import { useDataContext } from '@/store/useDataContext';
import { BASE_URL, CONNECT_URL } from '@env';

const StatusConnection = () => {
  const { state, dispatch } = useDataContext();
  const { orgId, user } = state;

  const getConnectionToken = async () => {
    try {
      const response = await axios.get(`${BASE_URL}/token/connection`, {
        headers: {
          Authorization: `Bearer ${state?.token}`,
          'Content-Type': 'application/json',
        },
      });
      return response.data.data.token;
    } catch (error) {
      console.error('Centrifugo Conn Token Error:', error);
    }
  };

  const getSubscriptionToken = async (channel: string) => {
    try {
      const response = await axios.post(
        `${BASE_URL}/token/subscription`,
        { channel },
        {
          headers: {
            Authorization: `Bearer ${state?.token}`,
            'Content-Type': 'application/json',
          },
        },
      );
      return response.data.data.token;
    } catch (error) {
      console.error('Centrifugo Sub Token Error:', error);
    }
  };

  useEffect(() => {
    if (!orgId || !state?.token) return;

    const centrifugeClient: any = new Centrifuge(CONNECT_URL, {
      getToken: getConnectionToken,
      debug: true,
    });

    const sub = centrifugeClient.newSubscription(orgId, {
      getToken: () => getSubscriptionToken(orgId),
    });

    sub.on('publication', (ctx: any) => {
      const { data } = ctx;

      // console.log(data, 'status centrifugo');

      if (data?.notification_type === 'profile_status_updated') {
        const updatedData = data?.data?.status;
        // Merge the new status fields into the user object
        dispatch({
          type: ACTIONS.USER,
          payload: {
            ...user,
            text: updatedData?.text,
            icon: updatedData?.emoji,
            status_timeout: updatedData?.expiry,
            online: updatedData?.online,
          },
        });
        dispatch({
          type: ACTIONS.STATUS_CALLBACK,
          payload: !state?.statusCallback,
        });
      }
    });

    sub.on('error', (ctx: any) =>
      console.error(`Mention subscription error: ${ctx.message}`),
    );

    centrifugeClient.connect();
    sub.subscribe();

    return () => {
      sub.unsubscribe();
      centrifugeClient.disconnect();
    };
  }, [orgId, state?.token]);

  return null;
};

export default StatusConnection;
