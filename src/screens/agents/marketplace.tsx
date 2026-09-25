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
import { useEffect, useMemo } from 'react';
import { AppText } from '@/components/ui/text';
import { useTheme } from '@/theme/ThemeProvider';
import { createAgentScreenStyles } from '@/theme/createStep10Styles';
import FontAwesome5Icon from 'react-native-vector-icons/FontAwesome5';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import { Agent } from '@/types/agents';
import { useMarketplace } from '@/services/agents/marketplace';
import ChatSkeleton from '@/components/skeleton/chat-skeleton';
import { ThemedRefreshControl } from '@/components/ui/themed-refresh-control';
import { useDataContext } from '@/store/useDataContext';
import { normalize } from '@/utils/normalize';

const Marketplace = () => {
  const { colors } = useTheme();
  const styles = useMemo(
    () => createAgentScreenStyles(colors).marketplace,
    [colors],
  );
  const navigation = useNavigation();
  const { state } = useDataContext();
  const { user } = state;
  const {
    data: agents,
    loading,
    loadingMore,
    loadMore,
    refresh,
  } = useMarketplace<Agent>('/agents', 50);

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

  useEffect(() => {
    refresh();
  }, []);

  const renderAgentItem = ({ item }: { item: Agent }) => (
    <TouchableOpacity
      style={styles.agentItem}
      onPress={() =>
        navigation.navigate('AgentStack', {
          screen: 'AgentDetails',
          params: { id: item.id },
        })
      }
    >
      <View style={styles.avatarPlaceholder}>
        <Image
          source={
            item.avatar
              ? { uri: item.avatar }
              : require('@/assets/images/agent-avatar.png')
          }
          style={styles.avatarImg}
        />
      </View>
      <View style={styles.agentInfo}>
        <View style={styles.agentHeader}>
          <AppText
            variant="bold"
            style={styles.agentName}
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            {item.name}
          </AppText>
          <TouchableOpacity>
            <Ionicons name="chevron-forward" size={24} color="#8E8E93" />
          </TouchableOpacity>
        </View>
        <AppText variant="medium" style={styles.agentRole}>
          {item.title}
        </AppText>
        <AppText numberOfLines={2} style={styles.agentDesc}>
          {item.description}
        </AppText>
      </View>
    </TouchableOpacity>
  );

  //

  return (
    <Container color={colors.secondary} dark={true}>
      <View style={styles.topHeader}>
        <View style={styles.profileTop}>
          <TouchableOpacity
            activeOpacity={0.8}
            style={{ flexDirection: 'row', alignItems: 'center', gap: 15 }}
            onPress={() => navigation.goBack()}
          >
            <FontAwesome5Icon name="chevron-left" color="white" size={20} />
            <AppText variant="bold" size={19} style={{ color: 'white' }}>
              Marketplace
            </AppText>
          </TouchableOpacity>

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
            placeholder="Search marketplace"
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
              <FlatList
                data={agents}
                keyExtractor={item => item.id}
                renderItem={renderAgentItem}
                contentContainerStyle={styles.listContent}
                showsVerticalScrollIndicator={false}
                onEndReached={loadMore}
                onEndReachedThreshold={0.5}
                refreshControl={
                  <ThemedRefreshControl
                    refreshing={loading && agents.length > 0}
                    onRefresh={refresh}
                  />
                }
                ListEmptyComponent={!loading ? renderEmptyState : null}
                ListFooterComponent={
                  loadingMore ? (
                    <View style={{ paddingVertical: 20 }}>
                      <ActivityIndicator color={colors.primary} />
                    </View>
                  ) : null
                }
              />
            )}
          </>
        )}
      </View>
    </Container>
  );
};

export default Marketplace;
