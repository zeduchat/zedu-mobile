import Container from '@/components/layout/container';
import {
  ActivityIndicator,
  FlatList,
  Image,
  ScrollView,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useMemo } from 'react';
import { AppText } from '@/components/ui/text';
import { useTheme } from '@/theme/ThemeProvider';
import { createAgentScreenStyles } from '@/theme/createStep10Styles';
import { normalize } from '@/utils/normalize';
import { useNavigation } from '@react-navigation/native';
import { useDataContext } from '@/store/useDataContext';
import { useOrgAgents } from '@/services/agents/agent-list';
import { AgentPopover } from '@/components/layout/agent-popover';
import { ThemedRefreshControl } from '@/components/ui/themed-refresh-control';
import ChatSkeleton from '@/components/skeleton/chat-skeleton';

const AgentHome = () => {
  const { colors } = useTheme();
  const styles = useMemo(() => createAgentScreenStyles(colors).index, [colors]);
  const navigation = useNavigation();
  const { state } = useDataContext();
  const { user, orgData, orgId, callback } = state;

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Image
        source={require('@/assets/icons/empty-box.png')}
        style={styles.emptyImage}
        resizeMode="contain"
      />
      <AppText variant="bold" style={styles.emptyTitle}>
        No Agents Found
      </AppText>
      <AppText style={styles.emptySubTitle}>
        Tap the marketplace button to explore and install new agents.
      </AppText>
      <TouchableOpacity style={styles.browseButton}>
        <Image source={require('@/assets/icons/store-front.png')} />
        <AppText variant="bold" style={styles.browseButtonText}>
          Browse Marketplace
        </AppText>
      </TouchableOpacity>
    </View>
  );

  // Use the separate hook with local state
  const { agents, loading, loadingMore, refresh, loadMore } = useOrgAgents(
    orgId,
    callback,
  );

  //

  return (
    <Container color={colors.secondary} dark={true}>
      <View style={styles.topHeader}>
        <View style={styles.profileTop}>
          <AppText variant="bold" size={19} style={{ color: 'white' }}>
            {orgData?.name}
          </AppText>

          <TouchableOpacity
            style={styles.avatarContainer}
            onPress={() =>
              navigation.navigate('SettingStack', { screen: 'Profile' })
            }
          >
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
          </TouchableOpacity>
        </View>

        <View style={styles.searchBar}>
          <Image
            source={require('@/assets/icons/search.png')}
            style={styles.searchIcon}
          />
          <TextInput
            placeholder="Find an agent"
            placeholderTextColor={colors.white}
            style={styles.searchInput}
          />
        </View>
      </View>

      {/* Content Section with White Rounded Background */}
      <View style={styles.contentContainer}>
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
            {agents.length === 0 ? (
              renderEmptyState()
            ) : (
              <>
                <FlatList
                  data={agents}
                  keyExtractor={item => item.id}
                  renderItem={({ item }) => {
                    return (
                      <TouchableOpacity style={styles.agentItem}>
                        <View style={styles.avatarPlaceholder}>
                          {item.avatar ? (
                            <Image
                              source={{ uri: item.avatar }}
                              style={styles.avatarImg}
                            />
                          ) : (
                            <Image
                              source={require('@/assets/images/agent-avatar.png')}
                              style={styles.avatarImg}
                            />
                          )}
                        </View>
                        <View style={styles.agentInfo}>
                          <View style={styles.agentHeader}>
                            <AppText variant="bold" style={styles.agentName}>
                              {item.name}
                            </AppText>
                            {item.thread_count > 0 && (
                              <View style={styles.countBadge}>
                                <AppText
                                  size={12}
                                  variant="bold"
                                  style={styles.countText}
                                >
                                  {item.thread_count}
                                </AppText>
                              </View>
                            )}
                          </View>
                          <AppText variant="medium" style={styles.agentRole}>
                            {item.title}
                          </AppText>
                          {/* <AppText numberOfLines={2} style={styles.agentDesc}>{item.preview_message}</AppText> */}
                        </View>
                      </TouchableOpacity>
                    );
                  }}
                  contentContainerStyle={styles.listContent}
                  showsVerticalScrollIndicator={false}
                  onEndReached={loadMore}
                  onEndReachedThreshold={0.4}
                  refreshControl={
                    <ThemedRefreshControl
                      refreshing={loading && agents.length > 0}
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
                {/* Floating Marketplace Button */}
                <AgentPopover />
              </>
            )}
          </>
        )}
      </View>
    </Container>
  );
};
export default AgentHome;
