import React, { useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  SectionList,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { AppText } from '@/components/ui/text';
import { useTheme } from '@/theme/ThemeProvider';
import { createBuzzAddMembersStyles } from '@/theme/createBuzzStyles';
import { ACTIONS } from '@/store/types';
import { useDataContext } from '@/store/useDataContext';
import UseGetOrgMembers from '@/services/org/get-org-members';
import { dmGroupUsersAlphabetically } from '@/utils/dm-grouping';
import FastImage from 'react-native-fast-image';

import { ALPHABETS } from '@/utils/alphabet';

export const AddMembersToCall = ({
  onClose,
  onAddMembers,
  existingParticipants = [],
}: any) => {
  const { colors } = useTheme();
  const styles = useMemo(() => createBuzzAddMembersStyles(colors), [colors]);
  const sectionListRef = useRef<SectionList>(null);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<string[]>([]);
  const [addLoading, setAddLoading] = useState(false);

  const { state, dispatch } = useDataContext();
  const { orgMembers = [] } = state;
  const { loading, loadMore } = UseGetOrgMembers();

  const existingParticipantIds = useMemo(
    () =>
      new Set(
        (existingParticipants || []).map((item: any) =>
          String(item?.user_id ?? item?.id),
        ),
      ),
    [existingParticipants],
  );

  const inviteableMembers = useMemo(
    () =>
      (orgMembers || [])
        .map((item: any) => ({
          ...item,
          id: String(item?.id ?? item?.user_id),
          name:
            item?.name || item?.full_name || item?.username || 'Unknown User',
        }))
        .filter((item: any) => !existingParticipantIds.has(String(item.id))),
    [existingParticipantIds, orgMembers],
  );

  const filteredFlatList = useMemo(
    () =>
      inviteableMembers.filter((u: any) =>
        u.name?.toLowerCase().includes(search.toLowerCase()),
      ),
    [inviteableMembers, search],
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

  const selectedUserObjects = useMemo(
    () =>
      inviteableMembers.filter((item: any) =>
        selected.includes(String(item.id)),
      ),
    [inviteableMembers, selected],
  );

  const transformAndInviteMembers = (members: any[]) => {
    return members.map((item: any) => ({
      ...item,
      user_id: item?.id ?? item?.user_id,
      full_name: item?.name || item?.full_name || item?.username,
      avatar_url: item?.avatar_url || item?.default_avatar_url,
      role: item?.role || 'Member',
      join_status: 'pending',
      invited: true,
      audioTrack: false,
      videoTrack: false,
      handsRaised: false,
    }));
  };

  const addMembers = async () => {
    if (selectedUserObjects.length === 0) return;

    setAddLoading(true);
    try {
      const transformedMembers = transformAndInviteMembers(selectedUserObjects);
      await onAddMembers(transformedMembers);
      onClose();
    } catch (_error) {
      dispatch({
        type: ACTIONS.ERROR,
        payload: 'Failed to invite selected members.',
      });
    } finally {
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

  return (
    <View style={{ flex: 1 }}>
      <View style={styles.navHeader}>
        <TouchableOpacity onPress={onClose}>
          <AppText style={styles.navActionText}>Cancel</AppText>
        </TouchableOpacity>

        <View style={styles.navTitleCenter}>
          <AppText style={styles.navTitle}>Members</AppText>
        </View>

        <TouchableOpacity
          onPress={addMembers}
          disabled={selected.length === 0 || addLoading}
          style={styles.navActionRow}
        >
          {addLoading && (
            <ActivityIndicator
              size="small"
              color={colors.primary}
              style={styles.navActionLoading}
            />
          )}
          <AppText
            style={[
              styles.navActionText,
              styles.navActionBold,
              (selected.length === 0 || addLoading) && { opacity: 0.3 },
            ]}
          >
            Add
          </AppText>
        </TouchableOpacity>
      </View>

      <View style={styles.searchSection}>
        <View style={styles.searchWrapper}>
          <AppText style={styles.searchLabel}>To:</AppText>
          <TextInput
            placeholder="Search name"
            placeholderTextColor={colors.messageMeta}
            style={styles.input}
            value={search}
            onChangeText={setSearch}
          />
        </View>
      </View>

      {groupedSections.length === 0 ||
      groupedSections.every((section: any) => section.data.length === 0) ? (
        <View style={styles.emptyStateContainer}>
          <Ionicons
            name="people-outline"
            size={48}
            color={colors.border}
            style={{ marginBottom: 12 }}
          />
          <AppText style={styles.emptyStateText}>No members found</AppText>
        </View>
      ) : (
        <View style={styles.contentContainer}>
          <SectionList
            ref={sectionListRef}
            sections={groupedSections}
            keyExtractor={(item: any) => String(item.id)}
            style={{ flex: 1 }}
            stickySectionHeadersEnabled={false}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
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
            renderSectionHeader={({ section }: any) => (
              <AppText style={styles.sectionHeader}>{section.title}</AppText>
            )}
            renderItem={({ item, index, section }: any) => {
              const itemId = String(item.id);
              const itemName = item?.name || 'Unknown User';
              const itemRole = item?.role || 'Member';

              return (
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
                    onPress={() => toggleUser(itemId)}
                  >
                    <View style={styles.userInfo}>
                      <FastImage
                        source={{
                          uri: item.avatar_url || item.default_avatar_url,
                        }}
                        style={styles.avatar}
                      />

                      <View>
                        <AppText style={styles.userName}>{itemName}</AppText>
                        <AppText style={styles.userRole}>{itemRole}</AppText>
                      </View>
                    </View>
                    <View
                      style={[
                        styles.radioCircle,
                        selected.includes(itemId) && styles.radioActive,
                      ]}
                    >
                      {selected.includes(itemId) && (
                        <Ionicons
                          name="checkmark"
                          size={16}
                          color={colors.white}
                        />
                      )}
                    </View>
                  </TouchableOpacity>
                </View>
              );
            }}
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
        </View>
      )}
    </View>
  );
};
