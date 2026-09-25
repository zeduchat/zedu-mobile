import React, { useMemo, useRef, useState } from 'react';
import {
  View,
  TouchableOpacity,
  Image,
  Dimensions,
  StatusBar,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '@/theme/ThemeProvider';
import { createBuzzHomeStyles } from '@/theme/createBuzzStyles';
import { AppText } from '@/components/ui/text';
import Carousel from '@/components/ui/carousel';
import Popover from '@/components/ui/popover';
import { useDataContext } from '@/store/useDataContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { statusBarTopPadding } from '@/utils/status-bar-inset';
import MeetingLinkModal from '@/components/layout/buzz/meeting-code-modal';
import JoinWithCodeModal from '@/components/layout/buzz/join-with-code-modal';
import { extractBuzzCodeFromInput } from '@/utils/buzz';
import BuzzService from '@/services/buzz.service';
import { ShowNotify } from '@/components/ui/toast';
import { UserAvatarWithStatus } from '@/components/ui/user-avatar-with-status';
import { ACTIONS } from '@/store/types';
import { CLIENT_URL } from '@env';
import { BuzzPopover } from '@/components/layout/buzz/buzz-popover';

const { width } = Dimensions.get('window');

const ONBOARDING_DATA = [
  {
    id: '1',
    title: 'Get a link that you can share',
    subtitle:
      'Tap New buzz to get a link that you can send to people that you want to meet with',
    image: require('@/assets/icons/meeting-link.png'),
  },
  {
    id: '2',
    title: 'Your meeting is safe',
    subtitle:
      'No one can join a meeting unless invited or admitted by the host',
    image: require('@/assets/icons/meeting-safe.png'),
  },
];

const BuzzHome = () => {
  const { colors } = useTheme();
  const styles = useMemo(() => createBuzzHomeStyles(colors), [colors]);
  const insets = useSafeAreaInsets();
  const headerTopPadding = statusBarTopPadding(insets.top);
  const [popoverVisible, setPopoverVisible] = useState(false);
  const newMeetingButtonRef = useRef<View | null>(null);
  const { state, dispatch } = useDataContext();
  const { user, orgData, buzzIsMuted, buzzShowVideo } = state;
  const [linkModalVisible, setLinkModalVisible] = useState(false);
  const [joinCodeModalVisible, setJoinCodeModalVisible] = useState(false);
  const [isCreatingCall, setIsCreatingCall] = useState(false);
  const [_isJoiningCall, setIsJoiningCall] = useState(false);
  const [meetingCode, setMeetingCode] = useState('');
  const navigation = useNavigation<any>();
  const [linkLoading, setLinkLoading] = useState(false);

  const handleGetMeetingLink = async () => {
    setLinkLoading(true);
    try {
      const joinResult = await BuzzService.createBuzz();

      if (joinResult.error || !joinResult.data) {
        throw new Error(joinResult.error || 'Failed to join call');
      }

      const buzzData = joinResult.data;

      // Store the meeting code for later reference
      const link = `${CLIENT_URL}/${orgData?.name}/buzz/${buzzData.buzz_code}`;
      setMeetingCode(link);

      setPopoverVisible(false);
      setLinkModalVisible(true);
      setLinkLoading(false);
    } catch (error) {
      setLinkLoading(false);
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to create call';
      ShowNotify('Error', errorMessage);
    }
  };

  const handleStartInstantMeeting = async () => {
    setIsCreatingCall(true);
    try {
      const result = await BuzzService.createBuzz();

      if (result.error || !result.data) {
        throw new Error(result.error || 'Failed to create call');
      }

      const buzz = result.data;

      setPopoverVisible(false);

      // Store the meeting code for later reference
      setMeetingCode(buzz.buzz_code);

      setIsCreatingCall(false);

      // Navigate to GreenRoom instead of joining immediately
      setTimeout(() => {
        navigation.navigate('BuzzStack', {
          screen: 'GreenRoom',
          params: {
            buzzCode: buzz.buzz_code,
            buzzData: buzz,
          },
        });
      }, 200);
    } catch (error) {
      setIsCreatingCall(false);
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to create call';
      ShowNotify('Error', errorMessage);
    }
  };

  const handleOpenJoinModal = () => {
    setJoinCodeModalVisible(true);
  };

  const handleJoinMeeting = async (code: string) => {
    const buzzCode = extractBuzzCodeFromInput(code);

    if (!buzzCode) {
      ShowNotify('Error', 'Please enter a valid meeting code or link');
      return;
    }

    setIsJoiningCall(true);
    try {
      const result = await BuzzService.joinBuzz(buzzCode);

      if (result.error || !result.data) {
        throw new Error(result.error || 'Failed to join call');
      }

      const buzzData = result.data;

      setJoinCodeModalVisible(false);

      // Dispatch buzzData from join_call response to global state
      dispatch({ type: ACTIONS.BUZZ_DATA, payload: buzzData });

      const isMuted = buzzIsMuted ?? true;
      const showVideo = buzzShowVideo ?? false;
      const currentUserId = user?.user_id ?? user?.id;

      const participantsWithLocalMediaState = (buzzData.participants || []).map(
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

      dispatch({
        type: ACTIONS.BUZZ_PARTICIPANTS,
        payload: participantsWithLocalMediaState,
      });

      // Navigate to call screen with buzzData from join response
      navigation.navigate('BuzzStack', {
        screen: 'CallScreen',
        params: {
          buzzCode,
          buzzData: buzzData,
        },
      });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to join call';
      ShowNotify('Error', errorMessage);
    } finally {
      setIsJoiningCall(false);
    }
  };

  const renderCarouselItem = (item: any) => (
    <View style={styles.carouselItemContainer}>
      <View style={styles.illustrationWrapper}>
        <Image
          source={item.image}
          style={styles.illustrationImage}
          resizeMode="contain"
        />
      </View>
      <View style={styles.textContainer}>
        <AppText variant="medium" style={styles.itemTitle}>
          {item.title}
        </AppText>
        <AppText variant="regular" style={styles.itemSubtitle}>
          {item.subtitle}
        </AppText>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.secondary} />
      {/* Header Section */}
      <View
        style={{
          backgroundColor: colors.secondary,
          paddingTop: headerTopPadding,
        }}
      >
        <View style={styles.header}>
          <AppText variant="bold" style={styles.headerTitle}>
            Buzz
          </AppText>

          <UserAvatarWithStatus user={user} />
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Top Action Buttons */}
        <View style={styles.actionSection}>
          <View style={styles.buttonsRow}>
            <TouchableOpacity
              ref={newMeetingButtonRef}
              activeOpacity={0.8}
              style={styles.primaryActionBtn}
              onPress={() => setPopoverVisible(true)}
            >
              <AppText style={styles.primaryActionText}>New meeting</AppText>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.8}
              style={styles.secondaryActionBtn}
              onPress={handleOpenJoinModal}
            >
              <AppText style={styles.secondaryActionText}>
                Join with a code
              </AppText>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.contentArea}>
          <Carousel
            data={ONBOARDING_DATA}
            renderItem={renderCarouselItem}
            itemWidth={width}
          />
        </View>

        {/* Popover Implementation for Screenshot 2 */}
        <Popover
          visible={popoverVisible}
          onClose={() => setPopoverVisible(false)}
          triggerRef={newMeetingButtonRef}
          placement="bottom"
        >
          <View style={styles.popoverCard}>
            <TouchableOpacity
              style={styles.popoverOption}
              activeOpacity={0.6}
              onPress={handleGetMeetingLink}
            >
              <AppText variant="regular" style={styles.popoverOptionTitle}>
                Get a meeting link to share
              </AppText>

              {linkLoading ? (
                <ActivityIndicator />
              ) : (
                <Image
                  source={require('@/assets/icons/link.png')}
                  style={styles.popoverIcon}
                />
              )}
            </TouchableOpacity>

            <View style={styles.divider} />

            <TouchableOpacity
              style={styles.popoverOption}
              activeOpacity={0.6}
              onPress={handleStartInstantMeeting}
            >
              <AppText variant="regular" style={styles.popoverOptionTitle}>
                Start an instant meeting
              </AppText>

              {isCreatingCall ? (
                <ActivityIndicator />
              ) : (
                <Image
                  source={require('@/assets/icons/video.png')}
                  style={styles.popoverIcon}
                />
              )}
            </TouchableOpacity>
          </View>
        </Popover>

        <MeetingLinkModal
          visible={linkModalVisible}
          onClose={() => setLinkModalVisible(false)}
          link={meetingCode || ''}
        />

        <JoinWithCodeModal
          visible={joinCodeModalVisible}
          onClose={() => setJoinCodeModalVisible(false)}
          onJoin={handleJoinMeeting}
        />
      </ScrollView>

      <BuzzPopover />
    </View>
  );
};

export default BuzzHome;
