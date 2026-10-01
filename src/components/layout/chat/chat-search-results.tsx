import React, { useMemo } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import moment from 'moment';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { AppText } from '@/components/ui/text';
import { useTheme } from '@/theme/ThemeProvider';
import { useChannelMessageSearch } from '@/hooks/useChannelMessageSearch';
import { getPlainMessageText } from '@/utils/message-text';
import type { ChannelSearchHit } from '@/services/chat/channel-search';

type Props = {
  channelId: string;
  query: string;
  onSelect: (hit: ChannelSearchHit) => void;
};

export function ChatSearchResults({ channelId, query, onSelect }: Props) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { results, loading, error } = useChannelMessageSearch(
    channelId,
    query,
    true,
  );

  const trimmed = query.trim();

  if (!trimmed) {
    return (
      <View style={styles.empty}>
        <Ionicons name="search" size={36} color={colors.textSecondary} />
        <AppText size={14} style={styles.emptyText}>
          Search messages in this chat
        </AppText>
        <AppText size={12} style={styles.hint}>
          Try keywords, or filters like from:username
        </AppText>
      </View>
    );
  }

  if (loading) {
    return (
      <View style={styles.empty}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.empty}>
        <AppText size={14} style={styles.emptyText}>
          {error}
        </AppText>
      </View>
    );
  }

  if (results.length === 0) {
    return (
      <View style={styles.empty}>
        <AppText size={14} style={styles.emptyText}>
          No messages found for “{trimmed}”
        </AppText>
      </View>
    );
  }

  return (
    <FlatList
      data={results}
      keyExtractor={item => item.key}
      style={styles.list}
      contentContainerStyle={styles.listContent}
      keyboardShouldPersistTaps="handled"
      renderItem={({ item }) => (
        <TouchableOpacity
          style={styles.row}
          activeOpacity={0.7}
          onPress={() => onSelect(item)}
        >
          <Image
            source={{
              uri: item.avatarUrl || undefined,
            }}
            style={styles.avatar}
          />
          <View style={styles.body}>
            <View style={styles.metaRow}>
              <AppText
                variant="bold"
                size={14}
                numberOfLines={1}
                style={styles.name}
              >
                {item.userName}
              </AppText>
              {item.timestamp ? (
                <AppText size={11} style={styles.time}>
                  {formatHitTime(item.timestamp)}
                </AppText>
              ) : null}
            </View>
            <AppText size={13} numberOfLines={2} style={styles.preview}>
              {getPlainMessageText(item.message) || item.message}
            </AppText>
          </View>
        </TouchableOpacity>
      )}
    />
  );
}

function formatHitTime(timestamp: string): string {
  const m = moment(timestamp);
  if (!m.isValid()) return '';
  if (m.isSame(moment(), 'day')) return m.format('h:mm A');
  if (m.isSame(moment().subtract(1, 'day'), 'day')) return 'Yesterday';
  return m.format('MMM D');
}

function createStyles(colors: ReturnType<typeof useTheme>['colors']) {
  return StyleSheet.create({
    list: {
      flex: 1,
      backgroundColor: colors.background,
    },
    listContent: {
      paddingVertical: 4,
    },
    row: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      paddingHorizontal: 14,
      paddingVertical: 12,
      gap: 12,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.border,
    },
    avatar: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: colors.bgSecondary,
    },
    body: {
      flex: 1,
      minWidth: 0,
    },
    metaRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      marginBottom: 2,
    },
    name: {
      flex: 1,
      color: colors.textPrimary,
    },
    time: {
      color: colors.textSecondary,
    },
    preview: {
      color: colors.textMuted,
    },
    empty: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 32,
      backgroundColor: colors.background,
      gap: 8,
    },
    emptyText: {
      color: colors.textSecondary,
      textAlign: 'center',
    },
    hint: {
      color: colors.textSecondary,
      textAlign: 'center',
      opacity: 0.8,
    },
  });
}

export default ChatSearchResults;
