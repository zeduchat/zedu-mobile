import { NativeModules, Platform } from 'react-native';

type CallOverlayScreenBroadcastModule = {
  stopScreenBroadcast?: () => void;
};

const CallOverlay = NativeModules.CallOverlay as
  | CallOverlayScreenBroadcastModule
  | undefined;

export const stopIosScreenBroadcast = (): void => {
  if (Platform.OS !== 'ios' || !CallOverlay?.stopScreenBroadcast) {
    return;
  }

  CallOverlay.stopScreenBroadcast();
};
