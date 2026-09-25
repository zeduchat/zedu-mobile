import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  View,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import { AppText } from '@/components/ui/text';
import { useTheme } from '@/theme/ThemeProvider';
import { createReactionDetailsStyles } from '@/theme/createChatOverlayStyles';
import ModalSheet from '@/components/ui/modal-sheet';
import FastImage from 'react-native-fast-image';
import { useDataContext } from '@/store/useDataContext';
import {
  fetchReactionUsers,
  type ReactionGroup,
  type ReactionUser,
} from '@/utils/reaction-users';

interface ReactionDetailsProps {
  visible: boolean;
  onClose: () => void;
  reactions: ReactionGroup[];
  threadId?: string | null;
  /** Emoji that was long-pressed — selected tab on open */
  initialReaction?: string | null;
}

const ReactionDetailsSheet = ({
  visible,
  onClose,
  reactions,
  threadId,
  initialReaction = null,
}: ReactionDetailsProps) => {
  const { colors } = useTheme();
  const styles = useMemo(() => createReactionDetailsStyles(colors), [colors]);
  const { state } = useDataContext();
  const currentUsername = (
    state?.user?.username ||
    state?.user?.display_name ||
    state?.user?.full_name ||
    ''
  ).trim();

  const [activeTab, setActiveTab] = useState<string>('All');
  const [reactors, setReactors] = useState<ReactionUser[]>([]);
  const [loading, setLoading] = useState(false);
  const cacheRef = useRef<Record<string, ReactionUser[]>>({});
  const requestIdRef = useRef(0);

  const tabs = useMemo(() => {
    const emojiTabs = (reactions || [])
      .filter(r => r?.reaction)
      .map(r => ({
        key: r.reaction,
        label: r.reaction,
        count: r.reaction_count ?? 0,
      }));
    const total = emojiTabs.reduce(
      (sum, tab) => sum + (Number(tab.count) || 0),
      0,
    );
    return [
      { key: 'All', label: 'All', count: total || reactions?.length || 0 },
      ...emojiTabs,
    ];
  }, [reactions]);

  const loadReactors = useCallback(
    async (tab: string) => {
      if (!threadId || !reactions?.length) {
        setReactors([]);
        setLoading(false);
        return;
      }

      if (cacheRef.current[tab]) {
        setReactors(cacheRef.current[tab]);
        setLoading(false);
        return;
      }

      const requestId = ++requestIdRef.current;
      setLoading(true);
      try {
        let users: ReactionUser[] = [];

        if (tab === 'All') {
          const batches = await Promise.all(
            reactions.map(async reaction => {
              if (!reaction.reaction_id) return [];
              return fetchReactionUsers(
                reaction.reaction_id,
                threadId,
                reaction.reaction,
                reaction.userReacted ? currentUsername : undefined,
              );
            }),
          );
          users = batches.flat();
        } else {
          const reaction = reactions.find(r => r.reaction === tab);
          if (reaction?.reaction_id) {
            users = await fetchReactionUsers(
              reaction.reaction_id,
              threadId,
              reaction.reaction,
              reaction.userReacted ? currentUsername : undefined,
            );
          }
        }

        if (requestId !== requestIdRef.current) return;
        cacheRef.current[tab] = users;
        setReactors(users);
      } finally {
        if (requestId === requestIdRef.current) {
          setLoading(false);
        }
      }
    },
    [currentUsername, reactions, threadId],
  );

  useEffect(() => {
    if (!visible) return;

    const nextTab =
      initialReaction && reactions.some(r => r.reaction === initialReaction)
        ? initialReaction
        : 'All';

    cacheRef.current = {};
    setActiveTab(nextTab);
    setReactors([]);
    void loadReactors(nextTab);
  }, [visible, initialReaction, reactions, loadReactors]);

  const handleTabPress = (tab: string) => {
    if (tab === activeTab) return;
    setActiveTab(tab);
    void loadReactors(tab);
  };

  const handleClose = () => {
    onClose();
    setActiveTab('All');
    setReactors([]);
    cacheRef.current = {};
  };

  const renderUser = ({ item }: { item: ReactionUser }) => {
    const avatarUri = item.avatar_url || item.default_avatar_url;
    return (
      <View style={styles.userReactionRow}>
        {avatarUri ? (
          <FastImage source={{ uri: avatarUri }} style={styles.sheetAvatar} />
        ) : (
          <View style={[styles.sheetAvatar, styles.sheetAvatarFallback]}>
            <AppText variant="bold" size={16} style={styles.sheetAvatarInitial}>
              {(item.username || '?').charAt(0).toUpperCase()}
            </AppText>
          </View>
        )}
        <View style={styles.sheetUserInfo}>
          <AppText variant="medium" size={15} style={styles.sheetUserName}>
            {item.username || 'User'}
          </AppText>
          {!!item.full_name && item.full_name !== item.username && (
            <AppText size={12} style={styles.sheetUserMeta}>
              {item.full_name}
            </AppText>
          )}
        </View>
        <AppText style={styles.sheetEmoji}>{item.reaction}</AppText>
      </View>
    );
  };

  const header = (
    <View style={styles.headerBlock}>
      <AppText variant="bold" style={styles.sheetTitle}>
        Reactions
      </AppText>
      {activeTab !== 'All' && (
        <View style={styles.heroEmojiWrap}>
          <AppText style={styles.heroEmoji}>{activeTab}</AppText>
        </View>
      )}
    </View>
  );

  return (
    <ModalSheet
      visible={visible}
      onClose={handleClose}
      header={header}
      containerStyle={{ backgroundColor: colors.surface }}
    >
      <View style={styles.body}>
        <View style={styles.tabContainer}>
          <FlatList
            horizontal
            showsHorizontalScrollIndicator={false}
            data={tabs}
            keyExtractor={item => item.key}
            contentContainerStyle={styles.tabList}
            renderItem={({ item }) => {
              const isActive = activeTab === item.key;
              return (
                <TouchableOpacity
                  onPress={() => handleTabPress(item.key)}
                  style={styles.tabItem}
                  activeOpacity={0.7}
                >
                  <AppText
                    style={[styles.tabText, isActive && styles.activeTabText]}
                  >
                    {item.key === 'All'
                      ? `All ${item.count}`
                      : `${item.label}  ${item.count || ''}`.trim()}
                  </AppText>
                  {isActive && <View style={styles.tabIndicator} />}
                </TouchableOpacity>
              );
            }}
          />
        </View>

        {loading ? (
          <View style={styles.loadingState}>
            <ActivityIndicator color={colors.primary} />
          </View>
        ) : (
          <FlatList
            style={styles.list}
            data={reactors}
            keyExtractor={(item, index) =>
              `${item.user_id || item.username}-${item.reaction}-${index}`
            }
            renderItem={renderUser}
            contentContainerStyle={styles.sheetList}
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <AppText style={styles.emptyText}>No reactors yet</AppText>
              </View>
            }
          />
        )}
      </View>
    </ModalSheet>
  );
};

export default ReactionDetailsSheet;
