import {
  DeviceEventEmitter,
  NativeEventEmitter,
  NativeModules,
  Platform,
} from 'react-native';

export type CallOverlayAction =
  | 'expand'
  | 'endCall'
  | 'toggleMic'
  | 'toggleEmoji';

export type CallOverlayActionPayload = {
  action?: CallOverlayAction;
  handledNatively?: boolean;
  isMuted?: boolean;
};

type CallOverlayModule = {
  canDrawOverlays: () => Promise<boolean>;
  requestOverlayPermission: () => Promise<boolean>;
  prepareOverlay?: (title: string, isMuted: boolean) => Promise<boolean>;
  showOverlay: (title: string, isMuted: boolean) => Promise<boolean>;
  hideOverlay: () => Promise<boolean>;
  dismissOverlay?: () => Promise<boolean>;
  updateMicState: (isMuted: boolean) => void;
  bringAppToForeground: () => Promise<boolean>;
  syncOngoingCallCallKit?: (
    buzzCode: string,
    title: string,
    isActive: boolean,
    alternateBuzzId?: string | null,
  ) => void;
};

const CallOverlay = NativeModules.CallOverlay as CallOverlayModule | undefined;

export const CALL_OVERLAY_EVENT = 'CallOverlayAction';

export const isAndroidCallOverlaySupported =
  Platform.OS === 'android' && Boolean(CallOverlay);

export const isIosCallPiPSupported =
  Platform.OS === 'ios' && Boolean(CallOverlay);

export const isCallOverlaySupported =
  isAndroidCallOverlaySupported || isIosCallPiPSupported;

export const canDrawCallOverlay = async (): Promise<boolean> => {
  if (!isCallOverlaySupported || !CallOverlay?.canDrawOverlays) {
    return false;
  }

  return CallOverlay.canDrawOverlays();
};

export const requestCallOverlayPermission = async (): Promise<boolean> => {
  if (!isCallOverlaySupported || !CallOverlay?.requestOverlayPermission) {
    return false;
  }

  return CallOverlay.requestOverlayPermission();
};

export const prepareIosCallPiP = async (
  title: string,
  isMuted: boolean,
): Promise<boolean> => {
  if (!isIosCallPiPSupported || !CallOverlay?.prepareOverlay) {
    return false;
  }

  return CallOverlay.prepareOverlay(title, isMuted);
};

export const showAndroidCallOverlay = async (
  title: string,
  isMuted: boolean,
): Promise<boolean> => {
  if (!isCallOverlaySupported || !CallOverlay?.showOverlay) {
    return false;
  }

  return CallOverlay.showOverlay(title, isMuted);
};

export const hideAndroidCallOverlay = async (): Promise<void> => {
  if (!isCallOverlaySupported || !CallOverlay?.hideOverlay) {
    return;
  }

  await CallOverlay.hideOverlay();
};

export const dismissCallOverlay = async (): Promise<void> => {
  if (!isCallOverlaySupported) {
    return;
  }

  if (isIosCallPiPSupported && CallOverlay?.dismissOverlay) {
    await CallOverlay.dismissOverlay();
    return;
  }

  if (CallOverlay?.hideOverlay) {
    await CallOverlay.hideOverlay();
  }
};

export const updateAndroidCallOverlayMic = (isMuted: boolean): void => {
  if (!isCallOverlaySupported || !CallOverlay?.updateMicState) {
    return;
  }

  CallOverlay.updateMicState(isMuted);
};

export const syncOngoingCallCallKit = (
  buzzCode: string,
  title: string,
  isActive: boolean,
  alternateBuzzId?: string | null,
): void => {
  if (Platform.OS !== 'ios' || !CallOverlay?.syncOngoingCallCallKit) {
    return;
  }

  CallOverlay.syncOngoingCallCallKit(
    buzzCode,
    title,
    isActive,
    alternateBuzzId ?? null,
  );
};

export const teardownIosBuzzCallNative = async (options?: {
  buzzCode?: string;
  buzzId?: string;
  title?: string;
}): Promise<void> => {
  await dismissCallOverlay();

  if (Platform.OS !== 'ios') {
    return;
  }

  const buzzCode = String(options?.buzzCode || '').trim();
  if (!buzzCode) {
    return;
  }

  const title = options?.title || 'Buzz call';
  const buzzId = options?.buzzId ? String(options.buzzId).trim() : null;
  syncOngoingCallCallKit(buzzCode, title, false, buzzId);
};

export const bringAppToForeground = async (): Promise<void> => {
  if (!isCallOverlaySupported || !CallOverlay?.bringAppToForeground) {
    return;
  }

  await CallOverlay.bringAppToForeground();
};

export const subscribeToCallOverlayActions = (
  listener: (
    action: CallOverlayAction,
    payload?: CallOverlayActionPayload,
  ) => void,
): (() => void) => {
  if (!isCallOverlaySupported) {
    return () => undefined;
  }

  const handler = (payload: CallOverlayActionPayload) => {
    if (payload?.action) {
      listener(payload.action, payload);
    }
  };

  if (Platform.OS === 'ios') {
    const emitter = new NativeEventEmitter(NativeModules.CallOverlay);
    const subscription = emitter.addListener(CALL_OVERLAY_EVENT, handler);
    return () => subscription.remove();
  }

  const subscription = DeviceEventEmitter.addListener(
    CALL_OVERLAY_EVENT,
    handler,
  );
  return () => subscription.remove();
};
