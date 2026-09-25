import React, { useMemo } from 'react';
import { View, TouchableOpacity, Image, ScrollView } from 'react-native';
import { AppText } from '@/components/ui/text';
import { useTheme } from '@/theme/ThemeProvider';
import { createMentionSheetStyles } from '@/theme/createChatOverlayStyles';

interface MentionSheetProps {
  query: string;
  showChannelMention?: boolean;
  participants: Array<{
    user_id: string | number;
    username?: string | null;
    avatar_url?: string | null;
    online?: boolean;
    default_avatar_url?: string | null;
  }>;
  onSelect: (user: any) => void;
}

const FALLBACK_AVATAR = require('@/assets/images/user.png');

export const MentionSheet = ({
  query,
  showChannelMention = false,
  participants,
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

  const filteredParticipants = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) {
      return safeParticipants;
    }

    return safeParticipants.filter(participant => {
      const username = String(participant?.username || '').toLowerCase();
      return username.includes(q);
    });
  }, [query, safeParticipants]);

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

      <ScrollView
        bounces={false}
        style={styles.list}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="always"
      >
        {showChannelOption ? (
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
        ) : null}

        {filteredParticipants.length > 0 ? (
          filteredParticipants.map((item, index) => {
            const avatarUri = item.avatar_url || item.default_avatar_url;
            return (
              <TouchableOpacity
                key={String(item.user_id ?? item.username ?? index)}
                style={styles.memberRow}
                onPress={() => onSelect(item)}
              >
                <View style={styles.avatarContainer}>
                  <Image
                    source={avatarUri ? { uri: avatarUri } : FALLBACK_AVATAR}
                    style={styles.avatar}
                  />
                  <View
                    style={
                      item.online ? styles.onlineBadge : styles.offlineBadge
                    }
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
          })
        ) : (
          <View style={styles.emptyContainer}>
            <AppText style={styles.emptyText}>
              {safeParticipants.length === 0
                ? 'No members available'
                : 'No matches found'}
            </AppText>
          </View>
        )}
      </ScrollView>
    </View>
  );
};
