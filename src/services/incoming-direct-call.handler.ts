import { Dispatch } from 'react';
import { Platform } from 'react-native';
import DirectCallInviteQueueService, {
  IncomingBuzzInvite,
} from '@/services/direct-call-invite-queue.service';
import { dismissAndroidIncomingCallNotification } from '@/services/android-incoming-call.service';
import {
  activateIosAppForAcceptedCall,
  dismissIosIncomingCallNotification,
  markIosIncomingCallConnected,
} from '@/services/ios-incoming-call.service';
import {
  getActiveRouteName,
  navigate,
  replaceOngoingDirectCallInStack,
} from '@/navigation/root-navigation';
import { registerPendingIncomingCall } from '@/services/incoming-direct-call-session.service';
import { resetDirectCallSession } from '@/services/direct-call-session-reset.service';
import BuzzService from '@/services/buzz.service';
import { joinDirectCallAgoraChannel } from '@/services/direct-call-agora-join.service';
import { Action, ACTIONS } from '@/store/types';
import { ShowNotify } from '@/components/ui/toast';
import {
  NativeIncomingCallAction,
  NativeIncomingCallEvent,
} from '@/types/native-incoming-call';

export type { NativeIncomingCallAction, NativeIncomingCallEvent };

const acceptingBuzzIds = new Set<string>();
const timingOutBuzzIds = new Set<string>();
const decliningBuzzIds = new Set<string>();

export const isAcceptingDirectCall = (buzzId: string): boolean =>
  acceptingBuzzIds.has(String(buzzId || ''));

const dismissNativeIncomingCallNotification = async () => {
  if (Platform.OS === 'android') {
    await dismissAndroidIncomingCallNotification();
    return;
  }

  if (Platform.OS === 'ios') {
    await dismissIosIncomingCallNotification();
  }
};

type ProcessIncomingCallOptions = {
  currentUserId?: string;
  activeBuzz?: any;
};

export type AcceptDirectCallContext = {
  dispatch: Dispatch<Action>;
  user?: { user_id?: string; id?: string };
  buzzIsMuted?: boolean;
  buzzShowVideo?: boolean;
};

const isSameActiveCall = (activeBuzz: any, invite: IncomingBuzzInvite) => {
  if (!activeBuzz) return false;

  return (
    String(activeBuzz?.buzz_id || '') === String(invite?.buzz_id || '') ||
    String(activeBuzz?.buzz_code || '') === String(invite?.buzz_code || '') ||
    String(activeBuzz?.channel_id || '') === String(invite?.channel_id || '')
  );
};

export const shouldProcessIncomingCallInvite = (
  invite: IncomingBuzzInvite,
  options: ProcessIncomingCallOptions,
): boolean => {
  const inviteHostId = String(invite?.host_id || invite?.caller_id || '');
  const currentUserId = String(options.currentUserId || '');

  if (currentUserId && inviteHostId && currentUserId === inviteHostId) {
    return false;
  }

  if (isSameActiveCall(options.activeBuzz, invite)) {
    return false;
  }

  return true;
};

export const navigateToIncomingDirectCall = (invite: IncomingBuzzInvite) => {
  if (Platform.OS === 'ios') {
    return;
  }

  if (invite?.buzz_id) {
    registerPendingIncomingCall(invite.buzz_id);
  }

  dismissNativeIncomingCallNotification();

  navigate('DirectCallStack', {
    screen: 'IncomingDirectCall',
    params: {
      invite,
    },
  } as any);
};

export const navigateToOngoingDirectCall = (buzzData: any) => {
  const params = {
    buzzCode: buzzData.buzz_code,
    buzzData,
  };

  if (
    getActiveRouteName() === 'IncomingDirectCall' &&
    replaceOngoingDirectCallInStack(params)
  ) {
    return;
  }

  navigate('DirectCallStack', {
    screen: 'OngoingDirectCall',
    params,
  } as any);
};

const ACTIVE_BUZZ_CALL_ROUTES = new Set([
  'CallScreen',
  'ChannelCall',
  'GreenRoom',
  'OngoingDirectCall',
  'IncomingDirectCall',
]);

export const isActiveBuzzCallRoute = (routeName?: string): boolean => {
  if (!routeName) {
    return false;
  }

  return ACTIVE_BUZZ_CALL_ROUTES.has(routeName);
};

export const isDirectCallBuzz = (buzzData: any): boolean => {
  const participants = buzzData?.participants || [];

  return participants.some((participant: any) => {
    const role = String(participant?.call_role || '').toLowerCase();
    return role === 'caller' || role === 'receiver';
  });
};

export const ensureOngoingDirectCallScreen = (buzzData: any) => {
  if (!buzzData?.buzz_code) {
    return;
  }

  const activeRoute = getActiveRouteName();
  if (isActiveBuzzCallRoute(activeRoute)) {
    return;
  }

  if (!isDirectCallBuzz(buzzData)) {
    return;
  }

  navigateToOngoingDirectCall(buzzData);
};

