import React, { useRef, useState, useEffect, useMemo } from 'react';
import {
  View,
  Image,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { AppText } from '@/components/ui/text';
import { useTheme } from '@/theme/ThemeProvider';
import { createChatInfoStyles } from '@/theme/createScreenStyles';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { AddDescription } from '@/components/layout/group-chat/add-description';
import { useDataContext } from '@/store/useDataContext';
import { GetRequest, PostRequest } from '@/utils/requests';
import { ACTIONS } from '@/store/types';
import Container from '@/components/layout/container';
import FastImage from 'react-native-fast-image';
import { ShowNotify } from '@/components/ui/toast';
import BuzzService from '@/services/buzz.service';
import buzzService from '@/services/buzz.service';
import { UserProfileStatus } from '@/components/ui/user-profile-status';
import { ContactInfoCard } from '@/components/ui/contact-info-card';

const getFileExtension = (fileName: string): string => {
  if (!fileName) return '';
  const ext = fileName.toLowerCase().split('.').pop() || '';
  return ext;
};

const isAudioFile = (mime: string, fileName: string) => {
  const mimeType = (mime || '').toLowerCase();
  const type = getFileExtension(fileName);
  const audioExtensions = ['wav', 'mp3', 'm4a', 'ogg', 'aac'];
  return audioExtensions.includes(type) || mimeType.startsWith('audio/');
};

const isVideoFile = (mime: string, fileName: string) => {
  if (!mime && !fileName) return false;
  const mimeType = (mime || '').toLowerCase();
  const type = getFileExtension(fileName);
  const videoExtensions = ['mp4', 'mov', 'm4v', 'avi', 'mkv', 'webm'];
  // Video if extension matches AND it's not audio
  if (videoExtensions.includes(type) && !isAudioFile(mime, fileName))
    return true;
  // Or if mime type is video (and not audio)
  if (mimeType.startsWith('video') && !isAudioFile(mime, fileName)) return true;
  return false;
};

const isImageFile = (mime: string, fileName: string) => {
  const mimeType = (mime || '').toLowerCase();
  const type = getFileExtension(fileName);
  const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'heic'];
  return imageExtensions.includes(type) || mimeType.startsWith('image/');
};

const isDocFile = (mime: string, fileName: string) => {
  const mimeType = (mime || '').toLowerCase();
  const type = getFileExtension(fileName);
  return mimeType.includes('pdf') || type === 'pdf';
};

