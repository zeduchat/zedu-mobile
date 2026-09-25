import React, { forwardRef, useCallback, useMemo, useState } from 'react';
import {
  View,
  Image,
  TouchableOpacity,
  ScrollView,
  FlatList,
  Platform,
} from 'react-native';
import { CameraRoll } from '@react-native-camera-roll/camera-roll';
import { AppText } from '@/components/ui/text';
import { useTheme } from '@/theme/ThemeProvider';
import { createChatMediaStyles } from '@/theme/createChatOverlayStyles';
import AppBottomSheet, {
  AppBottomSheetRef,
} from '@/components/ui/bottom-sheet';
import {
  launchCamera,
  launchImageLibrary,
  Asset,
} from 'react-native-image-picker';
import { pick, types } from '@react-native-documents/picker';
import { useFileUpload } from '@/hooks/useFileUpload';
import { useDataContext } from '@/store/useDataContext';
import { ACTIONS } from '@/store/types';
import { normalize } from '@/utils/normalize';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { ShowNotify } from '@/components/ui/toast';
import { isVideoUploadAsset } from '@/utils/compress-video';

const DOCUMENT_PICKER_TYPES = [
  types.pdf,
  types.doc,
  types.docx,
  types.xls,
  types.xlsx,
  types.csv,
  types.ppt,
  types.pptx,
];

interface MediaPickerSheetProps {
  onSend?: (uri: string, type: 'image' | 'video' | 'file' | 'audio') => void;
  onClose?: () => void;
  visible?: boolean;
  media?: any;
  setPendingMedia: any;
  setIsEditorVisible: any;
}

type GalleryItem = {
  id: string;
  uri?: string;
  isCamera: boolean;
  mediaType?: 'image' | 'video';
};

const AUDIO_PICKER_TYPES = [
  types.audio,
  'audio/mpeg',
  'audio/mp4',
  'audio/x-m4a',
  'audio/wav',
  'audio/aac',
  'audio/ogg',
  'audio/flac',
];

const VIDEO_PICKER_TYPES = [
  (types as { video?: string }).video,
  'video/mp4',
  'video/quicktime',
  'video/x-m4v',
  'video/avi',
  'video/webm',
].filter(Boolean) as string[];

function isImageAsset(asset: Asset): boolean {
  const mime = (asset.type || '').toLowerCase();
  if (mime.startsWith('image/')) return true;
  return !isVideoUploadAsset(asset);
}

function formatFileSize(bytes?: number | null): string | undefined {
  if (!bytes) return undefined;
  return `${(bytes / 1048576).toFixed(1)} MB`;
}

function buildUploadAssetFromLibraryAsset(asset: Asset) {
  const isVideo = isVideoUploadAsset(asset);
  const fallbackName = isVideo
    ? `video_${Date.now()}.mp4`
    : `gallery_${Date.now()}.jpg`;

  return {
    uri: asset.uri!,
    type: asset.type || (isVideo ? 'video/mp4' : 'image/jpeg'),
    name: asset.fileName || fallbackName,
  };
}

export const MediaPickerSheet = forwardRef<
  AppBottomSheetRef,
  MediaPickerSheetProps
