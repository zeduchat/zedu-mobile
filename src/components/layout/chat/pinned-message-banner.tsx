import React, { useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { AppText } from '@/components/ui/text';
import { useTheme } from '@/theme/ThemeProvider';
import { useDataContext } from '@/store/useDataContext';

type Props = {
  item: {
    is_pinned?: boolean;
    pinned_details?: {
      email?: string;
      username?: string;
    } | null;
  };
};

export const PinnedMessageBanner = ({ item }: Props) => {
  const { colors } = useTheme();
  const { state } = useDataContext();
  const styles = useMemo(
    () =>
      StyleSheet.create({
        banner: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: 6,
          paddingHorizontal: 12,
          paddingTop: 6,
          paddingBottom: 2,
        },
        label: {
          color: colors.textSecondary,
          fontSize: 12,
        },
      }),
    [colors],
  );

  if (!item?.is_pinned) return null;

  const pinnedBy =
    state?.user?.email &&
    item?.pinned_details?.email &&
    state.user.email === item.pinned_details.email
      ? 'you'
      : item?.pinned_details?.username || 'someone';

  return (
    <View style={styles.banner}>
      <MaterialCommunityIcons
        name="pin"
        size={12}
        color={colors.textSecondary}
      />
      <AppText size={12} variant="medium" style={styles.label}>
        Pinned by {pinnedBy}
      </AppText>
    </View>
  );
};
