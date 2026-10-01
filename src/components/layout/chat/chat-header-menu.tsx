import React, { useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Feather from 'react-native-vector-icons/Feather';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { AppText } from '@/components/ui/text';
import { useTheme } from '@/theme/ThemeProvider';

const MENU_WIDTH = 210;

type MenuProps = {
  onBuzzCall: () => void;
  onSearch: () => void;
  onPinnedMessages: () => void;
  buzzLoading?: boolean;
  /** When true, label becomes "Join Buzz" instead of "Buzz Call". */
  buzzActive?: boolean;
};

/** Chevron-in-circle trigger + WhatsApp-style overflow menu. */
export function ChatHeaderMenu({
  onBuzzCall,
  onSearch,
  onPinnedMessages,
  buzzLoading = false,
  buzzActive = false,
}: MenuProps) {
  const { colors } = useTheme();
  const [open, setOpen] = useState(false);
  const [menuPos, setMenuPos] = useState({
    top: 56,
    left: undefined as number | undefined,
    right: 10 as number | undefined,
  });
  const triggerRef = useRef<View>(null);
  const styles = useMemo(() => createStyles(colors), [colors]);

  const openMenu = () => {
    triggerRef.current?.measureInWindow((x, y, width, height) => {
      const screenWidth = Dimensions.get('window').width;
      const preferredLeft = x + width - MENU_WIDTH;
      const left = Math.min(
        Math.max(8, preferredLeft),
        screenWidth - MENU_WIDTH - 8,
      );
      setMenuPos({ top: y + height + 6, left, right: undefined });
      setOpen(true);
    });
  };

  const close = () => setOpen(false);

  const run = (action: () => void) => {
    close();
    requestAnimationFrame(() => action());
  };

  return (
    <>
      <TouchableOpacity
        ref={triggerRef}
        accessibilityRole="button"
        accessibilityLabel="Chat options"
        activeOpacity={0.75}
        onPress={openMenu}
        style={styles.trigger}
        hitSlop={8}
      >
        {buzzLoading ? (
          <ActivityIndicator size="small" color={colors.primary} />
        ) : (
          <Ionicons name="chevron-down" size={18} color={colors.iconDefault} />
        )}
        {buzzActive && !buzzLoading ? <View style={styles.activeDot} /> : null}
      </TouchableOpacity>

      <Modal
        visible={open}
        transparent
        animationType="fade"
        onRequestClose={close}
      >
        <Pressable style={styles.overlay} onPress={close}>
          <View
            style={[
              styles.menuCard,
              {
                position: 'absolute',
                top: menuPos.top,
                left: menuPos.left,
                right: menuPos.right,
              },
            ]}
            onStartShouldSetResponder={() => true}
          >
            <MenuRow
              icon={
                <Feather
                  name="video"
                  size={20}
                  color={buzzActive ? colors.online : colors.textPrimary}
                />
              }
              label={buzzActive ? 'Join Buzz' : 'Buzz Call'}
              onPress={() => run(onBuzzCall)}
              styles={styles}
            />
            <View style={styles.divider} />
            <MenuRow
              icon={
                <Ionicons name="search" size={20} color={colors.textPrimary} />
              }
              label="Search"
              onPress={() => run(onSearch)}
              styles={styles}
            />
            <View style={styles.divider} />
            <MenuRow
              icon={
                <MaterialCommunityIcons
                  name="pin"
                  size={20}
                  color={colors.textPrimary}
                />
              }
              label="Pinned messages"
              onPress={() => run(onPinnedMessages)}
              styles={styles}
            />
          </View>
        </Pressable>
      </Modal>
    </>
  );
}

type SearchBarProps = {
  value: string;
  onChangeText: (text: string) => void;
  onCancel: () => void;
  placeholder?: string;
};

/**
 * Search field + cancel control meant to sit *inside* the existing chat
 * header (`styles.header`) — it does not replace the header chrome.
 */
export function ChatHeaderSearchBar({
  value,
  onChangeText,
  onCancel,
  placeholder = 'Search…',
}: SearchBarProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <>
      <View style={styles.searchField}>
        <Ionicons
          name="search"
          size={18}
          color={colors.textSecondary}
          style={styles.searchIcon}
        />
        <TextInput
          autoFocus
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.textSecondary}
          style={styles.searchInput}
          returnKeyType="search"
          clearButtonMode="while-editing"
        />
      </View>
      <TouchableOpacity
        onPress={onCancel}
        hitSlop={10}
        accessibilityRole="button"
        accessibilityLabel="Cancel search"
        style={styles.cancelBtn}
      >
        <Ionicons name="close" size={22} color={colors.iconDefault} />
      </TouchableOpacity>
    </>
  );
}

function MenuRow({
  icon,
  label,
  onPress,
  styles,
}: {
  icon: React.ReactNode;
  label: string;
  onPress: () => void;
  styles: ReturnType<typeof createStyles>;
}) {
  return (
    <TouchableOpacity
      style={styles.menuRow}
      activeOpacity={0.7}
      onPress={onPress}
    >
      <AppText size={15} style={styles.menuLabel}>
        {label}
      </AppText>
      {icon}
    </TouchableOpacity>
  );
}

function createStyles(colors: ReturnType<typeof useTheme>['colors']) {
  return StyleSheet.create({
    trigger: {
      width: 34,
      height: 34,
      borderRadius: 17,
      marginRight: 10,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
      backgroundColor: colors.surfaceElevated || colors.surface,
    },
    activeDot: {
      position: 'absolute',
      top: 4,
      right: 4,
      width: 7,
      height: 7,
      borderRadius: 4,
      backgroundColor: colors.online,
      borderWidth: 1,
      borderColor: colors.surface,
    },
    overlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.12)',
    },
    menuCard: {
      width: MENU_WIDTH,
      backgroundColor: colors.surface,
      borderRadius: 10,
      paddingVertical: 4,
      ...Platform.select({
        ios: {
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.18,
          shadowRadius: 10,
        },
        android: {
          elevation: 8,
        },
      }),
    },
    menuRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      paddingVertical: 13,
      gap: 24,
    },
    menuLabel: {
      color: colors.textPrimary,
    },
    divider: {
      height: StyleSheet.hairlineWidth,
      backgroundColor: colors.border,
      marginHorizontal: 12,
    },
    searchField: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.surface,
      borderRadius: 10,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
      paddingHorizontal: 10,
      height: 40,
      marginRight: 4,
    },
    searchIcon: {
      marginRight: 6,
    },
    searchInput: {
      flex: 1,
      fontSize: 15,
      color: colors.textPrimary,
      paddingVertical: Platform.OS === 'android' ? 0 : 0,
      ...(Platform.OS === 'android' ? { includeFontPadding: false } : {}),
    },
    cancelBtn: {
      padding: 4,
      marginRight: 4,
    },
  });
}
