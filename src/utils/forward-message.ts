import { ACTIONS } from '@/store/types';
import { PostRequest } from '@/utils/requests';
import { buildMessageHtml, getPlainMessageText } from '@/utils/message-text';
import { ThreadChatType } from '@/utils/thread-message';

export interface ForwardedMessageBlockData {
  senderName: string;
  senderAvatar?: string;
  message: string;
  media: any[];
  sourceChannelName: string;
  sourceIsPrivate?: boolean;
  createdAt?: string;
}

export interface ForwardSourceContext {
  threadId: string;
  channelId: string;
  channelName?: string;
  isPrivate?: boolean;
  sourceType: ThreadChatType;
}

export interface ForwardMessagePreview {
  senderName: string;
  senderAvatar?: string;
  message: string;
  media: any[];
  createdAt?: string;
  hasText: boolean;
  previewImageUrl?: string;
  fileAttachment?: {
    fileName: string;
    label: string;
    color: string;
  };
}

const IMAGE_TYPES = new Set([
  'jpg',
  'jpeg',
  'png',
  'gif',
  'webp',
  'heic',
  'image',
]);

const forwardSnapshotByThreadId = new Map<string, ForwardedMessageBlockData>();
const forwardSnapshotBySourceRef = new Map<string, ForwardedMessageBlockData>();

function rememberForwardSnapshot({
  destinationChannelId,
  sourceThreadId,
  targetThreadId,
  snapshot,
}: {
  destinationChannelId: string;
  sourceThreadId: string;
  targetThreadId?: string;
  snapshot: ForwardedMessageBlockData;
}) {
  forwardSnapshotBySourceRef.set(
    `${destinationChannelId}:${sourceThreadId}`,
    snapshot,
  );

  if (targetThreadId) {
    forwardSnapshotByThreadId.set(targetThreadId, snapshot);
  }
}

function getMessageChannelId(item: any): string {
  return String(item?.channels_id || item?.channel_id || '');
}

function getReferencedThreadId(item: any): string {
  return String(
    item?.referenced_thread_id ||
      item?.forwarded_thread_id ||
      item?.source_thread_id ||
      item?.forwarded_from_thread_id ||
      '',
  );
}

function lookupForwardSnapshot(item: any): ForwardedMessageBlockData | null {
  const threadId = item?.thread_id;
  if (threadId && forwardSnapshotByThreadId.has(threadId)) {
    return forwardSnapshotByThreadId.get(threadId)!;
  }

  const refId = getReferencedThreadId(item);
  const channelId = getMessageChannelId(item);

  if (refId && channelId) {
    const key = `${channelId}:${refId}`;
    if (forwardSnapshotBySourceRef.has(key)) {
      return forwardSnapshotBySourceRef.get(key)!;
    }
  }

  return null;
}

function normalizeMessageItem(item: any) {
  if (!item) return item;

  if (item.type === 'message' && item.data && typeof item.data === 'object') {
    return { ...item.data, type: item.type };
  }

  return item;
}

export function buildForwardSnapshot(
  originalItem: any,
  source: ForwardSourceContext,
  media?: any[],
): ForwardedMessageBlockData {
  const preview = getForwardMessagePreview(originalItem);

  return {
    senderName: preview.senderName,
    senderAvatar: preview.senderAvatar,
    message: originalItem?.message || preview.message,
    media: media || preview.media || [],
    sourceChannelName: source.channelName || 'conversation',
    sourceIsPrivate: source.isPrivate,
    createdAt: originalItem?.created_at || preview.createdAt,
  };
}

function buildReferencedThreadObject(
  originalItem: any,
  source: ForwardSourceContext,
  media?: any[],
) {
  const preview = originalItem ? getForwardMessagePreview(originalItem) : null;

  return {
    thread_id: source.threadId,
    channels_id: source.channelId,
    channel_id: source.channelId,
    channel_name: source.channelName,
    is_private: source.isPrivate,
    username: originalItem?.username,
    full_name: originalItem?.full_name || preview?.senderName,
    avatar_url: originalItem?.avatar_url || preview?.senderAvatar,
    default_avatar_url: originalItem?.default_avatar_url,
    message: originalItem?.message,
    media: media || preview?.media || [],
    created_at: originalItem?.created_at,
  };
}

