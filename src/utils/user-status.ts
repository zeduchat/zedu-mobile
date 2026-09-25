export type UserStatusSource = {
  icon?: string | null;
  text?: string | null;
  online?: boolean;
};

export type UserStatusDisplay = {
  icon: string;
  text: string;
};

export type UserStatusApiData = {
  text?: string | null;
  emoji?: string | null;
  expiry?: number;
  visibility?: string;
};

const EMOJI_SHORTCODE_MAP: Record<string, string> = {
  spiral_calendar_pad: '🗓️',
  bus: '🚌',
  face_with_thermometer: '🤒',
  palm_tree: '🌴',
  house: '🏠',
  speech_balloon: '💬',
};

export const parseStatusEmoji = (emoji?: string | null): string => {
  const trimmed = String(emoji || '').trim();
  if (!trimmed) {
    return '';
  }

  if (!/^:[a-z0-9_+-]+:$/i.test(trimmed)) {
    return trimmed;
  }

  const shortcode = trimmed.slice(1, -1).toLowerCase();
  return EMOJI_SHORTCODE_MAP[shortcode] || '';
};

export const mapApiUserStatus = (
  status?: UserStatusApiData | null,
): UserStatusDisplay | null => {
  if (!status) {
    return null;
  }

  const text = String(status.text || '').trim();
  const icon = parseStatusEmoji(status.emoji);

  if (!text && !icon) {
    return null;
  }

  return {
    icon,
    text: text || 'Available',
  };
};

export const getUserStatusDisplay = (
  user?: UserStatusSource | null,
): UserStatusDisplay | null => {
  if (!user) {
    return null;
  }

  const icon = String(user.icon || '').trim();
  const text = String(user.text || '').trim();

  if (icon || text) {
    return {
      icon: icon || '💬',
      text: text || 'Available',
    };
  }

  if (user.online === false) {
    return { icon: '', text: 'Away' };
  }

  if (user.online === true) {
    return { icon: '', text: 'Active' };
  }

  return null;
};

export const getUserStatusIcon = (
  user?: UserStatusSource | null,
): string | null => {
  if (!user) {
    return null;
  }

  const icon = String(user.icon || '').trim();
  return icon || null;
};
