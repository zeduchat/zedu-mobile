/**
 * Email as the backend stores it: no leading/trailing whitespace, all lowercase.
 * Phone keyboards often capitalise the first letter or add a space after a suggestion.
 * Not related to `normalize.ts`, which scales font sizes.
 */
export const normalizeEmail = (email?: string | null): string =>
  (email ?? '').trim().toLowerCase();
