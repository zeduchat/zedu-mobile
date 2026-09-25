export type {
  AppTheme,
  ResolvedColorScheme,
  ThemeColors,
  ThemePreference,
} from './types';

export { lightColors, darkColors } from './palettes';
export { buildNavigationTheme } from './navigation-theme';
export { ThemeProvider, useTheme, THEME_PREFERENCE_KEY } from './ThemeProvider';

/** @deprecated Prefer `useTheme().colors` — kept for gradual migration. */
export { Colors } from './colors';

export * from './createBuzzStyles';
export * from './createChatOverlayStyles';
export * from './createStep10Styles';
