import { Image, Video, getFileSize } from 'react-native-compressor';

const VIDEO_EXTENSIONS = ['mp4', 'mov', 'm4v', 'avi', 'mkv', 'webm'];
const IMAGE_EXTENSIONS = ['jpg', 'jpeg', 'png', 'webp', 'heic', 'heif', 'gif'];
const MIN_IMAGE_SIZE_FOR_COMPRESS_BYTES = 150 * 1024;

type UploadAsset = {
  uri?: string;
  type?: string;
  name?: string;
  fileName?: string;
};

type ImageCompressOptions = {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
};

const DEFAULT_IMAGE_COMPRESS_OPTIONS: ImageCompressOptions = {
  maxWidth: 2048,
  maxHeight: 2048,
  quality: 0.75,
};

export const isImageUploadAsset = (asset: UploadAsset): boolean => {
  const mime = (asset.type || '').toLowerCase();
  if (mime.startsWith('image/')) return true;

  const fileName =
    asset.name || asset.fileName || asset.uri?.split('/').pop() || '';
  const ext = fileName.split('.').pop()?.toLowerCase() || '';
  return IMAGE_EXTENSIONS.includes(ext);
};

export const isVideoUploadAsset = (asset: UploadAsset): boolean => {
  const mime = (asset.type || '').toLowerCase();
  if (mime.startsWith('video/')) return true;

  const fileName =
    asset.name || asset.fileName || asset.uri?.split('/').pop() || '';
  const ext = fileName.split('.').pop()?.toLowerCase() || '';
  return VIDEO_EXTENSIONS.includes(ext);
};

const shouldSkipImageCompression = async (uri: string): Promise<boolean> => {
  try {
    const sizeStr = await getFileSize(uri);
    const sizeBytes = parseInt(sizeStr, 10);
    if (
      !Number.isNaN(sizeBytes) &&
      sizeBytes < MIN_IMAGE_SIZE_FOR_COMPRESS_BYTES
    ) {
      return true;
    }
  } catch {
    // If size lookup fails, proceed with compression.
  }
  return false;
};

export const compressImageForUpload = async (
  uri: string,
  options: ImageCompressOptions = DEFAULT_IMAGE_COMPRESS_OPTIONS,
): Promise<string> => {
  if (!uri) return uri;

  try {
    if (await shouldSkipImageCompression(uri)) {
      return uri;
    }

    const compressedUri = await Image.compress(uri, {
      compressionMethod: 'auto',
      maxWidth: options.maxWidth ?? DEFAULT_IMAGE_COMPRESS_OPTIONS.maxWidth,
      maxHeight: options.maxHeight ?? DEFAULT_IMAGE_COMPRESS_OPTIONS.maxHeight,
      quality: options.quality ?? DEFAULT_IMAGE_COMPRESS_OPTIONS.quality,
      output: 'jpg',
    });

    return compressedUri || uri;
  } catch (error) {
    console.warn('Image compression failed, uploading original file:', error);
    return uri;
  }
};

export const compressVideoForUpload = async (uri: string): Promise<string> => {
  if (!uri) return uri;

  try {
    const compressedUri = await Video.compress(uri, {
      compressionMethod: 'auto',
      maxSize: 1024,
      minimumFileSizeForCompress: 0.5,
    });

    return compressedUri || uri;
  } catch (error) {
    console.warn('Video compression failed, uploading original file:', error);
    return uri;
  }
};

export const prepareAssetForUpload = async (asset: UploadAsset) => {
  if (!asset.uri) {
    return asset;
  }

  if (isVideoUploadAsset(asset)) {
    const compressedUri = await compressVideoForUpload(asset.uri);
    const fileName =
      asset.name || asset.fileName || asset.uri.split('/').pop() || 'video.mp4';

    return {
      ...asset,
      uri: compressedUri,
      type: asset.type?.startsWith('video/') ? asset.type : 'video/mp4',
      name: fileName,
    };
  }

  if (isImageUploadAsset(asset)) {
    const compressedUri = await compressImageForUpload(asset.uri);
    const fileName =
      asset.name ||
      asset.fileName ||
      asset.uri.split('/').pop() ||
      'upload.jpg';

    return {
      ...asset,
      uri: compressedUri,
      type: 'image/jpeg',
      name: fileName.replace(/\.(png|webp|heic|heif|gif)$/i, '.jpg'),
    };
  }

  return asset;
};
