import { retrieveData, storeData, removeData } from '@/utils/helper';

export type DraftMention = {
  id: string;
  label: string;
  type: string;
};

export type MessageDraft = {
  text: string;
  mentions: DraftMention[];
  updatedAt: number;
};

export type MessageDraftScope = 'channel' | 'dm' | 'group-dm';

const STORAGE_PREFIX = '@zedu/message-draft:';

/** In-memory cache so drafts restore instantly when revisiting a room. */
const memoryCache = new Map<string, MessageDraft | null>();

export function buildMessageDraftKey(parts: {
  scope: MessageDraftScope;
  roomId: string;
  orgId?: string | null;
  userId?: string | null;
}): string | null {
  const roomId = String(parts.roomId || '').trim();
  if (!roomId) return null;

  const org = parts.orgId ? String(parts.orgId) : 'org';
  const user = parts.userId ? String(parts.userId) : 'user';
  return `${STORAGE_PREFIX}${user}:${org}:${parts.scope}:${roomId}`;
}

export function getCachedMessageDraft(key: string): MessageDraft | null {
  if (memoryCache.has(key)) {
    return memoryCache.get(key) ?? null;
  }
  return null;
}

export async function loadMessageDraft(
  key: string,
): Promise<MessageDraft | null> {
  if (memoryCache.has(key)) {
    return memoryCache.get(key) ?? null;
  }

  const stored = await retrieveData(key);
  if (
    stored &&
    typeof stored === 'object' &&
    typeof (stored as MessageDraft).text === 'string'
  ) {
    const draft: MessageDraft = {
      text: (stored as MessageDraft).text,
      mentions: Array.isArray((stored as MessageDraft).mentions)
        ? (stored as MessageDraft).mentions
        : [],
      updatedAt:
        typeof (stored as MessageDraft).updatedAt === 'number'
          ? (stored as MessageDraft).updatedAt
          : Date.now(),
    };
    memoryCache.set(key, draft);
    return draft;
  }

  memoryCache.set(key, null);
  return null;
}

export async function saveMessageDraft(
  key: string,
  text: string,
  mentions: DraftMention[] = [],
): Promise<void> {
  const trimmed = text.trim();
  if (!trimmed) {
    await clearMessageDraft(key);
    return;
  }

  const draft: MessageDraft = {
    text,
    mentions,
    updatedAt: Date.now(),
  };
  memoryCache.set(key, draft);
  await storeData(key, draft);
}

export async function clearMessageDraft(key: string): Promise<void> {
  memoryCache.set(key, null);
  await removeData(key);
}
