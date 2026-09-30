import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import moment from 'moment';
import type { RouteProp } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import { AppText } from '@/components/ui/text';
import Container from '@/components/layout/container';
import { useTheme } from '@/theme/ThemeProvider';
import { useDataContext } from '@/store/useDataContext';
import { ACTIONS } from '@/store/types';
import { ShowNotify } from '@/components/ui/toast';
import { getPlainMessageText } from '@/utils/message-text';
import { fetchPinnedMessages, unpinMessage } from '@/utils/pin-message';
import {
  normalizePins,
  pinKind,
  resolvePinnedMessages,
  type PinScope,
  type ResolvedPin,
} from '@/utils/resolve-pinned-messages';
import { setPendingPinJump } from '@/utils/scroll-to-pinned-message';

export type PinnedMessagesParams = {
  channel_id: string;
  scope?: PinScope;
};

type Props = {
  navigation: StackNavigationProp<any>;
  route: RouteProp<{ PinnedMessages: PinnedMessagesParams }, 'PinnedMessages'>;
};

const PinnedMessagesScreen = ({ navigation, route }: Props) => {
  const { colors } = useTheme();
  const { state, dispatch } = useDataContext();
  const channelId = route.params?.channel_id;
  const scope: PinScope = route.params?.scope ?? 'channel';

  const [loading, setLoading] = useState(true);
  const [unpinningId, setUnpinningId] = useState<string | null>(null);
  const [pins, setPins] = useState<ResolvedPin[]>([]);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        header: {
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: 12,
          paddingVertical: 12,
          borderBottomWidth: StyleSheet.hairlineWidth,
          borderBottomColor: colors.border,
          gap: 8,
        },
        title: {
          flex: 1,
        },
        row: {
          paddingHorizontal: 16,
          paddingVertical: 14,
          borderBottomWidth: StyleSheet.hairlineWidth,
          borderBottomColor: colors.border,
        },
        meta: {
          color: colors.textSecondary,
          marginTop: 4,
        },
        actions: {
          flexDirection: 'row',
          marginTop: 10,
          gap: 16,
        },
        empty: {
          padding: 48,
          alignItems: 'center',
        },
      }),
    [colors],
  );

  useEffect(() => {
    if (!channelId) return;

    let cancelled = false;
    const load = async () => {
      setLoading(true);
      const { data, error } = await fetchPinnedMessages(channelId);
      if (cancelled) return;

      if (error) {
        ShowNotify('Error', error);
        setPins([]);
        setLoading(false);
        return;
      }

      const records = normalizePins((data as any)?.data ?? data);
      const localMessages = [
        ...(state.channelsChat || []),
        ...(state.dmsChat || []),
        ...(state.replyChat || []),
      ];

      const resolved = await resolvePinnedMessages({
        records,
        knownMessages: localMessages,
        scope,
        channelId,
      });

      if (cancelled) return;
      setPins(resolved);
      setLoading(false);
    };

    load();
    return () => {
      cancelled = true;
    };
    // Resolve against the store snapshot when the screen opens.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [channelId, scope]);

  const handleJump = (pin: ResolvedPin) => {
    setPendingPinJump(pin);
    navigation.goBack();
  };

  const handleUnpin = async (pin: ResolvedPin) => {
    if (!channelId || unpinningId) return;
    setUnpinningId(pin.pinId);

    const target = pinKind(pin.message, pin.pinId);
    const { error } = await unpinMessage(
      target.kind === 'message'
        ? {
            kind: 'message',
            channelId,
            threadId: target.threadId,
            messageId: target.id,
          }
        : {
            kind: 'thread',
            channelId,
            threadId: target.id,
          },
    );

    if (error) {
      ShowNotify('Error', error);
      setUnpinningId(null);
      return;
    }

    const pinAction =
      scope === 'chat' ? ACTIONS.UPDATE_DM_PIN : ACTIONS.UPDATE_CHANNEL_PIN;

    dispatch({
      type: pinAction,
      payload: {
        threadId: target.threadId,
        is_pin: false,
        details: null,
      },
    });

    if (target.kind === 'message') {
      dispatch({
        type: ACTIONS.UPDATE_REPLY_PIN,
        payload: {
          threadId: target.id,
          is_pin: false,
          details: null,
        },
      });
    }

    setPins(current => current.filter(item => item.pinId !== pin.pinId));
    setUnpinningId(null);
  };

  return (
    <Container safeBottom>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={12}>
          <Ionicons name="chevron-back" size={24} color={colors.iconDefault} />
        </TouchableOpacity>
        <AppText variant="bold" size={16} style={styles.title}>
          Pinned messages
        </AppText>
      </View>

      {loading ? (
        <ActivityIndicator
          color={colors.primary}
          style={{ marginVertical: 40 }}
        />
      ) : (
        <FlatList
          data={pins}
          keyExtractor={item => item.pinId}
          ListEmptyComponent={
            <View style={styles.empty}>
              <AppText style={{ color: colors.textSecondary }}>
                No pinned messages yet
              </AppText>
            </View>
          }
          renderItem={({ item }) => {
            const preview =
              getPlainMessageText(item.message?.message) || 'Media';
            const pinnedAt = item.pinnedAt
              ? moment(item.pinnedAt).format('MMM D, YYYY')
              : '';

            return (
              <View style={styles.row}>
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => handleJump(item)}
                >
                  <AppText size={14} numberOfLines={3}>
                    {preview}
                  </AppText>
                  <AppText size={12} style={styles.meta}>
                    {item.message?.username
                      ? `${item.message.username}`
                      : 'Message'}
                    {pinnedAt ? ` · ${pinnedAt}` : ''}
                  </AppText>
                </TouchableOpacity>
                <View style={styles.actions}>
                  <TouchableOpacity
                    onPress={() => handleUnpin(item)}
                    disabled={unpinningId === item.pinId}
                  >
                    {unpinningId === item.pinId ? (
                      <ActivityIndicator size="small" color={colors.error} />
                    ) : (
                      <AppText size={13} style={{ color: colors.error }}>
                        Unpin
                      </AppText>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            );
          }}
        />
      )}
    </Container>
  );
};

export default PinnedMessagesScreen;
