import React, { useState, useRef, useEffect, useMemo } from 'react';
import { hasPermission } from '@/lib/role-permissions';
import { View, ScrollView, TouchableOpacity } from 'react-native';
import { AppText } from '@/components/ui/text';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import LogoutConfirmationModal from '@/components/layout/settings/logout-modal';
import StatusSheet from '@/components/layout/settings/StatusSheet';
import type { AppBottomSheetRef } from '@/components/ui/bottom-sheet';
import { useDataContext } from '@/store/useDataContext';
import FontAwesome5Icon from 'react-native-vector-icons/FontAwesome5';
import FastImage from 'react-native-fast-image';
import Container from '@/components/layout/container';
import { useTheme } from '@/theme/ThemeProvider';
import { createSettingsStyles } from '@/theme/createScreenStyles';
import { getThemePreferenceLabel } from '@/screens/settings/appearance';

const SettingsHome = () => {
  const navigation = useNavigation();
  const { colors, preference } = useTheme();
  const styles = useMemo(() => createSettingsStyles(colors), [colors]);
  const [isLogoutModalVisible, setLogoutModalVisible] = useState(false);
  const { state } = useDataContext();
  const { user, orgData: _orgData } = state;
  const statusSheetRef = useRef<AppBottomSheetRef>(null);

  const [statusText, setStatusText] = useState('');
  const [statusEmoji, setStatusEmoji] = useState('');
  const [_statusClearAfter, setStatusClearAfter] = useState('dont');

  useEffect(() => {
    setStatusText(user?.text);
    setStatusEmoji(user?.icon);
    setStatusClearAfter(user?.status_timeout);
  }, []);

  const SettingItem = ({
    icon,
    title,
    subtitle,
    onPress,
    isDestructive = false,
  }: {
    icon: string;
    title: string;
    subtitle?: string;
    onPress?: () => void;
    isDestructive?: boolean;
  }) => (
    <TouchableOpacity
      style={styles.itemRow}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.iconContainer}>
        <Ionicons
          name={icon}
          size={22}
          color={isDestructive ? colors.error : colors.iconDefault}
        />
      </View>
      <View style={styles.textContainer}>
        <AppText
          variant="medium"
          style={[styles.itemTitle, isDestructive && { color: colors.error }]}
        >
          {title}
        </AppText>
        {subtitle && <AppText style={styles.itemSubtitle}>{subtitle}</AppText>}
      </View>
      {!isDestructive && (
        <Ionicons name="chevron-forward" size={18} color={colors.iconMuted} />
      )}
    </TouchableOpacity>
  );

  const StatusRow = ({ onPress }: { onPress?: () => void }) => (
    <TouchableOpacity
      style={styles.statusRow}
      activeOpacity={0.7}
      onPress={onPress}
    >
      <View style={styles.statusInner}>
        <View style={styles.statusEmojiContainer}>
          {statusEmoji ? (
            <AppText size={18}>{statusEmoji}</AppText>
          ) : (
            <Ionicons name="happy-outline" size={22} color={colors.iconMuted} />
          )}
        </View>
        <View style={styles.statusTextContainer}>
          <AppText
            style={[styles.statusText, !statusText && styles.placeholderText]}
            numberOfLines={1}
          >
            {statusText || 'Update your status'}
          </AppText>
        </View>
        <Ionicons
          name="chevron-forward"
          size={16}
          color={colors.textSecondary}
        />
      </View>
    </TouchableOpacity>
  );

  const SectionHeader = ({ title }: { title: string }) => (
    <AppText variant="bold" style={styles.sectionHeader}>
      {title}
    </AppText>
  );

  return (
    <Container color={colors.secondary} dark>
      {/* Consistent Dark Header */}
      <View style={styles.header}>
        {/* Profile Section inside Header */}
        <View style={styles.profileCard}>
          <View style={styles.profileInfo}>
            <View style={styles.avatarWrapper}>
              {user?.avatar_url ? (
                <FastImage
                  source={{ uri: user?.avatar_url }}
                  style={styles.avatar}
                />
              ) : (
                <FastImage
                  source={{ uri: user?.default_avatar_url }}
                  style={styles.avatar}
                />
              )}
              <View
                style={[
                  styles.activeBadge,
                  {
                    backgroundColor: user?.online
                      ? colors.online
                      : colors.offline,
                  },
                ]}
              />
            </View>

            <View style={styles.nameSection}>
              <AppText variant="bold" style={styles.userName}>
                {user?.username}
              </AppText>
              <AppText style={styles.userStatus}>
                {statusEmoji ? `${statusEmoji} ` : ''}
                {user?.online ? 'Active' : 'Away'}
              </AppText>
            </View>
          </View>

          <TouchableOpacity
            style={styles.edit}
            onPress={() =>
              navigation.navigate('SettingStack', { screen: 'Profile' })
            }
          >
            <FontAwesome5Icon
              name="pencil-alt"
              color={colors.white}
              style={styles.editLink}
            />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={styles.scrollBody}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.innerContent}>
          <SectionHeader title="Set a status" />
          <StatusRow onPress={() => statusSheetRef.current?.expand()} />

          <SectionHeader title="Notifications & Preferences" />
          <View style={styles.groupCard}>
            <SettingItem
              icon="notifications-outline"
              title="Notifications"
              subtitle="Customize your notifications"
              onPress={() =>
                navigation.navigate('SettingStack', { screen: 'Notifications' })
              }
            />
            <View style={styles.divider} />
            <SettingItem
              icon="contrast-outline"
              title="Appearance"
              subtitle={getThemePreferenceLabel(preference)}
              onPress={() =>
                navigation.navigate('SettingStack', { screen: 'Appearance' })
              }
            />
          </View>

          {(() => {
            const perms = state?.orgData?.user_role?.permissions;
            const role = state?.orgData?.user_role?.role_name;
            const canInvite =
              Array.isArray(perms) &&
              perms.length > 0 &&
              hasPermission(perms, 'can_invite_members', role);

            if (!canInvite) {
              return null;
            }

            return (
              <>
                <SectionHeader title="Account & Workspace" />
                <View style={styles.groupCard}>
                  <SettingItem
                    icon="people-outline"
                    title="Invite People"
                    subtitle="Invite people to your workspace"
                    onPress={() =>
                      navigation.navigate('SettingStack', { screen: 'Invite' })
                    }
                  />
                  <View style={styles.divider} />
                </View>
              </>
            );
          })()}

          <SectionHeader title="Privacy & Security" />
          <View style={styles.groupCard}>
            <SettingItem
              icon="lock-closed-outline"
              title="Security"
              subtitle="Edit your security preferences"
              onPress={() =>
                navigation.navigate('SettingStack', { screen: 'Security' })
              }
            />
            <View style={styles.divider} />
            <SettingItem
              icon="lock-closed"
              title="Change Password"
              subtitle="Update your password"
              onPress={() =>
                navigation.navigate('SettingStack', {
                  screen: 'ChangePassword',
                })
              }
            />
          </View>

          <View style={[styles.groupCard, { marginTop: 24 }]}>
            <SettingItem
              icon="log-out-outline"
              title="Sign out"
              isDestructive
              onPress={() => setLogoutModalVisible(true)}
            />
          </View>

          <View style={styles.divider} />

          <View style={[styles.groupCard, { marginTop: 24, marginBottom: 40 }]}>
            <SettingItem
              icon="trash"
              title="Delete Account"
              isDestructive
              onPress={() =>
                navigation.navigate('SettingStack', { screen: 'DeleteAccount' })
              }
            />
          </View>
        </View>

        <LogoutConfirmationModal
          visible={isLogoutModalVisible}
          onClose={() => setLogoutModalVisible(false)}
        />
        <StatusSheet
          ref={statusSheetRef}
          initialText={statusText}
          initialEmoji={statusEmoji}
          onChange={(emoji, text, clearAfter) => {
            setStatusEmoji(emoji || '');
            setStatusText(text || '');
            setStatusClearAfter(clearAfter || 'dont');
          }}
        />
      </ScrollView>
    </Container>
  );
};

export default SettingsHome;
