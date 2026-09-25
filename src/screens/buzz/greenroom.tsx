import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  Clipboard,
  Share,
} from 'react-native';
import { AppText } from '@/components/ui/text';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useTheme } from '@/theme/ThemeProvider';
import { createBuzzGreenRoomScreenStyles } from '@/theme/createBuzzStyles';
import { useDataContext } from '@/store/useDataContext';
import BuzzService from '@/services/buzz.service';
import AgoraService from '@/services/agora.service';
import { ShowNotify } from '@/components/ui/toast';
import { ACTIONS } from '@/store/types';
import { RouteProp, useRoute } from '@react-navigation/native';
import { BuzzStackParamList } from '@/navigation/stacks/buzz';
import { StackNavigationProp } from '@react-navigation/stack';
import { RtcSurfaceView } from 'react-native-agora';
import { useCallScreen } from '@/hooks/useCallScreen';
import { CLIENT_URL } from '@env';
import Container from '@/components/layout/container';
import FastImage from 'react-native-fast-image';

type GreenRoomRouteProp = RouteProp<BuzzStackParamList, 'GreenRoom'>;
type GreenRoomNavigationProp = StackNavigationProp<
  BuzzStackParamList,
  'GreenRoom'
>;

interface GreenRoomProps {
  navigation: GreenRoomNavigationProp;
}

