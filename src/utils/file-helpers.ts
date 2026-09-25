import { Folder, Media } from '@/types/thread';
import { isVoiceMessageMedia } from '@/utils/voice-message';

export type FileCategory =
  | 'all'
  | 'documents'
  | 'spreadsheets'
  | 'images'
  | 'videos'
  | 'music';
export type FileMode = 'all' | 'my' | 'shared' | 'deleted';
export type FileSortOption =
  | 'newest'
  | 'oldest'
  | 'name_asc'
  | 'name_desc'
  | 'size_desc'
  | 'size_asc';
export type DateModifiedFilter =
  | 'any'
  | 'today'
  | 'last_7_days'
  | 'last_30_days'
  | 'this_year'
  | 'last_year';

export const FILE_CATEGORY_OPTIONS: { key: FileCategory; label: string }[] = [
  { key: 'documents', label: 'Documents' },
  { key: 'images', label: 'Images' },
  { key: 'videos', label: 'Videos' },
  { key: 'music', label: 'Music' },
];

export const FILE_MODE_OPTIONS: { key: FileMode; label: string }[] = [
  { key: 'all', label: 'All files' },
  { key: 'my', label: 'My files' },
  { key: 'shared', label: 'Shared with me' },
  { key: 'deleted', label: 'Deleted files' },
];

export const SORT_OPTIONS: { key: FileSortOption; label: string }[] = [
  { key: 'newest', label: 'Newest first' },
  { key: 'oldest', label: 'Oldest first' },
  { key: 'name_asc', label: 'Name (A-Z)' },
  { key: 'name_desc', label: 'Name (Z-A)' },
  { key: 'size_desc', label: 'Largest first' },
  { key: 'size_asc', label: 'Smallest first' },
];

export const DATE_MODIFIED_OPTIONS: {
  key: DateModifiedFilter;
  label: string;
}[] = [
  { key: 'any', label: 'Any time' },
  { key: 'today', label: 'Today' },
  { key: 'last_7_days', label: 'Last 7 days' },
  { key: 'last_30_days', label: 'Last 30 days' },
  { key: 'this_year', label: 'This year' },
  { key: 'last_year', label: 'Last year' },
];

export const decodeFileName = (name: string): string => {
  if (!name) return 'Untitled';
  try {
    return decodeURIComponent(name.replace(/\+/g, ' '));
  } catch {
    return name;
  }
};

export const getFileExtension = (
  fileName: string,
  fileType?: string,
): string => {
  const fromName = fileName?.split('.').pop()?.toLowerCase() || '';
  if (fromName) return fromName;
  return (fileType || '').toLowerCase();
};

export const formatFileSize = (bytes: number): string => {
  if (!bytes || bytes < 0) return '0 B';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
};

