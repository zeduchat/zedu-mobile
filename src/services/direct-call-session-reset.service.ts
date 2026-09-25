import { Dispatch } from 'react';
import { Platform } from 'react-native';
import { Action, ACTIONS } from '@/store/types';
import { clearPendingIncomingCall } from '@/services/incoming-direct-call-session.service';
import { clearPendingIncomingCallCancelled } from '@/services/incoming-direct-call-cancel.service';
import {
  clearIosLaunchIncomingCall,
  resetIosIncomingCallSession,
} from '@/services/ios-incoming-call.service';
import {
  clearAndroidLaunchIncomingCall,
  dismissAndroidIncomingCallNotification,
} from '@/services/android-incoming-call.service';

export type ResetDirectCallSessionOptions = {
  buzzId?: string;
  skipNative?: boolean;
};

export const resetDirectCallAppState = (dispatch: Dispatch<Action>) => {
  dispatch({ type: ACTIONS.RESET_DIRECT_CALL_SESSION });
};

export const resetDirectCallSession = async (
  dispatch: Dispatch<Action>,
  options?: ResetDirectCallSessionOptions,
) => {
  resetDirectCallAppState(dispatch);
  clearPendingIncomingCall();

  if (options?.buzzId) {
    clearPendingIncomingCallCancelled(options.buzzId);
  }

  if (options?.skipNative) {
    return;
  }

  if (Platform.OS === 'ios') {
    await resetIosIncomingCallSession(options?.buzzId);
    await clearIosLaunchIncomingCall();
    return;
  }

  if (Platform.OS === 'android') {
    await dismissAndroidIncomingCallNotification();
    await clearAndroidLaunchIncomingCall();
  }
};
