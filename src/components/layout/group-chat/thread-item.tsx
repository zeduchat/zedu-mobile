import React, { useMemo, useState } from 'react';
import { View, Image, TouchableOpacity } from 'react-native';
import { AppText } from '@/components/ui/text';
import { useTheme } from '@/theme/ThemeProvider';
import { createThreadItemStyles } from '@/theme/createChatOverlayStyles';
import FontAwesome5Icon from 'react-native-vector-icons/FontAwesome5';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Video from 'react-native-video';
import { MessageContent } from '../chat/message-content';
import { hasMessageContent } from '@/utils/message-text';

const ThreadItem = ({ item, onLongPress, isGroup }: any) => {
  const { colors } = useTheme();
  const styles = useMemo(() => createThreadItemStyles(colors), [colors]);
  const _showDateHeader = item.date;
  const isReceived = !item.sent;
  const [_viewerVisible, setViewerVisible] = useState(false);

  const getFileTheme = (fileName: string) => {
    const ext = fileName?.split('.').pop()?.toLowerCase();
    if (ext === 'pdf') return { color: '#FF5722', label: 'PDF' };
    if (ext === 'doc' || ext === 'docx')
      return { color: '#2B579A', label: 'DOC' };
    if (ext === 'xls' || ext === 'xlsx')
      return { color: '#217346', label: 'XLS' };
    return { color: '#607D8B', label: 'FILE' };
  };

  const handleMediaPress = () => {
    setViewerVisible(true);
  };

  const fileTheme = item.file ? getFileTheme(item.file.name) : null;

  return (
    <View
      style={{
        borderBottomWidth: 1,
        borderColor: colors.border,
        paddingBottom: 30,
      }}
    >
      <View style={styles.dateHeader}>
        <AppText style={styles.dateText}>{item.date}</AppText>
      </View>

      <View
        style={[
          styles.rowContainer,
          // styles.receivedRow
        ]}
      >
        <View style={styles.groupAvatarContainer}>
          <Image
            source={item.senderImg || require('@/assets/images/avatar.png')}
            style={styles.groupSenderAvatar}
          />
        </View>

        <TouchableOpacity
          activeOpacity={0.8}
          onLongPress={() => onLongPress(item)}
          delayLongPress={200}
          style={[
            styles.messageWrapper,
            item.sent ? styles.sentWrapper : styles.receivedWrapper,
            isGroup && isReceived && { maxWidth: '80%' },
          ]}
        >
          <View
            style={[
              styles.bubble,
              item.sent ? styles.sentBubble : styles.receivedBubble,
            ]}
          >
            {isGroup && isReceived && item.senderName && (
              <AppText
                size={13}
                variant="bold"
                style={[
                  styles.senderNameLabel,
                  { color: item.senderColor || colors.primary },
                ]}
              >
                {item.senderName}
              </AppText>
            )}

            {/* IMAGE LOGIC */}
            {item.type === 'image' && item.image && (
              <TouchableOpacity
                activeOpacity={0.9}
                onPress={handleMediaPress}
                style={styles.mediaContainer}
              >
                <Image source={{ uri: item.image }} style={styles.mediaImage} />
                {!item.text && (
                  <View style={styles.mediaTimeOverlay}>
                    <AppText size={10} style={styles.mediaTimeText}>
                      {item.time}
                    </AppText>
                    {item.sent && (
                      <Image
                        source={require('@/assets/icons/read-receipt.png')}
                        style={styles.receiptIconSmall}
                      />
                    )}
                  </View>
                )}
              </TouchableOpacity>
            )}

            {/* VIDEO LOGIC (Updated with your request) */}
            {item.type === 'video' && item.video && (
              <TouchableOpacity
                activeOpacity={0.9}
                onPress={handleMediaPress}
                style={styles.mediaContainer}
              >
                <View style={styles.videoWrapper}>
                  <Video
                    source={{ uri: item.video }}
                    style={styles.mediaImage}
                    resizeMode="cover"
                    paused={true}
                  />
                  <View style={styles.videoPlayOverlay}>
                    <View style={styles.playIconCircle}>
                      <Ionicons name="play" size={32} color="white" />
                    </View>
                  </View>
                  {/* Video timing icon at bottom */}
                  <View style={styles.videoDurationLabel}>
                    <Ionicons name="videocam" size={12} color="white" />
                    <AppText
                      size={10}
                      style={{ color: 'white', marginLeft: 4 }}
                    >
                      0:07
                    </AppText>
                  </View>
                </View>
                {!item.text && (
                  <View style={styles.mediaTimeOverlay}>
                    <AppText size={10} style={styles.mediaTimeText}>
                      {item.time}
                    </AppText>
                    {item.sent && (
                      <Image
                        source={require('@/assets/icons/read-receipt.png')}
                        style={styles.receiptIconSmall}
                      />
                    )}
                  </View>
                )}
              </TouchableOpacity>
            )}

            {/* VOICE LOGIC */}
            {item.type === 'audio' && item.voice && (
              <View style={styles.voiceContainer}>
                <TouchableOpacity style={styles.playBtn}>
                  <FontAwesome5Icon
                    name="play"
                    size={16}
                    style={styles.playIcon}
                  />
                </TouchableOpacity>
                <View style={styles.waveformContainer}>
                  <View style={styles.waveformLine} />
                  <View
                    style={[
                      styles.playbackThumb,
                      { backgroundColor: colors.primary },
                    ]}
                  />
                  <AppText size={10} style={styles.voiceDuration}>
                    0:15
                  </AppText>
                </View>
                <View style={styles.voiceAvatarContainer}>
                  <Image
                    source={require('@/assets/images/avatar.png')}
                    style={styles.voiceAvatar}
                  />
                  <View
                    style={[
                      styles.micBadge,
                      { backgroundColor: colors.primary },
                    ]}
                  >
                    <Image
                      source={require('@/assets/icons/mic.png')}
                      style={styles.miniMic}
                    />
                  </View>
                </View>
              </View>
            )}

            {/* FILE LOGIC */}
            {item.type === 'file' && item.file && (
              <View style={styles.complexFileWrapper}>
                <View style={styles.fileMainRow}>
                  <View
                    style={[
                      styles.fileIconBox,
                      { backgroundColor: fileTheme?.color },
                    ]}
                  >
                    <AppText style={styles.fileExtText}>
                      {fileTheme?.label}
                    </AppText>
                  </View>
                  <View style={styles.fileInfo}>
                    <AppText numberOfLines={1} style={styles.fileNameText}>
                      {typeof item.file === 'string'
                        ? item.file
                        : item.file.name}
                    </AppText>
                    <AppText size={11} style={styles.fileMetaText}>
                      {item.file.size || '1.2 MB'} • {fileTheme?.label}
                    </AppText>
                  </View>
                </View>
              </View>
            )}

            {hasMessageContent(item.message || item.text) && (
              <MessageContent
                html={item.message || item.text}
                media={item.media}
              />
            )}
          </View>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default ThreadItem;
