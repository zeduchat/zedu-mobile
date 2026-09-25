import React, { useState, useMemo, useRef } from 'react';
import {
  View,
  Image,
  TouchableOpacity,
  TextInput,
  SectionList,
  ActivityIndicator,
} from 'react-native';
import { AppText } from '@/components/ui/text';
import { useTheme } from '@/theme/ThemeProvider';
import { createMemberPickerStyles } from '@/theme/createScreenStyles';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Container from '@/components/layout/container';
import { dmGroupUsersAlphabetically } from '@/utils/dm-grouping';
import UseGetOrgMembers from '@/services/org/get-org-members';
import { useDataContext } from '@/store/useDataContext';
import { PostRequest } from '@/utils/requests';
import { ACTIONS } from '@/store/types';

import { ALPHABETS } from '@/utils/alphabet';

export const AddMemberScreen = ({ navigation }: any) => {
  const { colors } = useTheme();
  const styles = useMemo(() => createMemberPickerStyles(colors), [colors]);
  const sectionListRef = useRef<SectionList>(null);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<string[]>([]);
  const [addLoading, setAddLoading] = useState(false);
  const { state, dispatch } = useDataContext();
  const { orgMembers, orgId } = state;
  const { loading, loadMore } = UseGetOrgMembers();

  // Group the dynamic data instead of static BACKEND_USERS
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
    const isAlreadySelected = selected.includes(id);

    // If trying to add a NEW member and we already have 1
    if (!isAlreadySelected && selected.length >= 1) {
      dispatch({
        type: ACTIONS.ERROR,
        payload: 'You can only select one member at a time.',
      });
      return;
    }

    // remove if exists, add if not
    setSelected(prev =>
      isAlreadySelected ? prev.filter(i => i !== id) : [...prev, id],
    );
  };

  const addMember = async () => {
    setAddLoading(true);
    const id = selected[0];

    const firstPayload = {
      chat_type: 'user',
      participant_id: id,
    };

    const { data, error } = await PostRequest(
      `/organisations/${orgId}/dms`,
      firstPayload,
    );

    if (!error) {
      dispatch({ type: ACTIONS.PARTICIPANT, payload: data.data.participants });
      dispatch({ type: ACTIONS.DMS_CHAT, payload: { data: [], page: 1 } });
      navigation.replace('ChatStack', {
        screen: 'ChatDetails',
        params: {
          participant_id: id,
          channel_id: data?.data?.channel_id,
        },
      });
    } else {
      setAddLoading(false);
    }
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

  //

  return (
    <Container>
      {/* Header with Create Action */}
      <View style={styles.navHeader}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <AppText style={styles.navActionText}>Cancel</AppText>
        </TouchableOpacity>

        <View style={styles.navTitleCenter}>
          <AppText style={styles.navTitle}>Members</AppText>
        </View>

        <TouchableOpacity
          onPress={addMember}
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

      {/* Search Input */}
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
        <View style={styles.contentContainer}>
          <SectionList
            ref={sectionListRef}
            sections={groupedSections}
            keyExtractor={item => item.id}
            stickySectionHeadersEnabled={false}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
            // Pagination Logic
            onEndReached={loadMore}
            onEndReachedThreshold={0.5}
            ListFooterComponent={() =>
              loading ? (
                <View style={styles.footerLoader}>
                  <ActivityIndicator size="small" color={colors.primary} />
                </View>
              ) : (
                <View style={{ height: 40 }} />
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

          {/* Alphabet Sidebar */}
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
        </View>
      )}
    </Container>
  );
};
