import { useCallback } from 'react';
import { Alert, Share } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { claimSharePrompt } from '@/utils/share-zedu-prompt';
import { CLIENT_BASE_URL, normalizeClientBaseUrl } from '@/utils/client-url';

const SHARE_COPY =
  'Join me on Zedu—a space for learning communities to connect and collaborate.';

export const buildShareZeduMessage = (clientUrl?: string) => {
  const publicUrl = normalizeClientBaseUrl(clientUrl ?? CLIENT_BASE_URL);
  return `${SHARE_COPY}\n\n${publicUrl}`;
};

export const presentShareZeduPrompt = async (
  userId?: string,
  clientUrl = CLIENT_BASE_URL,
  shouldPresent: () => boolean = () => true,
) => {
  if (!userId || !shouldPresent()) return;

  try {
    const shouldShow = await claimSharePrompt(userId, shouldPresent);
    if (!shouldShow || !shouldPresent()) return;

    Alert.alert(
      'Know someone who would enjoy Zedu?',
      'Share Zedu with a friend or learning community.',
      [
        {
          text: 'Share Zedu',
          onPress: async () => {
            try {
              await Share.share({
                message: buildShareZeduMessage(clientUrl),
              });
            } catch (_error) {}
          },
        },
        { text: 'Not now', style: 'cancel' },
      ],
      { cancelable: false },
    );
  } catch (_error) {}
};

const useShareZeduPrompt = (userId?: string) => {
  useFocusEffect(
    useCallback(() => {
      let isFocused = true;
      presentShareZeduPrompt(userId, CLIENT_BASE_URL, () => isFocused);

      return () => {
        isFocused = false;
      };
    }, [userId]),
  );
};

export default useShareZeduPrompt;
