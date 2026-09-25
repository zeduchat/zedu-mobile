export interface IncomingBuzzInvite {
  buzz_id: string;
  participants: any[];
  host_id: string;
  caller_id: string;
  channel_id: string;
  buzz_code: string;
  caller_name?: string;
  avatar_url?: string;
  default_avatar_url?: string;
}

const parseJsonSafely = (value: unknown) => {
  if (typeof value !== 'string') return null;

  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
};

const resolveNotificationPayload = (payload: any) => {
  if (!payload) return null;

  const additionalData = payload?.additionalData;
  const customData = payload?.rawPayload?.custom?.a;
  const alertBody = parseJsonSafely(payload?.body);
  const apsBody = parseJsonSafely(payload?.rawPayload?.aps?.alert?.body);

  return {
    ...(apsBody && typeof apsBody === 'object' ? apsBody : {}),
    ...(alertBody && typeof alertBody === 'object' ? alertBody : {}),
    ...(customData && typeof customData === 'object' ? customData : {}),
    ...(additionalData && typeof additionalData === 'object'
      ? additionalData
      : {}),
    ...(typeof payload === 'object' ? payload : {}),
  };
};

const normalizeInvite = (payload: any): IncomingBuzzInvite | null => {
  const resolvedPayload = resolveNotificationPayload(payload);
  if (!resolvedPayload) return null;

  const rawParticipants = resolvedPayload?.participants;
  const participants = Array.isArray(rawParticipants)
    ? rawParticipants
    : typeof rawParticipants === 'string'
    ? (() => {
        try {
          const parsed = JSON.parse(rawParticipants);
          return Array.isArray(parsed) ? parsed : [];
        } catch {
          return [];
        }
      })()
    : [];

  const invite: IncomingBuzzInvite = {
    buzz_id: String(resolvedPayload?.buzz_id || ''),
    participants,
    host_id: String(
      resolvedPayload?.host_id || resolvedPayload?.caller_id || '',
    ),
    caller_id: String(
      resolvedPayload?.caller_id || resolvedPayload?.host_id || '',
    ),
    channel_id: String(resolvedPayload?.channel_id || ''),
    buzz_code: String(resolvedPayload?.buzz_code || ''),
    caller_name: String(resolvedPayload?.caller_name || ''),
    avatar_url: String(resolvedPayload?.avatar_url || ''),
    default_avatar_url: String(resolvedPayload?.default_avatar_url || ''),
  };

  if (!invite.buzz_id || !invite.host_id || !invite.channel_id) {
    return null;
  }

  return invite;
};

class DirectCallInviteQueueService {
  parseFromNotification(notification: any): IncomingBuzzInvite | null {
    const payload = notification?.notification || notification;
    return normalizeInvite(payload);
  }

  async enqueue(_invite: IncomingBuzzInvite): Promise<void> {}

  async peek(): Promise<IncomingBuzzInvite | null> {
    return null;
  }

  async consume(): Promise<IncomingBuzzInvite | null> {
    return null;
  }

  async clear(): Promise<void> {}
}

export default new DirectCallInviteQueueService();
