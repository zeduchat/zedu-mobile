import React, { useMemo, useRef, useState } from 'react';
import {
  View,
  Animated,
  Pressable,
  TouchableOpacity,
  Image,
} from 'react-native';
import { useTheme } from '@/theme/ThemeProvider';
import { createChatPopoverStyles } from '@/theme/createChatOverlayStyles';
import { AppText } from '../ui/text';
import { useNavigation } from '@react-navigation/native';
import FastImage from 'react-native-fast-image';

export const AppPopover = () => {
  const { colors } = useTheme();
  const styles = useMemo(() => createChatPopoverStyles(colors), [colors]);
  const navigation = useNavigation<any>();
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
      ]).start(() => {
        setIsVisible(false);
        scaleAnim.setValue(0);
        opacityAnim.setValue(0);
      });
    }
  };

  const createGroup = () => {
    toggle(false);
    navigation.navigate('ChatStack', { screen: 'GroupAddMembersScreen' });
  };

  const createDM = () => {
    toggle(false);
    navigation.navigate('ChatStack', { screen: 'AddMemberScreen' });
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
            <TouchableOpacity style={styles.menuItem} onPress={createGroup}>
              <Image
                source={require('@/assets/icons/new-group.png')}
                style={styles.menuIcon}
              />
              <AppText variant="medium" size={15} style={styles.menuText}>
                New Group
              </AppText>
            </TouchableOpacity>

            <View style={styles.separator} />

            <TouchableOpacity style={styles.menuItem} onPress={createDM}>
              <Image
                source={require('@/assets/icons/direct-message.png')}
                style={styles.menuIcon}
              />
              <AppText variant="medium" size={15} style={styles.menuText}>
                Direct Message
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
