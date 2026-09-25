import React, { useMemo, useRef, useState } from 'react';
import {
  View,
  Image,
  TouchableOpacity,
  TextInput,
  FlatList,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { AppText } from '@/components/ui/text';
import { useTheme } from '@/theme/ThemeProvider';
import { createChannelSetupStyles } from '@/theme/createStep10Styles';
import { normalize } from '@/utils/normalize';
import Container from '@/components/layout/container';
import { useNavigation } from '@react-navigation/native';
import FontAwesome5Icon from 'react-native-vector-icons/FontAwesome5';
import ChannelOnboardingSheet from './channel-onboarding';
import AppBottomSheet from '@/components/ui/bottom-sheet';
import { useDataContext } from '@/store/useDataContext';
import { ThemedRefreshControl } from '@/components/ui/themed-refresh-control';
import moment from 'moment';
import { ACTIONS } from '@/store/types';
import { Channel } from '@/types/channel';
import ChatSkeleton from '@/components/skeleton/chat-skeleton';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useBrowseChannels } from '@/services/channels/browse-channel';

const BrowseChannel = () => {
  const { colors } = useTheme();
  const styles = useMemo(
    () => createChannelSetupStyles(colors).browseChannels,
    [colors],
  );
  const navigation = useNavigation();
  const [_isSheetOpen, setIsSheetOpen] = useState(false);
  const { state, dispatch } = useDataContext();
  const { user, orgId } = state;
  const [search, setSearch] = useState('');
  const { channels, loading, loadingMore, refresh, loadMore } =
    useBrowseChannels(orgId, search);

  const onboardingSheetRef = useRef<any>(null);

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
  };

  return (
    <Container color={colors.secondary} dark={true}>
      <View style={styles.topHeader}>
        <View style={styles.profileTop}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              style={{ marginRight: normalize(12) }}
            >
              <Ionicons name="chevron-back" size={24} color="white" />
            </TouchableOpacity>

            <AppText variant="bold" size={19} style={{ color: 'white' }}>
              All Channels
            </AppText>
          </View>

          <View style={styles.avatarContainer}>
            {user.avatar_url ? (
              <Image
                source={{ uri: user.avatar_url }}
                style={styles.profilePic}
              />
            ) : (
              <Image
                source={require('@/assets/images/user.png')}
                style={styles.profilePic}
              />
            )}
            <View style={styles.onlineBadge} />
          </View>
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

      {loading ? (
        <ScrollView
          style={{
            paddingHorizontal: normalize(20),
            paddingTop: normalize(20),
          }}
          showsVerticalScrollIndicator={false}
        >
          {/* Render 6 skeleton items while loading */}
          {[1, 2, 3, 4, 5, 6].map(key => (
            <ChatSkeleton key={key} />
          ))}
        </ScrollView>
      ) : (
        <>
          {!loading && channels?.length === 0 ? (
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
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.chatItem}
                  onPress={() => handleNavigate(item)}
                >
                  <View style={styles.avatarWrapper}>
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
                  </View>

                  <View style={styles.chatInfo}>
                    <View style={styles.chatHeaderRow}>
                      <AppText
                        variant="bold"
                        size={14}
                        numberOfLines={1}
                        style={styles.chatName}
                      >
                        {item.name}
                      </AppText>
                      <AppText size={12} style={styles.chatTime}>
                        {moment(item.created_at).format('h:mm a')}
                      </AppText>
                    </View>

                    <AppText size={12} style={styles.chatTime}>{`${
                      item.members_count
                    } ${
                      item.members_count > 1 ? 'members' : 'member'
                    } in channel`}</AppText>
                  </View>
                </TouchableOpacity>
              )}
              onEndReached={loadMore}
              onEndReachedThreshold={0.1}
              refreshControl={
                <ThemedRefreshControl
                  refreshing={loading && channels.length > 0}
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
    </Container>
  );
};

export default BrowseChannel;
