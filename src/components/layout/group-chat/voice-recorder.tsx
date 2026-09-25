import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  View,
  Animated,
  PanResponder,
  Dimensions,
  StyleSheet,
} from 'react-native';
import { AppText } from '@/components/ui/text';
import { useTheme } from '@/theme/ThemeProvider';

const { width } = Dimensions.get('window');

interface VoiceRecorderProps {
  onRecordingStart: () => void;
  onRecordingStop: (uri: string) => void;
  onRecordingCancel: () => void;
}

export const VoiceRecorder = ({
  onRecordingStart,
  onRecordingStop,
  onRecordingCancel,
}: VoiceRecorderProps) => {
  const { colors } = useTheme();
  const styles = useMemo(
    () => ({
      wrapper: { flexDirection: 'row' as const, alignItems: 'center' as const },
      recordingOverlay: {
        width: width - 80,
        backgroundColor: colors.white,
        flexDirection: 'row' as const,
        alignItems: 'center' as const,
        justifyContent: 'space-between' as const,
        paddingHorizontal: 20,
        borderRadius: 30,
        left: -width + 100,
      },
      timerRow: {
        flexDirection: 'row' as const,
        alignItems: 'center' as const,
      },
      redDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: colors.error,
        marginRight: 8,
      },
      timerText: { fontSize: 16, color: colors.textPrimary },
      slideContainer: {
        flexDirection: 'row' as const,
        alignItems: 'center' as const,
      },
      slideText: { color: colors.messageMeta, fontSize: 14 },
      micCircle: {
        width: 50,
        height: 50,
        justifyContent: 'center' as const,
        alignItems: 'center' as const,
        borderRadius: 25,
      },
      activeMic: {
        transform: [{ scale: 1.5 }],
        backgroundColor: colors.transparent,
      },
      micIcon: { width: 24, height: 24 },
    }),
    [colors],
  );
  const [isRecording, setIsRecording] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const translateX = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(1)).current;

  // Timer Logic
  useEffect(() => {
    let interval: any;
    if (isRecording) {
      interval = setInterval(() => setSeconds(s => s + 1), 1000);
    } else {
      setSeconds(0);
    }
    return () => clearInterval(interval);
  }, [isRecording]);

  const formatTime = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const s = sec % 60;
    return `${mins}:${s < 10 ? '0' : ''}${s}`;
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        setIsRecording(true);
        onRecordingStart();
        // Pulsing animation for the red dot
        Animated.loop(
          Animated.sequence([
            Animated.timing(opacity, {
              toValue: 0.2,
              duration: 500,
              useNativeDriver: true,
            }),
            Animated.timing(opacity, {
              toValue: 1,
              duration: 500,
              useNativeDriver: true,
            }),
          ]),
        ).start();
      },
      onPanResponderMove: (_, gestureState) => {
        // Handle the left swipe to cancel
        if (gestureState.dx < 0) {
          translateX.setValue(gestureState.dx);
        }
        if (gestureState.dx < -120) {
          handleCancel();
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dx > -120) {
          handleStop();
        }
      },
    }),
  ).current;

  const handleStop = () => {
    setIsRecording(false);
    translateX.setValue(0);
    onRecordingStop('dummy_uri_here');
  };

  const handleCancel = () => {
    setIsRecording(false);
    translateX.setValue(0);
    onRecordingCancel();
  };

  return (
    <View style={styles.wrapper}>
      {isRecording && (
        <View style={[StyleSheet.absoluteFill, styles.recordingOverlay]}>
          <View style={styles.timerRow}>
            <Animated.View style={[styles.redDot, { opacity }]} />
            <AppText style={styles.timerText}>{formatTime(seconds)}</AppText>
          </View>

          <Animated.View
            style={[styles.slideContainer, { transform: [{ translateX }] }]}
          >
            <AppText style={styles.slideText}>{'< Slide to cancel'}</AppText>
          </Animated.View>
        </View>
      )}

      <View
        {...panResponder.panHandlers}
        style={[
          isRecording ? styles.micCircle : '',
          isRecording && styles.activeMic,
        ]}
      >
        {/* <Image
                    source={require('@/assets/icons/mic.png')}
                    style={[styles.micIcon, { tintColor: isRecording ? colors.primary : '#8696A0' }]}
                /> */}
      </View>
    </View>
  );
};
