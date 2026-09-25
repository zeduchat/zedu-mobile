import React, { useRef, useEffect, useMemo } from 'react';
import {
  Image,
  Animated,
  PanResponder,
  Platform,
  PermissionsAndroid,
} from 'react-native';
import AudioRecorderPlayer, {
  AudioSet,
  AudioEncoderAndroidType,
  OutputFormatAndroidType,
  AVEncodingOption,
} from 'react-native-audio-recorder-player';
import RNFS from 'react-native-fs';
import { useTheme } from '@/theme/ThemeProvider';

const audioRecorderPlayer = new AudioRecorderPlayer();

interface VoiceRecorderProps {
  isRecording: boolean;
  slideX: Animated.Value;
  dotOpacity: Animated.Value;
  onRecordingStart: () => void;
  onRecordingStop: (uri: string) => void;
  onRecordingCancel: () => void;
  onSecondsChange: (seconds: number) => void;
}

export const VoiceRecorder = ({
  isRecording,
  slideX,
  dotOpacity,
  onRecordingStart,
  onRecordingStop,
  onRecordingCancel,
  onSecondsChange,
}: VoiceRecorderProps) => {
  const { colors } = useTheme();
  const styles = useMemo(
    () => ({
      micBtn: {
        width: 40,
        height: 40,
        justifyContent: 'center' as const,
        alignItems: 'center' as const,
        borderRadius: 20,
      },
      micBtnActive: {
        backgroundColor: colors.primary,
        width: 48,
        height: 48,
        borderRadius: 24,
      },
      micIcon: { width: 22, height: 22 },
    }),
    [colors],
  );
  const isRecordingRef = useRef(false);
  const isProcessingRef = useRef(false);
  const isCancelledRef = useRef(false);
  const pulseAnimRef = useRef<Animated.CompositeAnimation | null>(null);
  const micScale = useRef(new Animated.Value(1)).current;
  const pressTimeRef = useRef(0);

  // Keep callback refs always fresh to avoid stale closures in PanResponder
  const onRecordingStartRef = useRef(onRecordingStart);
  const onRecordingStopRef = useRef(onRecordingStop);
  const onRecordingCancelRef = useRef(onRecordingCancel);
  const onSecondsChangeRef = useRef(onSecondsChange);
  useEffect(() => {
    onRecordingStartRef.current = onRecordingStart;
    onRecordingStopRef.current = onRecordingStop;
    onRecordingCancelRef.current = onRecordingCancel;
    onSecondsChangeRef.current = onSecondsChange;
  });

  useEffect(() => {
    return () => {
      if (isRecordingRef.current) {
        audioRecorderPlayer.stopRecorder().catch(() => {});
        audioRecorderPlayer.removeRecordBackListener();
      }
      pulseAnimRef.current?.stop();
    };
  }, []);

  const requestMicPermission = async (): Promise<boolean> => {
    if (Platform.OS !== 'android') return true;
    try {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
        {
          title: 'Microphone Permission',
          message: 'App needs microphone access to send voice messages.',
          buttonPositive: 'Allow',
          buttonNegative: 'Deny',
        },
      );
      const isGranted = granted === PermissionsAndroid.RESULTS.GRANTED;
      return isGranted;
    } catch (err) {
      console.error('[VoiceRecorder] Permission request failed:', err);
      return false;
    }
  };

  const startPulse = () => {
    dotOpacity.setValue(1);
    pulseAnimRef.current = Animated.loop(
      Animated.sequence([
        Animated.timing(dotOpacity, {
          toValue: 0,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(dotOpacity, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
      ]),
    );
    pulseAnimRef.current.start();
  };

  const stopPulse = () => {
    pulseAnimRef.current?.stop();
    dotOpacity.setValue(1);
  };

  // Cross-platform compatible audio settings - forces AAC codec on both platforms
  const audioSettings: AudioSet = {
    // iOS settings - use AAC codec
    AVFormatIDKeyIOS: AVEncodingOption.aac,
    AVEncoderAudioQualityKeyIOS: 96,
    AVNumberOfChannelsKeyIOS: 1,
    AVSampleRateKeyIOS: 44100,
    // Android settings - use AAC codec for compatibility
    OutputFormatAndroid: OutputFormatAndroidType.MPEG_4,
    AudioEncoderAndroid: AudioEncoderAndroidType.AAC,
    AudioSamplingRateAndroid: 44100,
    AudioChannelsAndroid: 1,
    AudioEncodingBitRateAndroid: 128000,
  };

  const doStart = async () => {
    if (isRecordingRef.current || isProcessingRef.current) return;
    isProcessingRef.current = true;
    isCancelledRef.current = false;

    const hasPermission = await requestMicPermission();
    if (!hasPermission) {
      isProcessingRef.current = false;
      console.warn('[VoiceRecorder] Microphone permission denied');
      return;
    }

    try {
      // Ensure recorder is in clean state
      try {
        audioRecorderPlayer.removeRecordBackListener();
        if (isRecordingRef.current) {
          await audioRecorderPlayer.stopRecorder();
        }
      } catch (_) {}

      const fileName = `voice_${Date.now()}.m4a`;
      let path: string;

      if (Platform.OS === 'android') {
        // Use DocumentDirectoryPath for Android - it's writable
        path = `${RNFS.DocumentDirectoryPath}/${fileName}`;
      } else {
        path = fileName;
      }

      // Pass audioSettings to ensure both iOS and Android use AAC codec
      const _result = await audioRecorderPlayer.startRecorder(
        path,
        audioSettings,
      );

      audioRecorderPlayer.addRecordBackListener(e => {
        onSecondsChangeRef.current(Math.floor(e.currentPosition / 1000));
      });

      isRecordingRef.current = true;
      isProcessingRef.current = false;
      onRecordingStartRef.current();
      startPulse();
      Animated.spring(micScale, {
        toValue: 1.3,
        useNativeDriver: true,
        friction: 5,
      }).start();
    } catch (err) {
      isProcessingRef.current = false;
      console.error('[VoiceRecorder] startRecorder error:', err);
      console.error('[VoiceRecorder] Error details:', JSON.stringify(err));
      if (err instanceof Error) {
        console.error('[VoiceRecorder] Error message:', err.message);
        console.error('[VoiceRecorder] Error name:', err.name);
      }
    }
  };

  const doStop = async (cancel: boolean) => {
    if (!isRecordingRef.current || isProcessingRef.current) return;
    isProcessingRef.current = true;
    isRecordingRef.current = false;

    stopPulse();
    slideX.setValue(0);
    Animated.spring(micScale, {
      toValue: 1,
      useNativeDriver: true,
      friction: 5,
    }).start();

    try {
      const uri = await audioRecorderPlayer.stopRecorder();
      audioRecorderPlayer.removeRecordBackListener();
      onSecondsChangeRef.current(0);
      isProcessingRef.current = false;

      if (cancel) {
        try {
          await RNFS.unlink(uri);
        } catch (_) {}
        onRecordingCancelRef.current();
      } else {
        onRecordingStopRef.current(uri);
      }
    } catch (err) {
      isProcessingRef.current = false;
      console.warn('[VoiceRecorder] stopRecorder failed:', err);
      onRecordingCancelRef.current();
    }
  };

  // Keep action refs fresh so PanResponder (created once) always calls latest
  const doStartRef = useRef(doStart);
  const doStopRef = useRef(doStop);
  useEffect(() => {
    doStartRef.current = doStart;
    doStopRef.current = doStop;
  });

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        pressTimeRef.current = Date.now();
        isCancelledRef.current = false;
      },
      onPanResponderMove: (_, { dx }) => {
        const elapsed = Date.now() - pressTimeRef.current;
        if (
          elapsed > 300 &&
          !isRecordingRef.current &&
          !isCancelledRef.current
        ) {
          doStartRef.current();
        }
        if (!isRecordingRef.current) return;
        if (dx < 0) slideX.setValue(dx);
        if (dx < -120) {
          isCancelledRef.current = true;
          doStopRef.current(true);
        }
      },
      onPanResponderRelease: () => {
        const elapsed = Date.now() - pressTimeRef.current;
        if (elapsed < 300) {
          if (isRecordingRef.current) {
            doStopRef.current(false);
          } else if (!isCancelledRef.current) {
            doStartRef.current();
          }
        } else if (isRecordingRef.current) {
          doStopRef.current(isCancelledRef.current);
        }
        isCancelledRef.current = false;
      },
      onPanResponderTerminate: () => {
        if (isRecordingRef.current) {
          isCancelledRef.current = true;
          doStopRef.current(true);
        }
        isCancelledRef.current = false;
      },
    }),
  ).current;

  return (
    <Animated.View
      {...panResponder.panHandlers}
      style={[
        styles.micBtn,
        isRecording && styles.micBtnActive,
        { transform: [{ scale: micScale }] },
      ]}
    >
      <Image
        source={require('@/assets/icons/mic.png')}
        style={[
          styles.micIcon,
          { tintColor: isRecording ? colors.white : colors.messageMeta },
        ]}
      />
    </Animated.View>
  );
};
