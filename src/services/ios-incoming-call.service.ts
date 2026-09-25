import { NativeEventEmitter, NativeModules, Platform } from 'react-native';
import { IncomingBuzzInvite } from '@/services/direct-call-invite-queue.service';
import { INCOMING_DIRECT_CALL_CANCELLED_NATIVE_EVENT } from '@/services/incoming-direct-call-cancel.service';
import {
  NativeIncomingCallAction,
  NativeIncomingCallEvent,
} from '@/types/native-incoming-call';

export type IosIncomingCallAction = Extract<
  NativeIncomingCallAction,
  'open' | 'accept' | 'decline' | 'timeout'
>;

export type IosIncomingCallEvent = NativeIncomingCallEvent;

type IncomingCallIosModule = {
  getLaunchIncomingCall: () => Promise<IosIncomingCallEvent | null>;
  clearLaunchIncomingCall: () => Promise<void>;
  dismissIncomingCallNotification: () => Promise<void>;
  dismissIncomingCallPresentation: () => Promise<void>;
  markIncomingCallConnected: (buzzId: string) => Promise<void>;
  activateAppForAcceptedCall: () => Promise<void>;
  resetIncomingCallSession: (buzzId: string | null) => Promise<void>;
  getVoipPushToken: () => Promise<string | null>;
  getRecentVoipPushLogs: () => Promise<IosVoipPushReceivedEvent[]>;
  clearRecentVoipPushLogs: () => Promise<void>;
};

const NativeIncomingCall = NativeModules.IncomingCallIOS as
  | IncomingCallIosModule
  | undefined;

const isIos = Platform.OS === 'ios';

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
  event: IosIncomingCallEvent | null,
): IosIncomingCallEvent | null => {
  if (!event?.invite) return null;

  const invite = normalizeInvite(
    event.invite as unknown as Record<string, unknown>,
  );
  if (!invite) return null;

  const action = (event.action || 'open') as IosIncomingCallAction;

  return { action, invite };
};

export const getIosLaunchIncomingCall =
  async (): Promise<IosIncomingCallEvent | null> => {
    if (!isIos || !NativeIncomingCall?.getLaunchIncomingCall) {
      return null;
    }

    const launch = await NativeIncomingCall.getLaunchIncomingCall();
    return normalizeEvent(launch);
  };

export const clearIosLaunchIncomingCall = async (): Promise<void> => {
  if (!isIos || !NativeIncomingCall?.clearLaunchIncomingCall) {
    return;
  }

  await NativeIncomingCall.clearLaunchIncomingCall();
};

export const dismissIosIncomingCallNotification = async (): Promise<void> => {
  if (!isIos || !NativeIncomingCall?.dismissIncomingCallNotification) {
    return;
  }

  await NativeIncomingCall.dismissIncomingCallNotification();
};

export const dismissIosIncomingCallPresentation = async (): Promise<void> => {
  if (!isIos || !NativeIncomingCall?.dismissIncomingCallPresentation) {
    return;
  }

  await NativeIncomingCall.dismissIncomingCallPresentation();
};

export const markIosIncomingCallConnected = async (
  buzzId: string,
): Promise<void> => {
  if (!isIos || !NativeIncomingCall?.markIncomingCallConnected) {
    return;
  }

  await NativeIncomingCall.markIncomingCallConnected(buzzId);
};

export const activateIosAppForAcceptedCall = async (): Promise<void> => {
  if (!isIos || !NativeIncomingCall?.activateAppForAcceptedCall) {
    return;
  }

  await NativeIncomingCall.activateAppForAcceptedCall();
};

export const resetIosIncomingCallSession = async (
  buzzId?: string,
): Promise<void> => {
  if (!isIos || !NativeIncomingCall?.resetIncomingCallSession) {
    return;
  }

  await NativeIncomingCall.resetIncomingCallSession(buzzId ?? null);
};

export type IosVoipPushKind =
  | 'direct_call'
  | 'direct_call_cancel'
  | 'unrecognized';

export interface IosVoipPushReceivedEvent {
  kind: IosVoipPushKind;
  rawPayload: Record<string, unknown>;
  parsedPayload?: Record<string, unknown>;
  receivedAt: string;
}

const normalizeVoipPushLog = (
  payload: Record<string, unknown>,
): IosVoipPushReceivedEvent => ({
  kind: String(payload?.kind || 'unrecognized') as IosVoipPushKind,
  rawPayload: (payload?.rawPayload || {}) as Record<string, unknown>,
  parsedPayload: payload?.parsedPayload as Record<string, unknown> | undefined,
  receivedAt: String(payload?.receivedAt || new Date().toISOString()),
});

export const getIosVoipPushToken = async (): Promise<string | null> => {
  if (!isIos || !NativeIncomingCall?.getVoipPushToken) {
    return null;
  }

  const token = await NativeIncomingCall.getVoipPushToken();
  if (typeof token !== 'string') {
    return null;
  }

  const normalized = token.trim();
  return normalized || null;
};

export const getIosRecentVoipPushLogs = async (): Promise<
  IosVoipPushReceivedEvent[]
> => {
  if (!isIos || !NativeIncomingCall?.getRecentVoipPushLogs) {
    return [];
  }

  const logs = await NativeIncomingCall.getRecentVoipPushLogs();
  if (!Array.isArray(logs)) {
    return [];
  }

  return logs.map(entry =>
    normalizeVoipPushLog(entry as unknown as Record<string, unknown>),
  );
};

export const subscribeToIosVoipPushReceived = (
  handler: (event: IosVoipPushReceivedEvent) => void,
): (() => void) => {
  if (!isIos || !NativeIncomingCall) {
    return () => {};
  }

  const emitter = new NativeEventEmitter(NativeModules.IncomingCallIOS);
  const subscription = emitter.addListener('VoipPushReceived', payload => {
    handler(normalizeVoipPushLog(payload as Record<string, unknown>));
  });

  return () => subscription.remove();
};

export const subscribeToIosIncomingCalls = (
  handler: (event: IosIncomingCallEvent) => void,
): (() => void) => {
  if (!isIos || !NativeIncomingCall) {
    return () => {};
  }

  const emitter = new NativeEventEmitter(NativeModules.IncomingCallIOS);
  const subscription = emitter.addListener('IncomingDirectCallIOS', payload => {
    const normalized = normalizeEvent(payload as IosIncomingCallEvent);
    if (normalized) {
      handler(normalized);
    }
  });

  return () => subscription.remove();
};

export const subscribeToIosIncomingCallCancelled = (
  handler: (buzzId: string) => void,
): (() => void) => {
  if (!isIos || !NativeIncomingCall) {
    return () => {};
  }

  const emitter = new NativeEventEmitter(NativeModules.IncomingCallIOS);
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
