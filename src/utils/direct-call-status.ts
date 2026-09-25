const normalize = (value?: string) => String(value || '').toLowerCase();

export const isJoinedJoinStatus = (status?: string) => {
  const normalized = normalize(status);
  return (
    normalized === 'active' ||
    normalized === 'accepted' ||
    normalized === 'accept'
  );
};

export const isActiveCaller = (
  participants: any[] | undefined,
  currentUserId: string,
): boolean => {
  const caller = (participants || []).find(
    participant => normalize(participant?.call_role) === 'caller',
  );

  if (!caller) return false;

  const callerId = String(caller.user_id ?? caller.id ?? '');
  const isCurrentUser = Boolean(callerId && callerId === String(currentUserId));

  return isCurrentUser && isJoinedJoinStatus(caller.join_status);
};

/**
 * True only while ringing: receivers exist, none have joined, and all are still pending.
 */
export const shouldCancelDirectCallOnHangup = (
  participants: any[] | undefined,
  options?: { hadRemoteParticipant?: boolean },
): boolean => {
  if (options?.hadRemoteParticipant) {
    return false;
  }

  const receivers = (participants || []).filter(
    participant => normalize(participant?.call_role) === 'receiver',
  );

  if (receivers.length === 0) {
    return false;
  }

  if (
    receivers.some(participant => isJoinedJoinStatus(participant?.join_status))
  ) {
    return false;
  }

  return receivers.every(
    participant => normalize(participant?.join_status) === 'pending',
  );
};
