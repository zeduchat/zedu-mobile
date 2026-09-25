import React, { useState, useMemo, useRef } from 'react';
import {
  View,
  Image,
  TouchableOpacity,
  TextInput,
  SectionList,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import { AppText } from '@/components/ui/text';
import { useTheme } from '@/theme/ThemeProvider';
import { createMemberPickerStyles } from '@/theme/createScreenStyles';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Container from '@/components/layout/container';
import { useDataContext } from '@/store/useDataContext';
import { dmGroupUsersAlphabetically } from '@/utils/dm-grouping';
import UseGetOrgMembers from '@/services/org/get-org-members';
import { PostRequest } from '@/utils/requests';
import { ACTIONS } from '@/store/types';

import { ALPHABETS } from '@/utils/alphabet';

export const GroupAddNewMembersScreen = ({ route, navigation }: any) => {
  const { colors } = useTheme();
  const styles = useMemo(() => createMemberPickerStyles(colors), [colors]);
  const sectionListRef = useRef<SectionList>(null);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<string[]>([]);
  const [addLoading, setAddLoading] = useState(false);
  const { channel_id } = route.params;

  const { state, dispatch } = useDataContext();
  const { orgMembers, orgId: _orgId } = state;

  // Use the hook for pagination
  const { loading, loadMore } = UseGetOrgMembers();

  // Memoize selected objects for the horizontal header
  const selectedUserObjects = useMemo(
    () => (orgMembers || []).filter(u => selected.includes(u.id)),
    [selected, orgMembers],
  );

  // Memoize filtered and grouped list
  const filteredFlatList = useMemo(
    () =>
      (orgMembers || []).filter((u: any) =>
        u.name?.toLowerCase().includes(search.toLowerCase()),
      ),
    [search, orgMembers],
  );

  const groupedSections = useMemo(
    () => dmGroupUsersAlphabetically(filteredFlatList),
    [filteredFlatList],
  );

  const toggleUser = (id: string) => {
    setSelected(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id],
    );
  };

  const scrollToLetter = (letter: string) => {
    const index = groupedSections.findIndex(
      (section: any) => section.title === letter,
    );
    if (index !== -1) {
      sectionListRef.current?.scrollToLocation({
        sectionIndex: index,
        itemIndex: 0,
        animated: true,
        viewOffset: 0,
      });
    }
  };

  const renderHeader = () => (
    <View style={styles.listHeader}>
      {selectedUserObjects.length > 0 && (
        <View style={styles.selectedContainer}>
          <FlatList
            horizontal
            data={selectedUserObjects}
            keyExtractor={item => `selected-${item.id}`}
            showsHorizontalScrollIndicator={false}
            // contentContainerStyle={{ paddingHorizontal: 0 }}
            renderItem={({ item }) => (
              <View style={styles.selectedItem}>
                <View>
                  {item.profile_url ? (
                    <Image
                      source={{ uri: item.profile_url }}
                      style={styles.selectedAvatar}
                    />
                  ) : (
                    <View
                      style={[
                        styles.selectedAvatar,
                        {
                          backgroundColor: '#E5E7EB',
                          justifyContent: 'center',
                          alignItems: 'center',
                        },
                      ]}
                    >
                      <AppText variant="bold" size={12}>
                        {item.name?.charAt(0).toUpperCase()}
                      </AppText>
                    </View>
                  )}
                  <TouchableOpacity
                    style={styles.removeBadge}
                    onPress={() => toggleUser(item.id)}
                  >
                    <Ionicons name="close" size={12} color={colors.white} />
                  </TouchableOpacity>
                </View>
                <AppText style={styles.selectedName} numberOfLines={1}>
                  {item.name?.split(' ')[0]}
                </AppText>
              </View>
            )}
          />
        </View>
      )}
    </View>
  );

  const addMembers = async () => {
    setAddLoading(true);

    const payload = {
      user_ids: selected?.map(item => item),
    };

    const { data, error } = await PostRequest(
      `/organisations/group-dms/${channel_id}/participants`,
      payload,
    );

    if (!error) {
      dispatch({ type: ACTIONS.PARTICIPANT, payload: data.data.participants });
      dispatch({ type: ACTIONS.DMS_CHAT, payload: { data: [], page: 1 } });
      navigation.replace('ChatStack', {
        screen: 'GroupChatDetails',
        params: {
          channel_id: channel_id,
        },
      });
    } else {
      setAddLoading(false);
    }
  };

  //

  return (
    <Container>
      <View style={styles.navHeader}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <AppText style={styles.navActionText}>Cancel</AppText>
        </TouchableOpacity>

        <View style={styles.navTitleCenter}>
          <AppText style={styles.navTitle}>Add New Members</AppText>
          {/* <AppText style={styles.navCount}>{selected.length}/1,023</AppText> */}
        </View>

        <TouchableOpacity
          onPress={addMembers}
          disabled={selected.length === 0}
          style={{ flexDirection: 'row', alignItems: 'center' }}
        >
          {addLoading && <ActivityIndicator />}
          <AppText
            style={[
              styles.navActionText,
              { color: colors.primary, fontWeight: '700' as const },
              selected.length === 0 && { opacity: 0.3 },
            ]}
          >
            Next
          </AppText>
        </TouchableOpacity>
      </View>

      <View style={styles.searchSection}>
        <View style={styles.searchWrapper}>
          <AppText style={{ color: '#8E8E93', marginRight: 8 }}>To:</AppText>
          <TextInput
            placeholder="Search name"
            placeholderTextColor="#8E8E93"
            style={styles.input}
            value={search}
            onChangeText={setSearch}
          />
        </View>
      </View>

      <View style={styles.contentContainer}>
        {groupedSections.length === 0 ||
        groupedSections.every(section => section.data.length === 0) ? (
          <View style={styles.emptyStateContainer}>
            <Ionicons
              name="people-outline"
              size={48}
              color={colors.iconMuted}
              style={{ marginBottom: 12 }}
            />
            <AppText style={styles.emptyStateText}>No members found</AppText>
          </View>
        ) : (
          <>
            <SectionList
              ref={sectionListRef}
              sections={groupedSections}
              keyExtractor={item => item.id}
              ListHeaderComponent={renderHeader}
              stickySectionHeadersEnabled={false}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.scrollContent}
              onEndReached={loadMore}
              onEndReachedThreshold={0.5}
              ListFooterComponent={() =>
                loading ? (
                  <View style={{ paddingVertical: 20 }}>
                    <ActivityIndicator color={colors.primary} />
                  </View>
                ) : (
                  <View style={{ height: 50 }} />
                )
              }
              renderSectionHeader={({ section: { title } }) => (
                <AppText style={styles.sectionHeader}>{title}</AppText>
              )}
              renderItem={({ item, index, section }) => (
                <View
                  style={[
                    styles.groupCard,
                    index === 0 && styles.cardTop,
                    index === section.data.length - 1 && styles.cardBottom,
                  ]}
                >
                  <TouchableOpacity
                    style={[
                      styles.userRow,
                      index !== section.data.length - 1 && styles.rowBorder,
                    ]}
                    onPress={() => toggleUser(item.id)}
                  >
                    <View style={styles.userInfo}>
                      {item.avatar_url || item.default_avatar_url ? (
                        <Image
                          source={{
                            uri: item.avatar_url || item.default_avatar_url,
                          }}
                          style={styles.avatar}
                        />
                      ) : (
                        <View
                          style={[
                            styles.avatar,
                            {
                              backgroundColor: '#E5E7EB',
                              justifyContent: 'center',
                              alignItems: 'center',
                            },
                          ]}
                        >
                          <AppText variant="bold" size={12}>
                            {item.name?.charAt(0).toUpperCase()}
                          </AppText>
                        </View>
                      )}
                      <View>
                        <AppText style={styles.userName}>{item.name}</AppText>
                        <AppText style={styles.userRole}>
                          {item.role || 'Member'}
                        </AppText>
                      </View>
                    </View>
                    <View
                      style={[
                        styles.radioCircle,
                        selected.includes(item.id) && styles.radioActive,
                      ]}
                    >
                      {selected.includes(item.id) && (
                        <Ionicons
                          name="checkmark"
                          size={16}
                          color={colors.white}
                        />
                      )}
                    </View>
                  </TouchableOpacity>
                </View>
              )}
            />
            <View style={styles.alphabetSidebar}>
              {ALPHABETS.map(letter => (
                <TouchableOpacity
                  key={letter}
                  onPress={() => scrollToLetter(letter)}
                  hitSlop={{ top: 5, bottom: 5, left: 10, right: 10 }}
                >
                  <AppText style={styles.alphabetText}>{letter}</AppText>
                </TouchableOpacity>
              ))}
            </View>
          </>
        )}
      </View>
    </Container>
  );
};
