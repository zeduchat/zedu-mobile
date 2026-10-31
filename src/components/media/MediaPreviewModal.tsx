import React, { useMemo } from 'react';
import { Modal, Pressable, View, Dimensions } from 'react-native';
import Video from 'react-native-video';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { AppText } from '@/components/ui/text';
import { useTheme } from '@/theme/ThemeProvider';
import { createMediaPreviewModalStyles } from '@/theme/createStep10Styles';
import ZoomableImage from '@/components/media/ZoomableImage';
import AudioPreview from '@/components/media/audio-preview';

const { width } = Dimensions.get('window');

export type PreviewMediaItem = {
  id: string;
  file_name: string;
  file_type: string;
  mime_type: string;
  file_link: string;
  user_id: string;
  created_at: string;
  updated_at: string;
  url?: string;
};

type MediaPreviewModalProps = {
  visible: boolean;
  item: PreviewMediaItem | null;
  onClose: () => void;
};

const isVideo = (mime: string, fileName: string) => {
  if (!mime && !fileName) return false;
  if (mime && mime.startsWith('video')) return true;
  if (fileName) {
    const ext = fileName.toLowerCase();
    return (
      ext.endsWith('.mp4') ||
      ext.endsWith('.mov') ||
      ext.endsWith('.avi') ||
      ext.endsWith('.mkv')
    );
  }
  return false;
};

const isAudio = (item: PreviewMediaItem) => {
  const extensions = ['wav', 'm4a', 'mp3', 'ogg', 'aac', 'flac'];
  const extension = (value: string) => {
    try {
      return decodeURIComponent(value)
        .split('?')[0]
        .split('.')
        .pop()
        ?.toLowerCase();
    } catch {
      return value.split('?')[0].split('.').pop()?.toLowerCase();
    }
  };
  return (
    item.mime_type?.toLowerCase().startsWith('audio/') ||
    [
      extension(item.file_name || ''),
      item.file_type?.toLowerCase(),
      extension(item.file_link || ''),
    ].some(value => extensions.includes(value || ''))
  );
};

const isImage = (mime: string) => mime && mime.startsWith('image');

const MediaPreviewModal: React.FC<MediaPreviewModalProps> = ({
  visible,
  item,
  onClose,
}) => {
  const { colors } = useTheme();
  const styles = useMemo(
    () => createMediaPreviewModalStyles(colors, width),
    [colors],
  );

  if (!item || !visible) return null;
  const audio = isAudio(item);
  const video = !audio && isVideo(item.mime_type, item.file_name);
  const image = !audio && isImage(item.mime_type);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalBackdrop}>
        <Pressable style={styles.modalDismissArea} onPress={onClose} />
        <View style={styles.modalContent} pointerEvents="box-none">
          <Pressable style={styles.modalCloseBtn} onPress={onClose}>
            <Ionicons name="close" size={32} color={colors.white} />
          </Pressable>
          {image && (
            <ZoomableImage uri={item.file_link} style={styles.modalImage} />
          )}
          {audio && (
            <AudioPreview
              key={`${item.id}:${item.file_link}`}
              uri={item.file_link}
              name={item.file_name}
            />
          )}
          {video && (
            <Video
              source={{ uri: item.file_link }}
              style={styles.modalVideo}
              controls
              resizeMode="contain"
              paused={false}
            />
          )}
          {!image && !video && !audio && (
            <View style={styles.filePreviewBox}>
              <Ionicons
                name="document-outline"
                size={48}
                color={colors.primary}
              />
              <AppText style={styles.fileName}>{item.file_name}</AppText>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
};

export default MediaPreviewModal;
