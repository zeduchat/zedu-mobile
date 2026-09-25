import React, { useMemo } from 'react';
import { EmojiKeyboard } from 'rn-emoji-keyboard';
import EmojiPicker from 'rn-emoji-keyboard';
import { useTheme } from '@/theme/ThemeProvider';
import {
  createEmojiPickerTheme,
  createEmojiPickerStyles,
} from '@/theme/createChatOverlayStyles';

type EmojiKeyboardComponentProps = React.ComponentProps<typeof EmojiKeyboard>;

type ThemedEmojiKeyboardProps = Omit<
  EmojiKeyboardComponentProps,
  'theme' | 'styles'
> & {
  containerStyle?: EmojiKeyboardComponentProps['styles'];
};

export function ThemedEmojiKeyboard({
  containerStyle,
  ...props
}: ThemedEmojiKeyboardProps) {
  const { colors } = useTheme();
  const theme = useMemo(() => createEmojiPickerTheme(colors), [colors]);
  const styles = useMemo(() => {
    const base = createEmojiPickerStyles(colors);
    return containerStyle
      ? {
          ...base,
          container: { ...base.container, ...containerStyle.container },
        }
      : base;
  }, [colors, containerStyle]);

  return <EmojiKeyboard {...props} theme={theme} styles={styles} />;
}

type ThemedEmojiPickerProps = Omit<
  React.ComponentProps<typeof EmojiPicker>,
  'theme' | 'styles'
>;

export function ThemedEmojiPicker(props: ThemedEmojiPickerProps) {
  const { colors } = useTheme();
  const theme = useMemo(() => createEmojiPickerTheme(colors), [colors]);
  const styles = useMemo(() => createEmojiPickerStyles(colors), [colors]);

  return <EmojiPicker {...props} theme={theme} styles={styles} />;
}
