import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  ImageBackground,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { RtcSurfaceView } from 'react-native-agora';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { AppText } from '@/components/ui/text';
import { useTheme } from '@/theme/ThemeProvider';
import { createBuzzGreenRoomComponentStyles } from '@/theme/createBuzzStyles';
import AgoraService from '@/services/agora.service';
import FastImage from 'react-native-fast-image';

interface GreenRoomProps {
  currentUser: any;
  isMuted: boolean;
  showVideo: boolean;
  onToggleMic: () => void;
  onToggleVideo: () => void;
  onJoinCall: () => void;
  onGoHome: () => void;
  buzzData?: any;
}

export const GreenRoom = ({
  currentUser,
  isMuted,
  showVideo,
  onToggleMic,
  onToggleVideo,
  onJoinCall,
  onGoHome,
  buzzData,
}: GreenRoomProps) => {
  const { colors } = useTheme();
  const styles = useMemo(
    () => createBuzzGreenRoomComponentStyles(colors),
    [colors],
  );
  const [pulseAnim] = useState(new Animated.Value(1));
  const [fadeAnim] = useState(new Animated.Value(0));
  const [slideAnim] = useState(new Animated.Value(50));

  // Sync media state with Agora when entering greenroom
  useEffect(() => {
    const syncMediaState = async () => {
      try {
        if (isMuted) {
          await AgoraService.toggleMicrophone(false);
        } else {
          await AgoraService.toggleMicrophone(true);
        }
      } catch (error) {
        console.error('Error syncing mic state:', error);
      }
    };
    syncMediaState();
  }, [isMuted]);

  useEffect(() => {
    const syncVideoState = async () => {
      try {
        if (showVideo) {
          await AgoraService.toggleCamera(false);
        } else {
          await AgoraService.toggleCamera(true);
        }
      } catch (error) {
        console.error('Error syncing video state:', error);
      }
    };
    syncVideoState();
  }, [showVideo]);

  // Animated entrance effects
  useEffect(() => {
    // Pulse animation for join button
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.05,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ]),
    ).start();

    // Fade in animation
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();

    // Slide up animation
    Animated.timing(slideAnim, {
      toValue: 0,
      duration: 500,
      useNativeDriver: true,
    }).start();
  }, [pulseAnim, fadeAnim, slideAnim]);

  const displayName = currentUser?.username || currentUser?.full_name || 'You';
  const avatarUrl = currentUser?.avatar_url;
  const buzzTitle = buzzData?.title || 'Buzz Call';
  const participantCount = buzzData?.participants?.length || 0;

  return (
    <ImageBackground
      source={require('@/assets/images/call-bg.png')}
      style={styles.container}
    >
      <View style={styles.gradientOverlay}>
        <Animated.View
          style={[
            styles.contentWrapper,
            { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
          ]}
        >
          {/* Header Section */}
          <View style={styles.headerSection}>
            <View style={styles.headerBadge}>
              <View style={styles.liveDot} />
              <AppText variant="semiBold" style={styles.headerBadgeText}>
                Ready to Join
              </AppText>
            </View>

            <AppText variant="bold" style={styles.buzzTitle}>
              {buzzTitle}
            </AppText>

            <View style={styles.participantsInfo}>
              <Ionicons name="people" size={16} color={colors.secondary} />
              <AppText variant="medium" style={styles.participantsText}>
                {participantCount}{' '}
                {participantCount === 1 ? 'participant' : 'participants'} in
                call
              </AppText>
            </View>
          </View>

          {/* Camera Preview Section */}
          <View style={styles.previewSection}>
            <View style={styles.previewCard}>
              {/* Decorative Corner Elements */}
              <View style={[styles.cornerDecor, styles.topLeftCorner]} />
              <View style={[styles.cornerDecor, styles.topRightCorner]} />
              <View style={[styles.cornerDecor, styles.bottomLeftCorner]} />
              <View style={[styles.cornerDecor, styles.bottomRightCorner]} />

              {/* Camera Preview or Avatar */}
              <View style={styles.videoPreviewContainer}>
                {showVideo ? (
                  <RtcSurfaceView
                    canvas={{ uid: 0 }}
                    style={styles.videoPreview}
                    zOrderMediaOverlay={true}
                  />
                ) : (
                  <View style={styles.avatarContainer}>
                    {avatarUrl ? (
                      <FastImage
                        source={{ uri: avatarUrl }}
                        style={styles.avatarImage}
                      />
                    ) : (
                      <AppText variant="bold" style={styles.avatarPlaceholder}>
                        {displayName.charAt(0).toUpperCase()}
                      </AppText>
                    )}
                  </View>
                )}

                {/* Status Overlay */}
                <View style={styles.statusOverlay}>
                  <View style={styles.statusBadge}>
                    <AppText variant="semiBold" style={styles.statusBadgeText}>
                      {displayName}
                    </AppText>
                  </View>
                </View>
              </View>

              {/* Device Controls */}
              <View style={styles.deviceControlsRow}>
                <TouchableOpacity
                  style={[
                    styles.deviceControl,
                    isMuted && styles.deviceControlActive,
                  ]}
                  onPress={onToggleMic}
                  activeOpacity={0.7}
                >
                  <Ionicons
                    name={isMuted ? 'mic-off' : 'mic'}
                    size={22}
                    color={isMuted ? colors.error : colors.secondary}
                  />
                  <AppText
                    variant="medium"
                    style={[
                      styles.deviceControlText,
                      isMuted && styles.deviceControlTextActive,
                    ]}
                  >
                    {isMuted ? 'Unmute' : 'Mute'}
                  </AppText>
                </TouchableOpacity>

                <View style={styles.deviceControlDivider} />

                <TouchableOpacity
                  style={[
                    styles.deviceControl,
                    !showVideo && styles.deviceControlActive,
                  ]}
                  onPress={onToggleVideo}
                  activeOpacity={0.7}
                >
                  <Ionicons
                    name={showVideo ? 'videocam' : 'videocam-off'}
                    size={22}
                    color={!showVideo ? colors.error : colors.secondary}
                  />
                  <AppText
                    variant="medium"
                    style={[
                      styles.deviceControlText,
                      !showVideo && styles.deviceControlTextActive,
                    ]}
                  >
                    {showVideo ? 'Stop Video' : 'Start Video'}
                  </AppText>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* Call to Action Section */}
          <View style={styles.ctaSection}>
            <View style={styles.ctaRow}>
              <Animated.View
                style={[
                  styles.ctaButtonWrap,
                  { transform: [{ scale: pulseAnim }] },
                ]}
              >
                <TouchableOpacity
                  style={styles.joinButton}
                  onPress={onJoinCall}
                  activeOpacity={0.9}
                >
                  <View style={styles.joinButtonGradient}>
                    <MaterialCommunityIcons
                      name="video-plus"
                      size={24}
                      color={colors.white}
                    />
                    <AppText variant="bold" style={styles.joinButtonText}>
                      Join Call
                    </AppText>
                  </View>
                </TouchableOpacity>
              </Animated.View>

              <View style={styles.ctaButtonWrap}>
                <TouchableOpacity
                  style={styles.goHomeButton}
                  onPress={onGoHome}
                  activeOpacity={0.8}
                >
                  <Ionicons
                    name="home-outline"
                    size={18}
                    color={colors.secondary}
                  />
                  <AppText variant="semiBold" style={styles.goHomeText}>
                    Go Home
                  </AppText>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Animated.View>
      </View>
    </ImageBackground>
  );
};
