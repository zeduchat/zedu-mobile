import React, { useMemo } from 'react';
import { View, TouchableOpacity, ViewStyle } from 'react-native';
import FastImage from 'react-native-fast-image';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '@/theme/ThemeProvider';
import { createChannelSetupStyles } from '@/theme/createStep10Styles';
import { normalize } from '@/utils/normalize';

interface UserAvatarProps {
  user: {
    avatar_url?: string;
    default_avatar_url?: string;
    online?: boolean;
  };
  size?: number;
  showBadge?: boolean;
  onPress?: () => void;
  style?: ViewStyle;
}

export const UserAvatar: React.FC<UserAvatarProps> = ({
  user,
  size = 40,
  showBadge = true,
  onPress,
  style,
}) => {
  const { colors } = useTheme();
  const styles = useMemo(
    () => createChannelSetupStyles(colors).userAvatar,
    [colors],
  );
  const navigation = useNavigation<any>();

  const handlePress = () => {
    if (onPress) {
      onPress();
    } else {
      navigation.navigate('SettingStack', { screen: 'Profile' });
    }
  };

  const avatarSource = useMemo(() => {
    return { uri: user?.avatar_url || user?.default_avatar_url };
  }, [user?.avatar_url, user?.default_avatar_url]);

  const dynamicStyles = {
    container: {
      width: normalize(size),
      height: normalize(size),
    },
    image: {
      width: normalize(size),
      height: normalize(size),
      borderRadius: normalize(size / 2),
    },
    badge: {
      width: normalize(size * 0.3),
      height: normalize(size * 0.3),
      borderRadius: normalize((size * 0.3) / 2),
      backgroundColor: user?.online ? colors.online : colors.offline,
    },
  };

  return (
    <TouchableOpacity
      style={[styles.avatarContainer, dynamicStyles.container, style]}
      onPress={handlePress}
      activeOpacity={0.8}
    >
      <FastImage
        source={avatarSource}
        style={dynamicStyles.image}
        resizeMode={FastImage.resizeMode.cover}
      />

      {showBadge && <View style={[styles.onlineBadge, dynamicStyles.badge]} />}
    </TouchableOpacity>
  );
};
