import React, { useMemo, useState } from 'react';
import { View, TouchableOpacity } from 'react-native';
import { AppText } from '@/components/ui/text';
import { useTheme } from '@/theme/ThemeProvider';
import { createThreadItemStyles } from '@/theme/createChatOverlayStyles';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Video from 'react-native-video';
import MediaViewer from '../chat/media-viewer';
import { AudioMessagePlayer } from '../chat/audio-message-player';
import FastImage from 'react-native-fast-image';
import { MessageContent } from '../chat/message-content';
import { hasMessageContent } from '@/utils/message-text';
import { truncateUsernameForChannel } from '@/utils/truncate-username';
import { UserStatusIcon } from '@/components/ui/user-status-icon';
import { isVoiceMessageMedia } from '@/utils/voice-message';
import { isVideoFile } from '@/utils/file-helpers';
import moment from 'moment';

const ThreadItem = ({ item, onMentionUser }: any) => {
  const { colors } = useTheme();
  const styles = useMemo(() => createThreadItemStyles(colors), [colors]);
  const [viewerVisible, setViewerVisible] = useState(false);
  const [selectedMedia, setSelectedMedia] = useState<any>(null);

  const getFileTheme = (fileName: string) => {
    const ext = fileName?.split('.').pop()?.toLowerCase();
    if (ext === 'pdf') return { color: '#FF5722', label: 'PDF' };
    if (ext === 'doc' || ext === 'docx')
      return { color: '#2B579A', label: 'DOC' };
    if (ext === 'xls' || ext === 'xlsx')
      return { color: '#217346', label: 'XLS' };
    return { color: '#607D8B', label: 'FILE' };
  };

  const handleMediaPress = (media: any) => {
    setSelectedMedia(media);
    setViewerVisible(true);
  };

  const renderMediaItem = (mediaItem: any) => {
    const type = mediaItem?.file_type?.toLowerCase();

    const isImage = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'heic'].includes(
      type,
    );
    const isAudio = isVoiceMessageMedia(mediaItem);
    const isVideo = !isAudio && isVideoFile(mediaItem);
    const isFile = mediaItem && !isImage && !isVideo && !isAudio;

    if (isImage) {
      return (
        <TouchableOpacity
          key={mediaItem.id}
          activeOpacity={0.9}
          onPress={() => handleMediaPress(mediaItem)}
          style={styles.mediaContainer}
        >
          <FastImage
            source={{ uri: mediaItem.file_link }}
            style={styles.mediaImage}
          />
        </TouchableOpacity>
      );
    }

    if (isVideo) {
      return (
        <TouchableOpacity
          key={mediaItem.id}
          activeOpacity={0.9}
          onPress={() => handleMediaPress(mediaItem)}
          style={styles.mediaContainer}
        >
          <View style={styles.videoWrapper}>
            <Video
              source={{ uri: mediaItem.file_link }}
              style={styles.mediaImage}
              resizeMode="cover"
              paused={true}
            />
            <View style={styles.videoPlayOverlay}>
              <View style={styles.playIconCircle}>
                <Ionicons name="play" size={32} color="white" />
              </View>
            </View>
          </View>
        </TouchableOpacity>
      );
    }

    if (isFile) {
      const theme = getFileTheme(mediaItem.file_name);
      return (
        <View key={mediaItem.id} style={styles.complexFileWrapper}>
          <View style={styles.fileMainRow}>
            <View
              style={[styles.fileIconBox, { backgroundColor: theme.color }]}
            >
              <AppText style={styles.fileExtText}>{theme.label}</AppText>
            </View>
            <View style={styles.fileInfo}>
              <AppText numberOfLines={1} style={styles.fileNameText}>
                {mediaItem.file_name}
              </AppText>
              <AppText size={11} style={styles.fileMetaText}>
                {(mediaItem.size / 1024).toFixed(1)} KB • {theme.label}
              </AppText>
            </View>
          </View>
        </View>
      );
    }

    if (isAudio) {
      return (
        <AudioMessagePlayer
          key={mediaItem.id}
          audioUrl={mediaItem.file_link}
          media={mediaItem}
          item={item}
        />
      );
    }

    return null;
  };

  console.log(item);

  //

  return (
    <View style={[styles.rowContainer]}>
      <UserStatusIcon user={item} style={styles.threadStatusIcon} />
      <TouchableOpacity
        style={styles.groupAvatarContainer}
        onPress={() => onMentionUser?.(item.user_id)}
      >
        <FastImage
          source={{ uri: item.avatar_url || item.default_avatar_url }}
          style={styles.groupSenderAvatar}
        />
      </TouchableOpacity>

      <View style={styles.messageColumn}>
        <TouchableOpacity activeOpacity={0.8} style={styles.messageWrapper}>
          <View style={{ width: '100%', minWidth: 0 }}>
            <View style={styles.senderRow}>
              <AppText
                size={13}
                variant="bold"
                numberOfLines={1}
                style={[
                  styles.senderNameLabel,
                  {
                    color: item.senderColor || colors.primary,
                    flex: 1,
                    minWidth: 0,
                    marginRight: 4,
                  },
                ]}
              >
                {truncateUsernameForChannel(item.username)}
              </AppText>
              <AppText size={10} style={styles.timeText}>
                {moment(item.created_at).calendar(null, {
                  sameDay: '[Today]',
                  lastDay: '[Yesterday]',
                  lastWeek: 'MMMM D, YYYY',
                  sameElse: 'MMMM D, YYYY',
                })}
              </AppText>
            </View>

            {item.media && item.media.length > 0 && (
              <View style={styles.verticalMediaStack}>
                {item.media.map((m: any) => (
                  <View key={m.id || m.url}>{renderMediaItem(m)}</View>
                ))}
              </View>
            )}

            {hasMessageContent(item.message) && (
              <View style={styles.messageTextContainer}>
                <MessageContent
                  html={item.message}
                  media={item.media}
                  onMentionUser={onMentionUser}
                />
              </View>
            )}
          </View>
        </TouchableOpacity>
      </View>

      {viewerVisible && (
        <MediaViewer
          visible={viewerVisible}
          onClose={() => setViewerVisible(false)}
          media={selectedMedia}
          username={item?.username}
          fullName={item?.full_name}
        />
      )}
    </View>
  );
};

export default ThreadItem;
