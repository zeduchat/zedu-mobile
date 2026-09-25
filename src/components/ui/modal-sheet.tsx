import React, { useMemo, useRef, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Dimensions,
  Modal,
  Pressable,
  Animated,
  PanResponder,
  ViewStyle,
} from 'react-native';
import { useTheme } from '@/theme/ThemeProvider';
import { createSharedUIStyles } from '@/theme/createStep10Styles';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

interface ModalSheetProps {
  visible: boolean;
  onClose: () => void;
  children: React.ReactNode;
  header?: React.ReactNode;
  height?: number;
  containerStyle?: ViewStyle;
}

const ModalSheet = ({
  visible,
  onClose,
  children,
  header,
  height = SCREEN_HEIGHT * 0.6,
  containerStyle,
}: ModalSheetProps) => {
  const { colors } = useTheme();
  const styles = useMemo(
    () => createSharedUIStyles(colors).modalSheet,
    [colors],
  );
  const translateY = useRef(new Animated.Value(height)).current;

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) =>
        Math.abs(gestureState.dy) > 10,
      onPanResponderMove: (_, gestureState) => {
        if (gestureState.dy > 0) translateY.setValue(gestureState.dy);
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dy > height * 0.3 || gestureState.vy > 0.5) {
          closeSheet();
        } else {
          Animated.spring(translateY, {
            toValue: 0,
            useNativeDriver: true,
            tension: 50,
            friction: 10,
          }).start();
        }
      },
    }),
  ).current;

  useEffect(() => {
    if (visible) {
      Animated.timing(translateY, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [visible]);

  const closeSheet = () => {
    Animated.timing(translateY, {
      toValue: height,
      duration: 250,
      useNativeDriver: true,
    }).start(onClose);
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={closeSheet}
    >
      <View style={styles.overlay}>
        <Pressable style={StyleSheet.absoluteFill} onPress={closeSheet} />
        <Animated.View
          style={[
            styles.content,
            { height, transform: [{ translateY }] },
            containerStyle,
          ]}
        >
          <View {...panResponder.panHandlers} style={styles.gestureArea}>
            <View style={styles.handle} />
            {header}
          </View>
          {children}
        </Animated.View>
      </View>
    </Modal>
  );
};

export default ModalSheet;
