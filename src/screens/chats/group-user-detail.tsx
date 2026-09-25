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
import { UserProfileStatus } from '@/components/ui/user-profile-status';
import { ContactInfoCard } from '@/components/ui/contact-info-card';
import UseGroupDetails from '@/services/chat/group-details';
import Container from '@/components/layout/container';

const GroupUserDetailScreen = ({ navigation, route }: any) => {
  const { colors } = useTheme();
  const styles = useMemo(() => createChatInfoStyles(colors), [colors]);
  const [loading, setLoading] = useState(false);

  const actionSheetRef = useRef<any>(null);

  const { state, dispatch } = useDataContext();
  const { groupDetails, orgId, groupCallback, statusCallback } = state;
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
  }, [participant, statusCallback]);

  const handleNavigate = async () => {
    setLoading(true);

    dispatch({ type: ACTIONS.SINGLE_PARTICIPANT, payload: state?.participant });
    dispatch({
      type: ACTIONS.SINGLE_DMS_CHAT,
      payload: { data: state?.dmsChat, page: 1 },
    });
    dispatch({ type: ACTIONS.MENTION_USER, payload: true });

    const payload = {
      chat_type: 'user',
      participant_id: userData?.user_id,
    };

    const { data, error } = await PostRequest(
      `/organisations/${state?.orgId}/dms`,
      payload,
    );

    if (!error) {
      dispatch({ type: ACTIONS.PARTICIPANT, payload: data.data.participants });
      dispatch({
        type: ACTIONS.DMS_CHAT,
        payload: { data: data.data.preview_thread, page: 1 },
      });

      setTimeout(() => {
        navigation.replace('ChatStack', {
          screen: 'ChatDetails',
          params: {
            participant_id: data.data.participant_id,
            channel_id: data.data.channel_id,
          },
        });
      }, 500);
    }
    // bottomSheetRef.current?.close();
    setLoading(false);
  };

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

  return (
    <Container>
      <UseGroupDetails channel_id={channel_id} />
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

          <UserProfileStatus
            user={userData}
            userId={userData?.user_id || userData?.id}
          />

          <View style={styles.quickActionRow}>
            <TouchableOpacity
              style={styles.circleAction}
              onPress={handleNavigate}
            >
              <View style={styles.actionIconCircle}>
                {loading ? (
                  <ActivityIndicator size="small" color={colors.primary} />
                ) : (
                  <Ionicons
                    name="chatbubble-ellipses-outline"
                    size={28}
                    color={colors.primary}
                  />
                )}
              </View>
              <AppText size={12} style={styles.circleActionText}>
                Message
              </AppText>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.circleAction}
              onPress={() =>
                navigation.navigate(
                  'DirectCallStack' as never,
                  {
                    screen: 'OngoingDirectCall',
                    params: {
                      calleeUserIds: [
                        String(userData?.user_id || userData?.id || ''),
                      ],
                      shouldInitiate: true,
                    },
                  } as never,
                )
              }
            >
              <View style={styles.actionIconCircle}>
                <Ionicons
                  name="videocam-outline"
                  size={28}
                  color={colors.primary}
                />
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

        {/* <View style={styles.settingsSection}>
                    <ActionItem icon="notifications-outline" label="Notifications" subLabel="Mute, sounds, alerts" showChevron />
                    <ActionItem icon="lock-closed-outline" label="Encryption" subLabel="Messages are end-to-end encrypted" showChevron />
                    <ActionItem icon="star-outline" label="Starred Messages" showChevron />
                    <ActionItem
                        icon="trash-outline"
                        label="Clear Chat"
                        color={colors.error}
                        isLast
                    />
                </View> */}

        <View style={{ height: 100 }} />
      </ScrollView>

      <AddDescription
        onClose={() => actionSheetRef.current?.close()}
        ref={actionSheetRef}
        channel_id={channel_id}
      />
    </Container>
  );
};

export default GroupUserDetailScreen;
