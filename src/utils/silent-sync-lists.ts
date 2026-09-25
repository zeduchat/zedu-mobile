import { Dispatch } from 'react';
import { GetRequest } from '@/utils/requests';
import { ACTIONS, Action } from '@/store/types';

const SILENT_SYNC_DELAY_MS = 600;

let dmSyncTimer: ReturnType<typeof setTimeout> | null = null;
let channelSyncTimer: ReturnType<typeof setTimeout> | null = null;

export const scheduleSilentDmSync = (
  orgId: string | null,
  dispatch: Dispatch<Action>,
) => {
  if (!orgId) return;

  if (dmSyncTimer) {
    clearTimeout(dmSyncTimer);
  }

  dmSyncTimer = setTimeout(async () => {
    const { data, error } = await GetRequest(
      `/organisations/${orgId}/dms?page=1&limit=50&search=`,
    );

    if (!error && data?.data) {
      dispatch({ type: ACTIONS.DMS, payload: data.data });
    }
  }, SILENT_SYNC_DELAY_MS);
};

export const scheduleSilentChannelSync = (
  orgId: string | null,
  dispatch: Dispatch<Action>,
) => {
  if (!orgId) return;

  if (channelSyncTimer) {
    clearTimeout(channelSyncTimer);
  }

  channelSyncTimer = setTimeout(async () => {
    const { data, error } = await GetRequest(
      `/organisations/${orgId}/user-channels?page=1&limit=50&search=`,
    );

    if (!error && data?.data) {
      dispatch({ type: ACTIONS.USER_CHANNELS, payload: data.data });
    }
  }, SILENT_SYNC_DELAY_MS);
};
