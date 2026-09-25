import React, { useEffect } from 'react';
import { Platform, StyleSheet, Vibration, View } from 'react-native';
import Video from 'react-native-video';

interface RingtonePlayerProps {
  type: 'incoming' | 'outgoing';
  playing: boolean;
  onReady?: () => void;
}

const INCOMING_VIBRATION_PATTERN = Platform.select({
  ios: [0, 400, 200, 400],
  android: [0, 500, 250, 500],
}) || [0, 400, 200, 400];

const TONES = {
  incoming: require('@/assets/audio/incomingcall.mp3'),
  outgoing: require('@/assets/audio/incomingcall.mp3'),
};

export const RingtonePlayer = ({
  type,
  playing,
  onReady,
}: RingtonePlayerProps) => {
  useEffect(() => {
    if (!playing || type !== 'incoming') {
      Vibration.cancel();
      return;
    }

    Vibration.vibrate(INCOMING_VIBRATION_PATTERN, false);

    const vibrationInterval = setInterval(() => {
      Vibration.vibrate(INCOMING_VIBRATION_PATTERN, false);
    }, 2200);

    return () => {
      clearInterval(vibrationInterval);
      Vibration.cancel();
    };
  }, [playing, type]);

  if (!playing) return null;

  return (
    <View style={styles.hidden} pointerEvents="none">
      <Video
        source={TONES[type]}
        paused={!playing}
        repeat
        playInBackground
        playWhenInactive
        ignoreSilentSwitch="ignore"
        volume={1}
        onLoad={onReady}
        onError={error => {
          console.warn('Ringtone playback error', error);
        }}
        style={styles.hidden}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  hidden: {
    width: 0,
    height: 0,
    opacity: 0,
  },
});