function getMediaType(mediaItem: any): string {
  return String(mediaItem?.file_type || mediaItem?.type || '').toLowerCase();
}

function isImageMedia(mediaItem: any): boolean {
  const type = getMediaType(mediaItem);
  const mimeType = String(
    mediaItem?.mime_type || mediaItem?.file_mime_type || '',
  ).toLowerCase();
  return IMAGE_TYPES.has(type) || mimeType.startsWith('image/');
}

function getFileTheme(fileName: string) {
  const ext = fileName?.split('.').pop()?.toLowerCase();
  if (ext === 'pdf') return { color: '#FF5722', label: 'PDF' };
  if (ext === 'doc' || ext === 'docx')
    return { color: '#2B579A', label: 'DOC' };
  if (ext === 'xls' || ext === 'xlsx')
    return { color: '#217346', label: 'XLS' };
  return { color: '#607D8B', label: 'FILE' };
}

export function getForwardMessagePreview(
  item: any,
  currentUser?: any,
): ForwardMessagePreview {
  if (!item) {
    return {
      senderName: 'Unknown',
      message: '',
      media: [],
      hasText: false,
    };
  }

  const isCurrentUser = Boolean(
    currentUser &&
      (String(item.user_id) === String(currentUser.user_id) ||
        String(item.user_id) === String(currentUser.id)),
  );

  const senderName =
    item.full_name ||
    item.username ||
    item.name ||
    item.sender?.full_name ||
    item.sender?.username ||
    item.sender_name ||
    item.email ||
    (isCurrentUser
      ? currentUser.full_name || currentUser.username || 'You'
      : '');

  const senderAvatar =
    item.avatar_url ||
    item.default_avatar_url ||
    item.sender?.avatar_url ||
    item.sender?.default_avatar_url ||
    (isCurrentUser
      ? currentUser.avatar_url || currentUser.default_avatar_url
      : undefined);

  const message = item.message || '';
  const plainText = getPlainMessageText(message);
  const hasText = Boolean(plainText.trim());
  const media = Array.isArray(item.media) ? item.media : [];
  const previewImage = media.find((mediaItem: any) => isImageMedia(mediaItem));
  const fileMedia = media.find(
    (mediaItem: any) => mediaItem && !isImageMedia(mediaItem),
  );

  return {
    senderName: senderName?.trim() || 'Unknown',
    senderAvatar,
    message,
    media,
    createdAt: item.created_at,
    hasText,
    previewImageUrl: previewImage?.file_link,
    fileAttachment: fileMedia?.file_name
      ? {
          fileName: fileMedia.file_name,
          ...getFileTheme(fileMedia.file_name),
        }
      : undefined,
  };
}

export type ForwardDestinationType = 'channel' | 'dm' | 'group_dm';

export interface ForwardDestination {
  type: ForwardDestinationType;
  id: string;
  channelId: string;
  label: string;
  subtitle?: string;
  avatarUrl?: string;
  isPrivate?: boolean;
  online?: boolean;
}

export function getForwardMessageSendUrl(
  destination: ForwardDestination,
): string {
  switch (destination.type) {
    case 'channel':
      return `/threads/${destination.channelId}`;
    case 'group_dm':
      return `/group-dms/channels/${destination.channelId}/threads`;
    default:
      return `/dms/channels/${destination.channelId}/threads`;
  }
}

export function getForwardMessageCallbackAction(
  destination: ForwardDestination,
) {
  return destination.type === 'channel'
    ? ACTIONS.CHANNEL_CALLBACK
    : ACTIONS.CALLBACK;
}

