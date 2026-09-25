import React, { useEffect, useMemo, useRef } from 'react';
import { Animated, Dimensions, View } from 'react-native';
import { AppText } from '@/components/ui/text';
import { useTheme } from '@/theme/ThemeProvider';
import { createBuzzFloatingEmojiStyles } from '@/theme/createBuzzStyles';

interface FloatingEmoji {
  id: number | string;
  emoji: string;
  x?: number;
  y?: number;
  name?: string;
  jitter?: number;
}

interface FloatingEmojiOverlayProps {
  floatingEmojis: FloatingEmoji[];
}

const FloatingEmojiItem = ({
  item,
  styles,
}: {
  item: FloatingEmoji;
  styles: ReturnType<typeof createBuzzFloatingEmojiStyles>;
}) => {
  const translateY = useRef(new Animated.Value(0)).current;
  const translateX = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(1)).current;
  const scale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const { height } = Dimensions.get('window');

    Animated.parallel([
      Animated.timing(translateY, {
        toValue: -height * 0.75,
        duration: 1800,
        useNativeDriver: true,
      }),
      Animated.timing(translateX, {
        toValue: item.jitter ?? 0,
        duration: 1800,
        useNativeDriver: true,
      }),
      Animated.sequence([
        Animated.delay(1200),
        Animated.timing(opacity, {
          toValue: 0,
          duration: 600,
          useNativeDriver: true,
        }),
      ]),
      Animated.timing(scale, {
        toValue: 0.72,
        duration: 1800,
        useNativeDriver: true,
      }),
    ]).start();
  }, [item.jitter, opacity, scale, translateX, translateY]);

  const left = (item.x ?? Dimensions.get('window').width / 2) - 30;
  const top = item.y ?? Dimensions.get('window').height - 140;

  return (
    <Animated.View
      style={[
        styles.emojiContainer,
        {
          left,
          top,
          opacity,
          transform: [{ translateX }, { translateY }, { scale }],
        },
      ]}
    >
      <AppText style={styles.emojiText}>{item.emoji}</AppText>
      {!!item.name && <AppText style={styles.nameTag}>{item.name}</AppText>}
    </Animated.View>
  );
};

export const FloatingEmojiOverlay = ({
  floatingEmojis,
}: FloatingEmojiOverlayProps) => {
  const { colors } = useTheme();
  const styles = useMemo(() => createBuzzFloatingEmojiStyles(colors), [colors]);

  return (
    <View pointerEvents="none" style={styles.overlay}>
      {floatingEmojis?.map(item => (
        <FloatingEmojiItem key={item.id} item={item} styles={styles} />
      ))}
    </View>
  );
};

export default FloatingEmojiOverlay;
