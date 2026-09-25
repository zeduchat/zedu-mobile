import { GetRequest } from '@/utils/requests';

export type ReactionGroup = {
  reaction: string;
  reaction_id?: string;
  reaction_count?: number;
  userReacted?: boolean;
};

export type ReactionUser = {
  username: string;
  full_name?: string;
  avatar_url?: string | null;
  default_avatar_url?: string | null;
  reaction: string;
  user_id?: string;
};

function normalizeUsername(entry: unknown): string {
  if (typeof entry === 'string') return entry.trim();
  if (!entry || typeof entry !== 'object') return '';

  const record = entry as Record<string, unknown>;
  const value =
    record.username ||
    record.user_name ||
    record.display_name ||
    record.full_name ||
    '';

  return typeof value === 'string' ? value.trim() : '';
}

function normalizeReactionUser(
  entry: unknown,
  reaction: string,
): ReactionUser | null {
  const username = normalizeUsername(entry);
  if (!username) return null;

  if (typeof entry === 'string') {
    return { username, reaction };
  }

  const record = entry as Record<string, unknown>;
  return {
    username,
    reaction,
    full_name:
      typeof record.full_name === 'string' ? record.full_name : undefined,
    avatar_url:
      typeof record.avatar_url === 'string' ? record.avatar_url : null,
    default_avatar_url:
      typeof record.default_avatar_url === 'string'
        ? record.default_avatar_url
        : null,
    user_id: typeof record.user_id === 'string' ? record.user_id : undefined,
  };
}

/**
 * Fetch people who reacted with a given reaction on a thread.
 * Mirrors web: GET /reactions/:reactionId/thread/:threadId
 */
export async function fetchReactionUsers(
  reactionId: string,
  threadId: string,
  reaction: string,
  fallbackUsername?: string,
): Promise<ReactionUser[]> {
  if (!reactionId || !threadId) {
    return fallbackUsername ? [{ username: fallbackUsername, reaction }] : [];
  }

  const { data, error } = await GetRequest(
    `/reactions/${reactionId}/thread/${threadId}`,
  );

  if (error) {
    return fallbackUsername ? [{ username: fallbackUsername, reaction }] : [];
  }

  const rawUsers = data?.data?.usernames || data?.data || [];
  const users = (Array.isArray(rawUsers) ? rawUsers : [])
    .map((entry: unknown) => normalizeReactionUser(entry, reaction))
    .filter(Boolean) as ReactionUser[];

  if (users.length === 0 && fallbackUsername) {
    return [{ username: fallbackUsername, reaction }];
  }

  return users;
}
