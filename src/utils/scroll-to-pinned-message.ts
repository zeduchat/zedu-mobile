import type { RefObject } from 'react';
import type { FlatList } from 'react-native';
import { InteractionManager } from 'react-native';
import { GetRequest } from '@/utils/requests';
import {
  pinKind,
  type PinScope,
  type ResolvedPin,
} from '@/utils/resolve-pinned-messages';

export type JumpTarget = {
  kind: 'thread' | 'message';
  id: string;
  threadId: string;
  isReply: boolean;
};

const DEFAULT_ITEM_HEIGHT = 88;
const heightById = new Map<string, number>();

let activeScrollToken = 0;
let pendingPinJump: ResolvedPin | null = null;

/** Queue a pin jump to run when the chat screen regains focus. */
export const setPendingPinJump = (pin: ResolvedPin) => {
  pendingPinJump = pin;
};

/** Take (and clear) any pin jump queued from the pins screen. */
export const consumePendingPinJump = (): ResolvedPin | null => {
  const pin = pendingPinJump;
  pendingPinJump = null;
  return pin;
};

/** Record a chat row height (call from the list row onLayout). */
export const recordChatItemHeight = (
  id: string | number | undefined,
  height: number,
) => {
  if (id == null || !(height > 0)) return;
  heightById.set(String(id), height);
};

const heightFor = (id: string | undefined) => {
  if (!id) return DEFAULT_ITEM_HEIGHT;
  return heightById.get(String(id)) ?? DEFAULT_ITEM_HEIGHT;
};

/** Content offset to bring `index` into view on an inverted chat list. */
export const offsetForChatIndex = (
  messages:
    | Array<{ thread_id?: string; id?: string; message_id?: string }>
    | null
    | undefined,
  index: number,
) => {
  if (!messages?.length || index <= 0) return 0;

  let offset = 0;
  const end = Math.min(index, messages.length);
  for (let i = 0; i < end; i += 1) {
    const id =
      messages[i]?.thread_id ?? messages[i]?.id ?? messages[i]?.message_id;
    offset += heightFor(id != null ? String(id) : undefined);
  }
  return offset;
};

/** Cancel any in-flight pin-jump work (call when the user scrolls). */
export const cancelPinnedScrollJumps = () => {
  activeScrollToken += 1;
};

/**
 * Run `fn` after navigation settles and the chat list can accept scroll.
 * Used when returning from the pinned-messages screen.
 */
export const runAfterPinNavReturn = (fn: () => void) => {
  const token = ++activeScrollToken;

  InteractionManager.runAfterInteractions(() => {
    if (token !== activeScrollToken) return;
    requestAnimationFrame(() => {
      if (token !== activeScrollToken) return;
      fn();
    });
  });
};

/** @deprecated use runAfterPinNavReturn */
export const runAfterPinSheetClosed = runAfterPinNavReturn;

export const getPinnedJumpTarget = (pin: ResolvedPin): JumpTarget => {
  const fromKind = pinKind(pin.message, pin.pinId);

  const threadId = String(
    pin.threadId || pin.message?.thread_id || fromKind.threadId || '',
  );

  const messageId = String(
    pin.messageId || (fromKind.kind === 'message' ? fromKind.id : '') || '',
  );

  const isReply = Boolean(messageId && threadId && messageId !== threadId);

  if (isReply) {
    return {
      kind: 'message',
      id: messageId,
      threadId,
      isReply: true,
    };
  }

  return {
    kind: 'thread',
    id: threadId || pin.pinId,
    threadId: threadId || pin.pinId,
    isReply: false,
  };
};

export const findThreadIndex = (
  messages:
    | Array<{ thread_id?: string; id?: string; message_id?: string }>
    | null
    | undefined,
  threadId: string,
  extraIds: Array<string | undefined | null> = [],
) => {
  if (!messages?.length) return -1;

  const candidates = [threadId, ...extraIds]
    .filter(Boolean)
    .map(value => String(value));

  if (candidates.length === 0) return -1;

  return messages.findIndex(message => {
    const ids = [message?.thread_id, message?.id, message?.message_id]
      .filter(Boolean)
      .map(value => String(value));
    return ids.some(id => candidates.includes(id));
  });
};

export const findPinnedMessageIndex = (
  messages: any[] | null | undefined,
  pin: ResolvedPin,
) => {
  const target = getPinnedJumpTarget(pin);
  return findThreadIndex(messages, target.threadId, [
    pin.threadId,
    pin.messageId,
    pin.message?.thread_id,
    target.isReply ? pin.message?.id : null,
    target.isReply ? pin.message?.message_id : null,
  ]);
};

const threadsUrlForPage = (
  scope: PinScope,
  channelId: string,
  page: number,
  preferGroup = false,
) => {
  if (scope === 'channel') {
    return `/threads/channels/${channelId}?page=${page}&limit=50`;
  }
  if (preferGroup) {
    return `/group-dms/channels/${channelId}/threads?page=${page}&limit=50`;
  }
  return `/dms/channels/${channelId}/threads?page=${page}&limit=50`;
};

export async function ensurePinnedThreadLoaded({
  messages,
  pin,
  channelId,
  scope,
  onPageLoaded,
}: {
  messages: any[];
  pin: ResolvedPin;
  channelId: string;
  scope: PinScope;
  onPageLoaded?: (page: number, data: any[]) => void;
}): Promise<number> {
  let list = Array.isArray(messages) ? [...messages] : [];

  let index = findPinnedMessageIndex(list, pin);
  if (index >= 0) return index;

  const tryFetch = async (preferGroup: boolean) => {
    const startPage = Math.max(2, Math.floor(list.length / 50) + 1);

    for (let page = startPage; page <= startPage + 7; page += 1) {
      const { data, error } = await GetRequest(
        threadsUrlForPage(scope, channelId, page, preferGroup),
      );
      if (error || !Array.isArray((data as any)?.data)) break;

      const batch = (data as any).data as any[];
      if (batch.length === 0) break;

      onPageLoaded?.(page, batch);

      const existing = new Set(
        list.map(item => String(item?.thread_id || '')).filter(Boolean),
      );
      const merged = batch.filter(
        item => item?.thread_id && !existing.has(String(item.thread_id)),
      );
      list = [...list, ...merged];

      index = findPinnedMessageIndex(list, pin);
      if (index >= 0) return true;

      if (batch.length < 50) break;
    }

    return false;
  };

  const found = await tryFetch(false);
  if (!found && scope === 'chat') {
    await tryFetch(true);
  }

  return findPinnedMessageIndex(list, pin);
}

/**
 * One instant jump (no animation). Uses measured row heights when available.
 */
export const scrollChatToIndex = (
  listRef: RefObject<FlatList<any> | null>,
  index: number,
  messages?: Array<{
    thread_id?: string;
    id?: string;
    message_id?: string;
  }> | null,
) => {
  if (index < 0 || !listRef.current) return;

  activeScrollToken += 1;

  listRef.current.scrollToOffset({
    offset: offsetForChatIndex(messages, index),
    animated: false,
  });
};

/** @deprecated no-op — jumps use scrollToOffset only. */
export const createScrollToIndexFailedHandler =
  (_listRef: RefObject<FlatList<any> | null>) =>
  (_info: {
    index: number;
    highestMeasuredFrameIndex: number;
    averageItemLength: number;
  }) => {};
