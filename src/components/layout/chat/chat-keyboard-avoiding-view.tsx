import React from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { s } from 'react-native-size-matters';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAndroidKeyboardInset } from '@/hooks/useAndroidKeyboardInset';
import {
  isAndroid15Plus,
  navigationBarBottomPadding,
} from '@/utils/status-bar-inset';
import { normalize } from '@/utils/normalize';
import { useTheme } from '@/theme/ThemeProvider';

type Props = {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  /** iOS only — matches prior chat screen offsets */
  keyboardVerticalOffset?: number;
};

/**
 * Chat composer keyboard avoidance that works across Android versions.
 * - iOS: KeyboardAvoidingView padding
 * - Android < 15: rely on manifest adjustResize
 * - Android 15+:
 *   - keyboard open → pad by IME height (adjustResize is a no-op under edge-to-edge)
 *   - keyboard closed → pad by system navigation-bar inset
 */
const ChatKeyboardAvoidingView = ({
  children,
  style,
  keyboardVerticalOffset = s(30),
}: Props) => {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const androidKeyboardInset = useAndroidKeyboardInset();

  if (Platform.OS === 'ios') {
    return (
      <KeyboardAvoidingView
        behavior="padding"
        keyboardVerticalOffset={keyboardVerticalOffset}
        style={style}
      >
        {children}
      </KeyboardAvoidingView>
    );
  }

  if (isAndroid15Plus) {
    const navPad = navigationBarBottomPadding(insets.bottom, normalize(16));
    const bottomPad = androidKeyboardInset > 0 ? androidKeyboardInset : navPad;

    return (
      <View
        style={[
          {
            paddingBottom: bottomPad,
            // Fill the inset so chat wallpaper doesn't show under the composer
            backgroundColor: colors.topNavigation,
          },
          style,
        ]}
      >
        {children}
      </View>
    );
  }

  return <View style={style}>{children}</View>;
};

export default ChatKeyboardAvoidingView;
