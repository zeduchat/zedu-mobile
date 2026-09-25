import { Platform } from 'react-native';
import RNFS from 'react-native-fs';
import { Media } from '@/types/thread';

export type VoiceMedia = Pick<
  Media,
  'id' | 'file_name' | 'file_type' | 'mime_type' | 'file_link'
>;

/** Fields used to detect voice messages; id/file_link optional for classification helpers */
export type VoiceMediaFields = Pick<
  Media,
  'file_name' | 'file_type' | 'mime_type'
> &
  Partial<Pick<Media, 'id' | 'file_link'>>;

export type VoicePlaybackEngine = 'native' | 'webview';

const VOICE_NAME_PATTERN = /voice|audio/i;

export function isWebRecordedVoice(media: VoiceMediaFields): boolean {
  const mime = (media.mime_type || '').toLowerCase();
  const type = (media.file_type || '').toLowerCase();
  const name = (media.file_name || '').toLowerCase();

  if (mime.includes('webm')) {
    return true;
  }

  if (type === 'webm') {
    return true;
  }

  // Web client records WebM but uploads with a .wav extension.
  if (name.startsWith('voice_message_') && type === 'wav') {
    return true;
  }

  return false;
}

export function isVoiceMessageMedia(media?: VoiceMediaFields | null): boolean {
  if (!media) {
    return false;
  }

  const mime = (
    media.mime_type ||
    (media as any).file_mime_type ||
    ''
  ).toLowerCase();
  const type = (media.file_type || '').toLowerCase();
  const name = (media.file_name || '').toLowerCase();

  if (isWebRecordedVoice(media)) {
    return true;
  }

  if (['wav', 'mp3', 'm4a', 'ogg', 'aac', 'opus', 'weba'].includes(type)) {
    return true;
  }

  if (mime.startsWith('audio/')) {
    return true;
  }

  // Mobile voice notes are often AAC in an m4a container with video/mp4 mime.
  if (
    VOICE_NAME_PATTERN.test(name) &&
    (type === 'm4a' ||
      type === 'mp4' ||
      mime === 'video/mp4' ||
      mime === 'audio/mp4')
  ) {
    return true;
  }

  return false;
}

export function getVoicePlaybackExtension(media: VoiceMedia): string {
  if (isWebRecordedVoice(media)) {
    return 'webm';
  }

  const type = (media.file_type || '').toLowerCase();
  if (type) {
    return type;
  }

  const mime = (media.mime_type || '').toLowerCase();
  if (mime.includes('webm')) return 'webm';
  if (mime.includes('mp4')) return 'm4a';
  if (mime.includes('mpeg')) return 'mp3';
  if (mime.includes('wav')) return 'wav';
  if (mime.includes('ogg')) return 'ogg';

  return 'm4a';
}

export function getVoicePlaybackEngine(media: VoiceMedia): VoicePlaybackEngine {
  if (isWebRecordedVoice(media)) {
    // iOS AVPlayer cannot decode WebM; use a WebView HTML5 audio engine instead.
    return Platform.OS === 'ios' ? 'webview' : 'native';
  }

  return 'native';
}

export function toFileUri(localPath: string): string {
  return localPath.startsWith('file://') ? localPath : `file://${localPath}`;
}

export async function ensureCachedVoiceAudio(
  media: VoiceMedia,
): Promise<string> {
  const remoteUrl = media.file_link;
  if (!remoteUrl) {
    throw new Error('Missing voice message url');
  }

  const ext = getVoicePlaybackExtension(media);
  const cacheId = media.id || 'voice';
  const localPath = `${RNFS.CachesDirectoryPath}/voice_${cacheId}.${ext}`;

  if (await RNFS.exists(localPath)) {
    return localPath;
  }

  await RNFS.downloadFile({ fromUrl: remoteUrl, toFile: localPath }).promise;
  return localPath;
}

export function buildVoiceMediaFromUrl(
  audioUrl: string,
  item?: { id?: string },
): VoiceMedia {
  const fileName = audioUrl.split('?')[0].split('/').pop() || 'voice.m4a';
  const fileType = fileName.split('.').pop() || 'm4a';

  return {
    id: item?.id ?? fileName,
    file_link: audioUrl,
    file_name: fileName,
    file_type: fileType,
    mime_type: `audio/${fileType}`,
  };
}
