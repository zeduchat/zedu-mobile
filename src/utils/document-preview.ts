import { Platform } from 'react-native';
import RNFS from 'react-native-fs';
import { decodeFileName, getFileExtension } from '@/utils/file-helpers';
import { ensureHttpsUrl } from '@/utils/link-url';

export type DocumentPreviewFile = {
  file_name?: string;
  name?: string;
  size?: number;
  file_link?: string;
  uri?: string;
  mime_type?: string;
  file_mime_type?: string;
  id?: string;
};

const DOCUMENT_URL_EXT_REGEX =
  /\.(pdf|doc|docx|xls|xlsx|csv|ppt|pptx|txt|rtf|odt|ods|odp)(?:[?#]|$)/i;

function getUrlPathname(url: string): string {
  const href = ensureHttpsUrl(url);
  // RN's URL typings are incomplete — parse path without relying on .pathname
  const withoutProtocol = href.replace(/^https?:\/\//i, '');
  const pathStart = withoutProtocol.indexOf('/');
  if (pathStart < 0) return '';
  try {
    return decodeURIComponent(
      withoutProtocol.slice(pathStart).split(/[?#]/)[0],
    );
  } catch {
    return withoutProtocol.slice(pathStart).split(/[?#]/)[0];
  }
}

/** True when a URL points at a previewable document file (not a normal webpage). */
export function isDocumentUrl(url: string): boolean {
  if (!url) return false;
  return DOCUMENT_URL_EXT_REGEX.test(getUrlPathname(url) || url);
}

/** Build a minimal file object so pasted document links open the in-app viewer. */
export function fileFromDocumentUrl(url: string): DocumentPreviewFile {
  const href = ensureHttpsUrl(url);
  const pathname = getUrlPathname(href);
  const last = pathname.split('/').filter(Boolean).pop();
  const fileName = last || 'Document';

  return {
    file_link: href,
    file_name: fileName,
    name: fileName,
  };
}

export type DocumentPreviewMode =
  | 'direct'
  | 'office-online'
  | 'google-viewer'
  | 'local';

export function getDocumentDisplayName(file: DocumentPreviewFile): string {
  return decodeFileName(file.file_name || file.name || 'Attachment');
}

export function getDocumentMimeType(
  file: DocumentPreviewFile,
): string | undefined {
  return file.mime_type || file.file_mime_type || undefined;
}

export function isPdfDocument(fileName: string, mimeType?: string): boolean {
  const ext = getFileExtension(fileName);
  const mime = (mimeType || '').toLowerCase();
  return ext === 'pdf' || mime === 'application/pdf';
}

export function isOfficeDocument(fileName: string, mimeType?: string): boolean {
  const ext = getFileExtension(fileName);
  const mime = (mimeType || '').toLowerCase();

  if (['doc', 'docx', 'xls', 'xlsx', 'csv', 'ppt', 'pptx'].includes(ext)) {
    return true;
  }

  return (
    mime.includes('word') ||
    mime.includes('excel') ||
    mime.includes('spreadsheet') ||
    mime.includes('powerpoint') ||
    mime.includes('presentation') ||
    mime === 'text/csv'
  );
}

export function isInAppPreviewSupported(
  fileName: string,
  mimeType?: string,
): boolean {
  return (
    isPdfDocument(fileName, mimeType) || isOfficeDocument(fileName, mimeType)
  );
}

export function buildOfficeOnlinePreviewUrl(fileUrl: string): string {
  return `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(
    fileUrl,
  )}`;
}

export function buildGoogleViewerPreviewUrl(fileUrl: string): string {
  return `https://docs.google.com/gviewer?embedded=true&url=${encodeURIComponent(
    fileUrl,
  )}`;
}

export function getRemoteDocumentUrl(
  file: DocumentPreviewFile,
): string | undefined {
  const url = file.file_link || file.uri;
  if (!url || (!url.startsWith('http://') && !url.startsWith('https://'))) {
    return undefined;
  }
  return url;
}

export function getInitialPreviewMode(
  file: DocumentPreviewFile,
): DocumentPreviewMode {
  const name = getDocumentDisplayName(file);
  const mimeType = getDocumentMimeType(file);
  const remoteUrl = getRemoteDocumentUrl(file);

  if (!remoteUrl) {
    return isPdfDocument(name, mimeType) ? 'local' : 'office-online';
  }

  if (isPdfDocument(name, mimeType)) {
    return 'direct';
  }

  return 'office-online';
}

export function getPreviewUri(
  file: DocumentPreviewFile,
  mode: DocumentPreviewMode,
  localUri?: string,
): string | null {
  const remoteUrl = getRemoteDocumentUrl(file);
  const name = getDocumentDisplayName(file);
  const mimeType = getDocumentMimeType(file);

  switch (mode) {
    case 'direct':
      return remoteUrl || null;
    case 'office-online':
      return remoteUrl ? buildOfficeOnlinePreviewUrl(remoteUrl) : null;
    case 'google-viewer':
      return remoteUrl ? buildGoogleViewerPreviewUrl(remoteUrl) : null;
    case 'local':
      if (!localUri) return null;
      if (Platform.OS === 'android') {
        return localUri.startsWith('file://') ? localUri : `file://${localUri}`;
      }
      return isPdfDocument(name, mimeType) ? localUri : null;
    default:
      return null;
  }
}

export function getNextPreviewMode(
  current: DocumentPreviewMode,
  file: DocumentPreviewFile,
): DocumentPreviewMode | null {
  const name = getDocumentDisplayName(file);
  const mimeType = getDocumentMimeType(file);
  const hasRemote = Boolean(getRemoteDocumentUrl(file));
  const isPdf = isPdfDocument(name, mimeType);

  if (current === 'direct' && hasRemote) {
    return 'office-online';
  }

  if (current === 'office-online' && hasRemote) {
    return 'google-viewer';
  }

  if ((current === 'google-viewer' || current === 'office-online') && isPdf) {
    return 'local';
  }

  return null;
}

export async function ensureCachedDocument(
  file: DocumentPreviewFile,
): Promise<string> {
  const remoteUrl = file.file_link || file.uri;
  if (!remoteUrl) {
    throw new Error('Missing file url');
  }

  const displayName = getDocumentDisplayName(file);
  const safeName = displayName.replace(/[^a-zA-Z0-9._-]/g, '_');
  const cacheId = file.id || Date.now();
  const localPath = `${RNFS.CachesDirectoryPath}/doc_preview_${cacheId}_${safeName}`;

  const exists = await RNFS.exists(localPath);
  if (exists) {
    return localPath;
  }

  if (remoteUrl.startsWith('file://') || remoteUrl.startsWith('/')) {
    const sourcePath = remoteUrl.replace('file://', '');
    await RNFS.copyFile(sourcePath, localPath);
    return localPath;
  }

  await RNFS.downloadFile({ fromUrl: remoteUrl, toFile: localPath }).promise;
  return localPath;
}
