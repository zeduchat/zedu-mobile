import React, { useMemo, useRef, useEffect } from 'react';
import {
  View,
  Modal,
  Pressable,
  Animated,
  Dimensions,
  LayoutRectangle,
} from 'react-native';
import { normalize } from '@/utils/normalize';
import { useTheme } from '@/theme/ThemeProvider';
import { createSharedUIStyles } from '@/theme/createStep10Styles';

interface PopoverProps {
  visible: boolean;
  onClose: () => void;
  children: React.ReactNode;
  triggerRef: React.RefObject<View | null>;
  placement?: 'bottom' | 'top';
  offsetY?: number;
  offsetX?: number;
  width?: number;
}

const Popover = ({
  visible,
  onClose,
  children,
  triggerRef,
  placement = 'bottom',
  offsetY = 8,
  offsetX = 0,
  width = 300,
}: PopoverProps) => {
  const { colors } = useTheme();
  const styles = useMemo(() => createSharedUIStyles(colors).popover, [colors]);
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const [triggerLayout, setTriggerLayout] =
    React.useState<LayoutRectangle | null>(null);

  useEffect(() => {
    if (visible && triggerRef.current) {
      triggerRef.current.measureInWindow((x, y, w, h) => {
        setTriggerLayout({ x, y, width: w, height: h });
        Animated.parallel([
          Animated.spring(scaleAnim, {
            toValue: 1,
            useNativeDriver: true,
            tension: 100,
            friction: 12,
          }),
          Animated.timing(opacityAnim, {
            toValue: 1,
            duration: 150,
            useNativeDriver: true,
          }),
        ]).start();
      });
    } else {
      Animated.parallel([
        Animated.timing(scaleAnim, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  const calculatePosition = () => {
    if (!triggerLayout) return { top: 0, left: 0 };

    const screenWidth = Dimensions.get('window').width;
    let left = triggerLayout.x + offsetX + (triggerLayout.width - width) / 2;

    // Prevent overflow
    if (left < normalize(16)) {
      left = normalize(16);
    } else if (left + width > screenWidth - normalize(16)) {
      left = screenWidth - width - normalize(16);
    }

    const top =
      placement === 'bottom'
        ? triggerLayout.y + triggerLayout.height + offsetY
        : triggerLayout.y - 200 - offsetY; // Estimate for 'top'

    return { top, left };
  };

  const position = calculatePosition();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
    >
      <Pressable style={styles.backdrop} onPress={onClose} />
      <Animated.View
        style={[
          styles.popoverContainer,
          {
            top: position.top,
            left: position.left,
            width,
            transform: [{ scale: scaleAnim }],
            opacity: opacityAnim,
          },
        ]}
      >
        {children}
      </Animated.View>
    </Modal>
  );
};

export default Popover;
