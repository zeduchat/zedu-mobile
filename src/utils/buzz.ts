export const getBuzzParticipantDisplayName = (
  participant: any,
  options?: { isMe?: boolean; fallback?: string; hostName?: string },
): string => {
  if (options?.isMe) {
    return 'You';
  }

  const nested = participant?.user || participant?.user_joined || {};

  return (
    participant?.full_name ||
    participant?.username ||
    participant?.name ||
    participant?.display_name ||
    nested?.full_name ||
    nested?.username ||
    nested?.name ||
    nested?.display_name ||
    [participant?.first_name, participant?.last_name]
      .filter(Boolean)
      .join(' ')
      .trim() ||
    [nested?.first_name, nested?.last_name].filter(Boolean).join(' ').trim() ||
    participant?.email ||
    nested?.email ||
    options?.hostName ||
    options?.fallback ||
    'User'
  );
};

export const enrichBuzzParticipant = (
  participant: any,
  catalog: any[] = [],
  buzzData?: any,
): any => {
  const participantId = String(participant?.user_id ?? participant?.id ?? '');
  const fromCatalog = catalog.find(
    (entry: any) => String(entry?.user_id ?? entry?.id) === participantId,
  );
  const hostId = String(buzzData?.host_id ?? '');
  const hostName = buzzData?.host_name;

  const merged = {
    ...(fromCatalog || {}),
    ...participant,
  };

  const enriched = {
    ...merged,
    full_name:
      participant?.full_name || fromCatalog?.full_name || merged.full_name,
    username: participant?.username || fromCatalog?.username || merged.username,
    name: participant?.name || fromCatalog?.name || merged.name,
    display_name:
      participant?.display_name ||
      fromCatalog?.display_name ||
      merged.display_name,
    avatar_url:
      participant?.avatar_url ||
      fromCatalog?.avatar_url ||
      fromCatalog?.default_avatar_url ||
      merged.avatar_url,
    default_avatar_url:
      participant?.default_avatar_url ||
      fromCatalog?.default_avatar_url ||
      merged.default_avatar_url,
  };

  if (participantId && participantId === hostId && hostName) {
    enriched.username = enriched.username || hostName;
    enriched.full_name = enriched.full_name || hostName;
  }

  return enriched;
};

export const enrichBuzzParticipants = (
  participants: any[],
  catalog: any[] = [],
  buzzData?: any,
): any[] => {
  const enriched = (participants || []).map(participant =>
    enrichBuzzParticipant(participant, catalog, buzzData),
  );
  const seen = new Set(
    enriched.map(participant =>
      String(participant?.user_id ?? participant?.id),
    ),
  );

  for (const entry of catalog) {
    const entryId = String(entry?.user_id ?? entry?.id ?? '');
    if (!entryId || seen.has(entryId)) {
      continue;
    }

    enriched.push(enrichBuzzParticipant(entry, catalog, buzzData));
    seen.add(entryId);
  }

  return enriched;
};

export const extractBuzzCodeFromInput = (input: string): string | null => {
  const trimmedInput = input.trim();

  if (!trimmedInput) {
    return null;
  }

  const compactInput = trimmedInput.replace(/\s+/g, '');
  const buzzLinkMatch = compactInput.match(
    /(?:https?:\/\/)?[^\s/]+\/(?:[^\s/]+\/)?buzz\/([^/?#\s]+)/i,
  );

  if (buzzLinkMatch?.[1]) {
    return decodeURIComponent(buzzLinkMatch[1]).trim();
  }

  const buzzPathMatch = compactInput.match(/\/buzz\/([^/?#\s]+)/i);

  if (buzzPathMatch?.[1]) {
    return decodeURIComponent(buzzPathMatch[1]).trim();
  }

  return trimmedInput;
};
