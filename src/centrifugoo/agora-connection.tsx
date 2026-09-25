import { useEffect, useRef } from 'react';
import { Centrifuge } from 'centrifuge';
import axios from 'axios';
import { ACTIONS } from '@/store/types';
import { useDataContext } from '@/store/useDataContext';
import { BASE_URL, CONNECT_URL } from '@env';
import { ShowNotify } from '@/components/ui/toast';
import { dispatchBuzzReactionEmoji } from '@/utils/buzz-reaction-events';

interface Props {
  id: string;
}

const AgoraConnection = ({ id }: Props) => {
  // Normalize channel id to uppercase for consistency
  const normalizedId = id.toUpperCase();
  const { state, dispatch } = useDataContext();
  const { user, buzzParticipants, buzzChats } = state || {};

  const participantsRef = useRef<any[]>(buzzParticipants || []);
  const chatsRef = useRef<any[]>(buzzChats || []);

  useEffect(() => {
    participantsRef.current = buzzParticipants;
  }, [buzzParticipants]);

  useEffect(() => {
    chatsRef.current = buzzChats;
  }, [buzzChats]);

  const getConnectionToken = async () => {
    try {
      const response = await axios.get(`${BASE_URL}/token/connection`, {
        headers: {
          Authorization: `Bearer ${state?.token}`,
          'Content-Type': 'application/json',
        },
      });
      return response.data?.data?.token;
    } catch (error) {
      console.error('Centrifugo Conn Token Error:', error);
    }
  };

  const getSubscriptionToken = async (channel: string) => {
    try {
      // Always use uppercase channel for token
      const response = await axios.post(
        `${BASE_URL}/token/subscription`,
        { channel: channel.toUpperCase() },
        {
          headers: {
            Authorization: `Bearer ${state?.token}`,
            'Content-Type': 'application/json',
          },
        },
      );
      return response.data?.data?.token;
    } catch (error) {
      console.error('Centrifugo Sub Token Error:', error);
    }
  };

  useEffect(() => {
    if (!normalizedId || !state?.token) return;

    const centrifugeClient: any = new Centrifuge(CONNECT_URL, {
      getToken: getConnectionToken,
      debug: true,
    });

    const getPersonalChannelSubscriptionToken = async () => {
      return getSubscriptionToken(normalizedId);
    };

    const sub = centrifugeClient.newSubscription(normalizedId, {
      getToken: getPersonalChannelSubscriptionToken,
    });

    // const sub = centrifugeClient.newSubscription(id, {
    //     getToken: () => getSubscriptionToken(id),
    // });

    sub.on('subscribed', (_ctx: any) => {
      // major agora calls is here just lets move and move there
    });

    sub.on('publication', async (ctx: any) => {
      const payload = ctx?.data;

      // Always use the ref to get the absolute latest list
      const currentParticipants = participantsRef.current || [];
      const currentChats = chatsRef.current || [];

      // console.log(payload, 'this is payload from agora connection centrifugo');

      if (payload?.notification_type === 'user_joined_buzz') {
        const buzzEventData = payload?.data || payload;
        console.log(buzzEventData, 'this is buzz event data');
        const newUser =
          buzzEventData?.user_joined || buzzEventData?.data?.user_joined;

        if (newUser && newUser.user_id) {
          const alreadyExists = currentParticipants.some(
            (p: any) => String(p.user_id) === String(newUser.user_id),
          );

          if (!alreadyExists) {
            const participantToAdd = {
              ...newUser,
              videoTrack: null,
              audioTrack: null,
              handsRaised: false,
              isPinned: false,
              status: 'active',
            };

            dispatch({
              type: ACTIONS.BUZZ_PARTICIPANTS,
              payload: [...currentParticipants, participantToAdd],
            });

            if (String(newUser.user_id) !== String(user?.user_id)) {
              ShowNotify(
                'Info',
                `${newUser.username || 'A participant'} joined the buzz`,
              );
            }
          }
        }
      }

      if (payload?.event === 'user_left_buzz') {
        const buzzEventData = payload?.data || payload;
        const userWhoLeft =
          buzzEventData?.user_left || buzzEventData?.data?.user_left;

        if (userWhoLeft && userWhoLeft.user_id) {
          const updatedParticipants = currentParticipants.filter(
            (p: any) => String(p.user_id) !== String(userWhoLeft.user_id),
          );

          dispatch({
            type: ACTIONS.BUZZ_PARTICIPANTS,
            payload: updatedParticipants,
          });

          if (String(userWhoLeft.user_id) !== String(user?.user_id)) {
            ShowNotify(
              'Info',
              `${userWhoLeft.username || 'A participant'} left the buzz`,
            );
          }
        }
      }

      if (payload?.notification_type === 'buzz_reaction_event') {
        dispatchBuzzReactionEmoji(payload.data, user?.user_id, dispatch);
      }

      if (payload?.notification_type === 'buzz_sticker_event') {
        const stickerData = payload.data;

        // Always pull the freshest list from the ref immediately before updating
        const latestParticipants = participantsRef.current || [];

        if (stickerData?.sticker === 'raise_hand') {
          const updated = latestParticipants.map((p: any) =>
            String(p.user_id) === String(stickerData.user_id)
              ? { ...p, handsRaised: true }
              : p,
          );
          dispatch({ type: ACTIONS.BUZZ_PARTICIPANTS, payload: updated });
        }

        if (stickerData?.sticker === 'away') {
          const updated = latestParticipants.map((p: any) =>
            String(p.user_id) === String(stickerData.user_id)
              ? { ...p, handsRaised: false }
              : p,
          );

          dispatch({ type: ACTIONS.BUZZ_PARTICIPANTS, payload: updated });
        }
      }

      // Handle audio/video status changes
      if (payload?.notification_type === 'user_audio_status_changed') {
        const statusData = payload.data;
        const latestParticipants = participantsRef.current || [];

        if (statusData?.user_id) {
          const updated = latestParticipants.map((p: any) =>
            String(p.user_id) === String(statusData.user_id)
              ? { ...p, audioTrack: statusData.audio_enabled }
              : p,
          );
          dispatch({ type: ACTIONS.BUZZ_PARTICIPANTS, payload: updated });
        }
      }

      if (payload?.notification_type === 'user_video_status_changed') {
        const statusData = payload.data;
        const latestParticipants = participantsRef.current || [];

        if (statusData?.user_id) {
          const updated = latestParticipants.map((p: any) =>
            String(p.user_id) === String(statusData.user_id)
              ? { ...p, videoTrack: statusData.video_enabled }
              : p,
          );
          dispatch({ type: ACTIONS.BUZZ_PARTICIPANTS, payload: updated });
        }
      }

      if (payload?.type === 'buzz_message') {
        const newMessage = payload?.data || payload;
        const incomingMessageId = String(
          newMessage?.message_id ?? newMessage?.id ?? '',
        );

        if (incomingMessageId) {
          const exists = currentChats.some(
            (message: any) =>
              String(message?.message_id ?? message?.id ?? '') ===
              incomingMessageId,
          );

          if (exists) {
            return;
          }
        }

        dispatch({
          type: ACTIONS.BUZZ_CHATS,
          payload: [...currentChats, newMessage],
        });
      }

      if (payload?.event === 'recording_started') {
        dispatch({
          type: ACTIONS.BUZZ_DATA,
          payload: {
            ...state.buzzData,
            is_recording: true,
          },
        });
      }

      if (payload?.event === 'recording_stopped') {
        dispatch({
          type: ACTIONS.BUZZ_DATA,
          payload: {
            ...state.buzzData,
            is_recording: false,
          },
        });
      }
    });

    sub.on('error', (ctx: any) =>
      console.error(`[CENTRIFUGO] Subscription error:`, ctx.message),
    );

    // Connect and subscribe immediately (matching web pattern)
    centrifugeClient.connect();
    sub.subscribe();

    return () => {
      sub.unsubscribe();
      centrifugeClient.disconnect();
    };
  }, [id, state?.token]);

  return null;
};

export default AgoraConnection;
