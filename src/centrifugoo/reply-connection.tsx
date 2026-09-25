import { useEffect } from 'react';
import { Centrifuge } from 'centrifuge';
import axios from 'axios';
import { ACTIONS } from '@/store/types';
import { useDataContext } from '@/store/useDataContext';
import { BASE_URL, CONNECT_URL } from '@env';

interface Props {
  id: string;
}

const ReplyConnection = ({ id }: Props) => {
  const { state, dispatch } = useDataContext();

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
    if (!id || !state?.token) return;

    const centrifugeClient: any = new Centrifuge(CONNECT_URL, {
      getToken: getConnectionToken,
      debug: true,
    });

    const sub = centrifugeClient.newSubscription(id, {
      getToken: () => getSubscriptionToken(id),
    });

    sub.on('publication', (ctx: any) => {
      const { data } = ctx;
      // dispatch({type:ACTIONS.CALLBACK, payload: !state.callback})

      console.log(ctx, 'centrifugo reply connection');

      if (data?.type === 'typing') {
        dispatch({
          type: ACTIONS.USER_TYPING,
          payload: {
            userId: data?.user?.id || data?.user?.user_id,
            username: data?.user?.username,
            typing: data?.typing,
          },
        });
        return;
      }

      if (data?.type === 'message') {
        dispatch({
          type: ACTIONS.USER_TYPING,
          payload: {
            userId: data?.user_id,
            typing: false,
          },
        });
        dispatch({
          type: ACTIONS.REPLY_CHAT,
          payload: {
            newMessage: {
              ...data,
              channels_id: data.channel_id ?? data.channels_id,
            },
          },
        });
      }

      // REACTIONS SECTION
      if (
        data?.section === 'thread_message' &&
        data?.notification_type === 'reaction_event'
      ) {
        const ids = ctx?.data?.modification_ids;
        const reactions = ctx?.data?.reactions;

        dispatch({
          type: ACTIONS.UPDATE_CHANNEL_REACTIONS,
          payload: {
            threadId: ids.thread_id,
            reactions,
          },
        });
      }

      // REPLY REACTIONS
      if (
        data?.section === 'reply_message' &&
        data?.notification_type === 'reaction_event'
      ) {
        const ids = ctx?.data?.modification_ids;
        const reactions = ctx?.data?.reactions;

        if (ids?.message_id) {
          dispatch({
            type: ACTIONS.UPDATE_REPLY_REACTIONS,
            payload: {
              messageId: ids.message_id,
              reactions,
            },
          });
        }
      }

      // DELETE CHANNEL MESSAGE
      if (
        data?.section === 'thread_message' &&
        data?.notification_type === 'deleted'
      ) {
        const threadId = data?.modification_ids?.thread_id;

        dispatch({
          type: ACTIONS.DELETE_CHANNEL_MESSAGE,
          payload: {
            threadId: threadId,
          },
        });
      }

      // DELETE CHANNEL REPLY MESSAGE
      if (
        data?.section === 'reply_message' &&
        data?.notification_type === 'deleted'
      ) {
        const messageId = data?.modification_ids?.message_id;
        const threadId = data?.modification_ids?.thread_id;
        const updates = data?.update_change;

        if (messageId) {
          dispatch({
            type: ACTIONS.REPLY_CHAT,
            payload: { removedMessageId: messageId },
          });
        }

        if (threadId && updates) {
          dispatch({
            type: ACTIONS.UPDATE_CHANNEL_MESSAGE_THREAD,
            payload: {
              threadId,
              reply: data?.data,
              updates,
            },
          });
        }
      }
    });

    sub.on('error', (ctx: any) =>
      console.error(`Subscription error: ${ctx.message}`),
    );

    centrifugeClient.connect();
    sub.subscribe();
    dispatch({ type: ACTIONS.REPLY_SUBSCRIPTION, payload: sub });

    return () => {
      sub.unsubscribe();
      centrifugeClient.disconnect();
      dispatch({ type: ACTIONS.REPLY_SUBSCRIPTION, payload: null });
      dispatch({ type: ACTIONS.CLEAR_TYPING });
    };
  }, [id, state?.token]);

  return null;
};

export default ReplyConnection;
