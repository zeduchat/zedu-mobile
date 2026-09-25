import { Platform } from 'react-native';

export const isAndroid15Plus =
  Platform.OS === 'android' && Platform.Version >= 35;

export function statusBarTopPadding(
  insetsTop: number,
  iosPadding = 40,
): number {
  if (Platform.OS === 'ios') return iosPadding;
  if (isAndroid15Plus) return insetsTop;
  return 0;
}

/** Bottom inset for tab bar / inputs above the system navigation bar */
export function navigationBarBottomPadding(
  insetsBottom: number,
  fallback = 0,
): number {
  if (Platform.OS === 'ios') return insetsBottom;
  if (insetsBottom > 0) return insetsBottom;
  return isAndroid15Plus ? fallback : 0;
}