const GreenRoom = ({ navigation }: GreenRoomProps) => {
  const { colors } = useTheme();
  const styles = useMemo(
    () => createBuzzGreenRoomScreenStyles(colors),
    [colors],
  );
  const route = useRoute<GreenRoomRouteProp>();
  const { buzzCode, buzzData } = route.params;
  const { state, dispatch } = useDataContext();
  const { user, orgData, buzzParticipants, buzzIsMuted, buzzShowVideo } = state;
  const [isJoining, setIsJoining] = useState(false);

  const isMuted = buzzIsMuted ?? true;
  const showVideo = buzzShowVideo ?? false;

  const { handleToggleVideo, handleToggleMic } = useCallScreen({
    buzzCode,
    buzzData,
    cleanupOnUnmount: false,
  });

  const participantCount = buzzParticipants?.length || 0;

  // get metadata for the call
  useEffect(() => {
    const fetchBuzzData = async () => {
      try {
        const result = await BuzzService.getBuzzMetadata(buzzCode);

        if (result.error || !result.data) {
          ShowNotify('Error', result.error || 'Failed to fetch call data');
          return;
        }

        const participants = result.data.participants || [];
        const hostId = result.data.host_id;
        const currentUserId = user?.user_id ?? user?.id;

        const onlyHostIsInCall =
          participants.length === 1 &&
          String(hostId) === String(currentUserId) &&
          String(participants[0]?.user_id) === String(currentUserId);

        dispatch({ type: ACTIONS.BUZZ_DATA, payload: result.data });
        dispatch({
          type: ACTIONS.BUZZ_PARTICIPANTS,
          payload: onlyHostIsInCall ? [] : participants,
        });
      } catch (_error) {
        ShowNotify('Error', 'Failed to fetch call data');
      }
    };
    fetchBuzzData();
  }, [buzzCode, dispatch, user?.id, user?.user_id]);

  useEffect(() => {
    const syncMediaState = async () => {
      try {
        if (isMuted) {
          await AgoraService.toggleMicrophone(false);
        } else {
          await AgoraService.toggleMicrophone(true);
        }
      } catch (_error) {
        console.error('Error syncing mic state:', _error);
      }
    };
    syncMediaState();
  }, [isMuted]);

  useEffect(() => {
    const syncVideoState = async () => {
      try {
        await AgoraService.toggleCamera(showVideo);
      } catch (_error) {
        console.error('Error syncing video state:', _error);
      }
    };
    syncVideoState();
  }, [showVideo]);

  const handleJoin = async () => {
    setIsJoining(true);
    try {
      const joinResult = await BuzzService.joinBuzz(buzzCode);

      if (joinResult.error || !joinResult.data) {
        ShowNotify('Error', joinResult.error || 'Failed to join call');
        setIsJoining(false);
        return;
      }

      const data = joinResult.data;
      const currentUserId = user?.user_id ?? user?.id;
      const participantsWithLocalMediaState = (data.participants || []).map(
        (participant: any) => {
          const participantUserId = participant.user_id ?? participant.id;

          if (String(participantUserId) === String(currentUserId)) {
            return {
              ...participant,
              audioTrack: !isMuted,
              videoTrack: showVideo,
            };
          }

          return participant;
        },
      );

      dispatch({ type: ACTIONS.BUZZ_DATA, payload: data });
      dispatch({
        type: ACTIONS.BUZZ_PARTICIPANTS,
        payload: participantsWithLocalMediaState,
      });

      setIsJoining(false);
      navigation.replace('CallScreen', {
        buzzCode: data.buzz_code,
        buzzData: data,
      });
    } catch (_error) {
      setIsJoining(false);
      ShowNotify('Error', 'Failed to join call');
    }
  };

  const handleCopyCode = () => {
    Clipboard.setString(buzzCode);
    ShowNotify('Success', 'Buzz code copied to clipboard');
  };

  const handleShare = async () => {
    try {
      const link = `${CLIENT_URL}/${orgData?.name}/buzz/${buzzCode}`;
      const _result = await Share.share({
        message: `Join my Buzz call! Use code: ${buzzCode}\n\nOr click this link:`,
        url: link,
        title: 'Join Buzz Call',
      });
    } catch (_error) {
      ShowNotify('Error', 'Failed to share');
    }
  };

  const handleBackToBuzz = async () => {
    try {
      await AgoraService.leaveChannel();
      await AgoraService.release();
    } catch (_error) {
      console.error('Failed to clean up greenroom session', _error);
    } finally {
      navigation.goBack();
    }
  };

  return (
    <Container>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBackToBuzz} style={styles.headerIcon}>
          <Ionicons
            name="chevron-back"
            size={26}
            color={colors.textSecondary}
          />
        </TouchableOpacity>
        <AppText size={16} variant="medium">
          Go Back
        </AppText>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.codeContainer}>
          <AppText size={18} variant="bold" style={styles.buzzCode}>
            {buzzCode}
          </AppText>
          <TouchableOpacity onPress={handleCopyCode} style={styles.copyButton}>
            <Ionicons
              name="copy-outline"
              size={18}
              color={colors.textSecondary}
            />
          </TouchableOpacity>
        </View>

        <View style={styles.userCard}>
          <View style={styles.previewContainer}>
            {showVideo ? (
              <View style={styles.videoWrapper}>
                <RtcSurfaceView
                  canvas={{ uid: 0 }}
                  style={styles.videoPreview}
                  zOrderMediaOverlay={true}
                />
              </View>
            ) : (
              <View style={styles.avatarWrapper}>
                <FastImage
                  source={{ uri: user?.avatar_url || user?.default_avatar_url }}
                  style={styles.avatar}
                />
              </View>
            )}
            <View
              style={
                showVideo ? styles.userNameWrapper : styles.userNameWrapperVideo
              }
            >
              <AppText
                variant="medium"
                style={showVideo ? styles.userNameVideo : styles.userName}
              >
                {user?.full_name || 'You'}
              </AppText>
            </View>

            <View style={styles.controlsOverlay}>
              <TouchableOpacity
                style={[
                  styles.controlButton,
                  !showVideo && styles.controlButtonOff,
                ]}
                onPress={handleToggleVideo}
              >
                <Ionicons
                  name={showVideo ? 'videocam-outline' : 'videocam-off-outline'}
                  size={22}
                  color={showVideo ? colors.textPrimary : colors.white}
                />
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.controlButton,
                  isMuted && styles.controlButtonOff,
                ]}
                onPress={handleToggleMic}
              >
                <Ionicons
                  name={isMuted ? 'mic-off-outline' : 'mic-outline'}
                  size={22}
                  color={isMuted ? colors.white : colors.textPrimary}
                />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {participantCount === 0 ? (
          <AppText style={styles.infoText}>No one is in the call yet</AppText>
        ) : (
          <AppText variant="medium" style={styles.infoText}>
            {participantCount}{' '}
            {participantCount === 1 ? 'participant' : 'participants'} in call
          </AppText>
        )}
      </ScrollView>

      <View style={styles.bottomSection}>
        <View style={styles.joiningInfoRow}>
          <View style={styles.row}>
            <Ionicons
              name="information-circle-outline"
              size={24}
              color={colors.textSecondary}
            />
            <AppText variant="medium" style={styles.joiningInfoTitle}>
              Joining information
            </AppText>
          </View>
          <TouchableOpacity onPress={handleShare}>
            <Ionicons
              name="share-outline"
              size={22}
              color={colors.textSecondary}
            />
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={[styles.joinButton, isJoining && styles.joinButtonDisabled]}
          onPress={handleJoin}
          disabled={isJoining}
        >
          {isJoining ? (
            <ActivityIndicator color={colors.white} />
          ) : (
            <AppText variant="bold" style={styles.joinButtonText}>
              Join
            </AppText>
          )}
        </TouchableOpacity>
      </View>
    </Container>
  );
};

export default GreenRoom;
