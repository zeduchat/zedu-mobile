import AsyncStorage from '@react-native-async-storage/async-storage';

export const SHARE_PROMPT_STORAGE_PREFIX = '@zedu/share-prompt/';

type SharePromptState = {
  successfulMessageCount: number;
  hasSeenPrompt: boolean;
};

const DEFAULT_STATE: SharePromptState = {
  successfulMessageCount: 0,
  hasSeenPrompt: false,
};

let mutationQueue = Promise.resolve();

const enqueueMutation = <T>(operation: () => Promise<T>): Promise<T> => {
  const result = mutationQueue.then(operation, operation);
  mutationQueue = result.then(
    () => undefined,
    () => undefined,
  );
  return result;
};

const getStorageKey = (userId: string) => {
  const normalizedUserId = userId.trim();
  return normalizedUserId
    ? `${SHARE_PROMPT_STORAGE_PREFIX}${normalizedUserId}`
    : null;
};

const readState = async (key: string): Promise<SharePromptState> => {
  const stored = await AsyncStorage.getItem(key);
  if (!stored) return { ...DEFAULT_STATE };

  try {
    const parsed = JSON.parse(stored);
    return {
      successfulMessageCount: Math.min(
        5,
        Math.max(0, Number(parsed?.successfulMessageCount) || 0),
      ),
      hasSeenPrompt: parsed?.hasSeenPrompt === true,
    };
  } catch {
    return { ...DEFAULT_STATE };
  }
};

export const recordSuccessfulMessage = async (userId: string) => {
  const key = getStorageKey(userId);
  if (!key) return;

  await enqueueMutation(async () => {
    const state = await readState(key);
    const nextState: SharePromptState = {
      ...state,
      successfulMessageCount: Math.min(
        5,
        state.successfulMessageCount + 1,
      ),
    };
    await AsyncStorage.setItem(key, JSON.stringify(nextState));
  });
};

export const recordSuccessfulMessageResult = async (
  userId: unknown,
  error: string | null,
) => {
  if (error || typeof userId !== 'string' || !userId.trim()) return;

  try {
    await recordSuccessfulMessage(userId);
  } catch (_error) {}
};

export const claimSharePrompt = async (userId: string) => {
  const key = getStorageKey(userId);
  if (!key) return false;

  return enqueueMutation(async () => {
    const state = await readState(key);
    if (state.successfulMessageCount < 5 || state.hasSeenPrompt) return false;

    await AsyncStorage.setItem(
      key,
      JSON.stringify({ ...state, hasSeenPrompt: true }),
    );
    return true;
  });
};
