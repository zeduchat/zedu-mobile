import React, { useEffect, useMemo, useRef } from 'react';
import { View, Animated, Easing, Dimensions } from 'react-native';
import { useTheme } from '@/theme/ThemeProvider';
import { createSharedUIStyles } from '@/theme/createStep10Styles';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const HorizontalLoader = () => {
  const { colors } = useTheme();
  const styles = useMemo(
    () => createSharedUIStyles(colors).horizontalLoader,
    [colors],
  );
  const scrollAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.timing(scrollAnim, {
        toValue: 1,
        duration: 1500,
        easing: Easing.bezier(0.4, 0, 0.2, 1),
        useNativeDriver: true,
      }),
    );
    animation.start();
    return () => animation.stop();
  }, [scrollAnim]);

  const translateX = scrollAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-SCREEN_WIDTH * 0.5, SCREEN_WIDTH],
  });

  const scaleX = scrollAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0.3, 1, 0.3],
  });

  return (
    <View style={styles.container}>
      <Animated.View
        style={[
          styles.fill,
          {
            transform: [{ translateX }, { scaleX }],
          },
        ]}
      />
    </View>
  );
};

export default HorizontalLoader;
