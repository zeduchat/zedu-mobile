import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Pressable, TouchableOpacity, View } from 'react-native';
import { AppText } from '@/components/ui/text';
import { ShowNotify } from '@/components/ui/toast';
import { useDataContext } from '@/store/useDataContext';
import { ACTIONS } from '@/store/types';
import BuzzService from '@/services/buzz.service';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { useTheme } from '@/theme/ThemeProvider';
import { createBuzzRecordingStyles } from '@/theme/createBuzzStyles';

const RecordingIndicator = () => {
  const { colors } = useTheme();
  const styles = useMemo(() => createBuzzRecordingStyles(colors), [colors]);
  const { state, dispatch } = useDataContext();
  const { buzzData, user: currentUser, buzzParticipants } = state;
  const [expanded, setExpanded] = useState(false);
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const pulseOpacity = useRef(new Animated.Value(0.75)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.parallel([
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 2.2,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 0,
            useNativeDriver: true,
          }),
        ]),
        Animated.sequence([
          Animated.timing(pulseOpacity, {
            toValue: 0,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseOpacity, {
            toValue: 0.75,
            duration: 0,
            useNativeDriver: true,
          }),
        ]),
      ]),
    );

    animation.start();
    return () => animation.stop();
  }, [pulseAnim, pulseOpacity]);

  const handleStop = async () => {
    const buzzId = buzzData?.buzz_id;
    if (!buzzId) return;

    const result = await BuzzService.stopRecording(buzzId);
    if (result.success) {
      dispatch({
        type: ACTIONS.BUZZ_DATA,
        payload: {
          ...buzzData,
          is_recording: false,
        },
      });
      ShowNotify('Success', 'Recording stopped');
      setExpanded(false);
    }
  };

  const currentUserId = String(currentUser?.user_id ?? currentUser?.id ?? '');
  const hostId = String(buzzData?.host_id ?? '');
  const participants = buzzData?.participants?.length
    ? buzzData.participants
    : buzzParticipants ?? [];

  const isHost =
    hostId !== '' &&
    currentUserId !== '' &&
    hostId === currentUserId &&
    (participants.length === 0 ||
      participants.some(
        (participant: any) =>
          String(participant?.user_id ?? participant?.id) === hostId,
      ));

  if (!buzzData?.is_recording) return null;

  return (
    <Pressable
      style={styles.container}
      onPress={() => isHost && setExpanded(prev => !prev)}
      disabled={!isHost}
    >
      <View style={[styles.badge, expanded && styles.badgeExpanded]}>
        <View style={styles.dotContainer}>
          <Animated.View
            style={[
              styles.pingDot,
              {
                transform: [{ scale: pulseAnim }],
                opacity: pulseOpacity,
              },
            ]}
          />
          <View style={styles.solidDot} />
        </View>

        <AppText style={styles.label}>Recording</AppText>

        {expanded && isHost ? (
          <TouchableOpacity
            style={styles.stopButton}
            onPress={handleStop}
            activeOpacity={0.8}
          >
            <MaterialIcons name="stop" size={10} color={colors.white} />
            <AppText style={styles.stopLabel}>Stop</AppText>
          </TouchableOpacity>
        ) : null}
      </View>
    </Pressable>
  );
};

export default RecordingIndicator;
