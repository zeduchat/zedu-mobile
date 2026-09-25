import React, { useState, useRef, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Image,
  Animated,
  PanResponder,
  Dimensions,
  Platform,
} from 'react-native';
import { AppText } from '@/components/ui/text';
import { Colors } from '@/theme/colors';
// import AudioRecorderPlayer from 'react-native-audio-recorder-player';

const { width } = Dimensions.get('window');
// const audioRecorderPlayer = new (AudioRecorderPlayer as any)();

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
  const [isRecording, setIsRecording] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const translateX = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(1)).current;

  // useEffect(() => {
  //     return () => {
  //         audioRecorderPlayer.stopRecorder();
  //         audioRecorderPlayer.removeRecordBackListener();
  //     };
  // }, []);

  const formatTime = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const s = sec % 60;
    return `${mins}:${s < 10 ? '0' : ''}${s}`;
  };

  const onStartRecord = async () => {
    try {
      // await audioRecorderPlayer.startRecorder();
      // audioRecorderPlayer.addRecordBackListener((e: any) => {
      //     setSeconds(Math.floor(e.currentPosition / 1000));
      // });
    } catch (err) {}
  };

  const handleStop = async () => {
    try {
      // const result = await audioRecorderPlayer.stopRecorder();
      // audioRecorderPlayer.removeRecordBackListener();
      setIsRecording(false);
      translateX.setValue(0);
      // onRecordingStop(result);
    } catch (err) {}
  };

  const handleCancel = async () => {
    try {
      // await audioRecorderPlayer.stopRecorder();
      // audioRecorderPlayer.removeRecordBackListener();
      setIsRecording(false);
      translateX.setValue(0);
      onRecordingCancel();
    } catch (err) {}
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        setIsRecording(true);
        onRecordingStart();
        onStartRecord();
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

  return (
    <View style={styles.wrapper}>
      {isRecording && (
        <View style={styles.recordingOverlay}>
          <View style={styles.timerRow}>
            <Animated.View style={[styles.redDot, { opacity }]} />
            <AppText style={styles.timerText}>{formatTime(seconds)}</AppText>
          </View>

          <Animated.View style={{ transform: [{ translateX }] }}>
            <AppText style={styles.slideText}>{'< Slide to cancel'}</AppText>
          </Animated.View>
        </View>
      )}

      <View
        {...panResponder.panHandlers}
        style={[styles.micCircle, isRecording && styles.activeMic]}
      >
        <Image
          source={require('@/assets/icons/mic.png')}
          style={[
            styles.micIcon,
            { tintColor: isRecording ? Colors.primary : '#54656F' },
          ]}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: { flexDirection: 'row', alignItems: 'center' },
  recordingOverlay: {
    position: 'absolute',
    right: 50,
    width: width - 100,
    backgroundColor: Colors.topNavigation,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 15,
    height: 50,
    borderRadius: 25,
    zIndex: 99,
  },
  timerRow: { flexDirection: 'row', alignItems: 'center' },
  redDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FF0000',
    marginRight: 8,
  },
  timerText: { fontSize: 16, color: '#111B21' },
  slideText: { color: '#667781', fontSize: 14 },
  micCircle: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 22,
  },
  activeMic: { transform: [{ scale: 1.4 }] },
  micIcon: { width: 24, height: 24 },
});
