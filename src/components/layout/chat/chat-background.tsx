import React from 'react';
import { Image, StyleSheet, View } from 'react-native';
import { useTheme } from '@/theme/ThemeProvider';

/**
 * Chat wallpaper — shows the light pattern in light mode;
 * uses a solid themed background in dark mode (pattern asset is light-only).
 */
const ChatBackground = () => {
  const { colors, isDark } = useTheme();

  if (isDark) {
    return (
      <View
        style={[
          StyleSheet.absoluteFill,
          { backgroundColor: colors.background },
        ]}
      />
    );
  }

  return (
    <Image
      source={require('@/assets/images/chat-bg.png')}
      style={StyleSheet.absoluteFill}
      resizeMode="repeat"
    />
  );
};

export default ChatBackground;
