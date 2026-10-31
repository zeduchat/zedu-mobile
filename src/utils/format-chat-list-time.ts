import moment from 'moment';

/**
 * Chat list timestamp:
 * - Today → 3:45 pm
 * - Yesterday → Yesterday
 * - Last 7 days → Monday
 * - Older → 01/10/2026
 */
export function formatChatListTime(timestamp?: string | null): string {
  if (!timestamp) return '';

  const when = moment(timestamp);
  if (!when.isValid()) return '';

  const now = moment();

  if (when.isSame(now, 'day')) {
    return when.format('h:mm a');
  }

  if (when.isSame(now.clone().subtract(1, 'day'), 'day')) {
    return 'Yesterday';
  }

  // Within the last 6 days before today.
  if (when.isAfter(now.clone().startOf('day').subtract(6, 'days'))) {
    return when.format('dddd');
  }

  return when.format('DD/MM/YYYY');
}
