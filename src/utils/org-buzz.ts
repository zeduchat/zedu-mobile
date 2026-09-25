import { OrgBuzz, OrgBuzzPagination } from '@/types/buzz';
import { Colors } from '@/theme/colors';

export type OrgBuzzFilter = 'all' | 'channel' | 'dm';

export const normalizeOrgBuzzPagination = (
  pagination: OrgBuzzPagination | OrgBuzzPagination[] | null | undefined,
): OrgBuzzPagination | null => {
  if (!pagination) return null;
  if (Array.isArray(pagination)) {
    return pagination[0] ?? null;
  }
  return pagination;
};

export const getOrgBuzzLabel = (buzz: OrgBuzz): string => {
  const channelName = String(buzz.channel_name || '').trim();
  if (channelName) {
    return channelName;
  }

  if (buzz.buzz_type === 'orgbuzz') {
    return 'Org Buzz';
  }

  if (
    buzz.channel_type === 'dm_channel' ||
    buzz.channel_type === 'dm' ||
    buzz.buzz_type === 'direct'
  ) {
    return 'Direct Buzz';
  }

  if (buzz.channel_type === 'channel' || buzz.buzz_type === 'channel') {
    return 'Channel Buzz';
  }

  return buzz.buzz_code || 'Buzz';
};

export const isOrgBuzzActive = (buzz: OrgBuzz) =>
  String(buzz.status || '').toLowerCase() === 'active';

export const getOrgBuzzStatusLabel = (status?: string): string => {
  const normalized = String(status || 'unknown').toLowerCase();
  if (normalized === 'active') return 'Active';
  if (normalized === 'ended') return 'Ended';
  return normalized.charAt(0).toUpperCase() + normalized.slice(1);
};

export const getOrgBuzzStatusColor = (status?: string): string => {
  const normalized = String(status || '').toLowerCase();
  if (normalized === 'active') return Colors.online;
  if (normalized === 'ended') return '#9CA3AF';
  return Colors.textMuted;
};

export const isChannelOrgBuzz = (buzz: OrgBuzz) =>
  buzz.channel_type === 'channel' ||
  buzz.buzz_type === 'channel' ||
  buzz.buzz_type === 'orgbuzz';

export const isDirectOrgBuzz = (buzz: OrgBuzz) =>
  buzz.channel_type === 'dm' ||
  buzz.channel_type === 'dm_channel' ||
  buzz.buzz_type === 'direct';

export const matchesOrgBuzzFilter = (
  buzz: OrgBuzz,
  filter: OrgBuzzFilter,
): boolean => {
  if (filter === 'all') return true;
  if (filter === 'channel') return isChannelOrgBuzz(buzz);
  return isDirectOrgBuzz(buzz);
};

export const matchesOrgBuzzSearch = (
  buzz: OrgBuzz,
  search: string,
): boolean => {
  const query = search.trim().toLowerCase();
  if (!query) return true;

  const haystack = [
    buzz.channel_name,
    buzz.buzz_code,
    buzz.channel_type,
    buzz.buzz_type,
    buzz.status,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

  return haystack.includes(query);
};
