import { Dispatch } from 'react';
import { ACTIONS, Action } from '@/store/types';
import { clearAllData } from '@/utils/helper';
import { unregisterAndroidPushDevice } from '@/services/push-notifications.service';

/**
 * Signs the user out on this device: clears saved data and resets the whole
 * in-memory state, so nothing from this account is shown to the next one.
 */
export const signOut = async (dispatch: Dispatch<Action>) => {
  await unregisterAndroidPushDevice().catch(() => {});
  await clearAllData();
  dispatch({ type: ACTIONS.RESET_STATE });
};
