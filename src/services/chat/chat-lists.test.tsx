/**
 * @format
 */

import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import { GetRequest } from '@/utils/requests';
import { ACTIONS } from '@/store/types';
import { useDMs } from '@/services/chat/chat-lists';

const mockDispatch = jest.fn();

jest.mock('@/utils/requests', () => ({
  GetRequest: jest.fn(),
}));

jest.mock('@/store/useDataContext', () => ({
  useDataContext: () => ({
    state: { dms: [], callback: false },
    dispatch: mockDispatch,
  }),
}));

const mockGetRequest = GetRequest as jest.MockedFunction<typeof GetRequest>;

const Harness = ({ search }: { search: string }) => {
  useDMs('org-1', search);
  return null;
};

const dmsDispatches = () =>
  mockDispatch.mock.calls
    .map(([action]) => action)
    .filter(action => action.type === ACTIONS.DMS);

describe('useDMs', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('ignores a slow answer for an old search after the search is cleared', async () => {
    const answers: Array<(value: any) => void> = [];
    mockGetRequest.mockImplementation(
      () => new Promise(resolve => answers.push(resolve)) as any,
    );

    let renderer: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(async () => {
      renderer = ReactTestRenderer.create(<Harness search="a" />);
    });
    await ReactTestRenderer.act(async () => {
      jest.advanceTimersByTime(500);
    });

    // Clear the search while the "a" request is still waiting.
    await ReactTestRenderer.act(async () => {
      renderer.update(<Harness search="" />);
    });
    await ReactTestRenderer.act(async () => {
      jest.advanceTimersByTime(500);
    });

    expect(mockGetRequest).toHaveBeenCalledTimes(2);
    expect(mockGetRequest.mock.calls[0][0]).toContain('search=a');
    expect(mockGetRequest.mock.calls[1][0]).toContain('search=');

    const allChats = [{ channel_id: 'dm-1' }, { channel_id: 'dm-2' }];
    const onlyA = [{ channel_id: 'dm-1' }];

    // The newer (cleared) answer arrives first, then the old "a" answer.
    await ReactTestRenderer.act(async () => {
      answers[1]({ data: { data: allChats }, error: null });
    });
    await ReactTestRenderer.act(async () => {
      answers[0]({ data: { data: onlyA }, error: null });
    });

    expect(dmsDispatches()).toEqual([{ type: ACTIONS.DMS, payload: allChats }]);
  });

  it('ignores an older answer for the same search text', async () => {
    const answers: Array<(value: any) => void> = [];
    mockGetRequest.mockImplementation(
      () => new Promise(resolve => answers.push(resolve)) as any,
    );

    let renderer: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(async () => {
      renderer = ReactTestRenderer.create(<Harness search="ab" />);
    });
    await ReactTestRenderer.act(async () => {
      jest.advanceTimersByTime(500);
    });

    // Change to "a", then back to "ab", while the first "ab" is still waiting.
    for (const search of ['a', 'ab']) {
      await ReactTestRenderer.act(async () => {
        renderer.update(<Harness search={search} />);
      });
      await ReactTestRenderer.act(async () => {
        jest.advanceTimersByTime(500);
      });
    }

    expect(mockGetRequest).toHaveBeenCalledTimes(3);

    const newest = [{ channel_id: 'dm-new' }];
    const oldest = [{ channel_id: 'dm-old' }];

    // The newest "ab" answer arrives first, then the first "ab" and the "a".
    await ReactTestRenderer.act(async () => {
      answers[2]({ data: { data: newest }, error: null });
    });
    await ReactTestRenderer.act(async () => {
      answers[0]({ data: { data: oldest }, error: null });
      answers[1]({ data: { data: oldest }, error: null });
    });

    expect(dmsDispatches()).toEqual([{ type: ACTIONS.DMS, payload: newest }]);
  });
});
