import { NativeEventEmitter, NativeModules, Platform } from 'react-native';
import { IncomingBuzzInvite } from '@/services/direct-call-invite-queue.service';
import { INCOMING_DIRECT_CALL_CANCELLED_NATIVE_EVENT } from '@/services/incoming-direct-call-cancel.service';
import {
  NativeIncomingCallAction,
  NativeIncomingCallEvent,
} from '@/types/native-incoming-call';

export type AndroidIncomingCallAction = NativeIncomingCallAction;

export type AndroidIncomingCallEvent = NativeIncomingCallEvent;

type IncomingCallAndroidModule = {
  getLaunchIncomingCall: () => Promise<AndroidIncomingCallEvent | null>;
  clearLaunchIncomingCall: () => Promise<void>;
  dismissIncomingCallNotification: () => Promise<void>;
};

const NativeIncomingCall = NativeModules.IncomingCallAndroid as
  | IncomingCallAndroidModule
  | undefined;

const isAndroid = Platform.OS === 'android';

const normalizeInvite = (
  invite: Record<string, unknown>,
): IncomingBuzzInvite | null => {
  const buzzId = String(invite?.buzz_id || '');
  const hostId = String(invite?.host_id || invite?.caller_id || '');
  const channelId = String(invite?.channel_id || '');

  if (!buzzId || !hostId || !channelId) {
    return null;
  }

  const rawParticipants = invite?.participants;
  const participants = Array.isArray(rawParticipants) ? rawParticipants : [];

  return {
    buzz_id: buzzId,
    host_id: hostId,
    caller_id: String(invite?.caller_id || hostId),
    channel_id: channelId,
    buzz_code: String(invite?.buzz_code || ''),
    caller_name: String(invite?.caller_name || ''),
    avatar_url: String(invite?.avatar_url || ''),
    default_avatar_url: String(invite?.default_avatar_url || ''),
    participants,
  };
};

const normalizeEvent = (
  event: AndroidIncomingCallEvent | null,
): AndroidIncomingCallEvent | null => {
  if (!event?.invite) return null;

  const invite = normalizeInvite(
    event.invite as unknown as Record<string, unknown>,
  );
  if (!invite) return null;

  const action = (event.action || 'open') as AndroidIncomingCallAction;

  return { action, invite };
};

export const getAndroidLaunchIncomingCall =
  async (): Promise<AndroidIncomingCallEvent | null> => {
    if (!isAndroid || !NativeIncomingCall?.getLaunchIncomingCall) {
      return null;
    }

    const launch = await NativeIncomingCall.getLaunchIncomingCall();
    return normalizeEvent(launch);
  };

export const clearAndroidLaunchIncomingCall = async (): Promise<void> => {
  if (!isAndroid || !NativeIncomingCall?.clearLaunchIncomingCall) {
    return;
  }

  await NativeIncomingCall.clearLaunchIncomingCall();
};

export const dismissAndroidIncomingCallNotification =
  async (): Promise<void> => {
    if (!isAndroid || !NativeIncomingCall?.dismissIncomingCallNotification) {
      return;
    }

    await NativeIncomingCall.dismissIncomingCallNotification();
  };

export const subscribeToAndroidIncomingCalls = (
  handler: (event: AndroidIncomingCallEvent) => void,
): (() => void) => {
  if (!isAndroid || !NativeIncomingCall) {
    return () => {};
  }

  const emitter = new NativeEventEmitter(NativeModules.IncomingCallAndroid);
  const subscription = emitter.addListener(
    'IncomingDirectCallAndroid',
    payload => {
      const normalized = normalizeEvent(payload as AndroidIncomingCallEvent);
      if (normalized) {
        handler(normalized);
      }
    },
  );

  return () => subscription.remove();
};

export const subscribeToAndroidIncomingCallCancelled = (
  handler: (buzzId: string) => void,
): (() => void) => {
  if (!isAndroid || !NativeIncomingCall) {
    return () => {};
  }

  const emitter = new NativeEventEmitter(NativeModules.IncomingCallAndroid);
  const subscription = emitter.addListener(
    INCOMING_DIRECT_CALL_CANCELLED_NATIVE_EVENT,
    (payload: { buzzId?: string }) => {
      const buzzId = String(payload?.buzzId || '');
      if (buzzId) {
        handler(buzzId);
      }
    },
  );

  return () => subscription.remove();
};
