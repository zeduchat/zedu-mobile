import React, { useMemo } from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Container from '@/components/layout/container';
import { AppText } from '@/components/ui/text';
import { UserAvatarWithStatus } from '@/components/ui/user-avatar-with-status';
import { useDataContext } from '@/store/useDataContext';
import { useTheme } from '@/theme/ThemeProvider';
import { normalize } from '@/utils/normalize';

const MoreScreen = () => {
  const navigation = useNavigation();
  const { colors } = useTheme();
  const { state } = useDataContext();
  const { user, orgData } = state;
  const styles = useMemo(() => createStyles(colors), [colors]);

  const openFiles = () => {
    navigation.navigate('FileStack', { screen: 'FileManagement' });
  };

  const openSettings = () => {
    navigation.navigate('SettingStack', { screen: 'Settings' });
  };

  return (
    <Container color={colors.secondary} dark>
      <View style={styles.screen}>
        <View style={styles.header}>
          <View style={styles.profileTop}>
            <View style={styles.headerText}>
              <AppText variant="bold" style={styles.heading}>
                More
              </AppText>
              <AppText style={styles.organisationName} numberOfLines={1}>
                {orgData?.name || ''}
              </AppText>
            </View>

            <UserAvatarWithStatus
              user={user}
              badgeRingColor={colors.secondary}
            />
          </View>
        </View>

        <View style={styles.content}>
          <View style={styles.card}>
            <MoreItem
              title="Files"
              icon="folder-outline"
              onPress={openFiles}
              colors={colors}
              styles={styles}
              showDivider
            />
          </View>
          <View style={[styles.card, styles.settingsCard]}>
            <MoreItem
              title="Settings"
              icon="sunny-outline"
              onPress={openSettings}
              colors={colors}
              styles={styles}
            />
          </View>
        </View>
      </View>
    </Container>
  );
};

const createStyles = (colors: ReturnType<typeof useTheme>['colors']) =>
  StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.bgSecondary },
    header: {
      backgroundColor: colors.secondary,
      paddingHorizontal: normalize(20),
      paddingVertical: normalize(20),
    },
    profileTop: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: normalize(12),
    },
    headerText: {
      flex: 1,
      minWidth: 0,
    },
    heading: {
      color: colors.white,
      fontSize: normalize(19),
      lineHeight: normalize(24),
    },
    organisationName: {
      color: colors.secondaryforeground,
      fontSize: normalize(14),
      marginTop: normalize(2),
    },
    content: {
      flex: 1,
      paddingHorizontal: normalize(16),
      paddingTop: normalize(20),
    },
    card: {
      backgroundColor: colors.surface,
      borderRadius: normalize(16),
      overflow: 'hidden',
    },
    settingsCard: { marginTop: normalize(16) },
    item: {
      minHeight: normalize(72),
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: normalize(18),
    },
    itemTitle: {
      flex: 1,
      color: colors.textPrimary,
      fontSize: 15,
      marginLeft: normalize(12),
    },
    divider: {
      position: 'absolute',
      bottom: 0,
      left: normalize(56),
      right: 0,
      height: StyleSheet.hairlineWidth,
      backgroundColor: colors.border,
    },
  });

type MoreItemProps = {
  title: string;
  icon: React.ComponentProps<typeof Ionicons>['name'];
  onPress: () => void;
  colors: ReturnType<typeof useTheme>['colors'];
  styles: ReturnType<typeof createStyles>;
  showDivider?: boolean;
};

const MoreItem = ({
  title,
  icon,
  onPress,
  colors,
  styles,
  showDivider = false,
}: MoreItemProps) => (
  <TouchableOpacity
    accessibilityRole="button"
    onPress={onPress}
    activeOpacity={0.7}
    style={styles.item}
  >
    <Ionicons name={icon} size={normalize(24)} color={colors.primary} />
    <AppText variant="medium" style={styles.itemTitle}>
      {title}
    </AppText>
    <Ionicons
      name="chevron-forward"
      size={normalize(22)}
      color={colors.iconMuted}
    />
    {showDivider && <View style={styles.divider} />}
  </TouchableOpacity>
);

export default MoreScreen;
