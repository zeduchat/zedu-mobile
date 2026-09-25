import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import FontAwesome5 from 'react-native-vector-icons/FontAwesome5';
import moment from 'moment';
import FastImage from 'react-native-fast-image';
import { AppText } from '@/components/ui/text';
import { useTheme } from '@/theme/ThemeProvider';
import { createForwardModalStyles } from '@/theme/createChatOverlayStyles';
import { useDataContext } from '@/store/useDataContext';
import { GetRequest } from '@/utils/requests';
import { hasMessageContent } from '@/utils/message-text';
import {
  ForwardDestination,
  ForwardSourceContext,
  getForwardMessagePreview,
  sendForwardedMessage,
} from '@/utils/forward-message';
import { ShowNotify } from '@/components/ui/toast';
import { ThreadChatType } from '@/utils/thread-message';
import { MessageContent } from './message-content';

const SLACK_BLUE = '#1264A3';
const SLACK_TEXT = '#1D1C1D';
const SLACK_SUBTEXT = '#616061';

type Props = {
  visible: boolean;
  item: any;
  sourceContext?: ForwardSourceContext;
  threadChatType?: ThreadChatType;
  onClose: () => void;
};

function mapChannelsToDestinations(channels: any[]): ForwardDestination[] {
  return (channels || []).map(channel => ({
    type: 'channel' as const,
    id: `channel-${channel.channels_id || channel.channel_id}`,
    channelId: channel.channels_id || channel.channel_id,
    label: channel.name,
    isPrivate: Boolean(channel.is_private),
  }));
}

function mapDmsToDestinations(dms: any[]): ForwardDestination[] {
  return (dms || []).map(chat => ({
    type:
      chat.channel_type === 'group_dm'
        ? ('group_dm' as const)
        : ('dm' as const),
    id: `chat-${chat.channel_id}`,
    channelId: chat.channel_id,
    label: chat.username,
    subtitle: chat.participant_email || chat.participants?.[0]?.full_name,
    avatarUrl: chat.avatar_url || chat.default_avatar_url,
    online: chat.participants?.[0]?.online,
  }));
}

function mergeDestinations(
  channels: ForwardDestination[],
  dms: ForwardDestination[],
) {
  const seen = new Set<string>();
  const merged: ForwardDestination[] = [];

  [...channels, ...dms].forEach(destination => {
    if (!destination.channelId || seen.has(destination.channelId)) {
      return;
    }

    seen.add(destination.channelId);
    merged.push(destination);
  });

  return merged;
}