export const getFileTheme = (fileName: string, fileType?: string) => {
  const ext = getFileExtension(fileName, fileType);
  if (ext === 'pdf') {
    return {
      color: '#E64A19',
      label: 'PDF',
      icon: 'document-text' as const,
      previewBackground: '#FBE9E7',
      previewAccent: '#FFCCBC',
      kind: 'document' as const,
      kindLabel: 'PDF',
    };
  }
  if (ext === 'doc' || ext === 'docx') {
    return {
      color: '#2B579A',
      label: 'DOC',
      icon: 'document-text' as const,
      previewBackground: '#E8EAF6',
      previewAccent: '#C5CAE9',
      kind: 'document' as const,
      kindLabel: 'Word document',
    };
  }
  if (ext === 'xls' || ext === 'xlsx' || ext === 'csv') {
    return {
      color: '#217346',
      label: ext === 'csv' ? 'CSV' : 'XLS',
      icon: 'grid' as const,
      previewBackground: '#E8F5E9',
      previewAccent: '#C8E6C9',
      kind: 'spreadsheet' as const,
      kindLabel: 'Spreadsheet',
    };
  }
  if (ext === 'ppt' || ext === 'pptx') {
    return {
      color: '#D24726',
      label: 'PPT',
      icon: 'easel' as const,
      previewBackground: '#FBE9E7',
      previewAccent: '#FFCCBC',
      kind: 'presentation' as const,
      kindLabel: 'Presentation',
    };
  }
  if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'heic'].includes(ext)) {
    return {
      color: '#6C47FF',
      label: 'IMG',
      icon: 'image' as const,
      previewBackground: '#EDE7F6',
      previewAccent: '#D1C4E9',
      kind: 'image' as const,
      kindLabel: 'Image',
    };
  }
  if (['mp4', 'mov', 'm4v', 'avi', 'mkv', 'webm'].includes(ext)) {
    return {
      color: '#1E88E5',
      label: 'VID',
      icon: 'videocam' as const,
      previewBackground: '#E3F2FD',
      previewAccent: '#BBDEFB',
      kind: 'video' as const,
      kindLabel: 'Video',
    };
  }
  if (['mp3', 'wav', 'm4a', 'ogg', 'aac'].includes(ext)) {
    return {
      color: '#8E24AA',
      label: 'AUD',
      icon: 'musical-notes' as const,
      previewBackground: '#F3E5F5',
      previewAccent: '#E1BEE7',
      kind: 'audio' as const,
      kindLabel: 'Audio',
    };
  }
  if (ext === 'md' || ext === 'mdx') {
    return {
      color: '#083FA1',
      label: 'MD',
      icon: 'logo-markdown' as const,
      previewBackground: '#E8EAF6',
      previewAccent: '#C5CAE9',
      kind: 'document' as const,
      kindLabel: 'Markdown',
    };
  }
  if (ext === 'py') {
    return {
      color: '#3776AB',
      label: 'PY',
      icon: 'logo-python' as const,
      previewBackground: '#E3F2FD',
      previewAccent: '#BBDEFB',
      kind: 'file' as const,
      kindLabel: 'Python',
    };
  }
  if (['js', 'jsx', 'mjs', 'cjs'].includes(ext)) {
    return {
      color: '#F0DB4F',
      label: 'JS',
      icon: 'logo-javascript' as const,
      previewBackground: '#FFFDE7',
      previewAccent: '#FFF9C4',
      kind: 'file' as const,
      kindLabel: 'JavaScript',
    };
  }
  if (['ts', 'tsx'].includes(ext)) {
    return {
      color: '#3178C6',
      label: 'TS',
      icon: 'code-slash' as const,
      previewBackground: '#E3F2FD',
      previewAccent: '#BBDEFB',
      kind: 'file' as const,
      kindLabel: 'TypeScript',
    };
  }
  if (['html', 'htm'].includes(ext)) {
    return {
      color: '#E34F26',
      label: 'HTML',
      icon: 'logo-html5' as const,
      previewBackground: '#FBE9E7',
      previewAccent: '#FFCCBC',
      kind: 'file' as const,
      kindLabel: 'HTML',
    };
  }
  if (['css', 'scss', 'sass', 'less'].includes(ext)) {
    return {
      color: '#1572B6',
      label: 'CSS',
      icon: 'logo-css3' as const,
      previewBackground: '#E3F2FD',
      previewAccent: '#BBDEFB',
      kind: 'file' as const,
      kindLabel: 'CSS',
    };
  }
  if (ext === 'json') {
    return {
      color: '#F59E0B',
      label: 'JSON',
      icon: 'code-working' as const,
      previewBackground: '#FFF8E1',
      previewAccent: '#FFECB3',
      kind: 'file' as const,
      kindLabel: 'JSON',
    };
  }
  if (['yaml', 'yml', 'toml', 'xml'].includes(ext)) {
    return {
      color: '#6B7280',
      label: ext.toUpperCase(),
      icon: 'settings-outline' as const,
      previewBackground: '#F3F4F6',
      previewAccent: '#E5E7EB',
      kind: 'file' as const,
      kindLabel: 'Config',
    };
  }
  if (['zip', 'rar', '7z', 'tar', 'gz'].includes(ext)) {
    return {
      color: '#795548',
      label: ext.toUpperCase(),
      icon: 'archive-outline' as const,
      previewBackground: '#EFEBE9',
      previewAccent: '#D7CCC8',
      kind: 'file' as const,
      kindLabel: 'Archive',
    };
  }
  if (['txt', 'rtf'].includes(ext)) {
    return {
      color: '#4B5563',
      label: ext.toUpperCase(),
      icon: 'reader-outline' as const,
      previewBackground: '#F3F4F6',
      previewAccent: '#E5E7EB',
      kind: 'document' as const,
      kindLabel: 'Text',
    };
  }
  if (
    [
      'java',
      'kt',
      'swift',
      'go',
      'rs',
      'rb',
      'c',
      'cpp',
      'h',
      'cs',
      'php',
      'sh',
      'bash',
      'sql',
    ].includes(ext)
  ) {
    return {
      color: '#607D8B',
      label: ext.toUpperCase(),
      icon: 'code-slash' as const,
      previewBackground: '#ECEFF1',
      previewAccent: '#CFD8DC',
      kind: 'file' as const,
      kindLabel: 'Code',
    };
  }
  return {
    color: '#607D8B',
    label: ext.toUpperCase() || 'FILE',
    icon: 'document' as const,
    previewBackground: '#ECEFF1',
    previewAccent: '#CFD8DC',
    kind: 'file' as const,
    kindLabel: 'File',
  };
};

