import React, { useState, useMemo } from 'react';
import {
  View,
  Image,
  TouchableOpacity,
  TextInput,
  ScrollView,
} from 'react-native';
import { AppText } from '@/components/ui/text';
import { useTheme } from '@/theme/ThemeProvider';
import { createMemberPickerStyles } from '@/theme/createScreenStyles';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { groupUsersAlphabetically } from '@/utils/grouping';
import { normalize } from '@/utils/normalize';
import FontAwesome5Icon from 'react-native-vector-icons/FontAwesome5';

// Mock data (keep your BACKEND_USERS array here)
const BACKEND_USERS = [
  {
    id: '1',
    name: 'Toyosi Bello',
    role: 'Product Designer',
    img: require('@/assets/images/user-1.png'),
  },
  {
    id: '2',
    name: 'Mabel',
    role: 'Product Designer',
    img: require('@/assets/images/user-2.png'),
  },
  {
    id: '3',
    name: 'Midas',
    role: 'Fullstack Dev',
    img: require('@/assets/images/user-3.png'),
  },
  {
    id: '4',
    name: 'Erasmus',
    role: 'Product Designer',
    img: require('@/assets/images/user-3.png'),
  },
  {
    id: '5',
    name: 'A1',
    role: 'Product Designer',
    img: require('@/assets/images/user-1.png'),
  },
  {
    id: '6',
    name: 'A2',
    role: 'Product Designer',
    img: require('@/assets/images/user-2.png'),
  },
  {
    id: '7',
    name: 'A3',
    role: 'Product Designer',
    img: require('@/assets/images/user-1.png'),
  },
  {
    id: '8',
    name: 'A4',
    role: 'Product Designer',
    img: require('@/assets/images/user-3.png'),
  },
];

export const AddMembersToCall = ({ onClose, onAddMembers }: any) => {
  const { colors } = useTheme();
  const baseStyles = useMemo(() => createMemberPickerStyles(colors), [colors]);
  const styles = useMemo(
    () => ({
      ...baseStyles,
      mainWrapper: baseStyles.safeArea,
      scrollContent: {
        paddingHorizontal: 20,
        paddingBottom: normalize(100),
      },
      searchWrapper: {
        ...baseStyles.searchWrapper,
        height: 48,
        marginBottom: 10,
      },
      floatingFooter: {
        padding: 10,
        position: 'absolute' as const,
        bottom: normalize(10),
        left: 20,
        right: 20,
        zIndex: 999,
      },
      addButton: {
        backgroundColor: colors.primary,
        flexDirection: 'row' as const,
        height: 56,
        borderRadius: 16,
        alignItems: 'center' as const,
        justifyContent: 'center' as const,
        shadowColor: colors.black,
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.2,
        shadowRadius: 10,
        elevation: 10,
      },
      addButtonText: {
        color: colors.white,
        fontSize: 16,
        fontWeight: '700' as const,
        marginLeft: 8,
      },
    }),
    [baseStyles, colors],
  );
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<string[]>([]);
  const selectedUserObjects = useMemo(
    () => BACKEND_USERS.filter(u => selected.includes(u.id)),
    [selected],
  );

  const filteredFlatList = useMemo(
    () =>
      BACKEND_USERS.filter(u =>
        u.name.toLowerCase().includes(search.toLowerCase()),
      ),
    [search],
  );

  const groupedSections = useMemo(
    () => groupUsersAlphabetically(filteredFlatList),
    [filteredFlatList],
  );

  const toggleUser = (id: string) => {
    setSelected(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id],
    );
  };

  return (
    <View>
      <ScrollView
        showsVerticalScrollIndicator={false}
        style={styles.mainWrapper}
      >
        {/* 1. Header & Search (Fixed at top) */}
        <View style={styles.navHeader}>
          <TouchableOpacity onPress={onClose}>
            <AppText style={styles.navActionText}>Cancel</AppText>
          </TouchableOpacity>

          <View style={styles.navTitleCenter}>
            <AppText style={styles.navTitle}>Add Members</AppText>
            <AppText style={styles.navCount}>{selected.length}/1,023</AppText>
          </View>
          <TouchableOpacity
            onPress={() => onAddMembers(selectedUserObjects)}
            disabled={selected.length === 0}
            style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}
          >
            <AppText
              style={[
                styles.navActionText,
                { color: colors.primary, fontWeight: '700' },
                selected.length === 0 && { opacity: 0.3 },
              ]}
            >
              Add
            </AppText>
            <FontAwesome5Icon
              name="plus"
              size={14}
              color={colors.primary}
              style={{ opacity: selected.length === 0 ? 0.3 : 1 }}
            />
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

        {/* 2. Scrollable Content Area */}
        <View style={styles.scrollContent}>
          {selectedUserObjects.length > 0 && (
            <View style={styles.selectedContainer}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {selectedUserObjects.map(user => (
                  <View key={user.id} style={styles.selectedItem}>
                    <View>
                      <Image source={user.img} style={styles.selectedAvatar} />
                      <TouchableOpacity
                        style={styles.removeBadge}
                        onPress={() => toggleUser(user.id)}
                      >
                        <Ionicons name="close" size={12} color="#FFF" />
                      </TouchableOpacity>
                    </View>
                    <AppText style={styles.selectedName} numberOfLines={1}>
                      {user.name.split(' ')[0]}
                    </AppText>
                  </View>
                ))}
              </ScrollView>
            </View>
          )}

          {groupedSections.map((section: any) => (
            <View key={section.title}>
              <AppText style={styles.sectionHeader}>{section.title}</AppText>
              <View style={styles.groupCard}>
                {section.data.map((user: any, idx: number) => (
                  <TouchableOpacity
                    key={user.id}
                    style={[
                      styles.userRow,
                      idx !== section.data.length - 1 && styles.rowBorder,
                    ]}
                    onPress={() => toggleUser(user.id)}
                  >
                    <View style={styles.userInfo}>
                      <Image source={user.img} style={styles.avatar} />
                      <View>
                        <AppText style={styles.userName}>{user.name}</AppText>
                        <AppText style={styles.userRole}>{user.role}</AppText>
                      </View>
                    </View>
                    <View
                      style={[
                        styles.radioCircle,
                        selected.includes(user.id) && styles.radioActive,
                      ]}
                    >
                      {selected.includes(user.id) && (
                        <Ionicons name="checkmark" size={16} color="#FFF" />
                      )}
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          ))}
        </View>
      </ScrollView>

      {/* 3. FLOATING BUTTON (Fixed at the absolute bottom of the wrapper) */}
      {selected.length > 0 && (
        <View style={styles.floatingFooter}>
          <TouchableOpacity
            style={styles.addButton}
            activeOpacity={0.9}
            onPress={() => {
              onAddMembers(selectedUserObjects);
              onClose();
            }}
          >
            <Ionicons name="add" size={24} color="#FFF" />
            <AppText style={styles.addButtonText}>Add to buzz</AppText>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};
