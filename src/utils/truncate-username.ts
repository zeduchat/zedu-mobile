import { Dimensions } from 'react-native';

const ELLIPSIS = '…';

/** Single-line channel username with trailing ellipsis when over the visible limit. */
export function truncateUsernameForChannel(username?: string | null): string {
  const name = (username?.substring(0, 30) ?? '').trim();
  if (!name) {
    return '';
  }

  const screenWidth = Dimensions.get('window').width;
  // Avatar, padding, time label — approximate chars that fit beside the timestamp
  const maxLength = Math.max(14, Math.floor((screenWidth - 128) / 7));

  if (name.length <= maxLength) {
    return name;
  }

  return `${name.slice(0, maxLength)}${ELLIPSIS}`;
}