export const isSpreadsheetFile = (
  file: Pick<Media, 'file_name' | 'file_type' | 'mime_type'>,
): boolean => {
  const ext = getFileExtension(file.file_name, file.file_type);
  const mime = (file.mime_type || '').toLowerCase();
  if (['xls', 'xlsx', 'csv'].includes(ext)) return true;
  return (
    mime.includes('spreadsheet') ||
    mime.includes('excel') ||
    mime === 'text/csv'
  );
};

export const isPresentationFile = (
  file: Pick<Media, 'file_name' | 'file_type' | 'mime_type'>,
): boolean => {
  const ext = getFileExtension(file.file_name, file.file_type);
  const mime = (file.mime_type || '').toLowerCase();
  if (['ppt', 'pptx'].includes(ext)) return true;
  return mime.includes('presentation') || mime.includes('powerpoint');
};

export const isOfficeAttachmentFile = (
  file: Pick<Media, 'file_name' | 'file_type' | 'mime_type'>,
): boolean =>
  isDocumentFile(file) || isSpreadsheetFile(file) || isPresentationFile(file);

export const isAudioFile = (
  file: Pick<Media, 'file_name' | 'file_type' | 'mime_type'>,
): boolean => {
  if (isVoiceMessageMedia(file)) return true;
  const ext = getFileExtension(file.file_name, file.file_type);
  const mime = (file.mime_type || '').toLowerCase();
  const audioExtensions = ['wav', 'mp3', 'm4a', 'ogg', 'aac'];
  if (audioExtensions.includes(ext) && !['mp4', 'mov'].includes(ext))
    return true;
  return mime.startsWith('audio/');
};

export const isVideoFile = (
  file: Pick<Media, 'file_name' | 'file_type' | 'mime_type'>,
): boolean => {
  if (isVoiceMessageMedia(file)) return false;
  const ext = getFileExtension(file.file_name, file.file_type);
  const mime = (file.mime_type || '').toLowerCase();
  const videoExtensions = ['mp4', 'mov', 'm4v', 'avi', 'mkv', 'webm'];
  if (videoExtensions.includes(ext)) return true;
  if (mime.startsWith('video/')) return true;
  if (mime === 'application/octet-stream' && ext === 'mov') return true;
  return false;
};

export const isImageFile = (
  file: Pick<Media, 'file_name' | 'file_type' | 'mime_type'>,
): boolean => {
  const ext = getFileExtension(file.file_name, file.file_type);
  const mime = (file.mime_type || '').toLowerCase();
  return (
    ['jpg', 'jpeg', 'png', 'gif', 'webp', 'heic'].includes(ext) ||
    mime.startsWith('image/')
  );
};

export const isDocumentFile = (
  file: Pick<Media, 'file_name' | 'file_type' | 'mime_type'>,
): boolean => {
  const ext = getFileExtension(file.file_name, file.file_type);
  return ['pdf', 'doc', 'docx', 'txt', 'rtf'].includes(ext);
};

export const getFileCategory = (file: Media): FileCategory | null => {
  if (isImageFile(file)) return 'images';
  if (isVideoFile(file)) return 'videos';
  if (isAudioFile(file)) return 'music';
  const ext = getFileExtension(file.file_name, file.file_type);
  if (['pdf', 'doc', 'docx', 'txt', 'rtf'].includes(ext)) return 'documents';
  if (['xls', 'xlsx', 'csv'].includes(ext)) return 'spreadsheets';
  if (['ppt', 'pptx'].includes(ext)) return 'documents';
  return null;
};

