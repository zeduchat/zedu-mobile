import React, { useMemo } from 'react';
import {
  View,
  Modal,
  TouchableOpacity,
  TouchableWithoutFeedback,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Feather from 'react-native-vector-icons/Feather';
import { AppText } from '@/components/ui/text';
import { useTheme } from '@/theme/ThemeProvider';
import { normalize } from '@/utils/normalize';

export type StartBuzzScope = 'channel' | 'group' | 'dm';

type Props = {
  visible: boolean;
  loading?: boolean;
  scope: StartBuzzScope;
  /** Channel name, group label, or peer username */
  contextName?: string;
  memberCount?: number;
  onClose: () => void;
  onConfirm: () => void;
};

export const StartBuzzConfirmationModal = ({
  visible,
  loading = false,
  scope,
  contextName,
  memberCount,
  onClose,
  onConfirm,
}: Props) => {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const title =
    scope === 'dm' ? 'Start a Buzz call?' : 'Start a Buzz for everyone?';

  const headline =
    scope === 'channel'
      ? `You are about to start a Buzz in ${
          contextName ? `#${contextName}` : 'this channel'
        }.`
      : scope === 'group'
      ? `You are about to start a Buzz in ${contextName || 'this group'}.`
      : `You are about to start a Buzz with ${contextName || 'this person'}.`;

  const notifyLine =
    scope === 'channel'
      ? 'This will notify the whole channel.'
      : scope === 'group'
      ? memberCount
        ? `This will notify all ${memberCount} members.`
        : 'This will notify everyone in the group.'
      : 'They will get a call notification right away.';

  const points =
    scope === 'dm'
      ? [
          'Opens a live video Buzz session',
          'Sends an incoming call to the other person',
          'You can mute or leave anytime',
        ]
      : [
          'Opens a live video Buzz session',
          scope === 'channel'
            ? 'Notifies every member of this channel'
            : 'Notifies every group member',
          'Anyone can join from the chat header',
        ];

  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      onRequestClose={loading ? undefined : onClose}
    >
      <TouchableWithoutFeedback onPress={loading ? undefined : onClose}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback>
            <View style={styles.sheet}>
              <View style={styles.topRail}>
                <View style={styles.iconRingOuter}>
                  <View style={styles.iconRingInner}>
                    <Feather name="video" size={22} color={colors.primary} />
                  </View>
                </View>
                <TouchableOpacity
                  onPress={onClose}
                  disabled={loading}
                  hitSlop={12}
                  style={styles.closeHit}
                >
                  <Ionicons
                    name="close"
                    size={20}
                    color={colors.textSecondary}
                  />
                </TouchableOpacity>
              </View>

              <AppText size={12} style={styles.eyebrow}>
                Buzz
              </AppText>
              <AppText variant="bold" size={20} style={styles.title}>
                {title}
              </AppText>

              {!!contextName && (
                <View style={styles.contextChip}>
                  <AppText
                    size={13}
                    variant="medium"
                    numberOfLines={1}
                    style={styles.contextChipText}
                  >
                    {scope === 'channel' ? `#${contextName}` : contextName}
                    {typeof memberCount === 'number' && memberCount > 0
                      ? ` · ${memberCount} ${
                          memberCount === 1 ? 'member' : 'members'
                        }`
                      : ''}
                  </AppText>
                </View>
              )}

              <AppText size={14} style={styles.body}>
                {headline} {notifyLine} Do you want to proceed?
              </AppText>

              <View style={styles.divider} />

              <View style={styles.pointsBlock}>
                {points.map((point, index) => (
                  <View key={point} style={styles.pointRow}>
                    <View style={styles.pointIndex}>
                      <AppText
                        size={11}
                        variant="bold"
                        style={styles.pointIndexText}
                      >
                        {index + 1}
                      </AppText>
                    </View>
                    <AppText size={13} style={styles.pointText}>
                      {point}
                    </AppText>
                  </View>
                ))}
              </View>

              <View style={styles.notice}>
                <Ionicons
                  name="notifications-outline"
                  size={16}
                  color={colors.primary}
                />
                <AppText size={12} style={styles.noticeText}>
                  {scope === 'dm'
                    ? 'Only start a Buzz when you are ready to talk.'
                    : 'Everyone who can access this chat may see and join the Buzz.'}
                </AppText>
              </View>

              <View style={styles.actions}>
                <TouchableOpacity
                  style={styles.cancelBtn}
                  onPress={onClose}
                  disabled={loading}
                >
                  <AppText size={15} style={styles.cancelText}>
                    Not now
                  </AppText>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.confirmBtn}
                  onPress={onConfirm}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator color={colors.white} size="small" />
                  ) : (
                    <>
                      <Feather name="video" size={16} color={colors.white} />
                      <AppText
                        variant="bold"
                        size={15}
                        style={styles.confirmText}
                      >
                        Start Buzz
                      </AppText>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const createStyles = (colors: any) =>
  StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.55)',
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: normalize(22),
    },
    sheet: {
      width: '100%',
      backgroundColor: colors.surface,
      borderRadius: normalize(20),
      paddingHorizontal: normalize(20),
      paddingTop: normalize(18),
      paddingBottom: normalize(20),
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
    },
    topRail: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      marginBottom: normalize(14),
    },
    iconRingOuter: {
      width: normalize(56),
      height: normalize(56),
      borderRadius: normalize(28),
      borderWidth: 1,
      borderColor: colors.border,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.surfaceElevated ?? colors.reactionBackground,
    },
    iconRingInner: {
      width: normalize(42),
      height: normalize(42),
      borderRadius: normalize(21),
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.secondaryforeground ?? colors.reactionBackground,
    },
    closeHit: {
      padding: 4,
    },
    eyebrow: {
      color: colors.primary,
      letterSpacing: 0.6,
      textTransform: 'uppercase',
      marginBottom: normalize(4),
    },
    title: {
      color: colors.textPrimary,
      marginBottom: normalize(12),
    },
    contextChip: {
      alignSelf: 'flex-start',
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: 999,
      backgroundColor: colors.reactionBackground,
      marginBottom: normalize(12),
      maxWidth: '100%',
    },
    contextChipText: {
      color: colors.textPrimary,
      flexShrink: 1,
    },
    body: {
      color: colors.textSecondary,
      lineHeight: normalize(21),
      marginBottom: normalize(14),
    },
    divider: {
      height: StyleSheet.hairlineWidth,
      backgroundColor: colors.border,
      marginBottom: normalize(14),
    },
    pointsBlock: {
      gap: normalize(10),
      marginBottom: normalize(14),
    },
    pointRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 10,
    },
    pointIndex: {
      width: normalize(22),
      height: normalize(22),
      borderRadius: normalize(11),
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.reactionBackground,
      marginTop: 1,
    },
    pointIndexText: {
      color: colors.textSecondary,
    },
    pointText: {
      flex: 1,
      color: colors.textPrimary,
      lineHeight: normalize(19),
    },
    notice: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 8,
      padding: normalize(12),
      borderRadius: normalize(12),
      backgroundColor: colors.secondaryforeground ?? colors.reactionBackground,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
      marginBottom: normalize(18),
    },
    noticeText: {
      flex: 1,
      color: colors.textSecondary,
      lineHeight: normalize(17),
    },
    actions: {
      flexDirection: 'row',
      gap: 10,
    },
    cancelBtn: {
      flex: 1,
      height: normalize(48),
      borderRadius: normalize(12),
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.reactionBackground,
    },
    cancelText: {
      color: colors.textPrimary,
    },
    confirmBtn: {
      flex: 1.15,
      height: normalize(48),
      borderRadius: normalize(12),
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'row',
      gap: 8,
      backgroundColor: colors.primary,
    },
    confirmText: {
      color: colors.white,
    },
  });

export default StartBuzzConfirmationModal;