const UserDetailScreen = ({ navigation, route }: any) => {
  const { colors } = useTheme();
  const styles = useMemo(() => createChatInfoStyles(colors), [colors]);
  const [callLoading, setCallLoading] = useState(false);
  const actionSheetRef = useRef<any>(null);

  const { state, dispatch } = useDataContext();
  const {
    groupDetails,
    orgId,
    groupCallback,
    buzzIsMuted,
    buzzShowVideo,
    user: currentUser,
  } = state;
  const { channel_id, participant } = route.params;

  const [userData, setUserData] = useState(participant);

  useEffect(() => {
    setUserData(participant);

    (async () => {
      const { data, error } = await GetRequest(
        `/users/${participant?.user_id}`,
      );
      if (error) return;
      setUserData(data?.data);
    })();
  }, [state?.statusCallback]);

  const favorites = async () => {
    const { data, error } = await PostRequest(
      `/organisations/${orgId}/dms/${channel_id}/favourite`,
      {},
    );
    if (!error) {
      dispatch({ type: ACTIONS.SUCCESS, payload: data.message });
      dispatch({ type: ACTIONS.GROUP_CALLBACK, payload: !groupCallback });
    } else {
      dispatch({ type: ACTIONS.ERROR, payload: error });
    }
  };

  const handleVideoCall = async () => {
    const activeBuzzData = state?.buzzData;
    if (state?.isCallMinimized && activeBuzzData?.buzz_code) {
      dispatch({ type: ACTIONS.CALL_MINIMIZED, payload: false });
      navigation.navigate('DirectCallStack', {
        screen: 'OngoingDirectCall',
        params: {
          buzzCode: activeBuzzData.buzz_code,
          buzzData: activeBuzzData,
        },
      });
      return;
    }

    setCallLoading(true);
    try {
      const result = await BuzzService.directBuzzCall(channel_id);

      if (result.error || !result.data) {
        ShowNotify('Error', result.error || 'Failed to create call');
        setCallLoading(false);
        return;
      }

      const joinResult = await buzzService.joinBuzz(result.data.buzz_code);

      if (joinResult.error || !joinResult.data) {
        ShowNotify('Error', joinResult.error || 'Failed to join call');
        setCallLoading(false);
        return;
      }

      const buzzData = joinResult.data;

      const isMuted = buzzIsMuted ?? true;
      const showVideo = buzzShowVideo ?? false;
      const currentUserId = currentUser?.user_id;

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

      dispatch({ type: ACTIONS.BUZZ_DATA, payload: buzzData });
      dispatch({
        type: ACTIONS.BUZZ_PARTICIPANTS,
        payload: participantsWithLocalMediaState,
      });

      navigation.navigate('DirectCallStack', {
        screen: 'OngoingDirectCall',
        params: {
          buzzCode: buzzData.buzz_code,
          buzzData: buzzData,
        },
      });
      setCallLoading(false);
    } catch (_error) {
      ShowNotify('Error', 'Failed to start call');
      setCallLoading(false);
    }
  };

  return (
    <Container>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.iconBtn}
        >
          <Ionicons name="chevron-back" size={24} color={colors.iconDefault} />
        </TouchableOpacity>
        <AppText variant="bold" style={{ fontSize: 17 }}>
          Contact Info
        </AppText>
        <TouchableOpacity style={styles.iconBtn}>
          {/* <Ionicons name="ellipsis-vertical" size={22} color={colors.iconDefault} /> */}
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} bounces={true}>
        <View style={styles.profileHero}>
          <View style={styles.mainAvatarContainer}>
            <Image
              source={{
                uri: userData?.avatar_url || userData?.default_avatar_url,
              }}
              style={styles.mainAvatar}
            />
            <View
              style={[
                styles.onlineStatus,
                {
                  backgroundColor: userData?.online
                    ? colors.online
                    : colors.offline,
                },
              ]}
            />
          </View>

          <AppText variant="bold" style={styles.userName}>
            {userData?.full_name?.trim() || userData?.username}
          </AppText>
          <AppText style={styles.userTitle}>
            {userData?.title || 'Member'}
          </AppText>

          <UserProfileStatus user={userData} userId={userData?.user_id} />

          <View style={styles.quickActionRow}>
            <TouchableOpacity
              style={styles.circleAction}
              onPress={() => navigation.goBack()}
            >
              <View style={styles.actionIconCircle}>
                <Ionicons
                  name="chatbubble-ellipses-outline"
                  size={28}
                  color={colors.primary}
                />
              </View>
              <AppText size={12} style={styles.circleActionText}>
                Message
              </AppText>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.circleAction}
              onPress={handleVideoCall}
            >
              <View style={styles.actionIconCircle}>
                {callLoading ? (
                  <ActivityIndicator color={colors.primary} />
                ) : (
                  <Ionicons
                    name="videocam-outline"
                    size={28}
                    color={colors.primary}
                  />
                )}
              </View>
              <AppText size={12} style={styles.circleActionText}>
                Buzz
              </AppText>
            </TouchableOpacity>

            <TouchableOpacity style={styles.circleAction} onPress={favorites}>
              <View style={styles.actionIconCircle}>
                <Ionicons
                  name={groupDetails?.is_favourite ? 'star' : 'star-outline'}
                  size={28}
                  color={colors.primary}
                />
              </View>
              <AppText size={12} style={styles.circleActionText}>
                Fav
              </AppText>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.contentSection}>
          <AppText variant="bold" style={styles.sectionTitle}>
            Contact Details
          </AppText>
          <View style={styles.detailsGrid}>
            <ContactInfoCard
              icon="mail-outline"
              label="Email Address"
              value={userData?.email}
              copyable
            />
            <ContactInfoCard
              icon="call-outline"
              label="Phone Number"
              value={userData?.phone}
              copyable
            />
            <ContactInfoCard
              icon="time-outline"
              label="Timezone"
              value={userData?.timezone}
            />
            <ContactInfoCard
              icon="language-outline"
              label="Pronunciation"
              value={userData?.name_pronounciation}
            />
          </View>
        </View>

        <View style={styles.divider} />

        {groupDetails?.preview_media?.length > 0 && (
          <View style={styles.sectionPadding}>
            <TouchableOpacity
              onPress={() =>
                navigation.navigate('MediaGalleryScreen', { channel_id })
              }
              style={styles.sectionHeader}
            >
              <AppText variant="bold" style={styles.sectionTitle}>
                Media, Links & Docs
              </AppText>

              <View style={styles.mediaCount}>
                <AppText size={13} style={{ color: colors.primary }}>
                  {groupDetails?.preview_media?.length}{' '}
                </AppText>
                <Ionicons
                  name="chevron-forward"
                  size={14}
                  color={colors.primary}
                />
              </View>
            </TouchableOpacity>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.mediaScroll}
            >
              {groupDetails?.preview_media?.map((item: any, index: number) => {
                const isImage = isImageFile(item.mime_type, item.file_name);
                const isVideo = isVideoFile(item.mime_type, item.file_name);
                const isAudio = isAudioFile(item.mime_type, item.file_name);
                const isDoc = isDocFile(item.mime_type, item.file_name);

                if (isAudio) {
                  return (
                    <View
                      key={index}
                      style={[
                        styles.mediaThumb,
                        {
                          backgroundColor: colors.reactionBackground,
                          justifyContent: 'center',
                          alignItems: 'center',
                        },
                      ]}
                    >
                      <Ionicons
                        name="musical-note"
                        size={28}
                        color={colors.primary}
                      />
                    </View>
                  );
                }

                if (isVideo) {
                  return (
                    <View key={index} style={styles.videoWrapper}>
                      <View
                        style={[
                          styles.mediaThumb,
                          { backgroundColor: colors.textPrimary },
                        ]}
                      />
                      <View style={styles.playIconOverlay}>
                        <Ionicons name="play" size={20} color={colors.white} />
                      </View>
                    </View>
                  );
                }

                if (isDoc) {
                  return (
                    <View
                      key={index}
                      style={[
                        styles.mediaThumb,
                        {
                          backgroundColor: colors.surfaceElevated,
                          justifyContent: 'center',
                          alignItems: 'center',
                        },
                      ]}
                    >
                      <Ionicons
                        name="document-text"
                        size={32}
                        color={colors.error}
                      />
                      <AppText
                        size={8}
                        numberOfLines={1}
                        style={{
                          position: 'absolute',
                          bottom: 5,
                          paddingHorizontal: 5,
                        }}
                      >
                        {item.file_name}
                      </AppText>
                    </View>
                  );
                }

                if (isImage) {
                  return (
                    <FastImage
                      key={index}
                      source={{ uri: item.file_link }}
                      style={styles.mediaThumb}
                      resizeMode={FastImage.resizeMode.cover}
                    />
                  );
                }

                return null;
              })}
            </ScrollView>
          </View>
        )}

        <View style={styles.divider} />

        <TouchableOpacity
          style={styles.actionRow}
          onPress={() =>
            navigation.navigate('MediaGalleryScreen', { channel_id })
          }
        >
          <View style={styles.actionLeading}>
            <Ionicons
              name="image-outline"
              size={22}
              color={colors.messageMeta}
            />
            <View style={styles.actionTextContainer}>
              <AppText style={styles.actionLabel}>Media Visibility</AppText>
            </View>
          </View>
          <Ionicons
            name="chevron-forward"
            size={18}
            color={colors.messageMeta}
          />
        </TouchableOpacity>
      </ScrollView>

      <AddDescription
        onClose={() => actionSheetRef.current?.close()}
        ref={actionSheetRef}
        channel_id={channel_id}
      />
    </Container>
  );
};

export default UserDetailScreen;
