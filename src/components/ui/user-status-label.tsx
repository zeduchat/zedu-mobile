import React, { useMemo } from 'react';
import { View, ViewStyle } from 'react-native';
import { AppText } from '@/components/ui/text';
import { getUserStatusDisplay, UserStatusSource } from '@/utils/user-status';
import { useTheme } from '@/theme/ThemeProvider';
import { createSharedUIStyles } from '@/theme/createStep10Styles';

interface UserStatusLabelProps {
  user?: UserStatusSource | null;
  dark?: boolean;
  style?: ViewStyle;
  numberOfLines?: number;
}

export const UserStatusLabel = ({
  user,
  dark = false,
  style,
  numberOfLines = 1,
}: UserStatusLabelProps) => {
  const { colors } = useTheme();
  const styles = useMemo(
    () => createSharedUIStyles(colors).userStatusLabel,
    [colors],
  );
  const status = useMemo(() => getUserStatusDisplay(user), [user]);

  if (!status) {
    return null;
  }

  const textColor = dark ? 'rgba(255,255,255,0.78)' : colors.textSecondary;

  return (
    <View style={[styles.container, style]}>
      {!!status.icon && (
        <AppText size={12} style={styles.emoji}>
          {status.icon}
        </AppText>
      )}
      <AppText
        size={12}
        numberOfLines={numberOfLines}
        style={[styles.text, { color: textColor }]}
      >
        {status.text}
      </AppText>
    </View>
  );
};
