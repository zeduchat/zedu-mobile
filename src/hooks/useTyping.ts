import { useCallback, useRef } from 'react';
import { useDataContext } from '@/store/useDataContext';

const TYPING_THROTTLE_MS = 2000;

export const useTyping = (subscription: any) => {
  const { state } = useDataContext();
  const lastStartRef = useRef(0);
  const subscriptionRef = useRef(subscription);
  const userRef = useRef(state?.user);

  subscriptionRef.current = subscription;
  userRef.current = state?.user;

  const publishTyping = (isTyping: boolean) => {
    const sub = subscriptionRef.current;
    const user = userRef.current;
    if (!sub || !user) return;

    try {
      sub.publish({
        user: {
          id: user.user_id || user.id,
          username: user.username || user.name,
        },
        typing: isTyping,
        type: 'typing',
      });
    } catch {
      // Ignore publish errors so typing never blocks the editor.
    }
  };

  const handleTyping = useCallback((isTyping: boolean) => {
    if (!isTyping) {
      lastStartRef.current = 0;
      publishTyping(false);
      return;
    }

    const now = Date.now();
    if (now - lastStartRef.current < TYPING_THROTTLE_MS) return;
    lastStartRef.current = now;
    publishTyping(true);
  }, []);

  return { handleTyping };
};
