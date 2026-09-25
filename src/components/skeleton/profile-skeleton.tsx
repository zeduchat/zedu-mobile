import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';

const ProfileSkeleton = () => {
  const opacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    // Creates a pulsing shimmer effect
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
  }, []);

  return (
    <Animated.View style={[styles.chatItem, { opacity }]}>
      <View style={styles.nameSkeleton} />
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  chatItem: { flexDirection: 'row', alignItems: 'center' },
  nameSkeleton: {
    width: '50%',
    height: 14,
    borderRadius: 4,
    backgroundColor: '#E1E9EE',
  },
});

export default ProfileSkeleton;
