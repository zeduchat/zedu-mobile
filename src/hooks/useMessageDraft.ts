import { useCallback, useEffect, useRef } from 'react';
import {
  buildMessageDraftKey,
  clearMessageDraft,
  getCachedMessageDraft,
  loadMessageDraft,
  saveMessageDraft,
  type DraftMention,
  type MessageDraftScope,
} from '@/utils/message-drafts';

const SAVE_DEBOUNCE_MS = 250;

type UseMessageDraftArgs = {
  scope: MessageDraftScope;
  roomId?: string | null;
  orgId?: string | null;
  userId?: string | null;
  message: string;
  setMessage: (value: string) => void;
  mentions?: DraftMention[];
  setMentions?: (value: DraftMention[]) => void;
  /** Pause draft load/save while editing an existing message. */
  enabled?: boolean;
};

/**
 * Slack-style client drafts: text typed in a room is restored when you return.
 */
export function useMessageDraft({
  scope,
  roomId,
  orgId,
  userId,
  message,
  setMessage,
  mentions = [],
  setMentions,
  enabled = true,
}: UseMessageDraftArgs) {
  const draftKey = buildMessageDraftKey({
    scope,
    roomId: roomId || '',
    orgId,
    userId,
  });

  const hydratedKeyRef = useRef<string | null>(null);
  const skipSaveRef = useRef(false);
  const enabledRef = useRef(enabled);
  const messageRef = useRef(message);
  const mentionsRef = useRef(mentions);

  enabledRef.current = enabled;
  messageRef.current = message;
  mentionsRef.current = mentions;

  const applyDraft = useCallback(
    (text: string, nextMentions: DraftMention[]) => {
      skipSaveRef.current = true;
      setMessage(text);
      setMentions?.(nextMentions);
    },
    [setMessage, setMentions],
  );

  const restoreDraft = useCallback(async () => {
    if (!draftKey) return;
    const draft =
      getCachedMessageDraft(draftKey) ?? (await loadMessageDraft(draftKey));
    applyDraft(draft?.text || '', draft?.mentions || []);
  }, [draftKey, applyDraft]);

  const clearDraft = useCallback(async () => {
    if (!draftKey) return;
    skipSaveRef.current = true;
    await clearMessageDraft(draftKey);
  }, [draftKey]);

  // Hydrate when entering / switching rooms.
  useEffect(() => {
    if (!draftKey) {
      hydratedKeyRef.current = null;
      return;
    }

    let cancelled = false;

    const hydrate = async () => {
      const draft =
        getCachedMessageDraft(draftKey) ?? (await loadMessageDraft(draftKey));
      if (cancelled) return;

      hydratedKeyRef.current = draftKey;

      // If edit mode is active, keep storage intact but don't overwrite the editor.
      if (!enabledRef.current) {
        return;
      }

      applyDraft(draft?.text || '', draft?.mentions || []);
    };

    hydrate();

    return () => {
      cancelled = true;
      // Persist latest text when leaving the room (unmount / key change).
      if (draftKey && enabledRef.current) {
        const text = messageRef.current;
        const nextMentions = mentionsRef.current;
        if (text.trim()) {
          void saveMessageDraft(draftKey, text, nextMentions);
        } else {
          void clearMessageDraft(draftKey);
        }
      }
    };
  }, [draftKey, applyDraft]);

  // Debounced persist while composing (not while editing).
  useEffect(() => {
    if (!draftKey || !enabled) return;
    if (hydratedKeyRef.current !== draftKey) return;

    if (skipSaveRef.current) {
      skipSaveRef.current = false;
      return;
    }

    const timer = setTimeout(() => {
      void saveMessageDraft(draftKey, message, mentions);
    }, SAVE_DEBOUNCE_MS);

    return () => clearTimeout(timer);
  }, [draftKey, enabled, message, mentions]);

  return { clearDraft, restoreDraft, draftKey };
}

export default useMessageDraft;
