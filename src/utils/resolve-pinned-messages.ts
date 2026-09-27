import { GetRequest } from '@/utils/requests';

export type PinScope = 'channel' | 'chat';

export type PinRecord = {
  id: string;
  threadId: string;
  messageId: string;
  pinnedAt: string;
  embedded: Record<string, any> | null;
};

export type ResolvedPin = {
  pinId: string;
  threadId: string;
  messageId: string;
  pinnedAt: string;
  message: Record<string, any> | null;
};

const CHANNEL_PAGE_SIZE = 80;
const CHAT_PAGE_SIZE = 50;
const MAX_PAGES = 8;

const embeddedMessage = (record: Record<string, any>) => {
  if (typeof record.message === 'string') return record;

  const nested = record.thread;
  if (
    nested &&
    typeof nested === 'object' &&
    typeof nested.message === 'string'
  ) {
    return nested as Record<string, any>;
  }

  return null;
};

export function normalizePins(data: unknown): PinRecord[] {
  if (!Array.isArray(data)) return [];

  return data.flatMap(item => {
    if (!item || typeof item !== 'object') return [];

    const record = item as Record<string, any>;
    const embedded = embeddedMessage(record);
    const id = String(record.id || record.thread_id || record.message_id || '');
    if (!id) return [];

    const threadId = String(
      record.thread_id || embedded?.thread_id || record.thread?.thread_id || '',
    );
    // Only trust an explicit API message_id for reply pins.
    const messageId = String(record.message_id || '');

    return [
      {
        id,
        threadId,
        messageId,
        pinnedAt: String(record.pinned_at || ''),
        embedded,
      },
    ];
  });
}

const remember = (map: Map<string, any>, item: any) => {
  if (!item || typeof item !== 'object') return;

  [item.thread_id, item.id, item.message_id]
    .filter(Boolean)
    .map(String)
    .forEach(key => {
      if (!map.has(key)) map.set(key, item);
    });
};

const readPage = async (url: string) => {
  const { data, error } = await GetRequest(url);
  if (error) return null;
  return Array.isArray((data as any)?.data) ? (data as any).data : [];
};

const fillSource = async (
  map: Map<string, any>,
  records: PinRecord[],
  urlForPage: (page: number) => string,
  pageSize: number,
) => {
  const missing = () =>
    records.some(pin => {
      const keys = [pin.id, pin.threadId, pin.messageId].filter(Boolean);
      return keys.length > 0 && !keys.some(key => map.has(key));
    });

  for (let page = 1; page <= MAX_PAGES && missing(); page += 1) {
    const batch = await readPage(urlForPage(page));
    if (!batch || batch.length === 0) return;

    batch.forEach((item: any) => remember(map, item));

    if (batch.length < pageSize) return;
  }
};

export async function resolvePinnedMessages({
  records,
  knownMessages,
  scope,
  channelId,
}: {
  records: PinRecord[];
  knownMessages: any[];
  scope: PinScope;
  channelId: string;
}): Promise<ResolvedPin[]> {
  const map = new Map<string, any>();

  knownMessages.forEach(item => remember(map, item));

  records.forEach(pin => {
    if (!pin.embedded) return;
    remember(map, pin.embedded);
    map.set(pin.id, pin.embedded);
    if (pin.threadId) map.set(pin.threadId, pin.embedded);
    if (pin.messageId) map.set(pin.messageId, pin.embedded);
  });

  const missing = () =>
    records.some(pin => {
      const keys = [pin.id, pin.threadId, pin.messageId].filter(Boolean);
      return keys.length > 0 && !keys.some(key => map.has(key));
    });

  if (missing() && channelId) {
    if (scope === 'channel') {
      await fillSource(
        map,
        records,
        page =>
          `/threads/channels/${channelId}?page=${page}&limit=${CHANNEL_PAGE_SIZE}`,
        CHANNEL_PAGE_SIZE,
      );
    } else {
      await fillSource(
        map,
        records,
        page =>
          `/dms/channels/${channelId}/threads?page=${page}&limit=${CHAT_PAGE_SIZE}`,
        CHAT_PAGE_SIZE,
      );

      if (missing()) {
        await fillSource(
          map,
          records,
          page =>
            `/group-dms/channels/${channelId}/threads?page=${page}&limit=${CHAT_PAGE_SIZE}`,
          CHAT_PAGE_SIZE,
        );
      }
    }
  }

  return records.map(pin => {
    const message =
      map.get(pin.id) ||
      (pin.threadId ? map.get(pin.threadId) : null) ||
      (pin.messageId ? map.get(pin.messageId) : null) ||
      pin.embedded ||
      null;

    return {
      pinId: pin.id,
      threadId: String(message?.thread_id || pin.threadId || pin.id || ''),
      messageId: String(
        pin.messageId ||
          (message &&
          message.thread_id &&
          message.id &&
          String(message.id) !== String(message.thread_id) &&
          // Hydrated chat messages don't carry pin-row `pinned_at`.
          !('pinned_at' in message)
            ? message.id
            : '') ||
          '',
      ),
      pinnedAt: pin.pinnedAt,
      message,
    };
  });
}

/** @deprecated prefer resolvePinnedMessages */
export function resolvePinsFromLocal(
  records: PinRecord[],
  localMessages: any[],
): ResolvedPin[] {
  return records.map(record => {
    const fromLocal =
      localMessages.find(msg => {
        const threadId = msg?.thread_id ? String(msg.thread_id) : '';
        const messageId = msg?.id ?? msg?.message_id;
        return (
          threadId === record.id ||
          threadId === record.threadId ||
          (messageId != null &&
            (String(messageId) === record.id ||
              String(messageId) === record.messageId))
        );
      }) || null;

    const message = fromLocal || record.embedded;

    return {
      pinId: record.id,
      threadId: String(
        message?.thread_id || record.threadId || record.id || '',
      ),
      messageId: String(record.messageId || ''),
      pinnedAt: record.pinnedAt,
      message,
    };
  });
}

export function pinKind(message: Record<string, any> | null, pinId: string) {
  const threadId = message?.thread_id ? String(message.thread_id) : '';
  const messageId = message?.id
    ? String(message.id)
    : message?.message_id
    ? String(message.message_id)
    : '';

  // Pin list rows often use a pin uuid as `id` plus a separate `thread_id`.
  // Those are thread pins, not replies.
  if (message && 'pinned_at' in message && !message.message_id) {
    return {
      kind: 'thread' as const,
      id: threadId || pinId,
      threadId: threadId || pinId,
    };
  }

  if (messageId && messageId === pinId && threadId && threadId !== messageId) {
    return { kind: 'message' as const, id: messageId, threadId };
  }

  return {
    kind: 'thread' as const,
    id: threadId || pinId,
    threadId: threadId || pinId,
  };
}
