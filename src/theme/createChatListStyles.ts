import { StyleSheet } from 'react-native';
import { normalize } from '@/utils/normalize';
import type { ThemeColors } from './types';

export function createChatListStyles(colors: ThemeColors) {
  return StyleSheet.create({
    topHeader: {
      paddingHorizontal: normalize(20),
      paddingVertical: normalize(20),
      backgroundColor: colors.secondary,
    },
    profileTop: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 10,
    },
    searchBar: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.secondaryforeground,
      height: normalize(40),
      borderRadius: normalize(8),
      paddingHorizontal: normalize(12),
    },
    searchIcon: {
      width: 18,
      height: 18,
      tintColor: colors.white,
      marginRight: 8,
    },
    searchInput: {
      flex: 1,
      fontSize: normalize(15),
      color: colors.white,
    },
    orgPic: {
      width: normalize(40),
      height: normalize(40),
      borderWidth: 1,
      borderColor: colors.white,
      borderRadius: 5,
    },
    avatarPlaceholder: {
      backgroundColor: colors.primary,
      justifyContent: 'center',
      alignItems: 'center',
    },
    categoryContainer: {
      paddingVertical: normalize(15),
      borderBottomWidth: 0.5,
      borderColor: colors.border,
    },
    categoryScroll: { paddingHorizontal: normalize(20) },
    categoryBtn: {
      paddingHorizontal: normalize(16),
      height: normalize(35),
      borderRadius: normalize(20),
      backgroundColor: colors.categoryChip,
      justifyContent: 'center',
      marginRight: 10,
    },
    activeCategoryBtn: { backgroundColor: colors.primary },
    listContent: {
      paddingHorizontal: normalize(20),
      paddingTop: normalize(20),
      paddingBottom: normalize(100),
    },
    chatItem: {
      flexDirection: 'row',
      marginBottom: normalize(25),
      alignItems: 'center',
    },
    chatAvatar: {
      width: normalize(45),
      height: normalize(45),
      borderRadius: normalize(28),
    },
    avatarWrapper: {
      width: 50,
      height: 50,
      justifyContent: 'center',
      alignItems: 'center',
      position: 'relative',
      overflow: 'hidden',
      borderRadius: 25,
      zIndex: 6,
      borderWidth: 1,
      borderColor: colors.border,
    },
    groupAvatarContainer: {
      width: 50,
      height: 50,
      position: 'relative',
      overflow: 'hidden',
      borderRadius: 25,
      zIndex: 7,
    },
    groupAvatarItem: {
      position: 'absolute',
      borderWidth: 2,
      borderColor: colors.white,
    },
    groupAvatarMain: {
      width: 26,
      height: 26,
      borderRadius: 13,
      top: 5,
      left: 5,
      zIndex: 3,
    },
    groupAvatarTopRight: {
      width: 26,
      height: 26,
      borderRadius: 13,
      top: 5,
      right: 5,
      zIndex: 2,
    },
    groupAvatarBottomRight: {
      width: 26,
      height: 26,
      borderRadius: 13,
      bottom: 4,
      alignSelf: 'center',
      zIndex: 4,
    },
    chatInfo: { flex: 1, marginLeft: 15 },
    chatHeaderRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 4,
    },
    chatName: {
      flex: 1,
      color: colors.textPrimary,
      marginRight: 40,
    },
    chatNameWrap: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      marginRight: 10,
    },
    chatTime: { color: colors.textSecondary },
    chatFooterRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    chatMsg: {
      color: colors.textMuted,
      flex: 1,
      marginRight: normalize(50),
    },
    countBadge: {
      backgroundColor: colors.primary,
      minWidth: 20,
      height: 20,
      borderRadius: 10,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 4,
    },
    countText: { color: colors.white },
    channelAvatarWrapper: {
      position: 'relative',
      backgroundColor: colors.channelAvatarBackground,
      width: normalize(45),
      height: normalize(45),
      borderRadius: normalize(28),
      alignItems: 'center',
      justifyContent: 'center',
    },
    channelAvatarWrapperActiveBuzz: {
      backgroundColor: 'rgba(34, 197, 94, 0.18)',
      borderWidth: 2,
      borderColor: colors.online,
    },
    buzzAvatarInner: {
      position: 'relative',
      alignItems: 'center',
      justifyContent: 'center',
    },
    buzzLiveDot: {
      position: 'absolute',
      top: -2,
      right: -6,
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: colors.online,
      borderWidth: 1.5,
      borderColor: colors.white,
    },
  });
}

export function createMentionListStyles(colors: ThemeColors) {
  return StyleSheet.create({
    topHeader: {
      paddingHorizontal: normalize(16),
      paddingVertical: normalize(26),
      backgroundColor: colors.secondary,
      marginBottom: normalize(10),
    },
    profileTop: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    orgButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: normalize(8),
      flex: 1,
    },
    orgPic: {
      width: normalize(40),
      height: normalize(40),
      borderWidth: 1,
      borderColor: colors.white,
      borderRadius: normalize(6),
    },
    avatarPlaceholder: {
      backgroundColor: colors.primary,
      justifyContent: 'center',
      alignItems: 'center',
    },
    profilePic: {
      width: normalize(40),
      height: normalize(40),
      borderRadius: normalize(20),
      borderWidth: 1,
      borderColor: colors.white,
    },
    chatItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: normalize(14),
      paddingHorizontal: normalize(16),
      borderBottomWidth: 0.5,
      borderBottomColor: colors.border,
      backgroundColor: colors.background,
    },
    avatarWrapper: {
      width: normalize(45),
      height: normalize(45),
      borderRadius: normalize(22.5),
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: colors.surfaceElevated,
      marginRight: normalize(12),
    },
    chatInfo: {
      flex: 1,
      justifyContent: 'center',
    },
    chatHeaderRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 2,
    },
    chatName: {
      color: colors.textPrimary,
      flex: 1,
      marginRight: 8,
    },
    chatTime: {
      color: colors.textSecondary,
    },
    chatFooterRow: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    chatMsg: {
      color: colors.messageMeta,
      flex: 1,
    },
    listContent: {
      flexGrow: 1,
    },
    emptyContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    emptyText: {
      color: colors.textSecondary,
    },
    footerLoader: {
      paddingVertical: normalize(20),
      alignItems: 'center',
      justifyContent: 'center',
    },
  });
}
