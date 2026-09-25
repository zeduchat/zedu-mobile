import React, { useMemo } from 'react';
import {
  View,
  TouchableOpacity,
  Image,
  StyleSheet,
  Platform,
} from 'react-native';
import FontAwesome5 from 'react-native-vector-icons/FontAwesome5';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { AppText } from '@/components/ui/text';
import { useTheme } from '@/theme/ThemeProvider';
import { normalize } from '@/utils/normalize';
import { voiceNotePlaybackService } from '@/services/voice-note-playback.service';

type Props = {
  visible: boolean;
  onExpand: () => void;
};

export const MinimizedVoiceNoteWidget = ({ visible, onExpand }: Props) => {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const playback = voiceNotePlaybackService.getState();
  const item = playback.activeTrack?.item;

  if (!visible || !playback.activeTrack) {
    return null;
  }

  const progress =
    playback.durationMs > 0
      ? Math.min(playback.currentMs / playback.durationMs, 1)
      : 0;

  const formatTime = (ms: number) => {
    const total = Math.floor(ms / 1000);
    const m = Math.floor(total / 60);
    const s = total % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const senderLabel = item?.username || item?.full_name || 'Voice message';

  const handleToggle = () => {
    const track = playback.activeTrack;
    if (!track) return;

    voiceNotePlaybackService.togglePlayback({
      trackId: track.trackId,
      audioUrl: track.audioUrl,
      item: track.item,
      media: track.voiceMedia,
    });
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.mainRow}
        activeOpacity={0.9}
        onPress={onExpand}
      >
        <TouchableOpacity
          style={styles.playBtn}
          onPress={handleToggle}
          activeOpacity={0.85}
        >
          <FontAwesome5
            name={playback.isPlaying ? 'pause' : 'play'}
            size={12}
            color={colors.white}
            style={playback.isPlaying ? undefined : styles.playIconOffset}
          />
        </TouchableOpacity>

        {(item?.avatar_url || item?.default_avatar_url) && (
          <Image
            source={{
              uri: item.avatar_url || item.default_avatar_url,
            }}
            style={styles.avatar}
          />
        )}

        <View style={styles.textCol}>
          <AppText
            variant="bold"
            size={12}
            numberOfLines={1}
            style={styles.title}
          >
            {senderLabel}
          </AppText>
          <View style={styles.progressTrack}>
            <View
              style={[styles.progressFill, { width: `${progress * 100}%` }]}
            />
          </View>
          <AppText size={10} style={styles.timeText}>
            {formatTime(playback.currentMs)}
            {playback.durationMs > 0
              ? ` / ${formatTime(playback.durationMs)}`
              : ''}
          </AppText>
        </View>

        <Ionicons name="expand" size={16} color={colors.textSecondary} />
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.closeBtn}
        onPress={() => voiceNotePlaybackService.stop()}
        activeOpacity={0.85}
      >
        <Ionicons name="close" size={18} color={colors.textSecondary} />
      </TouchableOpacity>
    </View>
  );
};

function createStyles(colors: ReturnType<typeof useTheme>['colors']) {
  return StyleSheet.create({
    container: {
      position: 'absolute',
      left: normalize(12),
      right: normalize(12),
      bottom: Platform.OS === 'ios' ? normalize(92) : normalize(72),
      zIndex: 998,
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.surface,
      borderRadius: normalize(16),
      borderWidth: 1,
      borderColor: colors.border,
      paddingHorizontal: normalize(10),
      paddingVertical: normalize(10),
      shadowColor: colors.black,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15,
      shadowRadius: 8,
      elevation: 10,
      gap: normalize(8),
    },
    mainRow: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      gap: normalize(8),
    },
    playBtn: {
      width: normalize(32),
      height: normalize(32),
      borderRadius: normalize(16),
      backgroundColor: colors.primary,
      justifyContent: 'center',
      alignItems: 'center',
    },
    playIconOffset: {
      marginLeft: 2,
    },
    avatar: {
      width: normalize(28),
      height: normalize(28),
      borderRadius: normalize(14),
    },
    textCol: {
      flex: 1,
      minWidth: 0,
    },
    title: {
      color: colors.textPrimary,
      marginBottom: normalize(4),
    },
    progressTrack: {
      height: normalize(3),
      borderRadius: normalize(2),
      backgroundColor: colors.waveformInactive,
      overflow: 'hidden',
      marginBottom: normalize(4),
    },
    progressFill: {
      height: '100%',
      backgroundColor: colors.primary,
      borderRadius: normalize(2),
    },
    timeText: {
      color: colors.textSecondary,
    },
    closeBtn: {
      padding: normalize(4),
    },
  });
}
