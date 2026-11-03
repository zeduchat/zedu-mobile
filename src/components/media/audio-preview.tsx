import React, { useMemo, useRef, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import Video, { VideoRef } from 'react-native-video';
import { AppButton } from '@/components/ui/button';
import { AppText } from '@/components/ui/text';
import { useTheme } from '@/theme/ThemeProvider';

const formatTime = (seconds: number) => {
  const total = Math.max(0, Math.floor(seconds));
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, '0')}`;
};

// The gallery already uses this media engine for video. Keeping its audio
// instance inside the modal makes closing/changing the preview release playback.
const AudioPreview = ({ uri, name }: { uri: string; name: string }) => {
  const { colors } = useTheme();
  const player = useRef<VideoRef>(null);
  const [paused, setPaused] = useState(true);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [ended, setEnded] = useState(false);
  const [position, setPosition] = useState(0);
  const [duration, setDuration] = useState(0);
  const [attempt, setAttempt] = useState(0);
  const styles = useMemo(
    () =>
      StyleSheet.create({
        card: {
          width: '90%',
          maxWidth: 480,
          padding: 24,
          borderRadius: 16,
          backgroundColor: colors.surfaceElevated,
          gap: 16,
        },
        engine: { width: 0, height: 0, opacity: 0 },
        name: { color: colors.textPrimary, textAlign: 'center' },
        time: { color: colors.textSecondary, textAlign: 'center' },
        error: { color: colors.error, textAlign: 'center' },
      }),
    [colors],
  );

  const togglePlayback = () => {
    if (ended) {
      player.current?.seek(0);
      setPosition(0);
      setEnded(false);
    }
    setPaused(value => !value);
  };

  const retry = () => {
    setFailed(false);
    setLoading(true);
    setPaused(true);
    setEnded(false);
    setPosition(0);
    setDuration(0);
    setAttempt(value => value + 1);
  };

  return (
    <View style={styles.card}>
      <Video
        key={attempt}
        ref={player}
        source={{ uri }}
        style={styles.engine}
        paused={paused || failed}
        playInBackground={false}
        playWhenInactive={false}
        onLoad={event => {
          setDuration(event.duration);
          setLoading(false);
        }}
        onLoadStart={() => setLoading(true)}
        onProgress={({ currentTime }) => setPosition(currentTime)}
        onEnd={() => {
          setPaused(true);
          setEnded(true);
          setPosition(duration);
        }}
        onError={() => {
          setFailed(true);
          setPaused(true);
          setLoading(false);
        }}
      />
      <AppText variant="bold" style={styles.name}>
        {name}
      </AppText>
      {loading && <ActivityIndicator accessibilityLabel="Loading audio" />}
      {failed ? (
        <>
          <AppText accessibilityRole="alert" style={styles.error}>
            Unable to play this audio file.
          </AppText>
          <AppButton title="Retry audio" onPress={retry} />
        </>
      ) : (
        <>
          <AppText
            accessibilityRole="progressbar"
            accessibilityLabel="Audio playback progress"
            accessibilityValue={{
              min: 0,
              max: duration,
              now: Math.min(position, duration),
            }}
            style={styles.time}
          >
            {formatTime(position)} / {formatTime(duration)}
          </AppText>
          <AppButton
            title={paused ? 'Play audio' : 'Pause audio'}
            disabled={loading}
            onPress={togglePlayback}
          />
        </>
      )}
    </View>
  );
};

export default AudioPreview;
