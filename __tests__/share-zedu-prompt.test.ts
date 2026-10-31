import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  SHARE_PROMPT_STORAGE_PREFIX,
  claimSharePrompt,
  recordSuccessfulMessageResult,
  recordSuccessfulMessage,
} from '@/utils/share-zedu-prompt';
import { clearAllData } from '@/utils/helper';

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

const readState = async (userId: string) => {
  const stored = await AsyncStorage.getItem(
    `${SHARE_PROMPT_STORAGE_PREFIX}${userId}`,
  );
  return stored ? JSON.parse(stored) : null;
};

describe('share Zedu prompt persistence', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
  });

  it('caps successful-message eligibility at five', async () => {
    for (let index = 0; index < 6; index += 1) {
      await recordSuccessfulMessage('user-a');
    }

    await expect(readState('user-a')).resolves.toEqual({
      successfulMessageCount: 5,
      hasSeenPrompt: false,
    });
  });

  it('keeps engagement state isolated between accounts', async () => {
    await Promise.all(
      Array.from({ length: 5 }, () => recordSuccessfulMessage('user-a')),
    );

    await expect(claimSharePrompt('user-b')).resolves.toBe(false);
    await expect(claimSharePrompt('user-a')).resolves.toBe(true);
  });

  it('serializes concurrent successful sends without losing increments', async () => {
    await Promise.all(
      Array.from({ length: 5 }, () => recordSuccessfulMessage('user-a')),
    );

    await expect(readState('user-a')).resolves.toEqual({
      successfulMessageCount: 5,
      hasSeenPrompt: false,
    });
  });

  it('claims the prompt only once after the fifth message', async () => {
    await Promise.all(
      Array.from({ length: 4 }, () => recordSuccessfulMessage('user-a')),
    );
    await expect(claimSharePrompt('user-a')).resolves.toBe(false);

    await recordSuccessfulMessage('user-a');

    await expect(claimSharePrompt('user-a')).resolves.toBe(true);
    await expect(claimSharePrompt('user-a')).resolves.toBe(false);
  });

  it('ignores empty account ids', async () => {
    await recordSuccessfulMessage('');

    await expect(claimSharePrompt('')).resolves.toBe(false);
    await expect(AsyncStorage.getAllKeys()).resolves.toEqual([]);
  });

  it('preserves account prompt state while clearing session data', async () => {
    await recordSuccessfulMessage('user-a');
    await AsyncStorage.setItem('token', JSON.stringify('secret-token'));

    await clearAllData();

    await expect(AsyncStorage.getItem('token')).resolves.toBeNull();
    await expect(readState('user-a')).resolves.toEqual({
      successfulMessageCount: 1,
      hasSeenPrompt: false,
    });
  });

  it('counts only successful API send results', async () => {
    await Promise.all(
      Array.from({ length: 5 }, () =>
        recordSuccessfulMessageResult('user-a', null),
      ),
    );

    await expect(claimSharePrompt('user-a')).resolves.toBe(true);
  });

  it('does not count failed API send results', async () => {
    await Promise.all(
      Array.from({ length: 5 }, () =>
        recordSuccessfulMessageResult('user-a', 'Message failed'),
      ),
    );

    await expect(claimSharePrompt('user-a')).resolves.toBe(false);
  });

  it('does not store successful results without a valid account id', async () => {
    await recordSuccessfulMessageResult(undefined, null);
    await recordSuccessfulMessageResult(42, null);

    await expect(AsyncStorage.getAllKeys()).resolves.toEqual([]);
  });
});
