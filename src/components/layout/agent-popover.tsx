import React, { useMemo, useRef, useState } from 'react';
import { View, Animated, Pressable, TouchableOpacity } from 'react-native';
import { AppText } from '../ui/text';
import { useNavigation } from '@react-navigation/native';
import FastImage from 'react-native-fast-image';
import { useTheme } from '@/theme/ThemeProvider';
import { createAgentScreenStyles } from '@/theme/createStep10Styles';

export const AgentPopover = () => {
  const { colors } = useTheme();
  const styles = useMemo(
    () => createAgentScreenStyles(colors).agentPopover,
    [colors],
  );
  const navigation = useNavigation();
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

  // create agent
  const createAgent = () => {
    navigation.navigate('AgentStack', { screen: 'CreateAgent' });
    toggle(false);
  };

  // marketplace
  const marketplace = () => {
    navigation.navigate('AgentStack', { screen: 'Marketplace' });
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
            <TouchableOpacity style={styles.menuItem} onPress={createAgent}>
              <FastImage
                source={require('@/assets/icons/new-group.png')}
                style={styles.menuIcon}
              />
              <AppText variant="medium" size={15} style={styles.menuText}>
                Create Agent
              </AppText>
            </TouchableOpacity>

            <View style={styles.separator} />

            <TouchableOpacity style={styles.menuItem} onPress={marketplace}>
              <FastImage
                source={require('@/assets/icons/direct-message.png')}
                style={styles.menuIcon}
              />
              <AppText variant="medium" size={15} style={styles.menuText}>
                Agent Marketplace
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
