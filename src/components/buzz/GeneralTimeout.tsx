import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { View, TouchableOpacity, Animated } from 'react-native';
import { AppText } from '@/components/ui/text';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTheme } from '@/theme/ThemeProvider';
import { createBuzzTimeoutStyles } from '@/theme/createBuzzStyles';
import BuzzService from '@/services/buzz.service';
import { useDataContext } from '@/store/useDataContext';
import { ACTIONS } from '@/store/types';

interface GeneralTimeoutProps {
  buzzData: any;
  onLeave?: () => void;
}

const CALL_DURATION_MS = 60 * 60 * 1000;
const WARNING_THRESHOLD_MS = 5 * 60 * 1000;

export const GeneralTimeout = ({ buzzData, onLeave }: GeneralTimeoutProps) => {
  const { colors } = useTheme();
  const styles = useMemo(() => createBuzzTimeoutStyles(colors), [colors]);
  const [isVisible, setIsVisible] = useState(false);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [isLeaving, setIsLeaving] = useState(false);

  const { dispatch } = useDataContext();

  const slideAnim = useRef(new Animated.Value(-100)).current;
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const handleTerminateMeeting = useCallback(async () => {
    if (isLeaving) return;
    setIsLeaving(true);

    try {
      await BuzzService.leaveBuzz(buzzData?.buzz_code);
      dispatch({ type: ACTIONS.HAS_JOINED, payload: false });
    } catch (error) {
      console.error('Error leaving buzz:', error);
    } finally {
      onLeave?.();
    }
  }, [buzzData?.buzz_code, isLeaving, onLeave, dispatch]);

  useEffect(() => {
    const createdAt = buzzData?.created_at;
    if (!createdAt) return;

    timerRef.current = setInterval(() => {
      const startTime = new Date(createdAt).getTime();
      const now = new Date().getTime();
      const elapsed = now - startTime;
      const remaining = CALL_DURATION_MS - elapsed;

      if (remaining <= 0) {
        if (timerRef.current) clearInterval(timerRef.current);
        handleTerminateMeeting();
        return;
      }

      setTimeLeft(Math.floor(remaining / 1000));

      if (remaining <= WARNING_THRESHOLD_MS && !isVisible) {
        setIsVisible(true);
      } else if (remaining > WARNING_THRESHOLD_MS && isVisible) {
        setIsVisible(false);
      }
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [buzzData?.created_at, isVisible, handleTerminateMeeting]);

  useEffect(() => {
    if (isVisible) {
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        friction: 8,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: -100,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
  }, [isVisible, slideAnim]);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleDismiss = useCallback(() => {
    setIsVisible(false);
  }, []);

  if (!isVisible || timeLeft === null) return null;

  const progressPercent = (timeLeft / (WARNING_THRESHOLD_MS / 1000)) * 100;

  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [{ translateY: slideAnim }],
        },
      ]}
    >
      <View style={styles.content}>
        <View style={styles.header}>
          <View style={styles.iconContainer}>
            <MaterialCommunityIcons
              name="timer-outline"
              size={20}
              color={colors.error}
            />
          </View>
          <View style={styles.textContainer}>
            <AppText variant="bold" style={styles.title}>
              Call ending soon
            </AppText>
            <AppText style={styles.subtitle}>
              This call will end for everyone in {formatTime(timeLeft)}
            </AppText>
          </View>
          <TouchableOpacity onPress={handleDismiss} style={styles.closeButton}>
            <Ionicons name="close" size={20} color={colors.textMuted} />
          </TouchableOpacity>
        </View>

        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={[styles.button, styles.dismissButton]}
            onPress={handleDismiss}
          >
            <AppText style={styles.dismissButtonText}>Dismiss</AppText>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.button, styles.leaveButton]}
            onPress={handleTerminateMeeting}
            disabled={isLeaving}
          >
            <AppText style={styles.leaveButtonText}>Leave now</AppText>
          </TouchableOpacity>
        </View>

        <View style={styles.progressBarBackground}>
          <View
            style={[styles.progressBarFill, { width: `${progressPercent}%` }]}
          />
        </View>
      </View>
    </Animated.View>
  );
};

export default GeneralTimeout;
