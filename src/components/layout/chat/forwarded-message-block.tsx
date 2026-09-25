import React, { useMemo } from 'react';
import { Image, View } from 'react-native';
import FontAwesome5 from 'react-native-vector-icons/FontAwesome5';
import moment from 'moment';
import FastImage from 'react-native-fast-image';
import { AppText } from '@/components/ui/text';
import { useTheme } from '@/theme/ThemeProvider';
import { createForwardedBlockStyles } from '@/theme/createChatOverlayStyles';
import { ForwardedMessageBlockData } from '@/utils/forward-message';
import { hasMessageContent } from '@/utils/message-text';
import { MessageContent } from './message-content';

type Props = {
  data: ForwardedMessageBlockData;
  onMentionUser?: (userId: string) => void;
};
export const ForwardedMessageBlock: React.FC<Props> = ({
  data,
  onMentionUser,
}) => {
  const { colors } = useTheme();
  const styles = useMemo(() => createForwardedBlockStyles(colors), [colors]);
  const previewImage = data.media.find(mediaItem => {
    const type = String(
      mediaItem?.file_type || mediaItem?.type || '',
    ).toLowerCase();
    const mimeType = String(
      mediaItem?.mime_type || mediaItem?.file_mime_type || '',
    ).toLowerCase();
    return (
      ['jpg', 'jpeg', 'png', 'gif', 'webp', 'heic', 'image'].includes(type) ||
      mimeType.startsWith('image/')
    );
  });

  const fileMedia = data.media.find(
    mediaItem => mediaItem && mediaItem !== previewImage,
  );

  const postedAt = data.createdAt
    ? moment(data.createdAt).format('MMM Do [at] h:mm A')
    : '';

  return (
    <View style={styles.container}>
      <View style={styles.accentLine} />

      <View style={styles.content}>
        <View style={styles.authorRow}>
          {data.senderAvatar ? (
            <Image source={{ uri: data.senderAvatar }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatar, styles.avatarPlaceholder]}>
              <AppText variant="bold" size={11}>
                {data.senderName.charAt(0).toUpperCase()}
              </AppText>
            </View>
          )}
          <AppText
            variant="bold"
            size={15}
            style={styles.senderName}
            numberOfLines={1}
          >
            {data.senderName}
          </AppText>
        </View>

        {hasMessageContent(data.message) ? (
          <MessageContent
            html={data.message}
            media={data.media}
            onMentionUser={onMentionUser}
            textStyle={styles.messageText}
          />
        ) : null}

        {previewImage?.file_link ? (
          <FastImage
            source={{ uri: previewImage.file_link }}
            style={styles.previewImage}
            resizeMode={FastImage.resizeMode.cover}
          />
        ) : null}

        {fileMedia?.file_name ? (
          <View style={styles.fileRow}>
            <View style={styles.fileIcon}>
              <AppText variant="bold" size={10} style={styles.fileIconText}>
                FILE
              </AppText>
            </View>
            <AppText size={14} style={styles.fileName} numberOfLines={2}>
              {fileMedia.file_name}
            </AppText>
          </View>
        ) : null}

        <View style={styles.footerRow}>
          <AppText size={13} style={styles.footerText}>
            Posted in{' '}
          </AppText>
          <FontAwesome5
            name={data.sourceIsPrivate ? 'lock' : 'hashtag'}
            size={11}
            color={colors.textSecondary}
            style={styles.footerIcon}
          />
          <AppText size={13} style={styles.footerChannel} numberOfLines={1}>
            {data.sourceChannelName}
          </AppText>
          {postedAt ? (
            <AppText size={13} style={styles.footerText}>
              {' '}
              | {postedAt}
            </AppText>
          ) : null}
        </View>
      </View>
    </View>
  );
};
