import { GetRequest, buildQueryString } from '@/utils/requests';

export type ChannelSearchMessage = {
  message_id: string;
  message: string;
  timestamp: string;
  reactions?: Array<{
    reaction_id: string;
    emoji: string;
    count: number;
  }>;
  reply_count?: number;
  last_reply_timestamp?: string;
};

export type ChannelSearchGroup = {
  user: {
    user_id: string;
    user_name: string;
    avatar_url?: string;
    default_avatar_url?: string;
  };
  messages: ChannelSearchMessage[];
  channel?: {
    channel_id: string;
    channel_name: string;
  };
};

export type ChannelSearchHit = {
  key: string;
  messageId: string;
  message: string;
  timestamp: string;
  userId: string;
  userName: string;
  avatarUrl?: string;
  channelId?: string;
  channelName?: string;
};

export type SearchSortBy = 'relevance' | 'newest' | 'oldest';

/** GET /search/channel/{channelId} */
export async function searchChannelMessages(
  channelId: string,
  query: string,
  sortBy: SearchSortBy = 'relevance',
): Promise<{ data: ChannelSearchGroup[]; error: string | null }> {
  const trimmed = query.trim();
  if (!channelId || !trimmed) {
    return { data: [], error: null };
  }

  const qs = buildQueryString({ query: trimmed, sortBy });
  const { data, error } = await GetRequest(
    `/search/channel/${channelId}?${qs}`,
  );

  if (error) {
    return { data: [], error };
  }

  const groups = Array.isArray((data as any)?.data)
    ? ((data as any).data as ChannelSearchGroup[])
    : [];

  return { data: groups, error: null };
}

/** Flatten grouped API results into one row per message. */
export function flattenChannelSearchResults(
  groups: ChannelSearchGroup[],
): ChannelSearchHit[] {
  const hits: ChannelSearchHit[] = [];

  groups.forEach((group, groupIndex) => {
    const messages = Array.isArray(group.messages) ? group.messages : [];
    messages.forEach((msg, msgIndex) => {
      if (!msg?.message_id) return;
      hits.push({
        key: `${msg.message_id}-${groupIndex}-${msgIndex}`,
        messageId: String(msg.message_id),
        message: msg.message || '',
        timestamp: msg.timestamp || '',
        userId: String(group.user?.user_id || ''),
        userName: group.user?.user_name || 'Unknown',
        avatarUrl:
          group.user?.avatar_url || group.user?.default_avatar_url || undefined,
        channelId: group.channel?.channel_id,
        channelName: group.channel?.channel_name,
      });
    });
  });

  return hits;
}