function extractForwardNested(item: any) {
  return (
    item?.referenced_thread ||
    item?.forwarded_thread ||
    item?.forwarded_message ||
    item?.forwarded_from ||
    item?.shared_thread ||
    item?.shared_message ||
    item?.quoted_message ||
    item?.parent_thread ||
    item?.referenced_message ||
    item?.thread_reference ||
    item?.original_thread ||
    null
  );
}

function resolveSenderName(source: any, fallback = 'Unknown') {
  return (
    source?.full_name ||
    source?.username ||
    source?.name ||
    source?.sender?.full_name ||
    source?.sender?.username ||
    fallback
  ).trim();
}

export function getForwardedMessageFromItem(
  item: any,
): ForwardedMessageBlockData | null {
  if (!item) return null;

  const normalizedItem = normalizeMessageItem(item);
  const nested = extractForwardNested(normalizedItem);

  if (nested) {
    const source = nested?.thread || nested?.message || nested;

    return {
      senderName: resolveSenderName(source),
      senderAvatar:
        source?.avatar_url ||
        source?.default_avatar_url ||
        source?.sender?.avatar_url,
      message: source?.message || '',
      media: Array.isArray(source?.media) ? source.media : [],
      sourceChannelName:
        source?.channel_name ||
        nested?.channel_name ||
        normalizedItem?.source_channel_name ||
        normalizedItem?.channel_name ||
        'conversation',
      sourceIsPrivate:
        source?.is_private ??
        nested?.is_private ??
        normalizedItem?.source_channel_is_private,
      createdAt: source?.created_at || nested?.created_at,
    };
  }

  if (
    getReferencedThreadId(normalizedItem) ||
    normalizedItem?.type === 'forward' ||
    normalizedItem?.is_forwarded
  ) {
    const source =
      normalizedItem?.referenced_thread ||
      normalizedItem?.forwarded_thread ||
      normalizedItem?.original_thread ||
      null;

    if (source) {
      return {
        senderName: resolveSenderName(source),
        senderAvatar: source?.avatar_url || source?.default_avatar_url,
        message: source?.message || '',
        media: Array.isArray(source?.media) ? source.media : [],
        sourceChannelName:
          source?.channel_name ||
          normalizedItem?.source_channel_name ||
          normalizedItem?.channel_name ||
          'conversation',
        sourceIsPrivate:
          source?.is_private ?? normalizedItem?.source_channel_is_private,
        createdAt: source?.created_at,
      };
    }

    const cached = lookupForwardSnapshot(normalizedItem);
    if (cached) {
      return cached;
    }
  }

  return lookupForwardSnapshot(normalizedItem);
}

export function enrichForwardedMessageIfNeeded(item: any) {
  if (!item) return item;

  const normalizedItem = normalizeMessageItem(item);
  if (extractForwardNested(normalizedItem)) {
    return normalizedItem;
  }

  const cached = lookupForwardSnapshot(normalizedItem);
  if (!cached) {
    return normalizedItem;
  }

  const referencedThread = {
    full_name: cached.senderName,
    username: cached.senderName,
    avatar_url: cached.senderAvatar,
    message: cached.message,
    media: cached.media,
    channel_name: cached.sourceChannelName,
    is_private: cached.sourceIsPrivate,
    created_at: cached.createdAt,
  };

  return {
    ...normalizedItem,
    referenced_thread: referencedThread,
    forwarded_thread: referencedThread,
    source_channel_name:
      normalizedItem.source_channel_name || cached.sourceChannelName,
    source_channel_is_private:
      normalizedItem.source_channel_is_private ?? cached.sourceIsPrivate,
    type: normalizedItem.type || 'forward',
    is_forwarded: true,
  };
}

export function hasForwardComment(item: any): boolean {
  const forwardData = getForwardedMessageFromItem(item);
  if (!forwardData) return false;

  const plainText = getPlainMessageText(item?.message || '');
  return Boolean(plainText.trim());
}

