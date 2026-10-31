/**
 * @format
 */

import reducers from '@/store/Reducers';
import { initialAppState } from '@/store/initial-state';
import { ACTIONS, Action } from '@/store/types';
import { signOut } from '@/utils/sign-out';
import { clearAllData } from '@/utils/helper';

jest.mock('@/utils/helper', () => ({
  clearAllData: jest.fn(() => Promise.resolve()),
}));

describe('RESET_STATE', () => {
  it('returns every field to its initial value after a signed-in session', () => {
    const signedIn = [
      { type: ACTIONS.TOKEN, payload: 'token-a' },
      { type: ACTIONS.USER, payload: { id: 'user-a' } },
      { type: ACTIONS.ORG_ID, payload: 'org-a' },
      { type: ACTIONS.USER_CHANNELS, payload: [{ id: 'channel-a' }] },
      { type: ACTIONS.MENTIONS_LIST, payload: [{ id: 'mention-a' }] },
      { type: ACTIONS.UNSEEN_THREAD_COUNT, payload: 4 },
    ].reduce(
      (state, action) => reducers(state, action as Action),
      initialAppState,
    );

    expect(signedIn).not.toEqual(initialAppState);

    const afterReset = reducers(signedIn, { type: ACTIONS.RESET_STATE });

    expect(afterReset).toEqual(initialAppState);
  });
});

describe('signOut', () => {
  it('clears saved data, then resets the in-memory state', async () => {
    const dispatch = jest.fn();

    await signOut(dispatch);

    expect(clearAllData).toHaveBeenCalledTimes(1);
    expect(dispatch).toHaveBeenCalledWith({ type: ACTIONS.RESET_STATE });
  });
});
