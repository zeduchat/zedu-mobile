import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  TouchableOpacity,
  View,
} from 'react-native';
import FastImage from 'react-native-fast-image';
import Video from 'react-native-video';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Slider from '@react-native-community/slider';
import RNFS from 'react-native-fs';
import { viewDocument } from '@react-native-documents/viewer';
import { AppText } from '@/components/ui/text';
import { Media } from '@/types/thread';
import {
  decodeFileName,
  formatFileSize,
  getFileTheme,
  isAudioFile,
  isDocumentFile,
  isImageFile,
  isPresentationFile,
  isSpreadsheetFile,
  isVideoFile,
} from '@/utils/file-helpers';
import { isInAppPreviewSupported } from '@/utils/document-preview';
import { InAppDocumentViewer } from '@/components/layout/chat/in-app-document-viewer';
import { ShowNotify } from '@/components/ui/toast';
import { AudioMessagePlayer } from '@/components/layout/chat/audio-message-player';
import { useTheme } from '@/theme/ThemeProvider';
import { useFileManagementStyles } from '@/components/files/file-management.styles';

type FilePreviewProps = {
  file: Media;
  ownerName?: string;
};

const FilePreview: React.FC<FilePreviewProps> = ({ file, ownerName }) => {
  const { colors } = useTheme();
  const styles = useFileManagementStyles();
  const [paused, setPaused] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isSliding, setIsSliding] = useState(false);
  const [openingDoc, setOpeningDoc] = useState(false);
  const videoRef = useRef<any>(null);
  const theme = getFileTheme(file.file_name);
  const displayName = decodeFileName(file.file_name);

  useEffect(() => {
    setPaused(false);
    setProgress(0);
    setDuration(0);
  }, [file.id]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const openDocument = async () => {
    if (!file.file_link || openingDoc) return;
    setOpeningDoc(true);
    try {
      const safeName = displayName.replace(/[^a-zA-Z0-9._-]/g, '_');
      const localPath = `${RNFS.CachesDirectoryPath}/${file.id}_${safeName}`;
      const exists = await RNFS.exists(localPath);
      if (!exists) {
        await RNFS.downloadFile({ fromUrl: file.file_link, toFile: localPath })
          .promise;
      }
      const uri = Platform.OS === 'android' ? `file://${localPath}` : localPath;
      await viewDocument({
        uri,
        mimeType: file.mime_type || 'application/pdf',
      });
    } catch {
      ShowNotify('Preview', 'Unable to open this document in-app.');
    } finally {
      setOpeningDoc(false);
    }
  };

  if (isImageFile(file)) {
    return (
      <View style={styles.previewCard}>
        <FastImage
          source={{ uri: file.file_link }}
          style={styles.imagePreview}
          resizeMode={FastImage.resizeMode.contain}
        />
      </View>
    );
  }

  if (isVideoFile(file)) {
    return (
      <View style={styles.previewCard}>
        <Video
          ref={videoRef}
          source={{ uri: file.file_link }}
          style={styles.videoPreview}
          resizeMode="contain"
          paused={paused || isSliding}
          controls={false}
          onProgress={data => {
            if (!isSliding) setProgress(data.currentTime);
          }}
          onLoad={data => setDuration(data.duration)}
          onEnd={() => {
            setPaused(true);
            videoRef.current?.seek(0);
          }}
        />
        <TouchableOpacity
          activeOpacity={1}
          onPress={() => setPaused(!paused)}
          style={styles.videoTouchOverlay}
        >
          {paused && (
            <View style={styles.playCircle}>
              <Ionicons name="play" size={30} color={colors.textPrimary} />
            </View>
          )}
        </TouchableOpacity>
        <View style={styles.videoControls}>
          <AppText size={12} style={styles.timeLabel}>
            {formatTime(progress)}
          </AppText>
          <Slider
            style={styles.slider}
            minimumValue={0}
            maximumValue={duration || 1}
            value={progress}
            onValueChange={value => {
              setIsSliding(true);
              videoRef.current?.seek(value);
            }}
            onSlidingComplete={value => {
              setIsSliding(false);
              setProgress(value);
            }}
            minimumTrackTintColor={colors.primary}
            maximumTrackTintColor={colors.waveformInactive}
            thumbTintColor={colors.primary}
          />
          <AppText size={12} style={styles.timeLabel}>
            {formatTime(duration)}
          </AppText>
        </View>
      </View>
    );
  }

  if (isAudioFile(file)) {
    return (
      <View style={styles.audioCard}>
        <View style={[styles.docIcon, { backgroundColor: theme.color }]}>
          <Ionicons name="musical-notes" size={28} color={colors.white} />
        </View>
        <AppText
          variant="bold"
          size={16}
          style={styles.audioTitle}
          numberOfLines={2}
        >
          {displayName}
        </AppText>
        <AppText size={13} style={styles.audioMeta}>
          {formatFileSize(file.size)}
          {ownerName ? ` • ${ownerName}` : ''}
        </AppText>
        <View style={styles.audioPlayerWrap}>
          <AudioMessagePlayer
            audioUrl={file.file_link}
            media={file}
            item={{ id: file.id }}
          />
        </View>
      </View>
    );
  }

  if (
    isDocumentFile(file) ||
    isSpreadsheetFile(file) ||
    isPresentationFile(file)
  ) {
    const docDisplayName = decodeFileName(file.file_name);

    if (isInAppPreviewSupported(docDisplayName, file.mime_type)) {
      return (
        <View style={styles.previewCard}>
          <InAppDocumentViewer file={file} variant="embedded" height={360} />
        </View>
      );
    }

    return (
      <View style={styles.docCard}>
        <View style={[styles.docIcon, { backgroundColor: theme.color }]}>
          <AppText variant="bold" style={styles.docLabel}>
            {theme.label}
          </AppText>
        </View>
        <AppText
          variant="bold"
          size={16}
          style={styles.docTitle}
          numberOfLines={2}
        >
          {docDisplayName}
        </AppText>
        <AppText size={13} style={styles.docMeta}>
          {formatFileSize(file.size)}
        </AppText>
        <TouchableOpacity
          style={styles.openDocBtn}
          onPress={openDocument}
          activeOpacity={0.85}
        >
          {openingDoc ? (
            <ActivityIndicator color={colors.white} />
          ) : (
            <>
              <Ionicons name="eye-outline" size={18} color={colors.white} />
              <AppText variant="bold" size={14} style={styles.openDocText}>
                Open document
              </AppText>
            </>
          )}
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.docCard}>
      <View style={[styles.docIcon, { backgroundColor: theme.color }]}>
        <Ionicons name="document" size={28} color={colors.white} />
      </View>
      <AppText
        variant="bold"
        size={16}
        style={styles.docTitle}
        numberOfLines={2}
      >
        {displayName}
      </AppText>
      <AppText size={13} style={styles.docMeta}>
        {formatFileSize(file.size)}
      </AppText>
    </View>
  );
};

export default FilePreview;
