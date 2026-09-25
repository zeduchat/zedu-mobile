import React, { useEffect, useMemo, useRef } from 'react';
import {
  ActivityIndicator,
  Animated,
  Pressable,
  StatusBar,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { AppText } from '@/components/ui/text';
import { normalize } from '@/utils/normalize';
import FastImage from 'react-native-fast-image';
import { useTheme } from '@/theme/ThemeProvider';
import { createIncomingCallStyles } from '@/theme/createStep10Styles';

interface IncomingCallContentProps {
  callerName: string;
  callerAvatar?: string;
  countdown: number;
  isLoading: boolean;
  onActionPressIn?: () => void;
  onDecline: () => void;
  onAccept: () => void;
}

const formatCountdown = (seconds: number) => {
  const safeSeconds = Math.max(0, seconds);
  const minutes = Math.floor(safeSeconds / 60);
  const remainingSeconds = safeSeconds % 60;

  return `${String(minutes).padStart(2, '0')}:${String(
    remainingSeconds,
  ).padStart(2, '0')}`;
};

const IncomingCallContent = ({
  callerName,
  callerAvatar,
  countdown,
  isLoading,
  onActionPressIn,
  onDecline,
  onAccept,
}: IncomingCallContentProps) => {
  const { colors } = useTheme();
  const styles = useMemo(() => createIncomingCallStyles(colors), [colors]);
  const primaryPulse = useRef(new Animated.Value(0)).current;
  const secondaryPulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (isLoading) {
      primaryPulse.stopAnimation();
      secondaryPulse.stopAnimation();
      return;
    }

    const createPulse = (animatedValue: Animated.Value, delay: number) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(animatedValue, {
            toValue: 1,
            duration: 2200,
            useNativeDriver: true,
          }),
          Animated.timing(animatedValue, {
            toValue: 0,
            duration: 0,
            useNativeDriver: true,
          }),
        ]),
      );

    const primaryAnimation = createPulse(primaryPulse, 0);
    const secondaryAnimation = createPulse(secondaryPulse, 900);

    primaryAnimation.start();
    secondaryAnimation.start();

    return () => {
      primaryAnimation.stop();
      secondaryAnimation.stop();
    };
  }, [isLoading, primaryPulse, secondaryPulse]);

  const primaryRingStyle = useMemo(
    () => ({
      opacity: primaryPulse.interpolate({
        inputRange: [0, 1],
        outputRange: [0.42, 0],
      }),
      transform: [
        {
          scale: primaryPulse.interpolate({
            inputRange: [0, 1],
            outputRange: [1, 1.75],
          }),
        },
      ],
    }),
    [primaryPulse],
  );

  const secondaryRingStyle = useMemo(
    () => ({
      opacity: secondaryPulse.interpolate({
        inputRange: [0, 1],
        outputRange: [0.28, 0],
      }),
      transform: [
        {
          scale: secondaryPulse.interpolate({
            inputRange: [0, 1],
            outputRange: [1, 1.45],
          }),
        },
      ],
    }),
    [secondaryPulse],
  );

  return (
    <SafeAreaView edges={['top', 'bottom']} style={styles.safeArea}>
      <StatusBar
        barStyle="light-content"
        translucent
        backgroundColor="transparent"
      />

      <View style={styles.container}>
        <View style={styles.topRow}>
          <View style={styles.infoPill}>
            <Ionicons name="lock-closed" size={normalize(13)} color="#E7FFF4" />
            <AppText style={styles.infoPillText}>Secure voice call</AppText>
          </View>

          <View style={styles.infoPill}>
            <Ionicons
              name="time-outline"
              size={normalize(13)}
              color="#E7FFF4"
            />
            <AppText style={styles.infoPillText}>
              {formatCountdown(countdown)}
            </AppText>
          </View>
        </View>

        <View style={styles.content}>
          <AppText style={styles.kicker}>Incoming call</AppText>
          <AppText variant="bold" style={styles.callerName}>
            {callerName}
          </AppText>
          <AppText style={styles.subText}>waiting for your response</AppText>

          <View style={styles.avatarStage}>
            <Animated.View style={[styles.pulseRing, primaryRingStyle]} />
            <Animated.View
              style={[
                styles.pulseRing,
                styles.pulseRingSecondary,
                secondaryRingStyle,
              ]}
            />

            <View style={styles.avatarHalo}>
              <FastImage source={{ uri: callerAvatar }} style={styles.avatar} />
            </View>
          </View>
        </View>

        <View style={styles.bottomDock}>
          {isLoading ? (
            <View style={styles.loadingWrap}>
              <ActivityIndicator color="#FFFFFF" size="small" />
              <AppText style={styles.loadingText}>Connecting…</AppText>
            </View>
          ) : (
            <>
              <View style={styles.actionRow}>
                <Pressable
                  style={styles.actionGroup}
                  onPressIn={onActionPressIn}
                  onPress={onDecline}
                >
                  <View style={[styles.actionButton, styles.declineButton]}>
                    <Ionicons
                      name="call"
                      size={normalize(24)}
                      color="#FFFFFF"
                      style={styles.declineIcon}
                    />
                  </View>
                  <AppText style={styles.actionLabel}>Decline</AppText>
                </Pressable>

                <Pressable
                  style={styles.actionGroup}
                  onPressIn={onActionPressIn}
                  onPress={onAccept}
                >
                  <View style={[styles.actionButton, styles.acceptButton]}>
                    <Ionicons
                      name="call"
                      size={normalize(24)}
                      color="#FFFFFF"
                    />
                  </View>
                  <AppText style={styles.actionLabel}>Accept</AppText>
                </Pressable>
              </View>
            </>
          )}
        </View>
      </View>
    </SafeAreaView>
  );
};

export default IncomingCallContent;
