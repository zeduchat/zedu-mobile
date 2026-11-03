import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { AppText } from '@/components/ui/text';
import { useTheme } from '@/theme/ThemeProvider';
import { useDataContext } from '@/store/useDataContext';
import { normalize } from '@/utils/normalize';

export const RestrictedChannelBanner = () => {
  const { colors } = useTheme();
  const { state } = useDataContext();
  const channelName = state?.channelDetails?.name;

  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: {
          paddingHorizontal: 15,
          paddingTop: 12,
          paddingBottom: normalize(40),
          backgroundColor: colors.surface,
        },
        card: {
          borderWidth: 1,
          borderColor: colors.border,
          backgroundColor: colors.surfaceElevated,
          borderRadius: 12,
          paddingHorizontal: 16,
          paddingVertical: 20,
          alignItems: 'center',
        },
        iconWrap: {
          width: 40,
          height: 40,
          borderRadius: 20,
          backgroundColor: colors.secondaryforeground,
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 12,
        },
        title: {
          textAlign: 'center',
          marginBottom: 6,
        },
        body: {
          textAlign: 'center',
          color: colors.textSecondary,
        },
      }),
    [colors],
  );

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <View style={styles.iconWrap}>
          <Ionicons name="lock-closed" size={18} color={colors.primary} />
        </View>
        <AppText variant="medium" size={15} style={styles.title}>
          Only admins can send message on this channel
        </AppText>
        <AppText size={13} style={styles.body}>
          Posting in {channelName ? `#${channelName}` : 'this channel'} is
          restricted. You can still read messages
          {channelName ? ` in #${channelName}` : ''}.
        </AppText>
      </View>
    </View>
  );
};