export function buildForwardSourceContext(
  item: any,
  sourceType: ThreadChatType,
  state?: any,
): ForwardSourceContext {
  const channelId = String(item?.channels_id || item?.channel_id || '');
  const channelName =
    item?.channel_name ||
    state?.channel?.name ||
    (sourceType === 'group_dm'
      ? 'Group message'
      : sourceType === 'dm'
      ? 'Direct message'
      : 'Channel');

  return {
    threadId: String(item?.thread_id || ''),
    channelId,
    channelName,
    isPrivate: state?.channel?.is_private ?? item?.is_private,
    sourceType,
  };
}

export function buildForwardPayload({
  optionalNote,
  media,
  source,
  originalItem,
}: {
  optionalNote?: string;
  media?: any[];
  source: ForwardSourceContext;
  originalItem?: any;
}) {
  const trimmedNote = optionalNote?.trim() || '';
  const referencedThread = originalItem
    ? buildReferencedThreadObject(originalItem, source, media)
    : undefined;

  return {
    content: trimmedNote ? buildMessageHtml(trimmedNote) : '<p></p>',
    media: [],
    mentions: [],
    referenced_thread_id: source.threadId,
    forwarded_thread_id: source.threadId,
    source_channel_id: source.channelId,
    forwarded_channel_id: source.channelId,
    source_channel_name: source.channelName,
    source_channel_is_private: source.isPrivate,
    referenced_thread: referencedThread,
    forwarded_thread: referencedThread,
    type: 'forward',
  };
}

export async function sendForwardedMessage({
  destination,
  optionalNote,
  media,
  source,
  originalItem,
  dispatch,
  callback,
  channelCallback,
  user,
}: {
  destination: ForwardDestination;
  optionalNote?: string;
  media?: any[];
  source: ForwardSourceContext;
  originalItem?: any;
  dispatch: (action: any) => void;
  callback?: boolean;
  channelCallback?: boolean;
  user?: any;
}) {
  const payload = buildForwardPayload({
    optionalNote,
    media,
    source,
    originalItem,
  });
  const snapshot = originalItem
    ? buildForwardSnapshot(originalItem, source, media)
    : null;
  const referencedThread = originalItem
    ? buildReferencedThreadObject(originalItem, source, media)
    : undefined;
  const trimmedNote = optionalNote?.trim() || '';
  const noteHtml = trimmedNote ? buildMessageHtml(trimmedNote) : '<p></p>';
  const optimisticThreadId = `optimistic-forward-${Date.now()}`;

  if (snapshot) {
    rememberForwardSnapshot({
      destinationChannelId: destination.channelId,
      sourceThreadId: source.threadId,
      targetThreadId: optimisticThreadId,
      snapshot,
    });
  }

  if (destination.type === 'channel' && user && snapshot && referencedThread) {
    dispatch({
      type: ACTIONS.CHANNELS_CHAT,
      payload: {
        newMessage: {
          channels_id: destination.channelId,
          thread_id: optimisticThreadId,
          username: user.username,
          full_name: user.full_name,
          avatar_url: user.avatar_url,
          message: noteHtml,
          created_at: new Date().toISOString(),
          status: 'pending',
          type: 'forward',
          is_forwarded: true,
          isOptimistic: true,
          user_id: user.user_id,
          referenced_thread_id: source.threadId,
          forwarded_thread_id: source.threadId,
          source_channel_id: source.channelId,
          source_channel_name: source.channelName,
          source_channel_is_private: source.isPrivate,
          referenced_thread: referencedThread,
          forwarded_thread: referencedThread,
          reactions: null,
        },
      },
    });
  }

  const { data, error } = await PostRequest(
    getForwardMessageSendUrl(destination),
    payload,
  );

  if (error) {
    throw new Error(error);
  }

  const createdThreadId = data?.data?.thread_id || data?.thread_id;
  if (snapshot && createdThreadId) {
    rememberForwardSnapshot({
      destinationChannelId: destination.channelId,
      sourceThreadId: source.threadId,
      targetThreadId: String(createdThreadId),
      snapshot,
    });
  }

  const callbackAction = getForwardMessageCallbackAction(destination);
  dispatch({
    type: callbackAction,
    payload: destination.type === 'channel' ? !channelCallback : !callback,
  });

  return true;
}
