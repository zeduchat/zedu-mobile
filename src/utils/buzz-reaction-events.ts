import { Dimensions } from 'react-native';
import { Dispatch } from 'react';
import { ACTIONS, Action } from '@/store/types';

const DEDUP_WINDOW_MS = 500;
const recentReactionKeys = new Map<string, number>();

const pruneOldReactionKeys = (now: number) => {
  for (const [key, timestamp] of recentReactionKeys.entries()) {
    if (now - timestamp > DEDUP_WINDOW_MS) {
      recentReactionKeys.delete(key);
    }
  }
};

const buildReactionDedupKey = (reactionData: any): string => {
  const serverId = reactionData?.id ?? reactionData?.reaction_id;
  if (serverId != null && serverId !== '') {
    return `id:${serverId}`;
  }

  const userId = String(reactionData?.user_id ?? '');
  const content = String(reactionData?.content ?? '');
  const createdAt = reactionData?.created_at ?? reactionData?.timestamp;

  if (createdAt) {
    return `evt:${userId}:${content}:${createdAt}`;
  }

  const bucket = Math.floor(Date.now() / DEDUP_WINDOW_MS);
  return `evt:${userId}:${content}:${bucket}`;
};

export const dispatchBuzzReactionEmoji = (
  reactionData: any,
  currentUserId: string | number | undefined,
  dispatch: Dispatch<Action>,
): boolean => {
  if (!reactionData || reactionData.reaction_type !== 'emoji') {
    return false;
  }

  if (
    currentUserId != null &&
    String(reactionData.user_id) === String(currentUserId)
  ) {
    return false;
  }

  const now = Date.now();
  pruneOldReactionKeys(now);

  const dedupKey = buildReactionDedupKey(reactionData);
  if (recentReactionKeys.has(dedupKey)) {
    return false;
  }

  recentReactionKeys.set(dedupKey, now);

  const id = Date.now() + Math.random();
  const { width, height } = Dimensions.get('window');
  const newFloatingEmoji = {
    id,
    emoji: reactionData.content,
    x: width / 2 + (Math.random() - 0.5) * 100,
    y: height - 100,
    name: reactionData.username || reactionData.full_name || 'User',
    jitter: (Math.random() - 0.5) * 80,
  };

  dispatch({ type: ACTIONS.ADD_FLOATING_EMOJI, payload: newFloatingEmoji });

  setTimeout(() => {
    dispatch({ type: ACTIONS.REMOVE_FLOATING_EMOJI, payload: id });
  }, 1800);

  return true;
};
