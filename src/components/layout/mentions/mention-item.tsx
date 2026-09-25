import React, { useMemo } from 'react';
import { View, Image, TouchableOpacity } from 'react-native';
import { AppText } from '@/components/ui/text';
import { useTheme } from '@/theme/ThemeProvider';
import { createMentionItemStyles } from '@/theme/createChatOverlayStyles';
import moment from 'moment';
import { normalize } from '@/utils/normalize';
import Markdown from 'react-native-markdown-display';
import FontAwesome5Icon from 'react-native-vector-icons/FontAwesome5';

interface MentionItemProps {
  id: string;
  username: string;
  avatar_url?: string;
  message: string;
  created_at: string;
  mention_type: string;
  channel_name?: string;
  is_private?: boolean;
  onPress: () => void;
}

const MentionItem: React.FC<MentionItemProps> = ({
  id: _id,
  username,
  avatar_url,
  message,
  created_at,
  mention_type,
  channel_name,
  is_private = false,
  onPress,
}) => {
  const { colors } = useTheme();
  const styles = useMemo(() => createMentionItemStyles(colors), [colors]);

  const messagePreview =
    message?.replace(/<[^>]*>?/gm, '').substring(0, 120) || '';
  const timeText = moment(created_at).format('HH:mm');

  const markdownStyles = {
    text: { color: colors.iconDefault, fontSize: 13, lineHeight: 18 },
    paragraph: { marginVertical: 0 },
    strong: { fontWeight: 'bold' as const, color: colors.textPrimary },
    em: { fontStyle: 'italic' as const, color: colors.iconDefault },
  };

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={onPress}
      style={styles.container}
    >
      {channel_name ? (
        <View style={styles.channelContainer}>
          <View style={styles.channelInner}>
            <FontAwesome5Icon
              name={is_private ? 'lock' : 'hashtag'}
              size={12}
              color={colors.iconDefault}
              style={{ marginRight: normalize(6) }}
            />
            <AppText size={12} style={styles.channelText} numberOfLines={1}>
              {channel_name}
            </AppText>
          </View>
        </View>
      ) : null}

      <View style={styles.avatarContainer}>
        {avatar_url ? (
          <Image source={{ uri: avatar_url }} style={styles.avatar} />
        ) : (
          <View style={[styles.avatar, styles.avatarPlaceholder]}>
            <AppText variant="bold" size={14} style={{ color: colors.white }}>
              {username?.charAt(0).toUpperCase()}
            </AppText>
          </View>
        )}
      </View>

      <View style={styles.contentContainer}>
        <View style={styles.headerRow}>
          <View style={styles.nameContainer}>
            <AppText variant="bold" size={14} style={styles.username}>
              {username}
            </AppText>
            {mention_type === 'channel' && channel_name && (
              <AppText size={12} style={styles.channelName} numberOfLines={1}>
                @{channel_name}
              </AppText>
            )}
          </View>
          <AppText size={12} style={styles.time}>
            {timeText}
          </AppText>
        </View>

        <Markdown style={markdownStyles}>{messagePreview}</Markdown>

        <View style={styles.threadBadge}>
          <AppText size={10} style={styles.threadText}>
            In thread
          </AppText>
        </View>
      </View>

      <Image
        source={require('@/assets/icons/back.png')}
        style={styles.chevron}
      />
    </TouchableOpacity>
  );
};

export default MentionItem;
