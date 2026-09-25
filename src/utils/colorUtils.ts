/**
 * Color utility for generating and caching random colors for participants
 */

// Color cache for persistent participant colors during session
const colorCache = new Map<string, string>();

const BG_COLORS = [
  '#EA5D97',
  '#1D3312',
  '#0661A7',
  '#7A383E',
  '#4D2542',
  '#720F38',
  '#33365D',
  '#2E5266',
  '#6A4C93',
  '#F72585',
  '#4361EE',
  '#3A0CA3',
  '#FB5607',
  '#FFBE0B',
];

/**
 * Get random background color for a participant
 * Colors are cached per userId to maintain consistency during session
 */
export const getRandomBgColor = (userId?: string): string => {
  if (!userId) {
    return BG_COLORS[Math.floor(Math.random() * BG_COLORS.length)];
  }

  // Check if color already assigned to this user
  if (colorCache.has(userId)) {
    return colorCache.get(userId)!;
  }

  // Assign new random color and cache it
  const randomColor = BG_COLORS[Math.floor(Math.random() * BG_COLORS.length)];
  colorCache.set(userId, randomColor);
  return randomColor;
};

/**
 * Clear color cache (useful when ending call)
 */
export const clearColorCache = (): void => {
  colorCache.clear();
};
