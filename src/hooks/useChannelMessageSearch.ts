import { useEffect, useRef, useState } from 'react';
import {
  flattenChannelSearchResults,
  searchChannelMessages,
  type ChannelSearchHit,
  type SearchSortBy,
} from '@/services/chat/channel-search';

const DEBOUNCE_MS = 350;

/**
 * Debounced channel message search for the in-chat header search UI.
 */
export function useChannelMessageSearch(
  channelId: string | undefined,
  query: string,
  enabled: boolean,
  sortBy: SearchSortBy = 'relevance',
) {
  const [results, setResults] = useState<ChannelSearchHit[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const requestIdRef = useRef(0);

  useEffect(() => {
    if (!enabled || !channelId) {
      setResults([]);
      setLoading(false);
      setError(null);
      return;
    }

    const trimmed = query.trim();
    if (!trimmed) {
      setResults([]);
      setLoading(false);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);
    const requestId = ++requestIdRef.current;

    const timer = setTimeout(async () => {
      const { data, error: apiError } = await searchChannelMessages(
        channelId,
        trimmed,
        sortBy,
      );

      if (requestId !== requestIdRef.current) return;

      if (apiError) {
        setError(apiError);
        setResults([]);
        setLoading(false);
        return;
      }

      setResults(flattenChannelSearchResults(data));
      setLoading(false);
    }, DEBOUNCE_MS);

    return () => {
      clearTimeout(timer);
    };
  }, [channelId, query, enabled, sortBy]);

  return { results, loading, error };
}
