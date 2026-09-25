import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Animated,
  TouchableOpacity,
  Modal,
  StyleSheet,
  StatusBar,
} from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Reanimated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import {
  RtcSurfaceView,
  VideoSourceType,
  RenderModeType,
} from 'react-native-agora';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { AppText } from '@/components/ui/text';
import { AudioVisualizer } from './AudioVisualizer';
import { getRandomBgColor } from '@/utils/colorUtils';
import FastImage from 'react-native-fast-image';
import AgoraService from '@/services/agora.service';
import { useTheme } from '@/theme/ThemeProvider';
import { createBuzzParticipantStyles } from '@/theme/createBuzzStyles';

interface ParticipantCardProps {
  userId: string;
  displayName: string;
  avatarUrl?: string;
  handsRaised: boolean;
  hasvideoTrack: boolean;
  hasaudioTrack: boolean;
  hasScreenTrack?: boolean;
  isMe: boolean;
  agoraUid: number;
  screenAgoraUid?: number;
  cardWidth: number;
  joinStatus?: 'pending' | 'accepted' | 'declined' | 'timeout';
  color?: string;
}

export const ParticipantCard = ({
  userId,
  displayName,
  avatarUrl,
  handsRaised,
  hasvideoTrack,
  hasaudioTrack,
  hasScreenTrack = false,
  isMe,
  agoraUid,
  screenAgoraUid = 0,
  cardWidth,
  joinStatus,
  color,
}: ParticipantCardProps) => {
  const { colors } = useTheme();
  const styles = useMemo(() => createBuzzParticipantStyles(colors), [colors]);
  const bgColor = color?.trim() || getRandomBgColor(userId);
  const hasAvatar = !!avatarUrl?.trim();
  const avatarSource = hasAvatar ? { uri: avatarUrl } : undefined;
  const avatarInitial = (displayName?.trim()?.charAt(0) || '?').toUpperCase();
  const isPending = joinStatus === 'pending';
  const isShowingScreen = hasScreenTrack;
  const isShowingVideo = hasvideoTrack && !isShowingScreen;
  const cameraRtcUid = isMe
    ? 0
    : agoraUid > 0
    ? agoraUid
    : AgoraService.getUidByUserAccount(userId) ?? 0;
  const screenRtcUid = isMe
    ? 0
    : screenAgoraUid > 0
    ? screenAgoraUid
    : cameraRtcUid;
  const rtcUid = isShowingScreen ? screenRtcUid : cameraRtcUid;
  const canRenderRtc = isMe || rtcUid > 0;
  const screenShareConnection = isShowingScreen
    ? AgoraService.getScreenShareConnection()
    : null;
  const [isScreenFullscreen, setIsScreenFullscreen] = useState(false);
  const [screenViewKey, setScreenViewKey] = useState(0);

  const openScreenFullscreen = () => {
    setIsScreenFullscreen(true);
  };

  const closeScreenFullscreen = () => {
    setIsScreenFullscreen(false);
    setTimeout(() => {
      setScreenViewKey(prev => prev + 1);
    }, 100);
  };

  const screenShareCanvas = {
    uid: rtcUid,
    sourceType: isMe
      ? VideoSourceType.VideoSourceScreen
      : VideoSourceType.VideoSourceRemote,
    renderMode: RenderModeType.RenderModeFit,
  };

  const fullscreenScale = useSharedValue(1);
  const fullscreenSavedScale = useSharedValue(1);
  const fullscreenTranslateX = useSharedValue(0);
  const fullscreenTranslateY = useSharedValue(0);
  const fullscreenSavedTranslateX = useSharedValue(0);
  const fullscreenSavedTranslateY = useSharedValue(0);

  const resetFullscreenZoom = () => {
    fullscreenScale.value = 1;
    fullscreenSavedScale.value = 1;
    fullscreenTranslateX.value = 0;
    fullscreenTranslateY.value = 0;
    fullscreenSavedTranslateX.value = 0;
    fullscreenSavedTranslateY.value = 0;
  };

  useEffect(() => {
    if (!isScreenFullscreen) {
      resetFullscreenZoom();
    }
  }, [isScreenFullscreen]);

  const fullscreenPinchGesture = Gesture.Pinch()
    .onUpdate(event => {
      fullscreenScale.value = Math.min(
        Math.max(fullscreenSavedScale.value * event.scale, 1),
        4,
      );
    })
    .onEnd(() => {
      if (fullscreenScale.value <= 1) {
        fullscreenScale.value = withTiming(1);
        fullscreenSavedScale.value = 1;
        fullscreenTranslateX.value = withTiming(0);
        fullscreenTranslateY.value = withTiming(0);
        fullscreenSavedTranslateX.value = 0;
        fullscreenSavedTranslateY.value = 0;
        return;
      }
      fullscreenSavedScale.value = fullscreenScale.value;
    });

  const fullscreenPanGesture = Gesture.Pan()
    .averageTouches(true)
    .onUpdate(event => {
      if (fullscreenScale.value > 1) {
        fullscreenTranslateX.value =
          fullscreenSavedTranslateX.value + event.translationX;
        fullscreenTranslateY.value =
          fullscreenSavedTranslateY.value + event.translationY;
      }
    })
    .onEnd(() => {
      fullscreenSavedTranslateX.value = fullscreenTranslateX.value;
      fullscreenSavedTranslateY.value = fullscreenTranslateY.value;
    });

  const fullscreenZoomGesture = Gesture.Simultaneous(
    fullscreenPinchGesture,
    fullscreenPanGesture,
  );

  const fullscreenAnimatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: fullscreenTranslateX.value },
      { translateY: fullscreenTranslateY.value },
      { scale: fullscreenScale.value },
    ],
  }));

  const blinkAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (!isPending) {
      blinkAnim.stopAnimation(() => {
        blinkAnim.setValue(1);
      });
      return;
    }

    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(blinkAnim, {
          toValue: 0.35,
          duration: 700,
          useNativeDriver: true,
        }),
        Animated.timing(blinkAnim, {
          toValue: 1,
          duration: 700,
          useNativeDriver: true,
        }),
      ]),
    );
    animation.start();
    return () => {
      animation.stop();
      blinkAnim.setValue(1);
    };
  }, [isPending, blinkAnim]);

  return (
    <Animated.View
      key={userId}
      style={[
        styles.card,
        { width: cardWidth },
        !isShowingVideo && !isShowingScreen && { backgroundColor: bgColor },
        isPending ? { opacity: blinkAnim } : { opacity: 1 },
      ]}
    >
      {isPending && (
        <View style={styles.ringingBadge}>
          <AppText style={styles.ringingText}>Ringing…</AppText>
        </View>
      )}

      {isShowingScreen && canRenderRtc ? (
        <>
          <TouchableOpacity
            activeOpacity={0.95}
            style={styles.videoWrapper}
            onPress={openScreenFullscreen}
          >
            {!isScreenFullscreen ? (
              <RtcSurfaceView
                key={`screen-${rtcUid}-${
                  screenShareConnection?.localUid ?? 'main'
                }-${screenViewKey}`}
                canvas={screenShareCanvas}
                connection={screenShareConnection ?? undefined}
                style={styles.rtcSurfaceViewFull}
                zOrderMediaOverlay={true}
              />
            ) : null}
            <View style={styles.presentingBadge}>
              <MaterialCommunityIcons
                name="monitor-share"
                size={12}
                color={colors.white}
              />
              <AppText style={styles.presentingText}>
                {isMe ? 'You are presenting' : `${displayName} is presenting`}
              </AppText>
            </View>
            <View style={styles.videoUsernameBadge}>
              <AppText style={styles.videoUsername}>{displayName}</AppText>
            </View>
            <View
              style={[styles.micBadge, !hasaudioTrack && styles.micBadgeMuted]}
            >
              <Ionicons
                name={hasaudioTrack ? 'mic' : 'mic-off'}
                size={14}
                color={colors.white}
              />
            </View>
          </TouchableOpacity>
          <Modal
            visible={isScreenFullscreen}
            animationType="fade"
            presentationStyle="fullScreen"
            onRequestClose={closeScreenFullscreen}
          >
            <StatusBar hidden />
            <View style={screenShareFullscreenStyles.container}>
              <TouchableOpacity
                style={screenShareFullscreenStyles.closeButton}
                onPress={closeScreenFullscreen}
              >
                <Ionicons name="close" size={28} color={colors.white} />
              </TouchableOpacity>
              {isScreenFullscreen ? (
                <GestureDetector gesture={fullscreenZoomGesture}>
                  <Reanimated.View
                    style={[
                      screenShareFullscreenStyles.video,
                      fullscreenAnimatedStyle,
                    ]}
                  >
                    <RtcSurfaceView
                      key={`screen-fullscreen-${rtcUid}-${
                        screenShareConnection?.localUid ?? 'main'
                      }`}
                      canvas={screenShareCanvas}
                      connection={screenShareConnection ?? undefined}
                      style={screenShareFullscreenStyles.videoSurface}
                      zOrderMediaOverlay={true}
                    />
                  </Reanimated.View>
                </GestureDetector>
              ) : null}
              <View style={screenShareFullscreenStyles.nameBadge}>
                <AppText style={screenShareFullscreenStyles.nameText}>
                  {isMe ? 'You are presenting' : `${displayName} is presenting`}
                </AppText>
              </View>
            </View>
          </Modal>
        </>
      ) : isShowingVideo && canRenderRtc ? (
        <View style={styles.videoWrapper}>
          <RtcSurfaceView
            key={`video-${rtcUid}`}
            canvas={{
              uid: rtcUid,
              sourceType: isMe
                ? VideoSourceType.VideoSourceCamera
                : VideoSourceType.VideoSourceRemote,
            }}
            style={styles.rtcSurfaceViewFull}
            zOrderMediaOverlay={true}
          />
          <View style={styles.videoUsernameBadge}>
            <AppText style={styles.videoUsername}>{displayName}</AppText>
          </View>
          <View
            style={[styles.micBadge, !hasaudioTrack && styles.micBadgeMuted]}
          >
            <Ionicons
              name={hasaudioTrack ? 'mic' : 'mic-off'}
              size={14}
              color={colors.white}
            />
          </View>
        </View>
      ) : (
        <View style={styles.avatarWrapper}>
          <View style={styles.audioVisualizerContainer}>
            {hasaudioTrack && <AudioVisualizer isActive={hasaudioTrack} />}
            {hasAvatar && avatarSource ? (
              <FastImage source={avatarSource} style={styles.cardAvatar} />
            ) : (
              <View style={styles.avatarFallback}>
                <AppText style={styles.avatarFallbackText}>
                  {avatarInitial}
                </AppText>
              </View>
            )}
          </View>
          <AppText style={styles.cardName}>{displayName}</AppText>
        </View>
      )}

      {handsRaised && (
        <View style={styles.handRaiseBadge}>
          <MaterialIcons
            name="back-hand"
            size={16}
            color={colors.textPrimary}
          />
        </View>
      )}
    </Animated.View>
  );
};

const screenShareFullscreenStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  video: {
    flex: 1,
    width: '100%',
  },
  videoSurface: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  closeButton: {
    position: 'absolute',
    top: 52,
    right: 16,
    zIndex: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  nameBadge: {
    position: 'absolute',
    top: 52,
    left: 16,
    zIndex: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    maxWidth: '70%',
  },
  nameText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});
