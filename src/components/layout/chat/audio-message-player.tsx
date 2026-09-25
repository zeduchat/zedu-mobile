import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  View,
  TouchableOpacity,
  Image,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { AppText } from '@/components/ui/text';
import { useTheme } from '@/theme/ThemeProvider';
import FontAwesome5 from 'react-native-vector-icons/FontAwesome5';
import { VoiceMedia, buildVoiceMediaFromUrl } from '@/utils/voice-message';
import { voiceNotePlaybackService } from '@/services/voice-note-playback.service';

const { width } = Dimensions.get('window');

interface AudioMessagePlayerProps {
  audioUrl: string;
  item?: any;
  media?: VoiceMedia;
}

let idCounter = 0;

export const AudioMessagePlayer = ({
  audioUrl,
  item,
  media,
}: AudioMessagePlayerProps) => {
  const { colors } = useTheme();
  const styles = useMemo(
    () => ({
      container: {
        flexDirection: 'row' as const,
        alignItems: 'center' as const,
        width: width * 0.65,
        paddingVertical: 8,
        paddingHorizontal: 6,
      },
      playBtn: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: colors.primary,
        justifyContent: 'center' as const,
        alignItems: 'center' as const,
      },
      playIconOffset: { marginLeft: 2 },
      middle: { flex: 1, marginHorizontal: 10 },
      waveformRow: {
        flexDirection: 'row' as const,
        alignItems: 'center' as const,
        gap: 2,
        height: 28,
      },
      bar: { flex: 1 },
      timer: {
        color: colors.messageMeta,
        position: 'absolute' as const,
        left: 0,
        bottom: -25,
      },
      avatarWrap: { position: 'relative' as const, width: 34, height: 34 },
      avatar: { width: 34, height: 34, borderRadius: 17 },
      micBadge: {
        position: 'absolute' as const,
        bottom: -2,
        right: -2,
        width: 14,
        height: 14,
        borderRadius: 7,
        justifyContent: 'center' as const,
        alignItems: 'center' as const,
        borderWidth: 1,
        borderColor: colors.white,
      },
      miniMic: { width: 8, height: 8, tintColor: colors.white },
    }),
    [colors],
  );
  const idRef = useRef(`amp_${++idCounter}`);
  const [, setTick] = useState(0);

  const voiceMedia = useMemo(
    () => media ?? buildVoiceMediaFromUrl(audioUrl, item),
    [audioUrl, item, media],
  );
  const trackId = idRef.current;
  const playback = voiceNotePlaybackService.getState();
  const isActiveTrack = playback.activeTrack?.trackId === trackId;
  const isPlaying = isActiveTrack && playback.isPlaying;
  const isLoading = isActiveTrack && playback.isLoading;
  const currentMs = isActiveTrack ? playback.currentMs : 0;
  const durationMs = isActiveTrack ? playback.durationMs : 0;

  useEffect(() => {
    return voiceNotePlaybackService.subscribe(() => {
      setTick(value => value + 1);
    });
  }, []);

  const formatTime = (ms: number) => {
    const total = Math.floor(ms / 1000);
    const m = Math.floor(total / 60);
    const s = total % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const handlePlayPause = async () => {
    await voiceNotePlaybackService.togglePlayback({
      trackId,
      audioUrl,
      item,
      media: voiceMedia,
    });
  };

  const progress = durationMs > 0 ? Math.min(currentMs / durationMs, 1) : 0;
  const timeLabel = isPlaying
    ? formatTime(currentMs)
    : durationMs > 0
    ? formatTime(durationMs)
    : '0:00';

  const BARS = 30;
  const barHeights = Array.from(
    { length: BARS },
    (_, i) =>
      5 + Math.abs(Math.sin(i * 0.7 + 1.2) * 12 + Math.cos(i * 0.4) * 5),
  );

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.playBtn}
        onPress={handlePlayPause}
        activeOpacity={0.8}
        disabled={isLoading}
      >
        {isLoading ? (
          <ActivityIndicator size="small" color="#FFF" />
        ) : (
          <FontAwesome5
            name={isPlaying ? 'pause' : 'play'}
            size={14}
            color="#FFF"
            style={isPlaying ? undefined : styles.playIconOffset}
          />
        )}
      </TouchableOpacity>

      <View style={styles.middle}>
        <View style={styles.waveformRow}>
          {barHeights.map((h, i) => {
            const filled = i / BARS <= progress;
            return (
              <View
                key={i}
                style={[
                  styles.bar,
                  {
                    height: h,
                    backgroundColor: filled
                      ? colors.primary
                      : colors.waveformInactive,
                    borderRadius: h / 2,
                  },
                ]}
              />
            );
          })}
        </View>

        <AppText size={10} style={styles.timer}>
          {timeLabel}
        </AppText>
      </View>

      {(item?.avatar_url || item?.default_avatar_url) && (
        <View style={styles.avatarWrap}>
          <Image
            source={{
              uri: item.avatar_url ? item.avatar_url : item?.default_avatar_url,
            }}
            style={styles.avatar}
          />

          <View
            style={[
              styles.micBadge,
              {
                backgroundColor: isPlaying
                  ? colors.primary
                  : colors.messageMeta,
              },
            ]}
          >
            <Image
              source={require('@/assets/icons/mic.png')}
              style={styles.miniMic}
            />
          </View>
        </View>
      )}
    </View>
  );
};
