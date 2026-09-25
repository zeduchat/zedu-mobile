import { useEffect, useRef } from 'react';
import { Centrifuge } from 'centrifuge';
import axios from 'axios';
import { useDataContext } from '@/store/useDataContext';
import { BASE_URL, CONNECT_URL } from '@env';
import { ACTIONS } from '@/store/types';
import {
  handleIncomingDirectCallCancelled,
  handleIncomingDirectCallAnsweredElsewhere,
} from '@/services/incoming-direct-call-cancel.service';
import { isAcceptingDirectCall } from '@/services/incoming-direct-call.handler';
import { ShowNotify } from '@/components/ui/toast';
import { parseOrganisationThreadsResponse } from '@/services/mentions/parse-organisation-threads';
import {
  extractGroupParticipants,
  extractLeftParticipantUserId,
  isGroupParticipantChangeEvent,
  removeParticipantByUserId,
} from '@/utils/group-participants';
import {
  scheduleSilentChannelSync,
  scheduleSilentDmSync,
} from '@/utils/silent-sync-lists';

//

export default function GeneralNotificationConnection() {
  const { state, dispatch } = useDataContext();
  const { token, orgId, user } = state;
  const participantsRef = useRef<any[]>(state?.buzzParticipants || []);

  useEffect(() => {
    participantsRef.current = state?.buzzParticipants || [];
  }, [state?.buzzParticipants]);

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
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        },
      );
      return response.data.data.token;
    } catch (error) {
      console.error('Centrifugo Sub Token Error:', error);
    }
  };

  // centrifugo connection for notification
  useEffect(() => {
    if (!orgId || !user?.user_id || !token) return;

    const channel = `${orgId}/${user.user_id}`;

    getSubscriptionToken(channel);

    // Initialize Centrifuge client
    const centrifugeClient: any = new Centrifuge(CONNECT_URL, {
      getToken: getConnectionToken,
      debug: true,
    });

    // Function to get the token for the personal channel
    const getPersonalChannelSubscriptionToken = async () => {
      return getSubscriptionToken(channel);
    };

    // Create a subscription to the channel
    const sub = centrifugeClient.newSubscription(channel, {
      getToken: getPersonalChannelSubscriptionToken,
    });

    // // message publishing
    sub.on('publication', (ctx: any) => {
      const { data } = ctx;

      // console.log(data, 'general notification centrifugo');

      // Channels message count and mention highlight
      if (
        data?.section === 'channels_section' &&
        data?.notification_type === 'unread_thread_change'
      ) {
        const { channels_id, thread_count } = data.data;

        dispatch({
          type: ACTIONS.UPDATE_CHANNEL_COUNT,
          payload: {
            channels_id: channels_id,
            thread_count: thread_count,
            channel: data.data,
          },
        });

        scheduleSilentChannelSync(orgId, dispatch);
      }

      // DM message count and mention highlight
      if (
        data?.section === 'dm_channels_section' &&
        data?.notification_type === 'unread_thread_change'
      ) {
        const dmData = data.data;

        dispatch({
          type: ACTIONS.UPDATE_DM_AND_MOVE_TO_TOP,
          payload: dmData,
        });

        scheduleSilentDmSync(orgId, dispatch);
      }

      if (
        data?.section === 'dm_channels_section' &&
        data?.notification_type !== 'unread_thread_change' &&
        isGroupParticipantChangeEvent(data)
      ) {
        const participantsList = extractGroupParticipants(data);
        const currentParticipants = state.participant || [];

        if (participantsList) {
          const isSameGroup =
            currentParticipants.length === 0 ||
            currentParticipants.some(current =>
              participantsList.some(
                (updated: any) =>
                  String(updated.user_id) === String(current.user_id),
              ),
            );

          if (isSameGroup) {
            dispatch({ type: ACTIONS.PARTICIPANT, payload: participantsList });
            dispatch({
              type: ACTIONS.GROUP_CALLBACK,
              payload: !state.groupCallback,
            });
          }
        } else {
          const leftUserId = extractLeftParticipantUserId(data);

          if (
            leftUserId &&
            currentParticipants.some(
              participant => String(participant.user_id) === String(leftUserId),
            )
          ) {
            dispatch({
              type: ACTIONS.PARTICIPANT,
              payload: removeParticipantByUserId(
                currentParticipants,
                leftUserId,
              ),
            });
            dispatch({
              type: ACTIONS.GROUP_CALLBACK,
              payload: !state.groupCallback,
            });
          }
        }
      }

      // mention thread section
      if (
        data?.notification_type === 'thread_notification' &&
        data?.section === 'thread_message'
      ) {
        const { threads: incomingThreads, unseenThreadCount } =
          parseOrganisationThreadsResponse({
            data: data?.data,
          });

        dispatch({
          type: ACTIONS.UNSEEN_THREAD_COUNT,
          payload: unseenThreadCount,
        });

        if (incomingThreads.length > 0) {
          const existingMentions = [...(state.mentionsList || [])];

          incomingThreads.forEach(newMention => {
            const existingIndex = existingMentions.findIndex(
              item => item.thread_id === newMention.thread_id,
            );

            if (existingIndex !== -1) {
              existingMentions.splice(existingIndex, 1);
            }

            existingMentions.unshift(newMention);
          });

          dispatch({
            type: ACTIONS.MENTIONS_LIST,
            payload: existingMentions,
          });
        }
      }

      if (data?.notification_type === 'direct_call_response') {
        const payload = data?.data;
        const currentParticipants = participantsRef.current || [];
        const buzzEventData = payload;
        const newUser = payload?.user_joined;
        const rejectedUser =
          buzzEventData?.user_rejected || payload?.user_rejected;
        const timeoutUser =
          buzzEventData?.user_timeout || payload?.user_timeout;
        const joinStatus = String(payload?.join_status || '').toLowerCase();
        const buzzId = payload?.buzz_id || '';

        if (
          (joinStatus === 'cancel' ||
            joinStatus === 'canceled' ||
            joinStatus === 'cancelled') &&
          buzzId
        ) {
          const isReceiver =
            String(payload?.caller_id || '') !== String(user?.user_id || '');

          if (isReceiver) {
            handleIncomingDirectCallCancelled(buzzId, {
              callerName: payload?.caller_name,
              notify: true,
              dispatch,
            }).catch(() => {});
          }

          if (payload?.participants) {
            dispatch({
              type: ACTIONS.BUZZ_PARTICIPANTS,
              payload: payload.participants,
            });
          }

          return;
        }

        if (
          (joinStatus === 'accept' || joinStatus === 'accepted') &&
          newUser?.user_id
        ) {
          const participantToAdd = {
            ...newUser,
            videoTrack: null,
            audioTrack: null,
            handsRaised: false,
            isPinned: false,
            status: 'active',
            join_status: 'accepted',
          };

          const existingIndex = currentParticipants.findIndex(
            (participant: any) =>
              String(participant?.user_id || participant?.id) ===
              String(newUser.user_id),
          );

          let updatedParticipants: any[];

          if (existingIndex !== -1) {
            // Override the existing pending entry with the accepted participant object
            updatedParticipants = [...currentParticipants];
            updatedParticipants[existingIndex] = {
              ...currentParticipants[existingIndex],
              ...participantToAdd,
            };
          } else {
            // User not yet in the list, append them
            updatedParticipants = [...currentParticipants, participantToAdd];
          }

          dispatch({
            type: ACTIONS.BUZZ_PARTICIPANTS,
            payload: updatedParticipants,
          });

          if (String(newUser.user_id) === String(user?.user_id) && buzzId) {
            const activeBuzzId = String(state?.buzzData?.buzz_id || '');
            const isAlreadyInThisCall =
              activeBuzzId === String(buzzId) && Boolean(state?.hasJoined);

            if (
              !isAlreadyInThisCall &&
              !isAcceptingDirectCall(String(buzzId))
            ) {
              handleIncomingDirectCallAnsweredElsewhere(buzzId, {
                dispatch,
              }).catch(() => {});
            }
          } else if (String(newUser.user_id) !== String(user?.user_id)) {
            ShowNotify(
              'Info',
              `${newUser.username || 'A participant'} joined the buzz`,
            );
          }
        }

        if (
          (joinStatus === 'decline' || joinStatus === 'declined') &&
          rejectedUser?.user_id
        ) {
          const updatedParticipants = currentParticipants.filter(
            (participant: any) =>
              String(participant?.user_id || participant?.id) !==
              String(rejectedUser.user_id),
          );

          dispatch({
            type: ACTIONS.BUZZ_PARTICIPANTS,
            payload: updatedParticipants,
          });

          if (String(rejectedUser.user_id) !== String(user?.user_id)) {
            ShowNotify(
              'Buzz Declined',
              `${rejectedUser.username || 'A participant'} declined the buzz`,
            );
          }
        }

        if (joinStatus === 'timeout' && timeoutUser?.user_id) {
          const updatedParticipants = currentParticipants.filter(
            (participant: any) =>
              String(participant?.user_id || participant?.id) !==
              String(timeoutUser.user_id),
          );

          dispatch({
            type: ACTIONS.BUZZ_PARTICIPANTS,
            payload: updatedParticipants,
          });

          if (String(timeoutUser.user_id) !== String(user?.user_id)) {
            ShowNotify(
              'Buzz Timeout',
              `${
                timeoutUser.username || 'A participant'
              } didn't respond to the buzz`,
            );
          }
        }
      }

      // BUZZ STARTED
      if (data?.notification_type === 'buzz_started') {
        const active_buzz = {
          buzz_id: data?.data?.buzz_id,
          host_id: data?.data?.host_id,
          host_name: data?.data?.host_name ?? '',
          participant_count: data?.data?.participant_ids?.length ?? 0,
          started_at: data?.data?.created_at,
        };
        // Update channelDetails (object)
        dispatch({
          type: ACTIONS.CHANNEL_DETAILS,
          payload: { ...state?.channelDetails, active_buzz } as any,
        });
        // Also update userChannels for buzz signal
        dispatch({
          type: ACTIONS.BUZZ_SIGNAL_UPDATE,
          payload: {
            notification_type: data.notification_type,
            buzzEventData: data.data,
          },
        });
      }

      // BUZZ ENDED
      if (data?.notification_type === 'buzz_ended') {
        // Remove active_buzz from channelDetails (object)
        const { active_buzz, ...rest } = state?.channelDetails ?? {};
        dispatch({
          type: ACTIONS.CHANNEL_DETAILS,
          payload: rest as any,
        });
        // Also update userChannels for buzz signal
        dispatch({
          type: ACTIONS.BUZZ_SIGNAL_UPDATE,
          payload: {
            notification_type: data.notification_type,
            buzzEventData: data.data,
          },
        });
      }
    });

    sub.on('error', (ctx: any) =>
      console.error(`Subscription error: ${ctx.message}`),
    );

    centrifugeClient.connect();
    sub.subscribe();

    return () => {
      sub.unsubscribe();
      centrifugeClient.disconnect();
    };
  }, [dispatch, orgId, token, user?.user_id]);

  //

  return null;
}
