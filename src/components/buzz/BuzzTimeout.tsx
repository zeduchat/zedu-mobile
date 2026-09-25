import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { View, Modal, TouchableOpacity, ActivityIndicator } from 'react-native';
import { AppText } from '@/components/ui/text';
import { useTheme } from '@/theme/ThemeProvider';
import { createBuzzTimeoutStyles } from '@/theme/createBuzzStyles';
import BuzzService from '@/services/buzz.service';
import { useDataContext } from '@/store/useDataContext';
import { ACTIONS } from '@/store/types';

interface BuzzTimeoutProps {
  participantCount: number;
  buzzCode: string;
  onLeave?: () => void;
}

const GRACE_PERIOD_MS = 5 * 60 * 1000; // 5 minutes
const COUNTDOWN_DURATION_S = 120; // 2 minutes

export const BuzzTimeout = ({
  participantCount,
  buzzCode,
  onLeave,
}: BuzzTimeoutProps) => {
  const { colors } = useTheme();
  const styles = useMemo(() => createBuzzTimeoutStyles(colors), [colors]);
  const [isVisible, setIsVisible] = useState(false);
  const [timeLeft, setTimeLeft] = useState(COUNTDOWN_DURATION_S);
  const [isLeaving, setIsLeaving] = useState(false);

  const graceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const countdownTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const countdownStartedRef = useRef(false);

  const { dispatch } = useDataContext();

  // Handle terminating the call
  const handleTerminateMeeting = useCallback(async () => {
    if (isLeaving) return;
    setIsLeaving(true);

    try {
      await BuzzService.leaveBuzz(buzzCode);
      dispatch({ type: ACTIONS.HAS_JOINED, payload: false });
    } catch (error) {
      console.error('Error leaving buzz:', error);
    } finally {
      onLeave?.();
    }
  }, [buzzCode, isLeaving, onLeave]);

  // Grace period and countdown logic
  useEffect(() => {
    // Clean up existing timers
    if (graceTimerRef.current) clearTimeout(graceTimerRef.current);
    if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
    countdownStartedRef.current = false;

    if (participantCount <= 1) {
      // Start grace period (5 minutes)
      graceTimerRef.current = setTimeout(() => {
        setIsVisible(true);
        setTimeLeft(COUNTDOWN_DURATION_S);
        countdownStartedRef.current = true;
      }, GRACE_PERIOD_MS);
    } else {
      // Close modal if other participants join
      setIsVisible(false);
      setTimeLeft(COUNTDOWN_DURATION_S);
      countdownStartedRef.current = false;
    }

    return () => {
      if (graceTimerRef.current) clearTimeout(graceTimerRef.current);
      if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
    };
  }, [participantCount]);

  // Countdown timer
  useEffect(() => {
    if (isVisible && timeLeft > 0) {
      countdownTimerRef.current = setInterval(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
    } else if (isVisible && timeLeft === 0) {
      // Time's up - auto leave
      handleTerminateMeeting();
    }

    return () => {
      if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
    };
  }, [isVisible, timeLeft, handleTerminateMeeting]);

  const handleStay = useCallback(() => {
    setIsVisible(false);
    setTimeLeft(COUNTDOWN_DURATION_S);
    countdownStartedRef.current = false;
  }, []);

  const handleLeaveNow = useCallback(() => {
    handleTerminateMeeting();
  }, [handleTerminateMeeting]);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <Modal
      visible={isVisible}
      transparent={true}
      animationType="fade"
      onRequestClose={() => {
        // Prevent closing on back press
      }}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          <View style={styles.timerCircle}>
            <AppText style={styles.timerText}>{formatTime(timeLeft)}</AppText>
          </View>

          <AppText style={styles.modalTitle}>Are you still there?</AppText>

          <AppText style={styles.message}>
            You're the only one here, so this call will end in less than 2
            minutes.{'\n'}
            Do you want to stay in this call?
          </AppText>

          <View style={styles.modalButtonRow}>
            <TouchableOpacity
              style={[styles.modalButton, styles.modalLeaveButton]}
              onPress={handleLeaveNow}
              disabled={isLeaving}
            >
              {isLeaving ? (
                <ActivityIndicator color={colors.primary} size="small" />
              ) : (
                <AppText style={styles.modalLeaveButtonText}>Leave now</AppText>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.modalButton, styles.stayButton]}
              onPress={handleStay}
              disabled={isLeaving}
            >
              <AppText style={styles.stayButtonText}>Stay in the call</AppText>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default BuzzTimeout;
