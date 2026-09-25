import { Platform } from 'react-native';

export const MIN_COMPOSER_HEIGHT = 40;
export const MAX_COMPOSER_HEIGHT = 120;
export const COMPOSER_EMOJI_WIDTH = 36;
export const COMPOSER_WRAPPER_HORIZONTAL_PADDING = 24;

export const clampComposerHeight = (height: number) =>
  Math.min(MAX_COMPOSER_HEIGHT, Math.max(MIN_COMPOSER_HEIGHT, height));

export const formatComposerMeasureText = (text: string) => {
  if (!text.length) return ' ';
  return text.endsWith('\n') ? `${text} ` : text;
};

/** Map native content size to the TextInput box height (includes vertical padding). */
export const contentSizeToComposerHeight = (contentHeight: number) => {
  const padding = Platform.OS === 'ios' ? 20 : 4;
  return Math.max(MIN_COMPOSER_HEIGHT, contentHeight + padding);
};

export const isComposerExpanded = (contentHeight: number, message: string) =>
  Boolean(message.trim()) && contentHeight > MIN_COMPOSER_HEIGHT;

export const shouldEnableComposerScroll = (contentHeight: number) =>
  contentHeight > MAX_COMPOSER_HEIGHT;

export const getComposerTextAreaWidth = (
  wrapperWidth: number,
  options?: { emojiVisible?: boolean },
) => {
  const emojiWidth = options?.emojiVisible === false ? 0 : COMPOSER_EMOJI_WIDTH;
  return Math.max(
    0,
    wrapperWidth - COMPOSER_WRAPPER_HORIZONTAL_PADDING - emojiWidth,
  );
};
