const GROUP_PARTICIPANT_CHANGE_TYPES = new Set([
  'participants_change',
  'participant_change',
  'participant_left',
  'member_left',
  'member_removed',
  'user_left_group',
  'user_left_group_dm',
]);

export function isGroupParticipantChangeEvent(data: any): boolean {
  const notificationType = String(data?.notification_type || '').toLowerCase();
  const eventType = String(data?.event || '').toLowerCase();

  return (
    GROUP_PARTICIPANT_CHANGE_TYPES.has(notificationType) ||
    GROUP_PARTICIPANT_CHANGE_TYPES.has(eventType)
  );
}

export function extractGroupParticipants(data: any): any[] | null {
  const participants = data?.data?.participants ?? data?.participants;
  return Array.isArray(participants) ? participants : null;
}

export function extractLeftParticipantUserId(data: any): string | null {
  const userId =
    data?.data?.user_id ??
    data?.data?.participant_id ??
    data?.data?.user_left?.user_id ??
    data?.data?.left_user?.user_id ??
    data?.user_id;

  return userId != null && userId !== '' ? String(userId) : null;
}

export function removeParticipantByUserId(
  participants: any[],
  userId: string,
): any[] {
  return participants.filter(
    (participant: any) => String(participant?.user_id) !== String(userId),
  );
}

export function hasParticipantMembershipChanged(
  current: any[],
  updated: any[],
): boolean {
  if (!Array.isArray(current) || !Array.isArray(updated)) return true;
  if (current.length !== updated.length) return true;

  const currentIds = new Set(current.map(p => String(p.user_id)));
  return updated.some(p => !currentIds.has(String(p.user_id)));
}

export function mergeParticipantsPreservingOrder(
  current: any[],
  updated: any[],
): any[] {
  if (!Array.isArray(updated)) return current;
  if (!Array.isArray(current) || !current.length) return updated;

  const updatedMap = new Map(updated.map(p => [String(p.user_id), p]));
  const ordered = current
    .map(p => updatedMap.get(String(p.user_id)))
    .filter(Boolean);
  const currentIds = new Set(current.map(p => String(p.user_id)));
  const newOnes = updated.filter(p => !currentIds.has(String(p.user_id)));

  return [...ordered, ...newOnes];
}