export const acceptAndJoinDirectCallInvite = async (
  invite: IncomingBuzzInvite,
  context: AcceptDirectCallContext,
): Promise<{ buzzData: any | null; error: string | null }> => {
  if (!invite?.buzz_id) {
    return { buzzData: null, error: 'Invalid call invite' };
  }

  const buzzId = String(invite.buzz_id);
  if (acceptingBuzzIds.has(buzzId)) {
    return { buzzData: null, error: 'Already accepting call' };
  }

  acceptingBuzzIds.add(buzzId);

  try {
    if (Platform.OS !== 'ios') {
      await dismissNativeIncomingCallNotification();
    }

    const respondResult = await BuzzService.respondToDirectCall(
      buzzId,
      'accept',
    );
    if (respondResult.error || !respondResult.data?.buzz_code) {
      return {
        buzzData: null,
        error: respondResult.error || 'Failed to accept call',
      };
    }

    const joinResult = await BuzzService.joinBuzz(respondResult.data.buzz_code);
    if (joinResult.error || !joinResult.data) {
      return {
        buzzData: null,
        error: joinResult.error || 'Failed to join call',
      };
    }

    const buzzData = joinResult.data;
    if (!buzzData?.buzz_code || !buzzData?.agora_token) {
      return {
        buzzData: null,
        error: 'Call accepted but buzz data is incomplete',
      };
    }

    const isMuted = context.buzzIsMuted ?? true;
    const showVideo = context.buzzShowVideo ?? false;
    const currentUserId = context.user?.user_id ?? context.user?.id;

    const participantsWithLocalMediaState = (buzzData.participants || []).map(
      (participant: any) => {
        const participantUserId = participant.user_id ?? participant.id;

        if (String(participantUserId) === String(currentUserId)) {
          return {
            ...participant,
            audioTrack: !isMuted,
            videoTrack: showVideo,
          };
        }

        return participant;
      },
    );

    context.dispatch({ type: ACTIONS.BUZZ_DATA, payload: buzzData });
    context.dispatch({
      type: ACTIONS.BUZZ_PARTICIPANTS,
      payload: participantsWithLocalMediaState,
    });
    context.dispatch({ type: ACTIONS.BUZZ_JOIN_LOADING, payload: true });

    const agoraJoined = await joinDirectCallAgoraChannel(buzzData, {
      isMuted,
      showVideo,
    });

    context.dispatch({ type: ACTIONS.BUZZ_JOIN_LOADING, payload: false });

    if (!agoraJoined) {
      return { buzzData: null, error: 'Failed to connect to call audio' };
    }

    context.dispatch({ type: ACTIONS.HAS_JOINED, payload: true });

    if (Platform.OS === 'ios') {
      await markIosIncomingCallConnected(buzzId);
    }

    return { buzzData, error: null };
  } finally {
    acceptingBuzzIds.delete(buzzId);
  }
};

export const handleNativeIncomingCallDecline = async (
  invite: IncomingBuzzInvite,
  context: AcceptDirectCallContext,
) => {
  if (!invite?.buzz_id) return;

  const buzzId = String(invite.buzz_id);
  if (decliningBuzzIds.has(buzzId)) {
    return;
  }

  decliningBuzzIds.add(buzzId);

  try {
    const declineResult = await BuzzService.respondToDirectCall(
      buzzId,
      'decline',
    );

    if (declineResult.error) {
      ShowNotify('Error', declineResult.error || 'Failed to decline call');
    }

    await resetDirectCallSession(context.dispatch, { buzzId });
  } finally {
    decliningBuzzIds.delete(buzzId);
  }
};

/** @deprecated Use handleNativeIncomingCallDecline */
export const handleAndroidIncomingCallDecline = handleNativeIncomingCallDecline;

export const handleNativeIncomingCallTimeout = async (
  invite: IncomingBuzzInvite,
  context: AcceptDirectCallContext,
) => {
  if (!invite?.buzz_id) return;

  const buzzId = String(invite.buzz_id);
  if (timingOutBuzzIds.has(buzzId)) {
    return;
  }

  timingOutBuzzIds.add(buzzId);

  try {
    const timeoutResult = await BuzzService.respondToDirectCall(
      buzzId,
      'timeout',
    );

    if (timeoutResult.error) {
      ShowNotify(
        'Error',
        timeoutResult.error || 'Failed to record call timeout',
      );
    }

    await resetDirectCallSession(context.dispatch, { buzzId });
  } finally {
    timingOutBuzzIds.delete(buzzId);
  }
};

export const parseInviteFromNotification = (
  notification: any,
): IncomingBuzzInvite | null => {
  return DirectCallInviteQueueService.parseFromNotification(notification);
};

export const handleNativeIncomingCallAction = async (
  action: NativeIncomingCallAction,
  invite: IncomingBuzzInvite,
  context: AcceptDirectCallContext,
) => {
  if (Platform.OS === 'ios' && action === 'open') {
    return;
  }

  if (action === 'decline') {
    await handleNativeIncomingCallDecline(invite, context);
    return;
  }

  if (action === 'timeout') {
    await handleNativeIncomingCallTimeout(invite, context);
    return;
  }

  if (action === 'accept') {
    const { buzzData, error } = await acceptAndJoinDirectCallInvite(
      invite,
      context,
    );

    if (error || !buzzData) {
      ShowNotify('Error', error || 'Failed to join call');
      await resetDirectCallSession(context.dispatch, {
        buzzId: String(invite.buzz_id),
      });
      if (Platform.OS !== 'ios') {
        navigateToIncomingDirectCall(invite);
      }
      return;
    }

    navigateToOngoingDirectCall(buzzData);
    ensureOngoingDirectCallScreen(buzzData);

    if (Platform.OS === 'ios') {
      await activateIosAppForAcceptedCall();
    }

    return;
  }

  navigateToIncomingDirectCall(invite);
};

/** @deprecated Use handleNativeIncomingCallAction */
export const handleAndroidIncomingCallAction = handleNativeIncomingCallAction;
