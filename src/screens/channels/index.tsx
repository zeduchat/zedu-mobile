import React, { useRef, useState } from 'react';
import {
  View,
  Image,
  TouchableOpacity,
  TextInput,
  FlatList,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { ThemedRefreshControl } from '@/components/ui/themed-refresh-control';
import { AppText } from '@/components/ui/text';
import { normalize } from '@/utils/normalize';
import Container from '@/components/layout/container';
import { useTheme } from '@/theme/ThemeProvider';
import { createChatListStyles } from '@/theme/createChatListStyles';
import { useNavigation } from '@react-navigation/native';
import FontAwesome5Icon from 'react-native-vector-icons/FontAwesome5';
import Feather from 'react-native-vector-icons/Feather';
import ChannelOnboardingSheet from './channel-onboarding';
import AppBottomSheet from '@/components/ui/bottom-sheet';
import { useDataContext } from '@/store/useDataContext';
import moment from 'moment';
import { formatCount } from '@/utils';
import { ACTIONS } from '@/store/types';
import { Channel } from '@/types/channel';
import ChatSkeleton from '@/components/skeleton/chat-skeleton';
import { useChannels } from '@/services/channels/channel-list';
import { ChannelPopover } from '@/components/layout/channel-popover';
import { UserAvatarWithStatus } from '@/components/ui/user-avatar-with-status';

const ChannelHome = () => {
  const navigation = useNavigation();
  const { colors } = useTheme();
  const styles = React.useMemo(() => createChatListStyles(colors), [colors]);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const { state, dispatch } = useDataContext();
  const { user, orgData, orgId, channelLoading } = state;
  const [search, setSearch] = useState('');
  const { channels, loadingMore, refresh, loadMore } = useChannels(
    orgId,
    search,
  );

  const onboardingSheetRef = useRef<any>(null);

  const handleOpen = () => {
    onboardingSheetRef.current?.expand();
  };

  const handleSheetChange = (index: number) => {
    setIsSheetOpen(index !== -1);
  };

  // navigate to channel details
  const handleNavigate = (props: Channel) => {
    dispatch({ type: ACTIONS.CHANNEL, payload: props });
    dispatch({
      type: ACTIONS.CHANNELS_CHAT,
      payload: { data: props.preview_thread, page: 1 },
    });

    navigation.navigate('ChannelStack', {
      screen: 'ChannelChat',
    });

    if (props?.thread_count > 0) {
      dispatch({
        type: ACTIONS.RESET_CHANNEL_THREAD_COUNT,
        payload: props?.channels_id,
      });
    }

    dispatch({
      type: ACTIONS.CHANNEL_CALLBACK,
      payload: !state?.channelCallback,
    });
  };

  return (
    <Container color={colors.secondary} dark={true}>
      <View style={styles.topHeader}>
        <View style={styles.profileTop}>
          <AppText variant="bold" size={19} style={{ color: 'white' }}>
            {orgData?.name}
          </AppText>

          <UserAvatarWithStatus user={user} />
        </View>

        <View style={styles.searchBar}>
          <Image
            source={require('@/assets/icons/search.png')}
            style={styles.searchIcon}
          />
          <TextInput
            placeholder="Find a channel"
            placeholderTextColor={colors.white}
            style={styles.searchInput}
            value={search}
            onChangeText={setSearch}
          />
        </View>
      </View>

      {channelLoading ? (
        <ScrollView
          style={{
            paddingHorizontal: normalize(20),
            paddingTop: normalize(20),
          }}
          showsVerticalScrollIndicator={false}
        >
          {/* Render 6 skeleton items channelLoading */}
          {[1, 2, 3, 4, 5, 6].map(key => (
            <ChatSkeleton key={key} />
          ))}
        </ScrollView>
      ) : (
        <>
          {!channelLoading && channels?.length === 0 ? (
            <View
              style={{
                justifyContent: 'center',
                alignItems: 'center',
                marginTop: normalize(150),
              }}
            >
              <Image
                source={require('@/assets/images/empty-chat.png')}
                style={{ objectFit: 'contain', height: normalize(50) }}
              />
            </View>
          ) : (
            <FlatList
              data={channels}
              keyExtractor={item => item.channels_id}
              contentContainerStyle={styles.listContent}
              showsVerticalScrollIndicator={false}
              renderItem={({ item }) => {
                const hasActiveBuzz = Boolean(item?.active_buzz);

                return (
                  <TouchableOpacity
                    style={styles.chatItem}
                    onPress={() => handleNavigate(item)}
                  >
                    <View
                      style={[
                        styles.channelAvatarWrapper,
                        hasActiveBuzz && styles.channelAvatarWrapperActiveBuzz,
                      ]}
                    >
                      {hasActiveBuzz ? (
                        <View style={styles.buzzAvatarInner}>
                          <Feather
                            name="video"
                            size={18}
                            color={colors.online}
                          />
                          <View style={styles.buzzLiveDot} />
                        </View>
                      ) : (
                        <>
                          {item.is_private ? (
                            <FontAwesome5Icon
                              name="lock"
                              size={15}
                              color={colors.iconDefault}
                            />
                          ) : (
                            <FontAwesome5Icon
                              name="hashtag"
                              size={15}
                              color={colors.iconDefault}
                            />
                          )}
                        </>
                      )}
                    </View>

                    <View style={styles.chatInfo}>
                      <View style={styles.chatHeaderRow}>
                        <View style={styles.chatNameWrap}>
                          <AppText
                            variant="bold"
                            size={14}
                            numberOfLines={1}
                            style={styles.chatName}
                          >
                            {item.name}
                          </AppText>
                        </View>
                        <AppText
                          size={12}
                          style={[styles.chatTime, { marginRight: 0 }]}
                        >
                          {item?.last_read_at
                            ? moment(item.last_read_at).calendar(null, {
                                dsameDay: 'h:mm a',
                                lastDay: '[Yesterday]',
                                lastWeek: 'dddd',
                                sameElse: 'DD/MM/YYYY',
                              })
                            : null}
                        </AppText>
                      </View>
                      <View style={styles.chatFooterRow}>
                        <AppText
                          size={14}
                          numberOfLines={1}
                          style={[styles.chatMsg, { marginRight: 10 }]}
                        >
                          {item?.preview_message
                            ?.replace(/<[^>]*>?/gm, '')
                            .replace(/&nbsp;/g, ' ')
                            .replace(/&amp;/g, '&')
                            .replace(/&lt;/g, '<')
                            .replace(/&gt;/g, '>') || 'Start chatting'}
                        </AppText>
                        {(item?.thread_count > 0 ||
                          item?.mention_count > 0) && (
                          <View style={styles.countBadge}>
                            <AppText
                              size={12}
                              variant="bold"
                              style={styles.countText}
                            >
                              {formatCount(
                                item?.thread_count || item?.mention_count,
                              )}
                            </AppText>
                          </View>
                        )}
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              }}
              onEndReached={loadMore}
              onEndReachedThreshold={0.1}
              refreshControl={
                <ThemedRefreshControl
                  refreshing={channelLoading && channels.length > 0}
                  onRefresh={refresh}
                />
              }
              ListFooterComponent={
                loadingMore ? (
                  <ActivityIndicator
                    color={colors.primary}
                    style={{ marginVertical: 20 }}
                  />
                ) : null
              }
            />
          )}
        </>
      )}

      <AppBottomSheet
        ref={onboardingSheetRef}
        snapPoints={['60%', '80%']}
        onChange={handleSheetChange}
      >
        <ChannelOnboardingSheet ref={onboardingSheetRef} />
      </AppBottomSheet>

      {!isSheetOpen && <ChannelPopover handleOpen={handleOpen} />}
    </Container>
  );
};

export default ChannelHome;
