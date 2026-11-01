import React, { useCallback, useMemo } from 'react';
import { View, TouchableOpacity, Image, FlatList } from 'react-native';
import type { ListRenderItem } from 'react-native';
import { AppText } from '@/components/ui/text';
import { useTheme } from '@/theme/ThemeProvider';
import { createMentionSheetStyles } from '@/theme/createChatOverlayStyles';
import { searchMentionParticipants } from './mention-search';

interface MentionParticipant {
  user_id: string | number;
  username?: string | null;
  avatar_url?: string | null;
  online?: boolean;
  default_avatar_url?: string | null;
}

export interface ChannelMentionOption {
  channels_id: string;
  name: string;
  channel_slug?: string | null;
  description?: string | null;
  members_count?: number | null;
}

interface MentionSheetProps {
  query: string;
  mode?: 'user' | 'channel';
  showChannelMention?: boolean;
  participants?: MentionParticipant[];
  channels?: ChannelMentionOption[];
  onSelect: (item: any) => void;
}

const FALLBACK_AVATAR = require('@/assets/images/user.png');
const INITIAL_RENDER_COUNT = 5;

export const MentionSheet = ({
  query,
  mode = 'user',
  showChannelMention = false,
  participants = [],
  channels = [],
  onSelect,
}: MentionSheetProps) => {
  const { colors } = useTheme();
  const styles = useMemo(() => createMentionSheetStyles(colors), [colors]);

  const safeParticipants = useMemo(
    () => (Array.isArray(participants) ? participants : []),
    [participants],
  );

  const showChannelOption = useMemo(() => {
    if (!showChannelMention) {
      return false;
    }

    const normalizedQuery = query.trim().toLowerCase();
    return (
      normalizedQuery.length === 0 || 'channel'.startsWith(normalizedQuery)
    );
  }, [query, showChannelMention]);

  const filteredParticipants = useMemo(
    () =>
      mode === 'channel' ? [] : searchMentionParticipants(safeParticipants, query),
    [mode, query, safeParticipants],
  );

  const filteredChannels = useMemo(() => {
    if (mode !== 'channel') {
      return [];
    }
    const q = query.trim().toLowerCase();
    const list = Array.isArray(channels) ? channels : [];
    if (!q) {
      return list;
    }
    return list.filter(channel => {
      const name = String(channel?.name || '').toLowerCase();
      const slug = String(channel?.channel_slug || '').toLowerCase();
      return name.includes(q) || slug.includes(q);
    });
  }, [channels, mode, query]);

  const renderChannelRef = useCallback<ListRenderItem<ChannelMentionOption>>(
    ({ item }) => {
      const count = item.members_count;
      const membersText =
        count != null ? `${count} ${count === 1 ? 'member' : 'members'}` : '';
      const subtitle = item.description || membersText;

      return (
        <TouchableOpacity
          style={styles.memberRow}
          onPress={() => onSelect(item)}
        >
          <View style={styles.channelMentionBadge}>
            <AppText
              variant="bold"
              size={13}
              style={styles.channelMentionBadgeText}
            >
              #
            </AppText>
          </View>
          <View style={styles.memberInfo}>
            <AppText variant="medium" size={14} numberOfLines={1}>
              {item.name}
            </AppText>
            {subtitle ? (
              <AppText size={12} style={styles.statusText} numberOfLines={1}>
                {subtitle}
              </AppText>
            ) : null}
          </View>
        </TouchableOpacity>
      );
    },
    [onSelect, styles],
  );

  const renderChannelOption = useCallback(() => {
    if (!showChannelOption) {
      return null;
    }

    return (
      <TouchableOpacity
        style={styles.memberRow}
        onPress={() =>
          onSelect({
            user_id: 'channel',
            username: 'channel',
            type: 'channel',
          })
        }
      >
        <View style={styles.channelMentionBadge}>
          <AppText
            variant="bold"
            size={13}
            style={styles.channelMentionBadgeText}
          >
            @
          </AppText>
        </View>
        <View style={styles.memberInfo}>
          <AppText
            variant="medium"
            size={14}
            style={styles.channelMentionLabel}
          >
            channel
          </AppText>
          <AppText size={12} style={styles.statusText}>
            Notify everyone in this channel
          </AppText>
        </View>
      </TouchableOpacity>
    );
  }, [onSelect, showChannelOption, styles]);

  const renderParticipant = useCallback<ListRenderItem<MentionParticipant>>(
    ({ item }) => {
      const avatarUri = item.avatar_url || item.default_avatar_url;

      return (
        <TouchableOpacity
          style={styles.memberRow}
          onPress={() => onSelect(item)}
        >
          <View style={styles.avatarContainer}>
            <Image
              source={avatarUri ? { uri: avatarUri } : FALLBACK_AVATAR}
              style={styles.avatar}
            />
            <View
              style={item.online ? styles.onlineBadge : styles.offlineBadge}
            />
          </View>

          <View style={styles.memberInfo}>
            <AppText variant="medium" size={14}>
              {item.username || 'Unknown'}
            </AppText>
            <AppText size={12} style={styles.statusText}>
              {item.online ? 'Active' : 'Away'}
            </AppText>
          </View>
        </TouchableOpacity>
      );
    },
    [onSelect, styles],
  );

  const renderEmptyState = useCallback(
    () => (
      <View style={styles.emptyContainer}>
        <AppText style={styles.emptyText}>
          {safeParticipants.length === 0
            ? 'No members available'
            : 'No matches found'}
        </AppText>
      </View>
    ),
    [safeParticipants.length, styles],
  );

  const keyExtractor = useCallback(
    (item: MentionParticipant, index: number) =>
      String(item.user_id ?? item.username ?? index),
    [],
  );

  if (mode === 'channel') {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <AppText variant="bold" size={14}>
            Link a channel
          </AppText>
          <AppText size={12} style={styles.headerHint}>
            {query ? `Results for "#${query}"` : 'Channels you can link'}
          </AppText>
        </View>

        <FlatList
          data={filteredChannels}
          renderItem={renderChannelRef}
          keyExtractor={(item, index) =>
            String(item.channels_id || item.name || index)
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <AppText style={styles.emptyText}>No channels found</AppText>
            </View>
          }
          bounces={false}
          style={styles.list}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="always"
          initialNumToRender={INITIAL_RENDER_COUNT}
          maxToRenderPerBatch={INITIAL_RENDER_COUNT}
          windowSize={5}
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <AppText variant="bold" size={14}>
          Mention someone
        </AppText>
        <AppText size={12} style={styles.headerHint}>
          {query ? `Results for "@${query}"` : 'Members in this chat'}
        </AppText>
      </View>

      <FlatList
        data={filteredParticipants}
        renderItem={renderParticipant}
        keyExtractor={keyExtractor}
        ListHeaderComponent={renderChannelOption}
        ListEmptyComponent={renderEmptyState}
        bounces={false}
        style={styles.list}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="always"
        removeClippedSubviews
        initialNumToRender={INITIAL_RENDER_COUNT}
        maxToRenderPerBatch={INITIAL_RENDER_COUNT}
        windowSize={5}
      />
    </View>
  );
};
