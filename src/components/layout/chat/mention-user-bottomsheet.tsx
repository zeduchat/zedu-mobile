import React, {
  forwardRef,
  useImperativeHandle,
  useMemo,
  useState,
  useRef,
} from 'react';
import { View, TouchableOpacity, ActivityIndicator } from 'react-native';
import AppBottomSheet, {
  AppBottomSheetRef,
} from '@/components/ui/bottom-sheet';
import { AppText } from '@/components/ui/text';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useTheme } from '@/theme/ThemeProvider';
import { createMentionSheetStyles } from '@/theme/createChatOverlayStyles';
import { Participant } from '@/types/chats';
import { useDataContext } from '@/store/useDataContext';
import { ACTIONS } from '@/store/types';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '@/navigation/navigator';
import { PostRequest } from '@/utils/requests';
import FastImage from 'react-native-fast-image';

export interface MentionUserBottomSheetRef {
  open: (user: Participant) => void;
  close: () => void;
}

const MentionUserBottomSheet = forwardRef<MentionUserBottomSheetRef, {}>(
  (props, ref) => {
    const { colors } = useTheme();
    const styles = useMemo(
      () => ({
        ...createMentionSheetStyles(colors),
        container: { flex: 1 },
        avatar: {
          width: 90,
          height: 90,
          borderRadius: 45,
          borderWidth: 1,
          borderColor: colors.border,
        },
        statusText: {
          fontSize: 14,
          color: colors.messageMeta,
        },
      }),
      [colors],
    );
    const [user, setUser] = useState<Participant | null>(null);
    const [loading, setLoading] = useState(false);
    const bottomSheetRef = useRef<AppBottomSheetRef>(null);
    const { state, dispatch } = useDataContext();
    const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();

    useImperativeHandle(ref, () => ({
      open: (user: Participant) => {
        setUser(user);
        bottomSheetRef.current?.expand();
      },
      close: () => {
        bottomSheetRef.current?.close();
      },
    }));

    const handleNavigate = async () => {
      setLoading(true);

      dispatch({
        type: ACTIONS.SINGLE_PARTICIPANT,
        payload: state?.participant,
      });
      dispatch({
        type: ACTIONS.SINGLE_DMS_CHAT,
        payload: { data: state?.dmsChat, page: 1 },
      });
      dispatch({ type: ACTIONS.MENTION_USER, payload: true });

      const payload = {
        chat_type: 'user',
        participant_id: user?.user_id,
      };

      const { data, error } = await PostRequest(
        `/organisations/${state?.orgId}/dms`,
        payload,
      );

      if (!error) {
        dispatch({
          type: ACTIONS.PARTICIPANT,
          payload: data.data.participants,
        });
        dispatch({
          type: ACTIONS.DMS_CHAT,
          payload: { data: data.data.preview_thread, page: 1 },
        });

        navigation.navigate('ChatStack', {
          screen: 'ChatDetails',
          params: {
            participant_id: data.data.participant_id,
            channel_id: data.data.channel_id,
          },
        });
      }
      // bottomSheetRef.current?.close();
      setLoading(false);
    };

    return (
      <AppBottomSheet
        ref={bottomSheetRef}
        snapPoints={['55%']}
        showBackdrop={true}
        enablePanDown={true}
        backgroundStyle={styles.sheetBackground}
        handleIndicatorStyle={styles.indicator}
        paddingBottom={100}
      >
        {user && (
          <View style={styles.container}>
            <View style={styles.headerSection}>
              <View style={styles.avatarWrapper}>
                <FastImage
                  source={{
                    uri: user.avatar_url
                      ? user.avatar_url
                      : user.default_avatar_url,
                  }}
                  style={styles.avatar}
                />
                <View
                  style={[
                    styles.onlineStatus,
                    { backgroundColor: user?.online ? '#22C55E' : '#9CA3AF' },
                  ]}
                />
              </View>

              <AppText variant="bold" style={styles.userName}>
                {user?.full_name || user?.username}
              </AppText>
              <AppText style={styles.userTitle}>
                {user?.title || 'Member'}
              </AppText>

              <View style={styles.statusBubble}>
                <AppText style={styles.statusEmoji}>
                  {user?.icon || '💬'}
                </AppText>
                <AppText style={styles.statusText} numberOfLines={1}>
                  {user?.text || 'Available'}
                </AppText>
              </View>

              <View style={styles.actionGrid}>
                <TouchableOpacity style={styles.circleAction}>
                  <View style={styles.actionIconCircle}>
                    <Ionicons
                      name="call-outline"
                      size={28}
                      color={colors.primary}
                    />
                  </View>
                  <AppText size={12} style={styles.circleActionText}>
                    Buzz
                  </AppText>
                </TouchableOpacity>

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
              </View>
            </View>
          </View>
        )}
      </AppBottomSheet>
    );
  },
);

export default MentionUserBottomSheet;
