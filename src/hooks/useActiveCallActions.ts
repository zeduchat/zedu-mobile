import { useCallback, useRef } from 'react';
import { Dimensions } from 'react-native';
import AgoraService from '@/services/agora.service';
import BuzzService from '@/services/buzz.service';
import { ShowNotify } from '@/components/ui/toast';
import { useDataContext } from '@/store/useDataContext';
import { ACTIONS } from '@/store/types';
import { resetDirectCallSession } from '@/services/direct-call-session-reset.service';
import { PostRequest } from '@/utils/requests';
import {
  dismissCallOverlay,
  teardownIosBuzzCallNative,
} from '@/native/android-call-overlay';

const DEFAULT_OVERLAY_EMOJI = '👍';

export const useActiveCallActions = () => {
  const { state, dispatch } = useDataContext();
  const isEndingCallRef = useRef(false);

  const buzzCode = state?.buzzData?.buzz_code;
  const buzzData = state?.buzzData;
  const showVideo = state?.buzzShowVideo ?? false;
  const isMuted = state?.buzzIsMuted ?? true;
  const globalParticipants = state?.buzzParticipants || [];
  const currentUser = state?.user;

  const syncMicMuted = useCallback(
    (nextMuted: boolean) => {
      const enableAudio = !nextMuted;
      dispatch({ type: ACTIONS.BUZZ_IS_MUTED, payload: nextMuted });

      const myId = currentUser?.user_id ?? currentUser?.id;
      const updated = globalParticipants.map((participant: any) => {
        const participantUserId = participant.user_id ?? participant.id;
        if (String(participantUserId) === String(myId)) {
          return { ...participant, audioTrack: enableAudio };
        }
        return participant;
      });

      dispatch({ type: ACTIONS.BUZZ_PARTICIPANTS, payload: updated });
    },
    [currentUser?.id, currentUser?.user_id, dispatch, globalParticipants],
  );

  const toggleMic = useCallback(async () => {
    try {
      const newMutedState = !isMuted;
      const enableAudio = !newMutedState;

      await AgoraService.toggleMicrophone(enableAudio);
      dispatch({ type: ACTIONS.BUZZ_IS_MUTED, payload: newMutedState });

      const myId = currentUser?.user_id ?? currentUser?.id;
      const updated = globalParticipants.map((participant: any) => {
        const participantUserId = participant.user_id ?? participant.id;
        if (String(participantUserId) === String(myId)) {
          return { ...participant, audioTrack: enableAudio };
        }
        return participant;
      });

      dispatch({ type: ACTIONS.BUZZ_PARTICIPANTS, payload: updated });
    } catch (error) {
      console.error('Toggle mic failed', error);
    }
  }, [
    currentUser?.id,
    currentUser?.user_id,
    dispatch,
    globalParticipants,
    isMuted,
  ]);

  const sendQuickEmoji = useCallback(async () => {
    const emoji = DEFAULT_OVERLAY_EMOJI;
    if (!buzzData?.buzz_id) return;

    const { width, height } = Dimensions.get('window');
    const originX = width / 2;
    const originY = height - 140;
    const id = Date.now() + Math.random();

    dispatch({
      type: ACTIONS.ADD_FLOATING_EMOJI,
      payload: {
        id,
        emoji,
        x: originX,
        y: originY,
        name: currentUser?.full_name || currentUser?.username || 'You',
        jitter: 0,
      },
    });

    setTimeout(() => {
      dispatch({ type: ACTIONS.REMOVE_FLOATING_EMOJI, payload: id });
    }, 1800);

    const response = await PostRequest(`/buzz/${buzzData.buzz_id}/reaction`, {
      reaction_type: 'emoji',
      content: emoji,
    });

    if (response?.error) {
      ShowNotify('Error', 'Failed to send reaction');
    }
  }, [
    buzzData?.buzz_id,
    currentUser?.full_name,
    currentUser?.username,
    dispatch,
  ]);

  const endCall = useCallback(
    async (options?: { skipMedia?: boolean }) => {
      if (!buzzCode || isEndingCallRef.current) return;

      isEndingCallRef.current = true;

      try {
        const callTitle = String(
          buzzData?.buzz_code || buzzData?.title || 'Buzz call',
        );
        const callBuzzId = String(buzzData?.buzz_id || '');

        await teardownIosBuzzCallNative({
          buzzCode,
          buzzId: callBuzzId,
          title: callTitle,
        });
        await BuzzService.leaveBuzz(buzzCode);
        if (!options?.skipMedia) {
          await AgoraService.stopAllLocalMedia();
          await AgoraService.leaveChannel();
          await AgoraService.release();
        }

        if ((state?.buzzParticipants || []).length === 1) {
          await BuzzService.endBuzz(buzzCode);
        }

        await resetDirectCallSession(dispatch, {
          buzzId: callBuzzId,
        });
        await dismissCallOverlay();
      } catch (error) {
        console.error('End call error:', error);
        ShowNotify('Error', 'Failed to end call');
      } finally {
        isEndingCallRef.current = false;
      }
    },
    [buzzCode, dispatch, state?.buzzParticipants],
  );

  return {
    buzzCode,
    buzzData,
    showVideo,
    isMuted,
    toggleMic,
    syncMicMuted,
    sendQuickEmoji,
    endCall,
  };
};
