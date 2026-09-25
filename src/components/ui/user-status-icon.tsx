import React, { useMemo } from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import { AppText } from '@/components/ui/text';
import { getUserStatusIcon, UserStatusSource } from '@/utils/user-status';

interface UserStatusIconProps {
  user?: UserStatusSource | null;
  size?: number;
  style?: ViewStyle;
}

export const UserStatusIcon = ({
  user,
  size = 16,
  style,
}: UserStatusIconProps) => {
  const icon = useMemo(() => getUserStatusIcon(user), [user]);

  if (!icon) {
    return null;
  }

  return (
    <View style={[styles.container, style]}>
      <AppText style={{ fontSize: size }}>{icon}</AppText>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
});
