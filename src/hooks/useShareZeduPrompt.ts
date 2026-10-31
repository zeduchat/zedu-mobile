import { useCallback } from 'react';
import { Alert, Share } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { CLIENT_URL } from '@env';
import { claimSharePrompt } from '@/utils/share-zedu-prompt';

const SHARE_COPY =
  'Join me on Zedu—a space for learning communities to connect and collaborate.';

export const buildShareZeduMessage = (clientUrl?: string) => {
  const publicUrl = (clientUrl || 'https://zedu.chat').replace(/\/$/, '');
  return `${SHARE_COPY}\n\n${publicUrl}`;
};

export const presentShareZeduPrompt = async (
  userId?: string,
  clientUrl = CLIENT_URL,
) => {
  if (!userId) return;

  try {
    const shouldShow = await claimSharePrompt(userId);
    if (!shouldShow) return;

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
      presentShareZeduPrompt(userId);
    }, [userId]),
  );
};

export default useShareZeduPrompt;
