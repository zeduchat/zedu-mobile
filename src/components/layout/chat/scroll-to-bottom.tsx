import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  Animated,
  FlatList,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Platform,
  StyleSheet,
  TouchableOpacity,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useTheme } from '@/theme/ThemeProvider';

const SHOW_THRESHOLD = 140;

type ListRef = React.RefObject<FlatList<any> | null>;

/**
 * Tracks inverted chat FlatList scroll for a WhatsApp-style jump-to-latest control.
 * On inverted lists, offset 0 is the newest messages (visual bottom).
 */
export function useInvertedChatScrollToBottom(listRef: ListRef) {
  const [visible, setVisible] = useState(false);
  const visibleRef = useRef(false);

  const onScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const offsetY = event.nativeEvent.contentOffset.y;
      const next = offsetY > SHOW_THRESHOLD;
      if (next === visibleRef.current) return;
      visibleRef.current = next;
      setVisible(next);
    },
    [],
  );

  const scrollToBottom = useCallback(() => {
    listRef.current?.scrollToOffset({ offset: 0, animated: true });
    visibleRef.current = false;
    setVisible(false);
  }, [listRef]);

  return { onScroll, visible, scrollToBottom };
}

type ButtonProps = {
  visible: boolean;
  onPress: () => void;
  style?: StyleProp<ViewStyle>;
};

/** Circular chevron-down FAB for inverted chat lists. */
export function ChatScrollToBottomButton({
  visible,
  onPress,
  style,
}: ButtonProps) {
  const { colors } = useTheme();
  const opacity = useRef(new Animated.Value(0)).current;
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    if (visible) {
      setMounted(true);
      Animated.timing(opacity, {
        toValue: 1,
        duration: 160,
        useNativeDriver: true,
      }).start();
      return;
    }

    Animated.timing(opacity, {
      toValue: 0,
      duration: 140,
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (finished) setMounted(false);
    });
  }, [opacity, visible]);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        wrap: {
          position: 'absolute',
          right: 14,
          bottom: 12,
          zIndex: 20,
        },
        button: {
          width: 40,
          height: 40,
          borderRadius: 20,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: colors.surfaceElevated || colors.surface,
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: colors.border,
          ...Platform.select({
            ios: {
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.18,
              shadowRadius: 4,
            },
            android: {
              elevation: 4,
            },
          }),
        },
      }),
    [colors],
  );

  if (!mounted) {
    return null;
  }

  return (
    <Animated.View
      pointerEvents={visible ? 'auto' : 'none'}
      style={[styles.wrap, style, { opacity }]}
    >
      <TouchableOpacity
        accessibilityRole="button"
        accessibilityLabel="Scroll to latest messages"
        activeOpacity={0.85}
        onPress={onPress}
        style={styles.button}
      >
        <Ionicons name="chevron-down" size={22} color={colors.iconDefault} />
      </TouchableOpacity>
    </Animated.View>
  );
}