export const ForwardMessageModal: React.FC<Props> = ({
  visible,
  item,
  sourceContext,
  threadChatType = 'dm',
  onClose,
}) => {
  const { colors } = useTheme();
  const styles = useMemo(() => createForwardModalStyles(colors), [colors]);
  const insets = useSafeAreaInsets();
  const { state, dispatch } = useDataContext();
  const { orgId, dms, userChannels, callback, channelCallback, user } = state;

  const [searchQuery, setSearchQuery] = useState('');
  const [optionalNote, setOptionalNote] = useState('');
  const [selectedDestination, setSelectedDestination] =
    useState<ForwardDestination | null>(null);
  const [destinations, setDestinations] = useState<ForwardDestination[]>([]);
  const [loadingDestinations, setLoadingDestinations] = useState(false);
  const [sending, setSending] = useState(false);
  const [isForwardToFocused, setIsForwardToFocused] = useState(false);

  const forwardToRef = useRef<TextInput>(null);
  const noteRef = useRef<TextInput>(null);

  const modalTitle =
    threadChatType === 'dm' ? 'Forward Private Message' : 'Forward Message';

  const resetState = useCallback(() => {
    setSearchQuery('');
    setOptionalNote('');
    setSelectedDestination(null);
    setDestinations([]);
    setLoadingDestinations(false);
    setSending(false);
    setIsForwardToFocused(false);
  }, []);

  useEffect(() => {
    if (!visible) {
      resetState();
      return;
    }

    const timer = setTimeout(() => forwardToRef.current?.focus(), 250);
    return () => clearTimeout(timer);
  }, [visible, resetState]);

  const fetchDestinations = useCallback(
    async (query: string) => {
      if (!orgId) return;

      setLoadingDestinations(true);

      try {
        const encodedQuery = encodeURIComponent(query.trim());
        const [channelsResponse, dmsResponse] = await Promise.all([
          GetRequest(
            `/organisations/${orgId}/user-channels?page=1&limit=50&search=${encodedQuery}`,
          ),
          GetRequest(
            `/organisations/${orgId}/dms?page=1&limit=50&search=${encodedQuery}`,
          ),
        ]);

        const channelItems = mapChannelsToDestinations(
          channelsResponse.data?.data || userChannels || [],
        );
        const dmItems = mapDmsToDestinations(
          dmsResponse.data?.data || dms || [],
        );

        setDestinations(mergeDestinations(channelItems, dmItems));
      } catch {
        setDestinations(
          mergeDestinations(
            mapChannelsToDestinations(userChannels || []),
            mapDmsToDestinations(dms || []),
          ),
        );
      } finally {
        setLoadingDestinations(false);
      }
    },
    [orgId, dms, userChannels],
  );

  useEffect(() => {
    if (!visible || !orgId) return;

    const timer = setTimeout(() => {
      fetchDestinations(searchQuery);
    }, 300);

    return () => clearTimeout(timer);
  }, [visible, orgId, searchQuery, fetchDestinations]);

  const filteredDestinations = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return destinations;

    return destinations.filter(destination => {
      const haystack = `${destination.label} ${
        destination.subtitle || ''
      }`.toLowerCase();
      return haystack.includes(query);
    });
  }, [destinations, searchQuery]);

  const showDropdown = isForwardToFocused && !selectedDestination;

  const handleSelectDestination = (destination: ForwardDestination) => {
    setSelectedDestination(destination);
    setSearchQuery(destination.label);
    setIsForwardToFocused(false);
    setTimeout(() => noteRef.current?.focus(), 200);
  };

  const handleForwardToChange = (value: string) => {
    setSearchQuery(value);
    if (selectedDestination && value !== selectedDestination.label) {
      setSelectedDestination(null);
    }
  };

  const preview = useMemo(
    () => getForwardMessagePreview(item, user),
    [item, user],
  );

  const handleSend = async () => {
    if (!selectedDestination || sending || !item || !sourceContext) return;

    const hasMedia = preview.media.length > 0;

    if (!preview.message.trim() && !hasMedia && !optionalNote.trim()) {
      ShowNotify('Error', 'Nothing to forward');
      return;
    }

    setSending(true);

    try {
      await sendForwardedMessage({
        destination: selectedDestination,
        optionalNote,
        media: preview.media,
        source: sourceContext,
        originalItem: item,
        dispatch,
        callback,
        channelCallback,
        user,
      });

      ShowNotify('Success', 'Message forwarded');
      onClose();
    } catch {
      ShowNotify('Error', 'Failed to forward message');
    } finally {
      setSending(false);
    }
  };

  const senderName = preview.senderName;
  const senderAvatar = preview.senderAvatar;
  const canSend = Boolean(selectedDestination) && !sending && Boolean(item);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        style={[styles.container, { paddingTop: insets.top }]}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.header}>
          <TouchableOpacity
            onPress={onClose}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <AppText size={17} style={styles.cancelText}>
              Cancel
            </AppText>
          </TouchableOpacity>

          <AppText variant="bold" size={17} style={styles.headerTitle}>
            {modalTitle}
          </AppText>

          <TouchableOpacity
            onPress={handleSend}
            disabled={!canSend}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            {sending ? (
              <ActivityIndicator size="small" color={SLACK_BLUE} />
            ) : (
              <AppText
                size={17}
                variant="medium"
                style={[styles.sendText, !canSend && styles.sendTextDisabled]}
              >
                Send
              </AppText>
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.body}>
          <View style={styles.forwardToSection}>
            <TextInput
              ref={forwardToRef}
              value={searchQuery}
              onChangeText={handleForwardToChange}
              placeholder="Forward to..."
              placeholderTextColor={SLACK_SUBTEXT}
              style={styles.forwardToInput}
              onFocus={() => setIsForwardToFocused(true)}
              onBlur={() => {
                setTimeout(() => setIsForwardToFocused(false), 150);
              }}
              autoCorrect={false}
              autoCapitalize="none"
            />

            {showDropdown && (
              <View style={styles.dropdown}>
                {loadingDestinations ? (
                  <View style={styles.dropdownLoading}>
                    <ActivityIndicator size="small" color={SLACK_BLUE} />
                  </View>
                ) : filteredDestinations.length === 0 ? (
                  <View style={styles.dropdownEmpty}>
                    <AppText size={15} style={styles.dropdownEmptyText}>
                      No channels or conversations found
                    </AppText>
                  </View>
                ) : (
                  <ScrollView
                    keyboardShouldPersistTaps="handled"
                    nestedScrollEnabled
                    style={styles.dropdownList}
                  >
                    {filteredDestinations.map(destination => (
                      <TouchableOpacity
                        key={destination.id}
                        style={styles.destinationRow}
                        activeOpacity={0.7}
                        onPress={() => handleSelectDestination(destination)}
                      >
                        {destination.type === 'channel' ? (
                          <View style={styles.channelIconWrap}>
                            <FontAwesome5
                              name={destination.isPrivate ? 'lock' : 'hashtag'}
                              size={14}
                              color={SLACK_TEXT}
                            />
                          </View>
                        ) : (
                          <View style={styles.avatarWrap}>
                            {destination.avatarUrl ? (
                              <Image
                                source={{ uri: destination.avatarUrl }}
                                style={styles.avatar}
                              />
                            ) : (
                              <View
                                style={[
                                  styles.avatar,
                                  styles.avatarPlaceholder,
                                ]}
                              >
                                <AppText
                                  variant="bold"
                                  size={14}
                                  style={styles.avatarInitial}
                                >
                                  {destination.label
                                    ?.charAt(0)
                                    ?.toUpperCase() || '?'}
                                </AppText>
                              </View>
                            )}
                            <View
                              style={[
                                styles.statusDot,
                                {
                                  backgroundColor: destination.online
                                    ? colors.online
                                    : colors.offline,
                                },
                              ]}
                            />
                          </View>
                        )}

                        <View style={styles.destinationTextWrap}>
                          <AppText
                            variant="bold"
                            size={16}
                            style={styles.destinationLabel}
                          >
                            {destination.label}
                          </AppText>
                          {destination.subtitle ? (
                            <AppText
                              size={15}
                              style={styles.destinationSubtitle}
                              numberOfLines={1}
                            >
                              {destination.subtitle}
                            </AppText>
                          ) : null}
                        </View>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                )}
              </View>
            )}
          </View>

          {selectedDestination ? (
            <TextInput
              ref={noteRef}
              value={optionalNote}
              onChangeText={setOptionalNote}
              placeholder="Add a message, if you'd like"
              placeholderTextColor={SLACK_SUBTEXT}
              style={styles.noteInput}
              multiline
            />
          ) : null}

          <View style={styles.previewCard}>
            <View style={styles.previewHeader}>
              <View style={styles.previewAuthorRow}>
                {senderAvatar ? (
                  <Image
                    source={{ uri: senderAvatar }}
                    style={styles.previewAvatar}
                  />
                ) : (
                  <View
                    style={[styles.previewAvatar, styles.avatarPlaceholder]}
                  >
                    <AppText variant="bold" size={12}>
                      {senderName.charAt(0).toUpperCase()}
                    </AppText>
                  </View>
                )}
                <AppText
                  variant="bold"
                  size={15}
                  style={styles.previewAuthorName}
                >
                  {senderName}
                </AppText>
              </View>

              {preview.createdAt ? (
                <AppText size={13} style={styles.previewDate}>
                  {moment(preview.createdAt).format('MMM Do')}
                </AppText>
              ) : null}
            </View>

            {preview.hasText && hasMessageContent(preview.message) ? (
              <MessageContent
                html={preview.message}
                textStyle={styles.previewMessage}
                showLinkPreviews={false}
              />
            ) : null}

            {!preview.hasText && preview.fileAttachment ? (
              <View style={styles.previewFileRow}>
                <View
                  style={[
                    styles.previewFileIcon,
                    { backgroundColor: preview.fileAttachment.color },
                  ]}
                >
                  <AppText
                    variant="bold"
                    size={11}
                    style={styles.previewFileLabel}
                  >
                    {preview.fileAttachment.label}
                  </AppText>
                </View>
                <AppText
                  size={15}
                  style={styles.previewFileName}
                  numberOfLines={2}
                >
                  {preview.fileAttachment.fileName}
                </AppText>
              </View>
            ) : null}

            {preview.previewImageUrl ? (
              <FastImage
                source={{ uri: preview.previewImageUrl }}
                style={styles.previewImage}
                resizeMode={FastImage.resizeMode.cover}
              />
            ) : null}
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};
