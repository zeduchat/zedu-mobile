import React, { useEffect, useMemo, useState } from 'react';
import { View, TouchableOpacity, ViewStyle } from 'react-native';
import FastImage from 'react-native-fast-image';
import { useNavigation } from '@react-navigation/native';
import { AppText } from '@/components/ui/text';
import { useTheme } from '@/theme/ThemeProvider';
import { createChannelSetupStyles } from '@/theme/createStep10Styles';
import { normalize } from '@/utils/normalize';
import { getInitials } from '@/utils/file-helpers';

const BADGE_RING_WIDTH = 2;

interface UserAvatarProps {
  user: {
    avatar_url?: string;
    default_avatar_url?: string;
    online?: boolean;
  };
  size?: number;
  showBadge?: boolean;
  /** Presence dot diameter, excluding the ring; defaults to 30% of the avatar. */
  badgeSize?: number;
  /** Ring around the presence dot; match the surrounding background. */
  badgeRingColor?: string;
  /** Optional border around the circular avatar image. */
  borderColor?: string;
  borderWidth?: number;
  /** Name used for the initials fallback when the user has no photo. */
  fallbackName?: string;
  disabled?: boolean;
  onPress?: () => void;
  style?: ViewStyle;
}

export const UserAvatar: React.FC<UserAvatarProps> = ({
  user,
  size = 40,
  showBadge = true,
  badgeSize,
  badgeRingColor,
  borderColor,
  borderWidth = 1,
  fallbackName,
  disabled = false,
  onPress,
  style,
}) => {
  const { colors } = useTheme();
  const styles = useMemo(
    () => createChannelSetupStyles(colors).userAvatar,
    [colors],
  );
  const navigation = useNavigation<any>();
  const [imageFailed, setImageFailed] = useState(false);

  const handlePress = () => {
    if (onPress) {
      onPress();
    } else {
      navigation.navigate('SettingStack', { screen: 'Profile' });
    }
  };

  const avatarUri = user?.avatar_url || user?.default_avatar_url;

  useEffect(() => {
    setImageFailed(false);
  }, [avatarUri]);

  const avatarSource = useMemo(() => ({ uri: avatarUri }), [avatarUri]);
  const showInitials = !!fallbackName && (!avatarUri || imageFailed);
  const presenceLabel = user?.online ? 'Online' : 'Offline';
  const accessibilityLabel = showBadge
    ? [fallbackName, presenceLabel].filter(Boolean).join(', ')
    : fallbackName;

  const avatarPx = normalize(size);
  const dotSize = normalize(badgeSize ?? size * 0.3);
  const ringSize = dotSize + BADGE_RING_WIDTH * 2;
  // Grow the hit box just enough for a slight overhang — most of the badge
  // still sits on the avatar rim.
  const badgeOverhang = showBadge
    ? Math.max(2, Math.round(ringSize * 0.22))
    : 0;

  const dynamicStyles = {
    container: {
      width: avatarPx + badgeOverhang,
      height: avatarPx + badgeOverhang,
      overflow: 'visible' as const,
    },
    media: {
      width: avatarPx,
      height: avatarPx,
      borderRadius: avatarPx / 2,
      ...(borderColor ? { borderWidth, borderColor } : null),
    },
    initials: {
      width: avatarPx,
      height: avatarPx,
      borderRadius: avatarPx / 2,
      backgroundColor: colors.primary,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      ...(borderColor ? { borderWidth, borderColor } : null),
    },
    initialsText: {
      color: colors.white,
    },
    // Outer ring (not a border) keeps the green/gray dot round on Android.
    badgeRing: {
      position: 'absolute' as const,
      bottom: 0,
      right: 0,
      width: ringSize,
      height: ringSize,
      borderRadius: ringSize / 2,
      backgroundColor: badgeRingColor ?? colors.white,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
    },
    badgeDot: {
      width: dotSize,
      height: dotSize,
      borderRadius: dotSize / 2,
      backgroundColor: user?.online
        ? colors.presenceOnline
        : colors.presenceOffline,
    },
  };

  return (
    <TouchableOpacity
      style={[styles.avatarContainer, dynamicStyles.container, style]}
      onPress={handlePress}
      disabled={disabled}
      accessibilityLabel={accessibilityLabel}
      activeOpacity={0.8}
    >
      {showInitials ? (
        <View style={dynamicStyles.initials}>
          <AppText
            variant="bold"
            size={Math.max(9, size * 0.38)}
            style={dynamicStyles.initialsText}
          >
            {getInitials(fallbackName)}
          </AppText>
        </View>
      ) : (
        <FastImage
          source={avatarSource}
          style={dynamicStyles.media}
          resizeMode={FastImage.resizeMode.cover}
          onError={() => setImageFailed(true)}
        />
      )}

      {showBadge && (
        <View style={[styles.onlineBadge, dynamicStyles.badgeRing]}>
          <View style={dynamicStyles.badgeDot} />
        </View>
      )}
    </TouchableOpacity>
  );
};
