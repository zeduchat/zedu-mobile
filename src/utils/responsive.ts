// src/utils/responsive.ts
import { Dimensions } from 'react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Based on standard design width (iPhone 11/13/15)
const guidelineBaseWidth = 375;

export const scale = (size: number) =>
  (SCREEN_WIDTH / guidelineBaseWidth) * size;

export const moderateScale = (size: number, factor = 0.5) =>
  size + (scale(size) - size) * factor;
