import React, { useEffect, useMemo, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { normalize } from '@/utils/normalize';
import { useTheme } from '@/theme/ThemeProvider';

const ChatSkeleton = () => {
  const { colors } = useTheme();
  const opacity = useRef(new Animated.Value(0.3)).current;

  const styles = useMemo(
    () =>
      StyleSheet.create({
        chatItem: {
          flexDirection: 'row',
          marginBottom: normalize(25),
          alignItems: 'center',
        },
        chatInfo: { flex: 1, marginLeft: 15 },
        chatHeaderRow: {
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 8,
        },
        chatFooterRow: {
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
        },
        avatarSkeleton: {
          width: normalize(45),
          height: normalize(45),
          borderRadius: normalize(28),
          backgroundColor: colors.skeleton,
        },
        nameSkeleton: {
          width: '40%',
          height: 14,
          borderRadius: 4,
          backgroundColor: colors.skeleton,
        },
        msgSkeleton: {
          width: '70%',
          height: 12,
          borderRadius: 4,
          backgroundColor: colors.skeleton,
        },
      }),
    [colors],
  );

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.3,
          duration: 800,
          useNativeDriver: true,
        }),
      ]),
    ).start();
  }, [opacity]);

  return (
    <Animated.View style={[styles.chatItem, { opacity }]}>
      <View style={styles.avatarSkeleton} />

      <View style={styles.chatInfo}>
        <View style={styles.chatHeaderRow}>
          <View style={styles.nameSkeleton} />
        </View>

        <View style={styles.chatFooterRow}>
          <View style={styles.msgSkeleton} />
        </View>
      </View>
    </Animated.View>
  );
};

export default ChatSkeleton;
