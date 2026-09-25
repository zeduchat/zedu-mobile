import { DeviceEventEmitter, Platform } from 'react-native';
import { Dispatch } from 'react';
import {
  dismissIncomingDirectCall,
  getActiveRouteName,
} from '@/navigation/root-navigation';
import { resetDirectCallSession } from '@/services/direct-call-session-reset.service';
import { dismissIosIncomingCallNotification } from '@/services/ios-incoming-call.service';
import { Action } from '@/store/types';
import { isPendingIncomingCall } from '@/services/incoming-direct-call-session.service';

/** Emitted from Android native when a cancel push is intercepted in the background. */
export const INCOMING_DIRECT_CALL_CANCELLED_NATIVE_EVENT = `IncomingDirectCallCancelled`;

/** Emitted from JS to notify in-app UI (incoming call screen) that the call was cancelled. */
export const INCOMING_DIRECT_CALL_CANCELLED_UI_EVENT = `IncomingDirectCallUiCancelled`;

const pendingCancelledBuzzIds = new Set<string>();
const handlingCancelledBuzzIds = new Set<string>();

export type IncomingDirectCallCancelledPayload = {
  buzzId: string;
  callerName: string;
};

export type DirectCallCancelDetails = {
  buzzId: string;
  callerName: string;
};

const resolvePayload = (raw: any) => {
  if (!raw) return null;

  const additionalData = raw?.additionalData;
  const customData = raw?.rawPayload?.custom?.a;
  const nestedData = raw?.data;

  const merged: Record<string, any> = {
    ...(typeof nestedData === 'object' && nestedData ? nestedData : {}),
    ...(typeof customData === 'object' && customData ? customData : {}),
    ...(typeof additionalData === 'object' && additionalData
      ? additionalData
      : {}),
  };

  if (raw?.notification_type) {
    merged.notification_type = raw.notification_type;
  }

  if (raw?.event && !merged.event) {
    merged.event = raw.event;
  }

  return merged;
};

const isDirectCallCancelSignal = (payload: Record<string, any>) => {
  const event = String(payload?.event || payload?.type || '').toLowerCase();
  const notificationType = String(
    payload?.notification_type || '',
  ).toLowerCase();
  const joinStatus = String(payload?.join_status || '').toLowerCase();

  if (
    event === 'direct_call_canceled' ||
    event === 'direct_call_cancelled' ||
    event === 'direct_call_ended' ||
    event === 'direct_call_cancel' ||
    notificationType === 'direct_call_canceled' ||
    notificationType === 'direct_call_cancelled' ||
    notificationType === 'direct_call_ended' ||
    notificationType === 'direct_call_cancel' ||
    joinStatus === 'cancel' ||
    joinStatus === 'canceled' ||
    joinStatus === 'cancelled'
  ) {
    return true;
  }

  return false;
};

export const extractDirectCallCancelDetails = (
  raw: any,
): DirectCallCancelDetails | null => {
  const payload = resolvePayload(raw);
  if (!payload || !isDirectCallCancelSignal(payload)) {
    return null;
  }

  const buzzId = String(payload?.buzz_id || '');
  if (!buzzId) {
    return null;
  }

  return {
    buzzId,
    callerName: String(payload?.caller_name || 'Someone'),
  };
};

export const extractDirectCallAnsweredElsewhereDetails = (
  raw: any,
  currentUserId?: string,
): DirectCallCancelDetails | null => {
  const payload = resolvePayload(raw);
  if (!payload) {
    return null;
  }

  const joinStatus = String(payload?.join_status || '').toLowerCase();
  if (joinStatus !== 'accept' && joinStatus !== 'accepted') {
    return null;
  }

  const buzzId = String(payload?.buzz_id || '');
  if (!buzzId || !currentUserId) {
    return null;
  }

  const answeredUserId = String(
    payload?.user_joined?.user_id || payload?.user_id || '',
  );

  if (!answeredUserId || String(answeredUserId) !== String(currentUserId)) {
    return null;
  }

  return {
    buzzId,
    callerName: String(payload?.caller_name || 'Someone'),
  };
};

export const markPendingIncomingCallCancelled = (buzzId: string) => {
  if (buzzId) {
    pendingCancelledBuzzIds.add(String(buzzId));
  }
};

export const consumePendingIncomingCallCancelled = (
  buzzId: string,
): boolean => {
  const normalizedBuzzId = String(buzzId || '');
  if (!normalizedBuzzId || !pendingCancelledBuzzIds.has(normalizedBuzzId)) {
    return false;
  }

  pendingCancelledBuzzIds.delete(normalizedBuzzId);
  return true;
};

export const clearPendingIncomingCallCancelled = (buzzId?: string) => {
  if (!buzzId) {
    pendingCancelledBuzzIds.clear();
    return;
  }

  pendingCancelledBuzzIds.delete(String(buzzId));
};

export const handleIncomingDirectCallCancelled = async (
  buzzId: string,
  options?: {
    callerName?: string;
    notify?: boolean;
    dispatch?: Dispatch<Action>;
  },
) => {
  const normalizedBuzzId = String(buzzId || '');
  if (!normalizedBuzzId) return;

  if (handlingCancelledBuzzIds.has(normalizedBuzzId)) {
    return;
  }

  handlingCancelledBuzzIds.add(normalizedBuzzId);

  const callerName = options?.callerName || 'Someone';
  markPendingIncomingCallCancelled(normalizedBuzzId);

  if (Platform.OS === 'ios') {
    await dismissIosIncomingCallNotification();
  }

  if (options?.dispatch) {
    await resetDirectCallSession(options.dispatch, {
      buzzId: normalizedBuzzId,
    });
  }

  DeviceEventEmitter.emit(INCOMING_DIRECT_CALL_CANCELLED_UI_EVENT, {
    buzzId: normalizedBuzzId,
    callerName,
  } satisfies IncomingDirectCallCancelledPayload);

  const isOnIncomingCallScreen = getActiveRouteName() === 'IncomingDirectCall';

  try {
    if (isOnIncomingCallScreen) {
      // if (options?.notify !== false) {
      //     ShowNotify('Missed call', `Missed call from ${callerName}`);
      // }
      dismissIncomingDirectCall();
      return;
    }

    // if (options?.notify !== false) {
    //     ShowNotify('Missed call', `Missed call from ${callerName}`);
    // }
  } finally {
    handlingCancelledBuzzIds.delete(normalizedBuzzId);
  }
};

export const handleIncomingDirectCallAnsweredElsewhere = async (
  buzzId: string,
  options?: { dispatch?: Dispatch<Action> },
) => {
  const normalizedBuzzId = String(buzzId || '');
  if (!normalizedBuzzId) {
    return;
  }

  // Stop CallKit / fallback ring immediately — the websocket often arrives
  // before VoIP push while the phone is still ringing natively.
  if (Platform.OS === 'ios') {
    await dismissIosIncomingCallNotification();
  }

  const activeRoute = getActiveRouteName();
  const shouldDismissIncomingUi =
    isPendingIncomingCall(normalizedBuzzId) ||
    activeRoute === 'IncomingDirectCall';

  if (!shouldDismissIncomingUi) {
    markPendingIncomingCallCancelled(normalizedBuzzId);
    if (options?.dispatch) {
      await resetDirectCallSession(options.dispatch, {
        buzzId: normalizedBuzzId,
      });
    }
    return;
  }

  await handleIncomingDirectCallCancelled(normalizedBuzzId, {
    notify: false,
    dispatch: options?.dispatch,
  });
};
