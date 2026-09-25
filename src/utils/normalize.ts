// src/utils/normalize.ts
import { Dimensions, Platform, PixelRatio } from 'react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// We use the standard iPhone 11/13/15 width as the base (375px)
const scale = SCREEN_WIDTH / 375;

export function normalize(size: number) {
  const newSize = size * scale;

  if (Platform.OS === 'ios') {
    return Math.round(PixelRatio.roundToNearestPixel(newSize));
  } else {
    // Android rendering can be slightly smaller, so we add a tiny offset
    // to match the visual "weight" of iOS fonts.
    return Math.round(PixelRatio.roundToNearestPixel(newSize)) - 1;
  }
}
