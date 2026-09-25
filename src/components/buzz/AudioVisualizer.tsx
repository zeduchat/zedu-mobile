import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet } from 'react-native';

interface AudioVisualizerProps {
  isActive: boolean;
}

/**
 * AudioVisualizer Component
 * Renders animated pulsing rings around participant when audio is active
 * Similar to Google Meet's audio visualization
 */
export const AudioVisualizer = ({ isActive }: AudioVisualizerProps) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const opacityAnim = useRef(new Animated.Value(0.6)).current;

  useEffect(() => {
    if (isActive) {
      Animated.loop(
        Animated.parallel([
          Animated.sequence([
            Animated.timing(scaleAnim, {
              toValue: 1.3,
              duration: 600,
              useNativeDriver: false,
            }),
            Animated.timing(scaleAnim, {
              toValue: 1,
              duration: 600,
              useNativeDriver: false,
            }),
          ]),
          Animated.sequence([
            Animated.timing(opacityAnim, {
              toValue: 0,
              duration: 1200,
              useNativeDriver: false,
            }),
            Animated.timing(opacityAnim, {
              toValue: 0.6,
              duration: 0,
              useNativeDriver: false,
            }),
          ]),
        ]),
      ).start();
    } else {
      scaleAnim.setValue(1);
      opacityAnim.setValue(0);
    }
  }, [isActive, scaleAnim, opacityAnim]);

  return (
    <>
      <Animated.View
        style={[
          styles.audioRing1,
          {
            transform: [{ scale: scaleAnim }],
            opacity: opacityAnim,
          },
        ]}
      />
      <Animated.View
        style={[
          styles.audioRing2,
          {
            transform: [{ scale: scaleAnim }],
            opacity: opacityAnim,
          },
        ]}
      />
      <Animated.View
        style={[
          styles.audioRing3,
          {
            transform: [{ scale: scaleAnim }],
            opacity: opacityAnim,
          },
        ]}
      />
    </>
  );
};

const styles = StyleSheet.create({
  audioRing1: {
    position: 'absolute',
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.8)',
  },
  audioRing2: {
    position: 'absolute',
    width: 95,
    height: 95,
    borderRadius: 47.5,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.5)',
  },
  audioRing3: {
    position: 'absolute',
    width: 110,
    height: 110,
    borderRadius: 55,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
});
