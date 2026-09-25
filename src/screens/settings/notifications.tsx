import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  View,
  TouchableOpacity,
  ActivityIndicator,
  Animated,
  Easing,
  FlatList,
} from 'react-native';
import { AppText } from '@/components/ui/text';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Feather from 'react-native-vector-icons/Feather';
import Container from '@/components/layout/container';
import AppBottomSheet from '@/components/ui/bottom-sheet';
import { useDataContext } from '@/store/useDataContext';
import { PostRequest, GetRequest } from '@/utils/requests';
import { ACTIONS } from '@/store/types';
import { useTheme } from '@/theme/ThemeProvider';
import { createSettingsSubScreenStyles } from '@/theme/createScreenStyles';
import type { ThemeColors } from '@/theme/types';

const TIME_OPTIONS = Array.from({ length: 24 * 2 }, (_, i) => {
  const hour = Math.floor(i / 2);
  const min = i % 2 === 0 ? '00' : '30';
  const ampm = hour < 12 ? 'AM' : 'PM';
  const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
  return `${displayHour}:${min} ${ampm}`;
});

const CustomToggle = ({
  active,
  onPress,
  toggleStyles,
  colors,
}: {
  active: boolean;
  onPress: () => void;
  toggleStyles: ReturnType<typeof createSettingsSubScreenStyles>;
  colors: ThemeColors;
}) => {
  const animatedValue = useRef(new Animated.Value(active ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(animatedValue, {
      toValue: active ? 1 : 0,
      duration: 250,
      easing: Easing.bezier(0.4, 0.0, 0.2, 1),
      useNativeDriver: false,
    }).start();
  }, [active]);

  const translateX = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [2, 18],
  });

  const backgroundColor = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [colors.iconMuted, colors.primary],
  });

  return (
    <TouchableOpacity activeOpacity={0.9} onPress={onPress}>
      <Animated.View
        style={[toggleStyles.toggleContainer, { backgroundColor }]}
      >
        <Animated.View
          style={[toggleStyles.toggleCircle, { transform: [{ translateX }] }]}
        />
      </Animated.View>
    </TouchableOpacity>
  );
};

const SkeletonItem = ({
  width,
  height,
  style,
  skeletonStyle,
}: {
  width: number | string;
  height: number;
  style?: object;
  skeletonStyle: object;
}) => <View style={[{ width, height }, skeletonStyle, style]} />;

