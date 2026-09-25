import { useEffect, useState } from 'react';
import { Dimensions, Keyboard, type KeyboardEvent } from 'react-native';
import { isAndroid15Plus } from '@/utils/status-bar-inset';

/** Extra lift so the IME toolbar never clips the composer on Android 15+. */
const KEYBOARD_CLEARANCE = 12;

function resolveKeyboardInset(event: KeyboardEvent): number {
  const screenHeight = Dimensions.get('screen').height;
  const fromScreenY = Math.max(
    0,
    Math.round(screenHeight - event.endCoordinates.screenY),
  );
  const reported = Math.max(0, Math.round(event.endCoordinates.height));
  // Prefer the larger value — under-padding clips the input; over-padding only adds a small gap.
  return Math.max(fromScreenY, reported) + KEYBOARD_CLEARANCE;
}

/**
 * On Android 15+ (API 35), edge-to-edge disables window SoftInput adjustResize.
 * Return the IME height so chat composers can pad themselves above the keyboard.
 * Older Android keeps adjustResize, so this returns 0 to avoid double-offset.
 */
export function useAndroidKeyboardInset(): number {
  const [keyboardInset, setKeyboardInset] = useState(0);

  useEffect(() => {
    if (!isAndroid15Plus) {
      return;
    }

    const onShow = (event: KeyboardEvent) => {
      setKeyboardInset(resolveKeyboardInset(event));
    };
    const onHide = () => {
      setKeyboardInset(0);
    };

    const showSub = Keyboard.addListener('keyboardDidShow', onShow);
    const hideSub = Keyboard.addListener('keyboardDidHide', onHide);

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  return isAndroid15Plus ? keyboardInset : 0;
}