export const matchesCategory = (
  file: Media,
  category: FileCategory,
): boolean => {
  if (category === 'all') return true;
  return getFileCategory(file) === category;
};

export const matchesDateFilter = (
  file: Media,
  filter: DateModifiedFilter,
): boolean => {
  if (filter === 'any') return true;
  const updated = new Date(file.updated_at || file.created_at).getTime();
  const now = Date.now();
  const day = 24 * 60 * 60 * 1000;
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const startOfYear = new Date(new Date().getFullYear(), 0, 1);
  const startOfLastYear = new Date(new Date().getFullYear() - 1, 0, 1);
  const endOfLastYear = new Date(new Date().getFullYear(), 0, 1);

  if (filter === 'today') return updated >= startOfToday.getTime();
  if (filter === 'last_7_days') return now - updated <= 7 * day;
  if (filter === 'last_30_days') return now - updated <= 30 * day;
  if (filter === 'this_year') return updated >= startOfYear.getTime();
  if (filter === 'last_year') {
    return (
      updated >= startOfLastYear.getTime() && updated < endOfLastYear.getTime()
    );
  }
  return true;
};

export const matchesFolderDateFilter = (
  folder: Folder,
  filter: DateModifiedFilter,
): boolean => {
  if (filter === 'any') return true;
  const updated = new Date(folder.updated_at || folder.created_at).getTime();
  const now = Date.now();
  const day = 24 * 60 * 60 * 1000;
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const startOfYear = new Date(new Date().getFullYear(), 0, 1);
  const startOfLastYear = new Date(new Date().getFullYear() - 1, 0, 1);
  const endOfLastYear = new Date(new Date().getFullYear(), 0, 1);

  if (filter === 'today') return updated >= startOfToday.getTime();
  if (filter === 'last_7_days') return now - updated <= 7 * day;
  if (filter === 'last_30_days') return now - updated <= 30 * day;
  if (filter === 'this_year') return updated >= startOfYear.getTime();
  if (filter === 'last_year') {
    return (
      updated >= startOfLastYear.getTime() && updated < endOfLastYear.getTime()
    );
  }
  return true;
};

export const formatItemCount = (count: number): string => {
  if (!count) return '0 items';
  return count === 1 ? '1 item' : `${count} items`;
};

export const sortFolders = (
  folders: Folder[],
  sort: FileSortOption,
): Folder[] => {
  const sorted = [...folders];
  sorted.sort((a, b) => {
    const nameA = a.name.toLowerCase();
    const nameB = b.name.toLowerCase();
    switch (sort) {
      case 'oldest':
        return (
          new Date(a.updated_at).getTime() - new Date(b.updated_at).getTime()
        );
      case 'name_asc':
        return nameA.localeCompare(nameB);
      case 'name_desc':
        return nameB.localeCompare(nameA);
      case 'size_desc':
        return b.item_count - a.item_count;
      case 'size_asc':
        return a.item_count - b.item_count;
      case 'newest':
      default:
        return (
          new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
        );
    }
  });
  return sorted;
};

export const sortFiles = (files: Media[], sort: FileSortOption): Media[] => {
  const sorted = [...files];
  sorted.sort((a, b) => {
    const nameA = decodeFileName(a.file_name).toLowerCase();
    const nameB = decodeFileName(b.file_name).toLowerCase();
    switch (sort) {
      case 'oldest':
        return (
          new Date(a.updated_at).getTime() - new Date(b.updated_at).getTime()
        );
      case 'name_asc':
        return nameA.localeCompare(nameB);
      case 'name_desc':
        return nameB.localeCompare(nameA);
      case 'size_desc':
        return b.size - a.size;
      case 'size_asc':
        return a.size - b.size;
      case 'newest':
      default:
        return (
          new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
        );
    }
  });
  return sorted;
};

export const getInitials = (name: string): string => {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
};

export const capitalizeAccess = (access: string): string => {
  if (!access) return 'Private';
  return access.charAt(0).toUpperCase() + access.slice(1);
};
