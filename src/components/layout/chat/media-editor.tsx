import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  View,
  Image,
  Modal,
  TouchableOpacity,
  TextInput,
  StatusBar,
  ScrollView,
} from 'react-native';
import { AppText } from '@/components/ui/text';
import { useTheme } from '@/theme/ThemeProvider';
import { createMediaEditorStyles } from '@/theme/createChatOverlayStyles';
import Video from 'react-native-video';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import Slider from '@react-native-community/slider';
import { useDataContext } from '@/store/useDataContext';
import HorizontalLoader from '@/components/horizontal-loader';
import { FileAttachmentPreviewPanel } from '@/components/layout/chat/chat-file-attachment';
import { getFileTheme } from '@/utils/file-helpers';
import ChatKeyboardAvoidingView from '@/components/layout/chat/chat-keyboard-avoiding-view';

interface MediaEditorProps {
  visible: boolean;
  media: {
    uri: string | string[];
    type: 'image' | 'video' | 'file' | 'audio';
    name?: string;
    size?: string;
    isMultiple?: boolean;
  } | null;
  onClose: () => void;
  onSend: (caption: string) => void;
}

const MediaEditorModal = ({
  visible,
  media,
  onClose,
  onSend,
}: MediaEditorProps) => {
  const { colors } = useTheme();
  const styles = useMemo(() => createMediaEditorStyles(colors), [colors]);
  const [caption, setCaption] = useState('');
  const [paused, setPaused] = useState(true);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [isSliding, setIsSliding] = useState(false);
  const videoRef = useRef<any>(null);
  const { state } = useDataContext();

  useEffect(() => {
    if (visible) {
      setPaused(true);
      setCurrentTime(0);
      setCaption('');
    }
  }, [visible]);

  if (!media) return null;

  const getCaptionIcon = () => {
    switch (media.type) {
      case 'video':
        return require('@/assets/icons/camera.png');
      case 'audio':
        return require('@/assets/icons/mic.png');
      case 'file':
        return require('@/assets/icons/file.png');
      case 'image':
        return media.isMultiple
          ? require('@/assets/icons/input-gallery.png')
          : require('@/assets/icons/input-gallery.png');
      default:
        return require('@/assets/icons/input-gallery.png');
    }
  };

  const formatTime = (seconds: number) => {
    if (!seconds) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent={false}
      onRequestClose={onClose}
    >
      <StatusBar barStyle="light-content" backgroundColor={colors.black} />
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <Image
              source={require('@/assets/icons/close.png')}
              style={styles.headerIcon}
            />
          </TouchableOpacity>
        </View>
        <View style={styles.previewArea}>
          {media.type === 'video' ? (
            <View style={styles.videoContainer}>
              <Video
                ref={videoRef}
                source={{
                  uri: typeof media.uri === 'string' ? media.uri : media.uri[0],
                }}
                style={styles.mainPreview}
                resizeMode="contain"
                paused={paused || isSliding}
                onLoad={data => setDuration(data.duration)}
                onProgress={data => {
                  if (!isSliding) {
                    setCurrentTime(data.currentTime);
                  }
                }}
                onEnd={() => {
                  setPaused(true);
                  videoRef.current?.seek(0);
                }}
                bufferConfig={{
                  minBufferMs: 15000,
                  maxBufferMs: 50000,
                  bufferForPlaybackMs: 2500,
                  bufferForPlaybackAfterRebufferMs: 5000,
                }}
              />
              <View style={styles.videoInfoOverlay}>
                <AppText style={styles.videoInfoText}>
                  {formatTime(duration)} - {media.size || '0 MB'}
                </AppText>
              </View>
              <TouchableOpacity
                activeOpacity={1}
                style={styles.touchOverlay}
                onPress={() => setPaused(!paused)}
              >
                {paused && (
                  <View style={styles.playIconCircle}>
                    <Ionicons name="play" size={28} color="#23272F" />
                  </View>
                )}
              </TouchableOpacity>
              <View style={styles.scrubberContainer}>
                <Slider
                  style={{ width: '100%', height: 24 }}
                  minimumValue={0}
                  maximumValue={duration || 1}
                  value={currentTime}
                  onValueChange={v => {
                    setIsSliding(true);
                    videoRef.current?.seek(v);
                  }}
                  onSlidingComplete={v => {
                    setIsSliding(false);
                    setCurrentTime(v);
                  }}
                  minimumTrackTintColor={colors.primary}
                  maximumTrackTintColor="#444"
                  thumbTintColor={colors.primary}
                />
              </View>
            </View>
          ) : media.type === 'file' || media.type === 'audio' ? (
            <View style={styles.filePreviewContainer}>
              {media.type === 'file' && media.name ? (
                <View style={styles.officePreviewWrap}>
                  <FileAttachmentPreviewPanel
                    fileName={media.name}
                    size="editor"
                  />
                  <View style={styles.officePreviewMeta}>
                    <View
                      style={[
                        styles.officeBadge,
                        { backgroundColor: getFileTheme(media.name).color },
                      ]}
                    >
                      <AppText variant="bold" style={styles.officeBadgeText}>
                        {getFileTheme(media.name).label}
                      </AppText>
                    </View>
                    <AppText style={styles.fileNameText} numberOfLines={2}>
                      {media.name}
                    </AppText>
                    <AppText style={styles.fileSizeText}>
                      {[media.size, getFileTheme(media.name).kindLabel]
                        .filter(Boolean)
                        .join(' • ')}
                    </AppText>
                  </View>
                </View>
              ) : (
                <>
                  <MaterialCommunityIcons
                    name={
                      media.type === 'file'
                        ? 'file-document-outline'
                        : 'music-note'
                    }
                    size={80}
                    color={colors.primary}
                  />
                  <AppText style={styles.fileNameText} numberOfLines={2}>
                    {media.name || 'Attachment'}
                  </AppText>
                  <AppText style={styles.fileSizeText}>
                    {media.size || ''}
                  </AppText>
                </>
              )}
            </View>
          ) : media.isMultiple ? (
            <View style={styles.multipleImagesContainer}>
              <ScrollView
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.imagesScrollContent}
              >
                {(typeof media.uri === 'string' ? [media.uri] : media.uri).map(
                  (uri, index) => (
                    <View key={index} style={styles.imagePage}>
                      <Image
                        source={{ uri }}
                        style={styles.imagePreview}
                        resizeMode="contain"
                      />
                    </View>
                  ),
                )}
              </ScrollView>
              {(typeof media.uri === 'string' ? [media.uri] : media.uri)
                .length > 1 && (
                <AppText style={styles.imageCountText}>
                  {
                    (typeof media.uri === 'string' ? [media.uri] : media.uri)
                      .length
                  }{' '}
                  photos
                </AppText>
              )}
            </View>
          ) : (
            <View style={styles.imagePreviewWrapper}>
              <Image
                source={{
                  uri: typeof media.uri === 'string' ? media.uri : media.uri[0],
                }}
                style={styles.imagePreview}
                resizeMode="contain"
              />
            </View>
          )}
        </View>
        <ChatKeyboardAvoidingView keyboardVerticalOffset={0}>
          {state?.uploading && <HorizontalLoader />}
          <View style={styles.bottomBar}>
            <View style={styles.inputWrapper}>
              <TouchableOpacity style={styles.mediaIconBtn}>
                <Image source={getCaptionIcon()} style={styles.miniThumb} />
              </TouchableOpacity>
              <TextInput
                style={styles.input}
                placeholder="Add a caption..."
                placeholderTextColor="#8696A0"
                value={caption}
                onChangeText={setCaption}
                multiline={true}
                blurOnSubmit={false}
              />
            </View>
            <View style={styles.footerActions}>
              <TouchableOpacity style={styles.onceViewBtn}>
                <AppText style={styles.onceText}>You</AppText>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.sendBtn,
                  { opacity: state?.uploading ? 0.5 : 1 },
                ]}
                onPress={() => onSend(caption)}
                disabled={state?.uploading}
              >
                <Image
                  source={require('@/assets/icons/send.png')}
                  style={styles.sendIcon}
                />
              </TouchableOpacity>
            </View>
          </View>
        </ChatKeyboardAvoidingView>
      </View>
    </Modal>
  );
};

export default MediaEditorModal;
