import React, { useMemo, useRef, useState } from 'react';
import { View, Animated, Pressable, TouchableOpacity } from 'react-native';
import { useTheme } from '@/theme/ThemeProvider';
import { createBuzzLayoutPopoverStyles } from '@/theme/createBuzzStyles';
import { AppText } from '@/components/ui/text';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import FastImage from 'react-native-fast-image';
import Feather from 'react-native-vector-icons/Feather';
import { BuzzTabStackParamList } from '@/navigation/stacks/buzz/buzz-tab-stack';

export const BuzzPopover = () => {
  const { colors } = useTheme();
  const styles = useMemo(() => createBuzzLayoutPopoverStyles(colors), [colors]);
  const navigation =
    useNavigation<StackNavigationProp<BuzzTabStackParamList>>();
  const [isVisible, setIsVisible] = useState(false);

  const scaleAnim = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  const toggle = (show: boolean) => {
    if (show) {
      setIsVisible(true);
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 50,
          friction: 7,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
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
      ]).start(() => setIsVisible(false));
    }
  };

  const viewAllBuzzes = () => {
    navigation.navigate('AllBuzzes');
    toggle(false);
  };

  return (
    <View style={styles.wrapper} pointerEvents="box-none">
      {isVisible && (
        <>
          <Pressable style={styles.overlay} onPress={() => toggle(false)} />
          <Animated.View
            style={[
              styles.popoverCard,
              {
                opacity: opacityAnim,
                transform: [
                  { scale: scaleAnim },
                  {
                    translateY: scaleAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [20, 0],
                    }),
                  },
                ],
              },
            ]}
          >
            <TouchableOpacity style={styles.menuItem} onPress={viewAllBuzzes}>
              <Feather
                name="video"
                size={22}
                color={colors.textPrimary}
                style={styles.menuIconFeather}
              />
              <AppText variant="medium" size={15} style={styles.menuText}>
                View Buzzs
              </AppText>
            </TouchableOpacity>
          </Animated.View>
        </>
      )}

      <TouchableOpacity
        style={[styles.fab, isVisible && styles.fabActive]}
        onPress={() => toggle(!isVisible)}
        activeOpacity={0.9}
      >
        <Animated.View
          style={{
            transform: [
              {
                rotate: opacityAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: ['0deg', '45deg'],
                }),
              },
            ],
          }}
        >
          <FastImage
            source={require('@/assets/icons/plus.png')}
            style={styles.plusIcon}
          />
        </Animated.View>
      </TouchableOpacity>
    </View>
  );
};
