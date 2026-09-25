import { NativeModules, Platform } from 'react-native';

type CallKeepAwakeModule = {
  setEnabled: (enabled: boolean) => Promise<void>;
};

const CallKeepAwake = NativeModules.CallKeepAwake as
  | CallKeepAwakeModule
  | undefined;

export const setCallKeepAwake = async (enabled: boolean): Promise<void> => {
  if (Platform.OS !== 'ios' || !CallKeepAwake?.setEnabled) {
    return;
  }

  await CallKeepAwake.setEnabled(enabled);
};
