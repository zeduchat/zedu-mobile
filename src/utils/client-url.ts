import { CLIENT_URL } from '@env';

/** Returns the configured web origin without trailing slashes. */
export const normalizeClientBaseUrl = (clientUrl?: string): string =>
  (clientUrl?.trim() || 'https://zedu.chat').replace(/\/+$/, '');

export const CLIENT_BASE_URL = normalizeClientBaseUrl(CLIENT_URL);
