import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert, Share } from 'react-native';
import { recordSuccessfulMessage } from '@/utils/share-zedu-prompt';
import {
  buildShareZeduMessage,
  presentShareZeduPrompt,
} from '@/hooks/useShareZeduPrompt';

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);
jest.mock('@react-navigation/native', () => ({
  useFocusEffect: jest.fn(),
}));

const makeEligible = async (userId = 'user-a') => {
  await Promise.all(
    Array.from({ length: 5 }, () => recordSuccessfulMessage(userId)),
  );
};

describe('Share Zedu prompt', () => {
  let alertSpy: jest.SpyInstance;
  let shareSpy: jest.SpyInstance;

  beforeEach(async () => {
    await AsyncStorage.clear();
    alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(jest.fn());
    shareSpy = jest
      .spyOn(Share, 'share')
      .mockResolvedValue({ action: Share.dismissedAction });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('does not interrupt an account before its fifth message', async () => {
    await Promise.all(
      Array.from({ length: 4 }, () => recordSuccessfulMessage('user-a')),
    );

    await presentShareZeduPrompt('user-a');

    expect(alertSpy).not.toHaveBeenCalled();
  });

  it('does nothing without an account id', async () => {
    await presentShareZeduPrompt(undefined);

    expect(alertSpy).not.toHaveBeenCalled();
  });

  it('shows the approved copy and actions after eligibility', async () => {
    await makeEligible();

    await presentShareZeduPrompt('user-a');

    expect(alertSpy).toHaveBeenCalledWith(
      'Know someone who would enjoy Zedu?',
      'Share Zedu with a friend or learning community.',
      [
        expect.objectContaining({ text: 'Share Zedu' }),
        expect.objectContaining({ text: 'Not now', style: 'cancel' }),
      ],
      { cancelable: false },
    );
  });

  it('normalizes the public URL in the native share message', () => {
    expect(buildShareZeduMessage('https://zedu.chat/')).toBe(
      'Join me on Zedu—a space for learning communities to connect and collaborate.\n\nhttps://zedu.chat',
    );
  });

  it('never reappears after Not now', async () => {
    await makeEligible();
    await presentShareZeduPrompt('user-a');

    const buttons = alertSpy.mock.calls[0][2];
    buttons?.[1]?.onPress?.();
    alertSpy.mockClear();

    await presentShareZeduPrompt('user-a');

    expect(alertSpy).not.toHaveBeenCalled();
  });

  it('opens native sharing once and stays dismissed when sharing is cancelled', async () => {
    await makeEligible();
    await presentShareZeduPrompt('user-a');

    const buttons = alertSpy.mock.calls[0][2];
    await buttons?.[0]?.onPress?.();

    expect(shareSpy).toHaveBeenCalledWith({
      message:
        'Join me on Zedu—a space for learning communities to connect and collaborate.\n\nhttps://zedu.chat',
    });

    alertSpy.mockClear();
    await presentShareZeduPrompt('user-a');
    expect(alertSpy).not.toHaveBeenCalled();
  });

  it('waits for the next list focus when the current focus ends during eligibility', async () => {
    await makeEligible();

    await presentShareZeduPrompt('user-a', 'https://zedu.chat', () => false);

    expect(alertSpy).not.toHaveBeenCalled();

    await presentShareZeduPrompt('user-a');
    expect(alertSpy).toHaveBeenCalledTimes(1);
  });
});
