import React, { useMemo } from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import { AppText } from '@/components/ui/text';
import { useUserProfileStatus } from '@/hooks/useUserProfileStatus';
import { getUserStatusDisplay, UserStatusSource } from '@/utils/user-status';

interface UserProfileStatusProps {
  user?: UserStatusSource | null;
  userId?: string | number | null;
  style?: ViewStyle;
}

export const UserProfileStatus = ({
  user,
  userId,
  style,
}: UserProfileStatusProps) => {
  const fetchedStatus = useUserProfileStatus(userId);
  const localStatus = useMemo(() => getUserStatusDisplay(user), [user]);
  const status = fetchedStatus ?? localStatus;

  if (!status) {
    return null;
  }

  return (
    <View style={[styles.statusBubble, style]}>
      {!!status.icon && (
        <AppText style={styles.statusEmoji}>{status.icon}</AppText>
      )}
      <AppText style={styles.statusText} numberOfLines={2}>
        {status.text}
      </AppText>
    </View>
  );
};

const styles = StyleSheet.create({
  statusBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F2F5',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginTop: 12,
    maxWidth: '90%',
  },
  statusEmoji: {
    fontSize: 16,
    marginRight: 8,
  },
  statusText: {
    fontSize: 14,
    color: '#54656F',
    flexShrink: 1,
  },
});
