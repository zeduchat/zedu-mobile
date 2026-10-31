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

type SearchableMember = {
  name?: string;
  email?: string;
  username?: string;
};

/**
 * Whether an organisation member (the "Add members" pickers) matches the
 * search by name, email or username, like the web people search. Ignores
 * case and surrounding spaces; an empty search matches everyone.
 */
export function memberMatchesSearch(
  member: SearchableMember,
  query: string,
): boolean {
  const normalized = query.trim().toLowerCase();
  if (!normalized) {
    return true;
  }

  return [member.name, member.email, member.username].some(value =>
    (value || '').toLowerCase().includes(normalized),
  );
}
