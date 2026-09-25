import { useState, useRef, useEffect } from 'react';
import AgoraService from '@/services/agora.service';
import BuzzService, { getScreenShareAccount } from '@/services/buzz.service';
import { joinDirectCallAgoraChannel } from '@/services/direct-call-agora-join.service';
import {
  isActiveCaller,
  shouldCancelDirectCallOnHangup,
} from '@/utils/direct-call-status';
import { ShowNotify } from '@/components/ui/toast';
import { useDataContext } from '@/store/useDataContext';
import { ACTIONS } from '@/store/types';
import { resetDirectCallSession } from '@/services/direct-call-session-reset.service';
import { PostRequest } from '@/utils/requests';
import { Dimensions } from 'react-native';
import { teardownIosBuzzCallNative } from '@/native/android-call-overlay';
import { enrichBuzzParticipant, enrichBuzzParticipants } from '@/utils/buzz';

interface UseCallScreenProps {
  buzzCode: string;
  buzzData: any;
  cleanupOnUnmount?: boolean;
  disableEffect?: boolean;
  isDirectCall?: boolean;
}

export const useCallScreen = ({
  buzzCode,
  buzzData,
  cleanupOnUnmount = true,
  disableEffect = false,
  isDirectCall = false,
}: UseCallScreenProps) => {
  const { state, dispatch } = useDataContext();
  const { buzzParticipants, buzzChats: _buzzChats } = state;
  const isMuted = state?.buzzIsMuted ?? true;
  const showVideo = state?.buzzShowVideo ?? false;
  const isScreenSharing = state?.buzzIsScreenSharing ?? false;
  const joinLoading = state?.buzzJoinLoading ?? false;
  const [emojiTray, setEmojiTray] = useState(false);
  const [defaultEmoji, setDefaultEmoji] = useState(false);
  const [isEndingCall, setIsEndingCall] = useState(false);

  const hasInitialized = useRef(false);
  const hadRemoteParticipantRef = useRef(false);
  const clickCountRef = useRef(0);
  const clickTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const preserveCallOnUnmountRef = useRef(false);
  const participantsRef = useRef<any[]>(state?.buzzParticipants || []);
  const pendingRemoteMediaRef = useRef<
    Record<
      number,
      { audioTrack?: boolean; videoTrack?: boolean; screenTrack?: boolean }
    >
  >({});
  const globalParticipants = state?.buzzParticipants || [];
  const currentUser = state?.user;

  useEffect(() => {
    participantsRef.current = state?.buzzParticipants || [];
  }, [state?.buzzParticipants]);

  const updateParticipants = (updater: (participants: any[]) => any[]) => {
    const latestParticipants = participantsRef.current || [];
    const updatedParticipants = updater(latestParticipants);
    participantsRef.current = updatedParticipants;
    dispatch({ type: ACTIONS.BUZZ_PARTICIPANTS, payload: updatedParticipants });
  };

  const applyRemoteMediaByUid = (
    uid: number,
    mediaPatch: {
      audioTrack?: boolean;
      videoTrack?: boolean;
      screenTrack?: boolean;
    },
  ) => {
    const userAccount = AgoraService.getUserAccountByUid(uid);

    if (!userAccount) {
      const currentPending = pendingRemoteMediaRef.current[uid] || {};
      pendingRemoteMediaRef.current[uid] = {
        ...currentPending,
        ...mediaPatch,
      };
      return;
    }

    const participantUserId = getPrimaryUserIdFromAccount(userAccount);
    const isScreenShareAccount = userAccount.startsWith('screen-');
    const normalizedPatch = isScreenShareAccount
      ? {
          screenTrack: mediaPatch.screenTrack ?? mediaPatch.videoTrack,
          ...(mediaPatch.screenTrack || mediaPatch.videoTrack
            ? { videoTrack: false }
            : {}),
          ...(mediaPatch.audioTrack !== undefined
            ? { audioTrack: mediaPatch.audioTrack }
            : {}),
        }
      : mediaPatch;

    dispatch({
      type: ACTIONS.BUZZ_PARTICIPANT_MEDIA_PATCH,
      payload: {
        user_id: String(participantUserId),
        ...(isScreenShareAccount
          ? { screenAgoraNumericUid: uid }
          : { agoraNumericUid: uid }),
        ...normalizedPatch,
      },
    });
  };

  const reconcilePendingRemoteMedia = (uid: number, userAccount: string) => {
    const pendingPatch = pendingRemoteMediaRef.current[uid];
    const isScreenShareAccount = userAccount.startsWith('screen-');
    const participantUserId = isScreenShareAccount
      ? userAccount.slice('screen-'.length)
      : userAccount;
    const catalog = buzzData?.participants || [];
    const currentParticipants = participantsRef.current || [];
    const participantExists = currentParticipants.some(
      (participant: any) =>
        String(participant?.user_id ?? participant?.id) ===
        String(participantUserId),
    );

    if (!participantExists) {
      const fromCatalog = catalog.find(
        (entry: any) =>
          String(entry?.user_id ?? entry?.id) === String(participantUserId),
      );

      if (fromCatalog) {
        const updatedParticipants = [
          ...currentParticipants,
          enrichBuzzParticipant(
            {
              ...fromCatalog,
              ...(isScreenShareAccount
                ? { screenAgoraNumericUid: uid }
                : { agoraNumericUid: uid }),
              ...(pendingPatch || {}),
            },
            catalog,
            buzzData,
          ),
        ];
        participantsRef.current = updatedParticipants;
        dispatch({
          type: ACTIONS.BUZZ_PARTICIPANTS,
          payload: updatedParticipants,
        });

        if (pendingPatch) {
          delete pendingRemoteMediaRef.current[uid];
        }
        return;
      }
    }

    dispatch({
      type: ACTIONS.BUZZ_PARTICIPANT_MEDIA_PATCH,
      payload: {
        user_id: String(participantUserId),
        ...(isScreenShareAccount
          ? { screenAgoraNumericUid: uid }
          : { agoraNumericUid: uid }),
        ...(pendingPatch || {}),
      },
    });

    if (pendingPatch) {
      delete pendingRemoteMediaRef.current[uid];
    }
  };

  const ensureScreenShareConnectionReady = async (): Promise<boolean> => {
    if (!buzzData?.buzz_id || !buzzData?.agora_token?.uid) {
      return false;
    }

    if (AgoraService.isScreenShareConnectionJoined()) {
      return true;
    }

    const screenAccount = getScreenShareAccount(buzzData.agora_token.uid);
    const tokenResult = await BuzzService.getBuzzAgoraToken({
      buzz_id: buzzData.buzz_id,
      uid: screenAccount,
    });

    if (tokenResult.error || !tokenResult.data) {
      console.error(
        '[AGORA] Failed to fetch screen share token',
        tokenResult.error,
      );
      return false;
    }

    return AgoraService.ensureScreenShareConnection(
      tokenResult.data.token,
      buzzData.buzz_id,
      screenAccount,
      tokenResult.data.uid,
    );
  };

  const getPrimaryUserIdFromAccount = (userAccount: string): string => {
    if (userAccount.startsWith('screen-')) {
      return userAccount.slice('screen-'.length);
    }

    return userAccount;
  };

  const syncCurrentUserMediaState = (participants: any[]) => {
    const myId = currentUser?.user_id ?? currentUser?.id;

    return participants.map((participant: any) => {
      const participantUserId = participant.user_id ?? participant.id;

      if (String(participantUserId) === String(myId)) {
        return {
          ...participant,
          audioTrack: !isMuted,
          videoTrack: showVideo && !isScreenSharing,
          screenTrack: isScreenSharing,
        };
      }

      return participant;
    });
  };

  useEffect(() => {
    if (disableEffect) {
      return;
    }

    const initializeAgora = async () => {
      try {
        if (!buzzData?.agora_token) return;

        AgoraService.setEventHandlers({
          onUserJoined: () => {
            hadRemoteParticipantRef.current = true;
          },
          onUserOffline: uid => {
            const userAccount = AgoraService.getUserAccountByUid(uid);

            if (userAccount?.startsWith('screen-')) {
              applyRemoteMediaByUid(uid, { screenTrack: false });
            } else {
              applyRemoteMediaByUid(uid, {
                audioTrack: false,
                videoTrack: false,
              });
            }

            delete pendingRemoteMediaRef.current[uid];
          },
          onUserPublished: (uid, mediaType) => {
            const userAccount = AgoraService.getUserAccountByUid(uid);
            const isScreenShareAccount = userAccount?.startsWith('screen-');

            if (isScreenShareAccount && mediaType === 'video') {
              applyRemoteMediaByUid(uid, { screenTrack: true });
              return;
            }

            applyRemoteMediaByUid(uid, {
              [mediaType === 'audio' ? 'audioTrack' : 'videoTrack']: true,
            });
          },
          onUserUnpublished: (uid, mediaType) => {
            const userAccount = AgoraService.getUserAccountByUid(uid);
            const isScreenShareAccount = userAccount?.startsWith('screen-');

            if (isScreenShareAccount && mediaType === 'video') {
              applyRemoteMediaByUid(uid, { screenTrack: false });
              return;
            }

            applyRemoteMediaByUid(uid, {
              [mediaType === 'audio' ? 'audioTrack' : 'videoTrack']: false,
            });
          },
          onUserInfoUpdated: (uid, userAccount) => {
            reconcilePendingRemoteMedia(uid, userAccount);
          },
          onRemoteScreenShareChanged: (uid, sharing) => {
            applyRemoteMediaByUid(uid, {
              screenTrack: sharing,
              ...(sharing ? { videoTrack: false } : {}),
            });
          },
          onLocalScreenShareChanged: sharing => {
            dispatch({
              type: ACTIONS.BUZZ_IS_SCREEN_SHARING,
              payload: sharing,
            });

            const myId = currentUser?.user_id ?? currentUser?.id;
            const updated = (participantsRef.current || []).map(
              (participant: any) => {
                const participantUserId = participant.user_id ?? participant.id;
                if (String(participantUserId) === String(myId)) {
                  return {
                    ...participant,
                    screenTrack: sharing,
                    videoTrack: sharing ? false : showVideo,
                  };
                }
                return participant;
              },
            );

            dispatch({ type: ACTIONS.BUZZ_PARTICIPANTS, payload: updated });
          },
        });

        const joined = await joinDirectCallAgoraChannel(buzzData, {
          isMuted,
          showVideo,
        });

        if (joined) {
          const screenReady = await ensureScreenShareConnectionReady();
          if (!screenReady) {
            console.warn('[AGORA] Screen share connection pre-join failed');
          } else {
            AgoraService.subscribeExistingRemoteScreenShares();
          }

          const catalog = buzzData?.participants || [];
          updateParticipants(participants => {
            const enriched = enrichBuzzParticipants(
              syncCurrentUserMediaState(participants),
              catalog,
              buzzData,
            );
            return enriched;
          });
          dispatch({ type: ACTIONS.HAS_JOINED, payload: true });
        }

        dispatch({ type: ACTIONS.BUZZ_JOIN_LOADING, payload: false });
      } catch (error) {
        console.error('[AGORA INIT] Error:', error);
      }
    };

    if (!hasInitialized.current) {
      hasInitialized.current = true;
      initializeAgora();
    }
  }, [disableEffect]);

  useEffect(() => {
    if (disableEffect) {
      return;
    }

    return () => {
      if (clickTimerRef.current) {
        clearTimeout(clickTimerRef.current);
      }

      if (preserveCallOnUnmountRef.current) {
        return;
      }

      if (!cleanupOnUnmount) {
        return;
      }

      AgoraService.leaveChannel().catch(console.error);
      AgoraService.release().catch(console.error);
    };
  }, [cleanupOnUnmount, disableEffect]);

  const handleToggleMic = async () => {
    try {
      const newState = !isMuted;
      const enableAudio = !newState;

      await AgoraService.toggleMicrophone(enableAudio);
      dispatch({ type: ACTIONS.BUZZ_IS_MUTED, payload: newState });

      const updated = globalParticipants.map((p: any) => {
        const userId = p.user_id ?? p.id;
        const myId = currentUser?.user_id ?? currentUser?.id;
        if (String(userId) === String(myId)) {
          return { ...p, audioTrack: enableAudio };
        }
        return p;
      });

      dispatch({ type: ACTIONS.BUZZ_PARTICIPANTS, payload: updated });
    } catch (error) {
      console.error('Toggle mic failed', error);
    }
  };

  const handleToggleVideo = async () => {
    try {
      const newState = !showVideo;

      if (isScreenSharing && newState) {
        ShowNotify('Info', 'Stop screen sharing to turn on camera');
        return;
      }

      const _res = await AgoraService.toggleCamera(newState);
      dispatch({ type: ACTIONS.BUZZ_SHOW_VIDEO, payload: newState });

      const updated = globalParticipants.map((p: any) => {
        const userId = p.user_id;
        const myId = currentUser?.user_id;

        if (String(userId) === String(myId)) {
          return { ...p, videoTrack: newState };
        }
        return p;
      });

      dispatch({ type: ACTIONS.BUZZ_PARTICIPANTS, payload: updated });
    } catch (error) {
      console.error('Toggle video failed', error);
    }
  };

  const handleEndCall = async () => {
    if (isEndingCall) return;
    preserveCallOnUnmountRef.current = true;
    setIsEndingCall(true);
    try {
      const currentUserId = String(
        currentUser?.user_id ?? currentUser?.id ?? '',
      );
      const shouldCancel =
        isDirectCall &&
        isActiveCaller(buzzParticipants, currentUserId) &&
        shouldCancelDirectCallOnHangup(buzzParticipants, {
          hadRemoteParticipant: hadRemoteParticipantRef.current,
        });

      if (shouldCancel) {
        const buzzId = String(buzzData?.buzz_id || '');
        if (!buzzId) {
          ShowNotify('Error', 'Call ID is missing');
        } else {
          const cancelResult = await BuzzService.respondToDirectCall(
            buzzId,
            'cancel',
          );
          if (cancelResult.error) {
            ShowNotify('Error', cancelResult.error || 'Failed to cancel call');
          }
        }
      } else {
        await BuzzService.leaveBuzz(buzzCode);

        const isDirectCallCallerEnding =
          isDirectCall && isActiveCaller(buzzParticipants, currentUserId);

        if (isDirectCallCallerEnding || (buzzParticipants || []).length === 1) {
          await BuzzService.endBuzz(buzzCode);
        }
      }

      await AgoraService.stopAllLocalMedia();
      await AgoraService.leaveChannel();
      await AgoraService.release();

      await teardownIosBuzzCallNative({
        buzzCode,
        buzzId: String(buzzData?.buzz_id || ''),
        title: String(buzzData?.buzz_code || buzzData?.title || 'Buzz call'),
      });

      await resetDirectCallSession(dispatch, {
        buzzId: String(buzzData?.buzz_id || ''),
      });
    } catch (error) {
      console.error('End call error:', error);
      ShowNotify('Error', 'Failed to end call');
    } finally {
      setIsEndingCall(false);
    }
  };

  const handleRejoinCall = async () => {
    try {
      const result = await BuzzService.joinBuzz(buzzCode);

      if (result.data) {
        dispatch({ type: ACTIONS.BUZZ_DATA, payload: result.data });
        dispatch({
          type: ACTIONS.BUZZ_PARTICIPANTS,
          payload: result.data.participants,
        });
        dispatch({ type: ACTIONS.HAS_JOINED, payload: true });
      }
    } catch (error) {
      console.error('Rejoin call error:', error);
      ShowNotify('Error', 'Failed to rejoin call');
    }
  };

  const handleEmojiSelect = async (
    emojiObject: any,
    anchor?: { x: number; y: number },
  ) => {
    const emoji = emojiObject?.emoji || emojiObject?.native;
    if (!emoji || !buzzData?.buzz_id) return;

    clickCountRef.current += 1;

    if (clickTimerRef.current) {
      clearTimeout(clickTimerRef.current);
    }

    clickTimerRef.current = setTimeout(() => {
      clickCountRef.current = 0;
    }, 1000);

    const isBursting = clickCountRef.current > 5;
    const spawnAmount = isBursting ? 3 : 1;
    const { width, height } = Dimensions.get('window');
    const originX = anchor?.x ?? width / 2;
    const originY = anchor?.y ?? height - 140;

    for (let i = 0; i < spawnAmount; i++) {
      const id = Date.now() + Math.random();
      const newFloatingEmoji = {
        id,
        emoji,
        x: originX,
        y: originY,
        name: currentUser?.full_name || currentUser?.username || 'You',
        jitter: (Math.random() - 0.5) * (isBursting ? 200 : 60),
      };

      dispatch({ type: ACTIONS.ADD_FLOATING_EMOJI, payload: newFloatingEmoji });

      setTimeout(() => {
        dispatch({ type: ACTIONS.REMOVE_FLOATING_EMOJI, payload: id });
      }, 1800);
    }

    if (clickCountRef.current % 3 === 1 || !isBursting) {
      const response = await PostRequest(`/buzz/${buzzData.buzz_id}/reaction`, {
        reaction_type: 'emoji',
        content: emoji,
      });

      if (response?.error) {
        ShowNotify('Error', 'Failed to send reaction');
      }
    }
  };

  const handleClose = () => {
    setDefaultEmoji(false);
    setEmojiTray(false);
  };

  const handleToggleScreenShare = async () => {
    try {
      const newState = !isScreenSharing;

      if (newState) {
        if (!buzzData?.buzz_id || !buzzData?.agora_token?.uid) {
          ShowNotify('Error', 'Unable to start screen sharing right now.');
          return;
        }

        const screenReady = await ensureScreenShareConnectionReady();
        if (!screenReady) {
          ShowNotify('Error', 'Failed to prepare screen share connection');
          return;
        }

        const result = await AgoraService.startScreenCapture();
        if (!result) {
          ShowNotify('Error', 'Failed to start screen share');
          return;
        }

        dispatch({ type: ACTIONS.BUZZ_IS_SCREEN_SHARING, payload: true });

        const myId = currentUser?.user_id ?? currentUser?.id;
        const updated = globalParticipants.map((participant: any) => {
          const participantUserId = participant.user_id ?? participant.id;
          if (String(participantUserId) === String(myId)) {
            return {
              ...participant,
              screenTrack: true,
              videoTrack: false,
            };
          }
          return participant;
        });

        dispatch({ type: ACTIONS.BUZZ_PARTICIPANTS, payload: updated });
      } else {
        const result = await AgoraService.stopScreenCapture(showVideo);
        if (!result) {
          ShowNotify('Error', 'Failed to stop screen share');
          return;
        }

        dispatch({ type: ACTIONS.BUZZ_IS_SCREEN_SHARING, payload: false });

        const myId = currentUser?.user_id ?? currentUser?.id;
        const updated = globalParticipants.map((participant: any) => {
          const participantUserId = participant.user_id ?? participant.id;
          if (String(participantUserId) === String(myId)) {
            return {
              ...participant,
              screenTrack: false,
              videoTrack: showVideo,
            };
          }
          return participant;
        });

        dispatch({ type: ACTIONS.BUZZ_PARTICIPANTS, payload: updated });
      }
    } catch (error) {
      console.error('Screen share toggle failed', error);
      ShowNotify('Error', 'Screen share not available');
    }
  };

  const prepareForMinimize = () => {
    preserveCallOnUnmountRef.current = true;
  };

  return {
    isMuted,
    showVideo,
    emojiTray,
    defaultEmoji,
    isEndingCall,
    isScreenSharing,
    globalParticipants,
    currentUser,
    handleToggleMic,
    handleToggleVideo,
    handleEndCall,
    handleRejoinCall,
    handleEmojiSelect,
    handleClose,
    handleToggleScreenShare,
    prepareForMinimize,
    setDefaultEmoji,
    setEmojiTray,
    joinLoading,
  };
};
