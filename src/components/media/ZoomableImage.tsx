import React, { useEffect } from 'react';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import FastImage from 'react-native-fast-image';

type Props = {
  uri: string;
  style?: React.ComponentProps<typeof FastImage>['style'];
  onZoomChange?: (isZoomed: boolean) => void;
};

const MIN_SCALE = 1;
const MAX_SCALE = 4;

const ZoomableImage = ({ uri, style, onZoomChange }: Props) => {
  const scale = useSharedValue(1);
  const savedScale = useSharedValue(1);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const savedTranslateX = useSharedValue(0);
  const savedTranslateY = useSharedValue(0);

  useEffect(() => {
    scale.value = 1;
    savedScale.value = 1;
    translateX.value = 0;
    translateY.value = 0;
    savedTranslateX.value = 0;
    savedTranslateY.value = 0;
    onZoomChange?.(false);
  }, [uri]);

  const notifyZoomChange = (zoomed: boolean) => {
    onZoomChange?.(zoomed);
  };

  const pinch = Gesture.Pinch()
    .onUpdate(e => {
      const nextScale = Math.min(
        Math.max(savedScale.value * e.scale, MIN_SCALE),
        MAX_SCALE,
      );
      scale.value = nextScale;
      runOnJS(notifyZoomChange)(nextScale > 1);
    })
    .onEnd(() => {
      if (scale.value <= MIN_SCALE) {
        scale.value = withTiming(1);
        savedScale.value = 1;
        translateX.value = withTiming(0);
        translateY.value = withTiming(0);
        savedTranslateX.value = 0;
        savedTranslateY.value = 0;
        runOnJS(notifyZoomChange)(false);
        return;
      }
      savedScale.value = scale.value;
    });

  const pan = Gesture.Pan()
    .averageTouches(true)
    .onUpdate(e => {
      if (scale.value > 1) {
        translateX.value = savedTranslateX.value + e.translationX;
        translateY.value = savedTranslateY.value + e.translationY;
      }
    })
    .onEnd(() => {
      savedTranslateX.value = translateX.value;
      savedTranslateY.value = translateY.value;
    });

  const doubleTap = Gesture.Tap()
    .numberOfTaps(2)
    .onEnd(() => {
      if (scale.value > 1) {
        scale.value = withTiming(1);
        savedScale.value = 1;
        translateX.value = withTiming(0);
        translateY.value = withTiming(0);
        savedTranslateX.value = 0;
        savedTranslateY.value = 0;
        runOnJS(notifyZoomChange)(false);
        return;
      }

      scale.value = withTiming(2);
      savedScale.value = 2;
      runOnJS(notifyZoomChange)(true);
    });

  const gesture = Gesture.Simultaneous(pinch, Gesture.Race(doubleTap, pan));

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: scale.value },
    ],
  }));

  return (
    <GestureDetector gesture={gesture}>
      <Animated.View style={[{ flex: 1, width: '100%' }, animatedStyle]}>
        <FastImage
          source={{ uri }}
          style={[{ width: '100%', height: '100%' }, style]}
          resizeMode={FastImage.resizeMode.contain}
        />
      </Animated.View>
    </GestureDetector>
  );
};

export default ZoomableImage;
