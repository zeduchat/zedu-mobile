type SearchableParticipant = {
  username?: string;
  full_name?: string;
  title?: string;
};

export function participantMatchesSearch(
  participant: SearchableParticipant,
  query: string,
): boolean {
  const normalized = query.trim().toLowerCase();
  if (!normalized) {
    return true;
  }

  const username = (participant.username || '').toLowerCase();
  const fullName = (participant.full_name || '').toLowerCase();
  const title = (participant.title || '').toLowerCase();

  return (
    username.includes(normalized) ||
    fullName.includes(normalized) ||
    title.includes(normalized)
  );
}

export function filterParticipantsBySearch<T extends SearchableParticipant>(
  participants: T[] | undefined,
  query: string,
): T[] {
  if (!Array.isArray(participants)) {
    return [];
  }

  return participants.filter(participant =>
    participantMatchesSearch(participant, query),
  );
}
