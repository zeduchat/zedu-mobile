import { lightColors } from './palettes';

/**
 * Static light palette — existing imports keep working unchanged.
 * New code should use `useTheme().colors` instead.
 */
export const Colors = {
  primary: lightColors.primary,
  primaryforeground: lightColors.primaryforeground,
  secondary: lightColors.secondary,
  secondaryforeground: lightColors.secondaryforeground,
  white: lightColors.white,
  black: lightColors.black,
  transparent: lightColors.transparent,
  textMain: lightColors.textMain,
  textSecondary: lightColors.textSecondary,
  textMuted: lightColors.textMuted,
  border: lightColors.border,
  error: lightColors.error,
  online: lightColors.online,
  offline: lightColors.offline,
  bgSecondary: lightColors.bgSecondary,
  topNavigation: lightColors.topNavigation,
  lightBlue: lightColors.lightBlue,
  lightYellow: lightColors.lightYellow,
};