const NotificationScreen = ({ navigation }: any) => {
  const { colors } = useTheme();
  const styles = useMemo(() => createSettingsSubScreenStyles(colors), [colors]);
  const { state, dispatch } = useDataContext();
  const { orgId } = state;
  const bottomSheetRef = useRef<any>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [selectingFor, setSelectingFor] = useState<'startTime' | 'endTime'>(
    'startTime',
  );

  const [prefs, setPrefs] = useState({
    notificationType: 'all',
    startTime: '12:00 AM',
    endTime: '11:59 PM',
    differentMobileSettings: false,
    emailNotifications: true,
  });

  useEffect(() => {
    const fetchPreferences = async () => {
      setIsLoading(true);
      const { error, data } = await GetRequest(
        `/organisations/${orgId}/notification-preference?device_type=mobile`,
      );

      if (!error && data?.data) {
        const resData = data.data;
        const timeRange = resData.time_range || '12:00 AM - 11:59 PM';
        const [from, to] = timeRange.split(' - ');

        setPrefs({
          notificationType:
            resData.notify_about === 'all_new_messages'
              ? 'all'
              : resData.notify_about,
          startTime: from,
          endTime: to,
          differentMobileSettings: resData.mobile_override || false,
          emailNotifications: resData.send_mail || false,
        });
      }
      setIsLoading(false);
    };

    if (orgId) fetchPreferences();
  }, [orgId]);

  const handleSave = async () => {
    setIsSaving(true);
    const payload = {
      notify_about:
        prefs.notificationType === 'all'
          ? 'all_new_messages'
          : prefs.notificationType === 'mentions'
          ? 'mentions'
          : 'nothing',
      send_mail: prefs.emailNotifications,
      time_range: `${prefs.startTime} - ${prefs.endTime}`,
      device_type: 'mobile',
      mobile_override: prefs.differentMobileSettings,
    };

    const { data, error } = await PostRequest(
      `/organisations/${orgId}/notification-preference?device_type=mobile`,
      payload,
    );

    if (!error) {
      dispatch({
        type: ACTIONS.SUCCESS,
        payload: data.message || 'Preferences updated',
      });
      navigation.goBack();
    } else {
      dispatch({ type: ACTIONS.ERROR, payload: 'Failed to update' });
    }
    setIsSaving(false);
  };

  const openTimePicker = (target: 'startTime' | 'endTime') => {
    setSelectingFor(target);
    bottomSheetRef.current?.expand();
  };

  const selectTime = (time: string) => {
    setPrefs(prev => ({ ...prev, [selectingFor]: time }));
    bottomSheetRef.current?.close();
  };

  const RadioItem = ({
    label,
    value,
    active,
  }: {
    label: string;
    value: string;
    active: boolean;
  }) => (
    <TouchableOpacity
      style={styles.radioRow}
      onPress={() => setPrefs({ ...prefs, notificationType: value })}
    >
      <View style={[styles.radioOuter, active && styles.radioOuterActive]}>
        {active && <View style={styles.radioInner} />}
      </View>
      <AppText style={styles.radioLabel}>{label}</AppText>
    </TouchableOpacity>
  );

  const renderHeader = () => {
    if (isLoading) {
      return (
        <View style={styles.formContent}>
          <SkeletonItem
            width="70%"
            height={20}
            skeletonStyle={styles.skeleton}
            style={{ marginBottom: 30 }}
          />
          <SkeletonItem
            width="40%"
            height={24}
            skeletonStyle={styles.skeleton}
            style={{ marginBottom: 20 }}
          />
          {[1, 2, 3].map(i => (
            <SkeletonItem
              key={i}
              width="100%"
              height={48}
              skeletonStyle={styles.skeleton}
              style={{ marginBottom: 15 }}
            />
          ))}
          <View style={styles.divider} />
          <SkeletonItem
            width="50%"
            height={24}
            skeletonStyle={styles.skeleton}
            style={{ marginBottom: 20 }}
          />
          <View style={styles.timePickerContainer}>
            <SkeletonItem
              width="47%"
              height={54}
              skeletonStyle={styles.skeleton}
              style={{ borderRadius: 10 }}
            />
            <SkeletonItem
              width="47%"
              height={54}
              skeletonStyle={styles.skeleton}
              style={{ borderRadius: 10 }}
            />
          </View>
        </View>
      );
    }

    return (
      <View style={styles.formContent}>
        <View style={styles.introSection}>
          <AppText style={styles.subText}>
            Manage when and why you get notified.
          </AppText>
        </View>

        <View style={styles.sectionContainer}>
          <AppText variant="bold" style={styles.sectionTitle}>
            Send notifications for:
          </AppText>
          <RadioItem
            label="All New Messages"
            value="all"
            active={prefs.notificationType === 'all'}
          />
          <RadioItem
            label="Mentions"
            value="mentions"
            active={prefs.notificationType === 'mentions'}
          />
          <RadioItem
            label="Nothing"
            value="nothing"
            active={prefs.notificationType === 'nothing'}
          />
        </View>

        <View style={styles.divider} />

        <View style={styles.sectionContainer}>
          <AppText variant="bold" style={styles.sectionTitle}>
            Receive notifications only within:
          </AppText>
          <View style={styles.timePickerContainer}>
            <View style={styles.timeBox}>
              <AppText size={12} style={styles.labelSmall}>
                From
              </AppText>
              <TouchableOpacity
                style={styles.timeInput}
                onPress={() => openTimePicker('startTime')}
              >
                <AppText style={styles.timeValue}>{prefs.startTime}</AppText>
                <Feather name="clock" size={18} color={colors.iconDefault} />
              </TouchableOpacity>
            </View>
            <View style={styles.timeBox}>
              <AppText size={12} style={styles.labelSmall}>
                To
              </AppText>
              <TouchableOpacity
                style={styles.timeInput}
                onPress={() => openTimePicker('endTime')}
              >
                <AppText style={styles.timeValue}>{prefs.endTime}</AppText>
                <Feather name="clock" size={18} color={colors.iconDefault} />
              </TouchableOpacity>
            </View>
          </View>
          <AppText style={styles.noteText}>
            <AppText variant="bold" style={{ color: colors.textSecondary }}>
              Note:
            </AppText>{' '}
            Outside this time, notifications are paused.
          </AppText>
        </View>

        <View style={styles.divider} />

        <View style={styles.sectionContainer}>
          <AppText variant="bold" style={styles.sectionTitle}>
            To keep me informed:
          </AppText>
          <View style={styles.toggleRow}>
            <CustomToggle
              active={prefs.emailNotifications}
              onPress={() =>
                setPrefs({
                  ...prefs,
                  emailNotifications: !prefs.emailNotifications,
                })
              }
              toggleStyles={styles}
              colors={colors}
            />
            <AppText style={styles.toggleLabel}>
              Receive notifications via email
            </AppText>
          </View>
        </View>

        <TouchableOpacity
          style={[styles.saveButton, isSaving && { opacity: 0.7 }]}
          onPress={handleSave}
          disabled={isSaving}
        >
          {isSaving && <ActivityIndicator color={colors.white} />}
          <AppText variant="bold" style={styles.saveButtonText}>
            Save Changes
          </AppText>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <Container>
      <View style={styles.stackHeader}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backBtn}
        >
          <Ionicons name="chevron-back" size={24} color={colors.iconDefault} />
          <AppText variant="bold" style={styles.headerTitle}>
            Notification Preferences
          </AppText>
        </TouchableOpacity>
        {isSaving && !isLoading && (
          <ActivityIndicator size="small" color={colors.primary} />
        )}
      </View>

      <FlatList
        data={[]}
        renderItem={null}
        ListHeaderComponent={renderHeader}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      />

      <AppBottomSheet ref={bottomSheetRef} snapPoints={['50%']}>
        {TIME_OPTIONS.map(item => (
          <TouchableOpacity
            key={item}
            style={styles.timeOption}
            onPress={() => selectTime(item)}
          >
            <AppText
              style={[
                styles.timeOptionText,
                (selectingFor === 'startTime'
                  ? prefs.startTime
                  : prefs.endTime) === item && styles.timeOptionTextActive,
              ]}
            >
              {item}
            </AppText>
            {(selectingFor === 'startTime'
              ? prefs.startTime
              : prefs.endTime) === item && (
              <Ionicons name="checkmark" size={20} color={colors.primary} />
            )}
          </TouchableOpacity>
        ))}
      </AppBottomSheet>
    </Container>
  );
};

export default NotificationScreen;