>((props, ref) => {
  const { colors } = useTheme();
  const styles = useMemo(() => createChatMediaStyles(colors), [colors]);
  const { setPendingMedia, setIsEditorVisible } = props;
  const [galleryPhotos, setGalleryPhotos] = useState<GalleryItem[]>([]);
  const [hasLoadedGallery, setHasLoadedGallery] = useState(false);
  const [selectedImages, setSelectedImages] = useState<Set<string>>(new Set());
  const { uploadFiles } = useFileUpload();
  const { dispatch } = useDataContext();

  const fetchPhotos = useCallback(async () => {
    try {
      const result = await CameraRoll.getPhotos({
        first: 20,
        assetType: 'All',
      });
      const photos: GalleryItem[] = result.edges.map(edge => ({
        id: edge.node.image.uri,
        uri: edge.node.image.uri,
        isCamera: false,
        mediaType: edge.node.type === 'video' ? 'video' : 'image',
      }));
      setGalleryPhotos([{ id: 'cam', isCamera: true }, ...photos]);
      setHasLoadedGallery(true);
    } catch (_error) {
      console.error('Gallery fetch error:', _error);
    }
  }, []);

  const ensureGalleryLoaded = useCallback(async () => {
    if (hasLoadedGallery) return;
    await fetchPhotos();
  }, [fetchPhotos, hasLoadedGallery]);

  const toggleImageSelection = (imageId: string) => {
    setSelectedImages(prev => {
      const newSet = new Set(prev);
      if (newSet.has(imageId)) {
        newSet.delete(imageId);
      } else {
        newSet.add(imageId);
      }
      return newSet;
    });
  };

  const handleMultipleImagesConfirm = async () => {
    if (selectedImages.size === 0) return;

    const selectedPhotos = galleryPhotos.filter(
      photo => !photo.isCamera && selectedImages.has(photo.id),
    );

    const filesToUpload = selectedPhotos.map(photo => ({
      uri: photo.uri,
      type: 'image/jpeg',
      name: `gallery_${photo.id}.jpg`,
    }));

    const response = await uploadFiles(filesToUpload);
    dispatch({ type: ACTIONS.MEDIA, payload: response.data });

    setPendingMedia({
      uri: selectedPhotos.map(p => p.uri),
      type: 'image',
      isMultiple: true,
    });
    setIsEditorVisible(true);
    setSelectedImages(new Set());
    if (ref && 'current' in ref) {
      ref.current?.close();
    }
  };

  const openEditor = (uri: string, type: any, name?: string, size?: string) => {
    setPendingMedia({ uri, type, name, size });
    setIsEditorVisible(true);
    if (ref && 'current' in ref) {
      ref.current?.close();
    }
  };

  const handleGalleryItemPress = async (item: GalleryItem) => {
    if (!item.uri) return;

    if (item.mediaType === 'video') {
      const uploadAsset = {
        uri: item.uri,
        type: 'video/mp4',
        name: `gallery_video_${Date.now()}.mp4`,
      };

      openEditor(item.uri, 'video', uploadAsset.name);
      const response = await uploadFiles([uploadAsset]);
      if (response.data) {
        dispatch({ type: ACTIONS.MEDIA, payload: response.data });
      }
      return;
    }

    toggleImageSelection(item.id);
  };

  const uploadSingleMedia = async (
    uri: string,
    type: 'image' | 'video' | 'file' | 'audio',
    uploadAsset: any,
    meta?: { name?: string; size?: string },
  ) => {
    openEditor(uri, type, meta?.name, meta?.size);
    const response = await uploadFiles([uploadAsset]);
    if (response.data) {
      dispatch({ type: ACTIONS.MEDIA, payload: response.data });
    }
  };

  const handleCamera = async () => {
    const result = await launchCamera({
      mediaType: 'photo',
      quality: 0.6,
      maxWidth: 1024,
      maxHeight: 1024,
    });
    if (result.assets && result.assets[0].uri) {
      openEditor(result.assets[0].uri, 'image');
      const response = await uploadFiles(result.assets);
      dispatch({ type: ACTIONS.MEDIA, payload: response.data });
    }
  };

  const handleVideo = async () => {
    const result = await launchCamera({
      mediaType: 'video',
      ...(Platform.OS === 'ios' ? { videoQuality: 'medium' } : {}),
    });
    if (result.assets && result.assets[0].uri) {
      const asset = result.assets[0];
      const uploadAsset = buildUploadAssetFromLibraryAsset(asset);
      await uploadSingleMedia(asset.uri!, 'video', uploadAsset, {
        name: uploadAsset.name,
        size: formatFileSize(asset.fileSize),
      });
    }
  };

  const handlePickVideo = async () => {
    try {
      const result = await launchImageLibrary({
        mediaType: 'video',
        selectionLimit: 1,
        ...(Platform.OS === 'ios' ? { videoQuality: 'medium' } : {}),
      });

      const asset = result.assets?.[0];
      if (!asset?.uri) return;

      const uploadAsset = buildUploadAssetFromLibraryAsset(asset);
      await uploadSingleMedia(asset.uri, 'video', uploadAsset, {
        name: uploadAsset.name,
        size: formatFileSize(asset.fileSize),
      });
    } catch (error) {
      console.error('Video library pick error:', error);
    }
  };

  const handlePickVideoFromFiles = async () => {
    try {
      const [res] = await pick({ type: VIDEO_PICKER_TYPES });
      if (!res) return;

      await uploadSingleMedia(res.uri, 'video', res, {
        name: res.name || undefined,
        size: res.size ? formatFileSize(Number(res.size)) : undefined,
      });
    } catch (_error) {
      // User cancelled picker.
    }
  };

  const handleViewLibrary = async () => {
    const result = await launchImageLibrary({
      mediaType: 'mixed',
      selectionLimit: 0,
      quality: 0.6,
      maxWidth: 1024,
      maxHeight: 1024,
      ...(Platform.OS === 'ios' ? { videoQuality: 'medium' } : {}),
    });
    if (!result.assets?.length) return;

    const videos = result.assets.filter(asset => isVideoUploadAsset(asset));
    const images = result.assets.filter(asset => isImageAsset(asset));

    if (videos.length > 0 && images.length > 0) {
      ShowNotify('Error', 'Please select either photos or videos, not both.');
      return;
    }

    if (videos.length > 0) {
      if (videos.length > 1) {
        ShowNotify('Info', 'Only one video can be sent at a time.');
      }

      const asset = videos[0];
      const uploadAsset = buildUploadAssetFromLibraryAsset(asset);
      await uploadSingleMedia(asset.uri!, 'video', uploadAsset, {
        name: uploadAsset.name,
        size: formatFileSize(asset.fileSize),
      });
      return;
    }

    const filesToUpload = images.map(asset =>
      buildUploadAssetFromLibraryAsset(asset),
    );

    const response = await uploadFiles(filesToUpload);
    if (response.data) {
      dispatch({ type: ACTIONS.MEDIA, payload: response.data });
    }

    setPendingMedia({
      uri: images.map(asset => asset.uri),
      type: 'image',
      isMultiple: images.length > 1,
    });
    setIsEditorVisible(true);
    if (ref && 'current' in ref) {
      ref.current?.close();
    }
  };

  const handleDocument = async () => {
    try {
      const [res] = await pick({ type: DOCUMENT_PICKER_TYPES });
      if (res) {
        openEditor(
          res.uri,
          'file',
          res.name || undefined,
          res.size
            ? `${(Number(res.size) / 1048576).toFixed(1)} MB`
            : undefined,
        );
        const response = await uploadFiles([res]);
        dispatch({ type: ACTIONS.MEDIA, payload: response.data });
      }
    } catch (_err) {}
  };

  const handleAudio = async () => {
    try {
      const [res] = await pick({ type: AUDIO_PICKER_TYPES });
      if (res) {
        await uploadSingleMedia(res.uri, 'audio', res, {
          name: res.name || undefined,
          size: res.size ? formatFileSize(Number(res.size)) : undefined,
        });
      }
    } catch (_err) {
      // User cancelled picker.
    }
  };

  const MenuOption = ({ label, icon, onPress, showBorder = true }: any) => (
    <TouchableOpacity
      style={[styles.menuItem, !showBorder && { borderBottomWidth: 0 }]}
      onPress={onPress}
    >
      <View style={styles.menuIconContainer}>
        <Image source={icon} style={styles.menuIcon} />
      </View>
      <AppText style={styles.menuLabel} size={15}>
        {label}
      </AppText>
    </TouchableOpacity>
  );

  return (
    <AppBottomSheet
      ref={ref}
      snapPoints={['67%']}
      backgroundStyle={styles.sheetBackground}
      paddingBottom={normalize(110)}
      onChange={index => {
        if (index >= 0) {
          ensureGalleryLoaded();
        }
      }}
    >
      <View style={styles.container}>
        <View style={styles.statsRow}>
          <View style={styles.statsTextGroup}>
            <AppText style={styles.darkText} size={15}>
              Photos & Videos
            </AppText>
            {selectedImages.size > 0 && (
              <View style={styles.selectionBadge}>
                <AppText style={styles.badgeText} size={12}>
                  {selectedImages.size}
                </AppText>
              </View>
            )}
          </View>
          <TouchableOpacity
            style={styles.viewLibraryBtn}
            onPress={async () => {
              await ensureGalleryLoaded();
              await handleViewLibrary();
            }}
          >
            <AppText size={15} style={styles.blueText} variant="medium">
              View Library
            </AppText>
          </TouchableOpacity>
        </View>

        <View style={styles.galleryWrapper}>
          <FlatList
            horizontal
            data={galleryPhotos}
            showsHorizontalScrollIndicator={false}
            keyExtractor={item => item.id}
            contentContainerStyle={styles.galleryPadding}
            renderItem={({ item }) =>
              item.isCamera ? (
                <TouchableOpacity
                  style={styles.cameraBox}
                  onPress={handleCamera}
                >
                  <Image
                    source={require('@/assets/icons/camera.png')}
                    style={styles.cameraIcon}
                  />
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  activeOpacity={0.7}
                  style={styles.galleryItem}
                  onPress={() => handleGalleryItemPress(item)}
                >
                  <Image
                    source={{ uri: item.uri }}
                    style={styles.galleryImage}
                  />
                  {item.mediaType === 'video' && (
                    <View style={styles.videoBadge}>
                      <View style={styles.videoBadgeCircle}>
                        <Ionicons
                          name="play"
                          size={14}
                          color="#fff"
                          style={styles.videoBadgeIcon}
                        />
                      </View>
                    </View>
                  )}
                  {item.mediaType !== 'video' &&
                    selectedImages.has(item.id) && (
                      <View style={styles.selectionOverlay}>
                        <View style={styles.checkmarkCircle}>
                          <Ionicons name="checkmark" size={16} color="#fff" />
                        </View>
                      </View>
                    )}
                </TouchableOpacity>
              )
            }
          />
        </View>

        <ScrollView bounces={false} contentContainerStyle={styles.menuScroll}>
          <MenuOption
            label="Record a Video Clip"
            icon={require('@/assets/icons/video.png')}
            onPress={handleVideo}
          />
          <MenuOption
            label="Select a Video"
            icon={require('@/assets/icons/video.png')}
            onPress={handlePickVideo}
          />
          <MenuOption
            label="Select Video from Files"
            icon={require('@/assets/icons/upload.png')}
            onPress={handlePickVideoFromFiles}
          />
          <MenuOption
            label="Select an Audio Clip"
            icon={require('@/assets/icons/mic.png')}
            onPress={handleAudio}
          />
          <MenuOption
            label="Upload a File"
            icon={require('@/assets/icons/upload.png')}
            onPress={handleDocument}
          />
          {/* <MenuOption label="Add a GIF" icon={require('@/assets/icons/gif.png')} /> */}
          <MenuOption
            label="Recent Files"
            icon={require('@/assets/icons/file.png')}
            showBorder={false}
            onPress={handleDocument}
          />
        </ScrollView>

        {selectedImages.size > 0 && (
          <View style={styles.confirmButtonContainer}>
            <TouchableOpacity
              style={styles.confirmButton}
              onPress={handleMultipleImagesConfirm}
            >
              <AppText style={styles.confirmButtonText} variant="medium">
                Send {selectedImages.size} Photo
                {selectedImages.size !== 1 ? 's' : ''}
              </AppText>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </AppBottomSheet>
  );
});
