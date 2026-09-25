import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  TouchableOpacity,
  FlatList,
  StatusBar,
  TextInput,
  Image,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { AppText } from '@/components/ui/text';
import { useTheme } from '@/theme/ThemeProvider';
import { createBuzzListStyles } from '@/theme/createBuzzStyles';
import { ThemedRefreshControl } from '@/components/ui/themed-refresh-control';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { statusBarTopPadding } from '@/utils/status-bar-inset';
import { BuzzListItem } from '@/components/layout/buzz/live-buzzes-list';
import { useOrgBuzzes } from '@/hooks/useOrgBuzzes';
import { OrgBuzz } from '@/types/buzz';
import { OrgBuzzFilter } from '@/utils/org-buzz';

const FILTER_OPTIONS: { id: OrgBuzzFilter; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'channel', label: 'Channels' },
  { id: 'dm', label: 'Direct' },
];

const AllBuzzesScreen = () => {
  const { colors } = useTheme();
  const styles = useMemo(() => createBuzzListStyles(colors), [colors]);
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const headerTopPadding = statusBarTopPadding(insets.top);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState<OrgBuzzFilter>('all');

  useEffect(() => {
    const timeout = setTimeout(() => {
      setSearch(searchInput);
    }, 400);

    return () => clearTimeout(timeout);
  }, [searchInput]);

  const { buzzes, loading, loadingMore, error, refresh, loadMore } =
    useOrgBuzzes({ search, filter: activeFilter });

  const listHeader = useMemo(
    () => (
      <View style={styles.filtersSection}>
        <View style={styles.searchBar}>
          <Image
            source={require('@/assets/icons/search.png')}
            style={styles.searchIcon}
          />
          <TextInput
            placeholder="Search buzzes"
            placeholderTextColor={colors.textMuted}
            style={styles.searchInput}
            value={searchInput}
            onChangeText={setSearchInput}
          />
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterScroll}
        >
          {FILTER_OPTIONS.map(filter => (
            <TouchableOpacity
              key={filter.id}
              style={[
                styles.filterChip,
                activeFilter === filter.id && styles.filterChipActive,
              ]}
              onPress={() => setActiveFilter(filter.id)}
            >
              <AppText
                size={13}
                variant="medium"
                style={[
                  styles.filterChipText,
                  activeFilter === filter.id && styles.filterChipTextActive,
                ]}
              >
                {filter.label}
              </AppText>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    ),
    [searchInput, activeFilter, styles, colors.textMuted],
  );

  const renderItem = ({ item }: { item: OrgBuzz }) => (
    <BuzzListItem buzz={item} />
  );

  const renderEmpty = () => {
    if (loading) {
      return (
        <View style={styles.emptyWrap}>
          <ActivityIndicator color={colors.primary} />
        </View>
      );
    }

    if (error) {
      return (
        <View style={styles.emptyWrap}>
          <AppText size={13} style={styles.emptyText}>
            {error}
          </AppText>
        </View>
      );
    }

    return (
      <View style={styles.emptyWrap}>
        <Ionicons
          name="videocam-off-outline"
          size={28}
          color={colors.textMuted}
        />
        <AppText size={13} style={styles.emptyText}>
          No buzzes match your search
        </AppText>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.secondary} />

      <View style={[styles.header, { paddingTop: headerTopPadding }]}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backBtn}
        >
          <Ionicons name="chevron-back" size={24} color={colors.white} />
        </TouchableOpacity>
        <AppText variant="bold" style={styles.headerTitle}>
          All Buzzes
        </AppText>
        <View style={styles.backBtn} />
      </View>

      <FlatList
        data={buzzes}
        keyExtractor={item => item.buzz_id}
        renderItem={renderItem}
        ListHeaderComponent={listHeader}
        ListEmptyComponent={renderEmpty}
        contentContainerStyle={[
          styles.listContent,
          buzzes.length === 0 && styles.listContentEmpty,
        ]}
        showsVerticalScrollIndicator={false}
        onEndReached={loadMore}
        onEndReachedThreshold={0.1}
        refreshControl={
          <ThemedRefreshControl
            refreshing={loading && buzzes.length > 0}
            onRefresh={refresh}
          />
        }
        ListFooterComponent={
          loadingMore ? (
            <ActivityIndicator
              color={colors.primary}
              style={styles.footerLoader}
            />
          ) : null
        }
      />
    </View>
  );
};

export default AllBuzzesScreen;
