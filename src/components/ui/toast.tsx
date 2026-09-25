import React, { useMemo, useRef } from 'react';
import {
  View,
  Image,
  TouchableOpacity,
  Platform,
  Animated,
  PanResponder,
} from 'react-native';
import Toast from 'react-native-toast-message';
import { AppText } from '@/components/ui/text';
import { useTheme } from '@/theme/ThemeProvider';
import { createToastStyles } from '@/theme/createChatOverlayStyles';

/**
 * Enhanced ShowNotify function
 */
export const ShowNotify = (
  title: string,
  message: string,
  avatar?: string,
  onPress?: () => void,
) => {
  Toast.show({
    type: 'appNotification',
    text1: title,
    text2: message,
    props: { avatar },
    onPress: () => {
      Toast.hide();
      onPress?.();
    },
    topOffset: Platform.OS === 'ios' ? 50 : 20,
    visibilityTime: 5000,
  });
};

const AppNotification = ({ text1, text2, props, onPress }: any) => {
  const { colors } = useTheme();
  const styles = useMemo(() => createToastStyles(colors), [colors]);
  const translateY = useRef(new Animated.Value(0)).current;

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return Math.abs(gestureState.dy) > 10;
      },
      onPanResponderMove: (_, gestureState) => {
        if (gestureState.dy < 0) {
          translateY.setValue(gestureState.dy);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dy < -40) {
          Animated.timing(translateY, {
            toValue: -100,
            duration: 200,
            useNativeDriver: true,
          }).start(() => Toast.hide());
        } else {
          Animated.spring(translateY, {
            toValue: 0,
            useNativeDriver: true,
            tension: 40,
          }).start();
        }
      },
    }),
  ).current;

  return (
    <Animated.View
      {...panResponder.panHandlers}
      style={[styles.container, { transform: [{ translateY }] }]}
    >
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={onPress}
        style={styles.innerContent}
      >
        <View style={styles.content}>
          <View style={styles.avatarWrapper}>
            <Image
              source={
                props.avatar
                  ? { uri: props.avatar }
                  : require('@/assets/Logo.png')
              }
              style={styles.avatar}
            />
          </View>

          <View style={styles.textContainer}>
            <AppText
              variant="bold"
              size={15}
              numberOfLines={1}
              style={styles.title}
            >
              {text1}
            </AppText>
            <AppText size={13} numberOfLines={2} style={styles.message}>
              {text2}
            </AppText>
          </View>

          <View style={styles.rightAction}>
            <View style={styles.timeDot} />
          </View>
        </View>

        <View style={styles.grabber} />
      </TouchableOpacity>
    </Animated.View>
  );
};

export const NotificationToastConfig = {
  appNotification: (props: any) => <AppNotification {...props} />,
};
