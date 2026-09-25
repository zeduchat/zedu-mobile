import React, { useEffect, useMemo, useRef } from 'react';
import { View, Animated } from 'react-native';
import { useTheme } from '@/theme/ThemeProvider';
import { createMentionSkeletonStyles } from '@/theme/createStep10Styles';

const MentionSkeleton = () => {
  const { colors } = useTheme();
  const styles = useMemo(() => createMentionSkeletonStyles(colors), [colors]);
  const opacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 700,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.3,
          duration: 700,
          useNativeDriver: true,
        }),
      ]),
    ).start();
  }, []);

  return (
    <Animated.View style={[styles.card, { opacity }]}>
      <View style={styles.channelBar} />
      <View style={styles.row}>
        <View style={styles.avatar} />
        <View style={styles.content}>
          <View style={styles.headerRow}>
            <View style={styles.name} />
            <View style={styles.time} />
          </View>
          <View style={styles.line} />
          <View style={styles.badge} />
        </View>
      </View>
    </Animated.View>
  );
};

export default MentionSkeleton;
