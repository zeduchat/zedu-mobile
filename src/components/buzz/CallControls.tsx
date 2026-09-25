import React, { useMemo } from 'react';
import { View, TouchableOpacity, GestureResponderEvent } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { AppText } from '@/components/ui/text';
import FastImage from 'react-native-fast-image';
import { useTheme } from '@/theme/ThemeProvider';
import { createBuzzCallControlStyles } from '@/theme/createBuzzStyles';

interface CallControlsProps {
  isMuted: boolean;
  showVideo: boolean;
  defaultEmoji: boolean;
  onToggleMic: () => void;
  onToggleVideo: () => void;
  onToggleEmoji: () => void;
  onToggleEmojiTray: () => void;
  onEmojiSelect: (emojiObject: any, anchor?: { x: number; y: number }) => void;
  onEndCall: () => void;
  onMenuOpen: () => void;
  defaultEmojis: string[];
  onChatOpen: () => void;
  showChatButton?: boolean;
}

export const CallControls = ({
  isMuted,
  showVideo,
  defaultEmoji,
  onToggleMic,
  onToggleVideo,
  onToggleEmoji,
  onToggleEmojiTray,
  onEmojiSelect,
  onEndCall,
  onMenuOpen,
  defaultEmojis,
  onChatOpen,
  showChatButton,
}: CallControlsProps) => {
  const { colors } = useTheme();
  const styles = useMemo(() => createBuzzCallControlStyles(colors), [colors]);

  return (
    <View style={styles.bottomContainer}>
      <View style={styles.controlBar}>
        <TouchableOpacity style={styles.iconCircle} onPress={onMenuOpen}>
          <MaterialCommunityIcons
            name="dots-horizontal"
            size={24}
            color={colors.white}
          />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.iconCircle, isMuted && styles.whiteIcon]}
          onPress={onToggleMic}
        >
          <Ionicons
            name={isMuted ? 'mic-off' : 'mic'}
            size={24}
            color={isMuted ? colors.black : colors.white}
          />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.iconCircle, !showVideo && styles.whiteIcon]}
          onPress={onToggleVideo}
        >
          <Ionicons
            name={showVideo ? 'videocam' : 'videocam-off'}
            size={24}
            color={!showVideo ? colors.black : colors.white}
          />
        </TouchableOpacity>

        <TouchableOpacity style={styles.iconCircle} onPress={onToggleEmoji}>
          <Ionicons name="happy-outline" size={24} color={colors.white} />
        </TouchableOpacity>

        {showChatButton && (
          <TouchableOpacity style={styles.iconCircle} onPress={onChatOpen}>
            <MaterialCommunityIcons
              name="message"
              size={24}
              color={colors.white}
            />
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={[styles.iconCircle, styles.endCallButton]}
          onPress={onEndCall}
        >
          <MaterialCommunityIcons
            name="phone-hangup"
            size={28}
            color={colors.white}
          />
        </TouchableOpacity>
      </View>

      {defaultEmoji && (
        <View style={styles.quickAccessRow}>
          {defaultEmojis.map((emoji, index) => (
            <TouchableOpacity
              key={index}
              onPress={(event: GestureResponderEvent) =>
                onEmojiSelect(
                  { emoji },
                  {
                    x: event.nativeEvent.pageX,
                    y: event.nativeEvent.pageY,
                  },
                )
              }
            >
              <AppText style={styles.emojiText}>{emoji}</AppText>
            </TouchableOpacity>
          ))}

          <TouchableOpacity style={styles.plusBtn} onPress={onToggleEmojiTray}>
            <FastImage
              source={require('@/assets/icons/emoji.png')}
              style={styles.inputIcon}
            />
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};
