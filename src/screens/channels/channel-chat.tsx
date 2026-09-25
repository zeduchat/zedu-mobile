import React, {
  useState,
  useRef,
  useEffect,
  useCallback,
  useMemo,
} from 'react';
import {
  View,
  Image,
  FlatList,
  TouchableOpacity,
  Keyboard,
  ActivityIndicator,
} from 'react-native';
import { AppText } from '@/components/ui/text';
import Container from '@/components/layout/container';
import { useTheme } from '@/theme/ThemeProvider';
import { createChatDetailStyles } from '@/theme/createScreenStyles';
import { useFocusEffect } from '@react-navigation/native';
import { launchCamera } from 'react-native-image-picker';
import { ThemedEmojiKeyboard } from '@/components/ui/themed-emoji-keyboard';
import MessageItem from '@/components/layout/channels/messagItem';
import ChatInput from '@/components/layout/chat/chat-input';
import ChatKeyboardAvoidingView from '@/components/layout/chat/chat-keyboard-avoiding-view';
import { useTyping } from '@/hooks/useTyping';
import { MessageAction } from '@/components/layout/chat/message-action';
import { MediaPickerSheet } from '@/components/layout/chat/media-picker';
import MediaEditorModal from '@/components/layout/chat/media-editor';
import { useDataContext } from '@/store/useDataContext';
import UseChannelChat from '@/services/channels/channel-chat';
import { useFileUpload } from '@/hooks/useFileUpload';
import uuid from 'react-native-uuid';
import Feather from 'react-native-vector-icons/Feather';
import { PostRequest, PutRequest } from '@/utils/requests';
import { ACTIONS } from '@/store/types';
import { Channel } from '@/types/channel';
import ChannelConnection from '@/centrifugoo/channel-connection';
import UseChannelDetails from '@/services/channels/channel-details';
import { normalize } from '@/utils/normalize';
import MentionUserBottomSheet, {
  MentionUserBottomSheetRef,
} from '@/components/layout/chat/mention-user-bottomsheet';
import { MentionSheet } from '@/components/layout/chat/mention-sheet';
import { buildMentionHtmlTag } from '@/utils/message-text';
import { ShowNotify } from '@/components/ui/toast';
import buzzService from '@/services/buzz.service';
import ChatBackground from '@/components/layout/chat/chat-background';
import { useMessageDraft } from '@/hooks/useMessageDraft';

const ChannelChatScreen = ({ navigation, route }: any) => {
  const { colors } = useTheme();
  const styles = useMemo(() => createChatDetailStyles(colors), [colors]);
  const [message, setMessage] = useState('');
  const [isEmojiOpen, setIsEmojiOpen] = useState(false);
  const flatListRef = useRef<FlatList>(null);
  const actionSheetRef = useRef<any>(null);
  const pickerSheetRef = useRef<any>(null);
  const [selectedMsg, setSelectedMsg] = useState<Channel | null>(null);
  const [pendingMedia, setPendingMedia] = useState<{
    uri: string;
    type: 'image' | 'file';
  } | null>(null);
  // Mention State
  const [mentionState, setMentionState] = useState<{
    query: string;
    pos: number;
  } | null>(null);
  const [mentionsMetadata, setMentionsMetadata] = useState<any[]>([]);
  const [isEditorVisible, setIsEditorVisible] = useState(false);
  const [joinLoading, setJoinLoading] = useState(false);
  const { state, dispatch } = useDataContext();
  const { handleTyping } = useTyping(state.channelSubscription);
  const {
    channel,
    media,
    channelsChat,
    user,
    callback,
    channelDetails,
    buzzIsMuted,
    buzzShowVideo,
    orgId,
  } = state;
  const [channelAccess, setChannelAccess] = useState(channel?.access);
  const [onEdit, setOnEdit] = useState(false);
  const [editMsgId, setEditMsgId] = useState<string | null>(null);
  const [callLoading, setCallLoading] = useState(false);
  const [returnLoading, setReturnLoading] = useState(true);

  const mentionUserSheetRef = useRef<MentionUserBottomSheetRef>(null);
  const { fromNotification, channel_id: routeChannelId } = route?.params || {};

  const channel_id =
    routeChannelId || channel?.channels_id || channel?.channel_id;
  const { loadMore, isFetchingMore } = UseChannelChat({
    channel_id: channel_id as string,
  });
  const { uploadFiles, clearUploads } = useFileUpload();

  const { clearDraft, restoreDraft } = useMessageDraft({
    scope: 'channel',
    roomId: channel_id,
    orgId,
    userId: user?.user_id ?? user?.id,
    message,
    setMessage,
    mentions: mentionsMetadata,
    setMentions: setMentionsMetadata,
    enabled: !onEdit,
  });

  useEffect(() => {
    if (channel?.access !== undefined) {
      setChannelAccess(channel.access);
    }
  }, [channel?.access, channel?.channels_id, channel_id]);

  useEffect(() => {
    setReturnLoading(false);
  }, [fromNotification]);

  // Dismiss keyboard when screen loses focus
  useFocusEffect(
    useCallback(() => {
      return () => {
        Keyboard.dismiss();
      };
    }, []),
  );

  // Handler to open mention user bottom sheet
  const handleMentionUser = (userId: string) => {
    if (
      !channelDetails?.participants ||
      !Array.isArray(channelDetails?.participants)
    )
      return;
    const found = channelDetails?.participants.find(
      (p: any) => p.user_id === userId,
    );
    if (found) {
      mentionUserSheetRef.current?.open(found);
    }
  };

  const handleVideoCall = async () => {
    const activeBuzzData = state?.buzzData;
    if (state?.isCallMinimized && activeBuzzData?.buzz_code) {
      dispatch({ type: ACTIONS.CALL_MINIMIZED, payload: false });
      navigation.navigate('BuzzStack', {
        screen: 'CallScreen',
        params: {
          buzzCode: activeBuzzData.buzz_code,
          buzzData: activeBuzzData,
        },
      });
      return;
    }

    try {
      const result = await buzzService.createChannelBuzz(channel_id as string);

      if (result.error || !result.data) {
        ShowNotify('Error', result.error || 'Failed to create call');
        return;
      }

      setCallLoading(true);

      const buzz = result.data;

      const joinResult = await buzzService.joinBuzz(buzz.buzz_code);

      if (joinResult.error || !joinResult.data) {
        ShowNotify('Error', joinResult.error || 'Failed to join call');
        return;
      }

      const buzzData = joinResult.data;

      const isMuted = buzzIsMuted ?? true;
      const showVideo = buzzShowVideo ?? false;
      const currentUserId = user?.user_id ?? user?.id;

      const participantsWithLocalMediaState = (buzzData.participants || []).map(
        (participant: any) => {
          const participantUserId = participant.user_id ?? participant.id;

          if (String(participantUserId) === String(currentUserId)) {
            return {
              ...participant,
              audioTrack: !isMuted,
              videoTrack: showVideo,
            };
          }

          return participant;
        },
      );

      dispatch({ type: ACTIONS.BUZZ_DATA, payload: buzzData });
      dispatch({
        type: ACTIONS.BUZZ_PARTICIPANTS,
        payload: participantsWithLocalMediaState,
      });

      navigation.navigate('BuzzStack', {
        screen: 'ChannelCall',
        params: {
          buzzCode: buzzData.buzz_code,
          buzzData: buzzData,
        },
      });
      setCallLoading(false);
    } catch (_error) {
      ShowNotify('Error', 'Failed to start call');
      setCallLoading(false);
    }
  };

  const handleJoinCall = async () => {
    try {
      setCallLoading(true);

      const joinResult = await buzzService.joinBuzz(
        channelDetails?.active_buzz?.buzz_id as string,
      );

      if (joinResult.error || !joinResult.data) {
        ShowNotify('Error', joinResult.error || 'Failed to join call');
        return;
      }

      const buzzData = joinResult.data;

      const isMuted = buzzIsMuted ?? true;
      const showVideo = buzzShowVideo ?? false;
      const currentUserId = user?.user_id ?? user?.id;

      const participantsWithLocalMediaState = (buzzData.participants || []).map(
        (participant: any) => {
          const participantUserId = participant.user_id ?? participant.id;

          if (String(participantUserId) === String(currentUserId)) {
            return {
              ...participant,
              audioTrack: !isMuted,
              videoTrack: showVideo,
            };
          }

          return participant;
        },
      );

      dispatch({ type: ACTIONS.BUZZ_DATA, payload: buzzData });
      dispatch({
        type: ACTIONS.BUZZ_PARTICIPANTS,
        payload: participantsWithLocalMediaState,
      });

      navigation.navigate('BuzzStack', {
        screen: 'ChannelCall',
        params: {
          buzzCode: buzzData.buzz_code,
          buzzData: buzzData,
        },
      });
      setCallLoading(false);
    } catch (_error) {
      ShowNotify('Error', 'Failed to start call');
      setCallLoading(false);
    }
  };

  // Mention participants for this channel
  const mentionParticipants = useMemo(
    () => channelDetails?.participants || channel?.participants || [],
    [channelDetails?.participants, channel?.participants],
  );

  // Open mention picker when @ is typed
  const handleMentionTrigger = (query: string, pos: number) => {
    setMentionState({ query, pos });
  };

  const handleMentionSelect = (selectedUser: any) => {
    if (!mentionState) return;

    const { pos, query } = mentionState;
    const mentionStart = pos - query.length - 1;

    const textBefore = message.substring(0, mentionStart);
    const textAfter = message.substring(pos);

    const newMessage = `${textBefore}@${selectedUser.username} ${textAfter}`;

    setMessage(newMessage);

    const mentionType =
      selectedUser.type === 'channel' || selectedUser.username === 'channel'
        ? 'channel'
        : 'user';

    setMentionsMetadata(prev => [
      ...prev,
      {
        id:
          mentionType === 'channel' ? 'channel' : String(selectedUser.user_id),
        label: mentionType === 'channel' ? 'channel' : selectedUser.username,
        type: mentionType,
      },
    ]);

    setMentionState(null);
  };

  const [isVoiceUploading, setIsVoiceUploading] = useState(false);

  // Called immediately when the user stops recording — uploads in background
  const handleVoiceRecorded = async (uri: string) => {
    setIsVoiceUploading(true);
    const tempId = uuid.v4() as string;
    const asset = {
      uri,
      type: 'audio/m4a',
      name: uri.split('/').pop() || `voice_${tempId}`,
    };
    try {
      const response = await uploadFiles([asset]);
      if (response.data && response.data.length > 0) {
        dispatch({ type: ACTIONS.MEDIA, payload: response.data });
      } else {
        ShowNotify('Error', 'Voice upload failed');
      }
    } catch (_err) {
      ShowNotify('Error', 'Voice upload failed');
    } finally {
      setIsVoiceUploading(false);
    }
  };

  // Called when user presses send on the preview bar
  const handleVoiceSendReady = () => {
    handleSendMessage('', state.media);
  };

  // Called when user discards the preview
  const handleVoiceCancel = () => {
    dispatch({ type: ACTIONS.MEDIA, payload: [] });
    clearUploads();
  };

  const handleMediaPicker = () => {
    pickerSheetRef.current?.expand();
  };

  const handleSendMessage = async (content: string, medias: any[] = []) => {
    if (!content.trim() && medias.length === 0 && state.media.length === 0)
      return;

    handleTyping(false);

    const tempId = uuid.v4() as string;
    // Construct web-compatible HTML payload
    let formattedContent = content;
    mentionsMetadata.forEach(m => {
      const mentionTag = buildMentionHtmlTag(m);
      formattedContent = formattedContent.replace(`@${m.label}`, mentionTag);
    });

    const finalHtml = `<p>${formattedContent}</p>`;

    const optimisticMessage = {
      channels_id: channel_id,
      thread_id: tempId,
      username: state.user?.username || 'You',
      avatar_url: state.user?.avatar_url,
      message: finalHtml,
      created_at: new Date().toISOString(),
      status: 'pending',
      type: 'message',
      media: medias.length > 0 ? medias : state.media,
      user_id: state.user?.user_id,
      reactions: null,
      isOptimistic: true,
    };

    dispatch({
      type: ACTIONS.CHANNELS_CHAT,
      payload: { newMessage: optimisticMessage },
    });
    setMessage('');
    setMentionsMetadata([]);
    void clearDraft();
    dispatch({ type: ACTIONS.MEDIA, payload: [] });

    const payload = {
      content: finalHtml,
      media: medias.length > 0 ? medias : state.media,
      mentions: mentionsMetadata,
    };

    await PostRequest(`/threads/${channel_id}`, payload);
    dispatch({
      type: ACTIONS.CHANNEL_CALLBACK,
      payload: !state.channelCallback,
    });
    clearUploads();
  };

  const handleSendEditMessage = async (content: string, medias: any[] = []) => {
    if (!content.trim() && medias.length === 0) return;

    handleTyping(false);

    const tempId = uuid.v4() as string;

    // Construct web-compatible HTML payload
    let formattedContent = content;
    mentionsMetadata.forEach(m => {
      const mentionTag = buildMentionHtmlTag(m);
      formattedContent = formattedContent.replace(`@${m.label}`, mentionTag);
    });

    const finalHtml = `<p>${formattedContent}</p>`;

    const optimisticMessage = {
      channels_id: channel_id,
      thread_id: editMsgId || tempId,
      username: user?.username || 'You',
      avatar_url: user?.avatar_url,
      message: finalHtml,
      created_at: new Date().toISOString(),
      status: 'pending',
      type: 'message',
      media: state.media,
      user_id: user?.user_id,
      reactions: null,
      isOptimistic: true,
      edited: true,
    };

    dispatch({
      type: ACTIONS.EDIT_CHANNELS_CHAT,
      payload: {
        threadId: editMsgId || tempId,
        updatedMessage: optimisticMessage,
      },
    });
    dispatch({ type: ACTIONS.MEDIA, payload: [] });
    setOnEdit(false);
    void restoreDraft();

    const payload = {
      content: finalHtml,
      media: medias,
      mentions: mentionsMetadata,
    };

    await PutRequest(`/threads/${editMsgId}/channels/${channel_id}`, payload);

    dispatch({
      type: ACTIONS.CHANNEL_CALLBACK,
      payload: !state.channelCallback,
    });
    clearUploads();
  };

  const pickImage = async () => {
    const result = await launchCamera({
      mediaType: 'photo',
      quality: 0.6,
      maxWidth: 1024,
      maxHeight: 1024,
    });
    if (result.assets && result.assets[0].uri) {
      setPendingMedia({ uri: result.assets[0].uri, type: 'image' });
      setIsEditorVisible(true);
      const response = await uploadFiles(result.assets);
      dispatch({ type: ACTIONS.MEDIA, payload: response.data });
    }
  };

  const handleSendFromEditor = (caption: string) => {
    if (pendingMedia) {
      handleSendMessage(caption, media);
    }
    setIsEditorVisible(false);
    setPendingMedia(null);
    dispatch({ type: ACTIONS.MEDIA, payload: [] });
  };

  const handleEmojiSelect = (emojiObject: any) => {
    if (!isEmojiOpen) {
      Keyboard.dismiss();
    }
    setMessage(prev => prev + emojiObject.emoji);
  };

  const onClose = () => {
    setSelectedMsg(null);
  };

  const handleLongPress = (item: Channel) => {
    setSelectedMsg(item);
  };

  const handleJoinChannel = async () => {
    setJoinLoading(true);

    const { data, error } = await PostRequest(`/channels/${channel_id}/join`, {
      username: user?.username,
    });

    if (!error) {
      setChannelAccess(true);
      dispatch({ type: ACTIONS.CHANNEL_CALLBACK, payload: !callback });
      dispatch({ type: ACTIONS.SUCCESS, payload: data.message });
    } else {
      dispatch({ type: ACTIONS.ERROR, payload: error });
    }

    setJoinLoading(false);
  };

  const handleDetails = () => {
    if (!channel?.access) {
      dispatch({
        type: ACTIONS.ERROR,
        payload: 'Please join the channel to continue',
      });
      return;
    }
    navigation.navigate('ChannelStack', {
      screen: 'ChannelDetails',
      params: { channel_id: channel_id },
    });
  };

  const handleEdit = () => {
    if (selectedMsg) {
      setOnEdit(true);
      setEditMsgId(selectedMsg.thread_id);
      setMessage(selectedMsg.message?.replace(/<[^>]*>?/gm, '') || '');
      actionSheetRef.current?.close();
    }
  };

  const handleGoBack = () => {
    Keyboard.dismiss();
    navigation.goBack();
  };

  const activeBuzz = channel?.active_buzz || channelDetails?.active_buzz;

  //
  if ((returnLoading && fromNotification) || !channel_id) return null;

  return (
    <Container color={colors.topNavigation}>
      <ChannelConnection id={channel_id as string} />
      <UseChannelDetails channel_id={channel_id as string} />
      {/* GROUP HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleGoBack} style={styles.backBtn}>
          <Image
            source={require('@/assets/icons/back.png')}
            style={styles.headerIcon}
          />
        </TouchableOpacity>

        <TouchableOpacity style={styles.headerInfo} onPress={handleDetails}>
          <AppText variant="bold" size={15} numberOfLines={1}>
            #{channel?.name || channelDetails?.name}
          </AppText>
          <AppText size={11} style={{ color: colors.textSecondary }}>
            {channel?.members_count || channel?.users_count}{' '}
            {(channel?.members_count || channel?.users_count) === 1
              ? 'Member'
              : 'Members'}{' '}
          </AppText>
        </TouchableOpacity>

        {channelAccess && (
          <TouchableOpacity
            style={{ padding: 5, borderRadius: 5, marginRight: 10 }}
            onPress={activeBuzz ? handleJoinCall : handleVideoCall}
          >
            {callLoading ? (
              <ActivityIndicator color={colors.primary} />
            ) : (
              <View style={styles.videoIconWrap}>
                <Feather
                  name="video"
                  size={22}
                  color={activeBuzz ? colors.online : colors.iconDefault}
                />
                {activeBuzz && <View style={styles.activeBuzzDot} />}
              </View>
            )}
          </TouchableOpacity>
        )}
      </View>

      <ChatBackground />

      {channelAccess && (
        <FlatList
          ref={flatListRef}
          data={channelsChat}
          inverted
          keyExtractor={(item, index) => `${item.thread_id}-${index}`}
          renderItem={({ item, index }) => (
            <View
              style={{
                backgroundColor:
                  onEdit && editMsgId === item.thread_id
                    ? colors.chatHighlight
                    : 'transparent',
              }}
            >
              <MessageItem
                item={{
                  ...item,
                  id: item.thread_id,
                  text: item.message,
                }}
                index={index}
                messages={channelsChat}
                onLongPress={() => handleLongPress(item)}
                onMentionUser={handleMentionUser}
                editMsgId={editMsgId}
                onEdit={onEdit}
              />
            </View>
          )}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          onEndReached={loadMore}
          onEndReachedThreshold={0.1}
          ListFooterComponent={() =>
            isFetchingMore ? (
              <ActivityIndicator
                size="small"
                color={colors.primary}
                style={{ margin: 10 }}
              />
            ) : null
          }
        />
      )}

      <ChatKeyboardAvoidingView>
        {channelAccess === false ? (
          <View style={styles.joinPrompt}>
            <AppText style={styles.joinText}>
              You are viewing #{channel?.name}. Join to start chatting.
            </AppText>
            <TouchableOpacity
              style={[styles.joinButton, { marginBottom: normalize(50) }]}
              onPress={handleJoinChannel}
              disabled={joinLoading}
            >
              {joinLoading ? (
                <ActivityIndicator color={colors.white} />
              ) : (
                <AppText variant="bold" style={{ color: colors.white }}>
                  Join Channel
                </AppText>
              )}
            </TouchableOpacity>
          </View>
        ) : (
          <>
            {mentionState && (
              <MentionSheet
                query={mentionState.query}
                showChannelMention
                participants={mentionParticipants}
                onSelect={handleMentionSelect}
              />
            )}

            <ChatInput
              message={message}
              setMessage={setMessage}
              onTypingChange={handleTyping}
              onSend={(content: any) =>
                onEdit
                  ? handleSendEditMessage(content)
                  : handleSendMessage(content)
              }
              onVoiceRecorded={handleVoiceRecorded}
              onVoiceSendReady={handleVoiceSendReady}
              onVoiceCancel={handleVoiceCancel}
              isVoiceUploading={isVoiceUploading}
              onPickImage={pickImage}
              onMediaPicker={handleMediaPicker}
              onOpenEmoji={() => setIsEmojiOpen(true)}
              onCloseEmoji={() => setIsEmojiOpen(false)}
              isEmojiOpen={isEmojiOpen}
              onFocus={() => pickerSheetRef.current?.close()}
              onMentionTrigger={handleMentionTrigger}
              onMentionCancel={() => {
                setMentionState(null);
              }}
            />

            {isEmojiOpen && (
              <View style={styles.emojiWrapper}>
                <ThemedEmojiKeyboard
                  onEmojiSelected={handleEmojiSelect}
                  enableRecentlyUsed
                  categoryPosition="bottom"
                  enableSearchBar
                  disableSafeArea={true}
                  allowMultipleSelections
                  emojiSize={25}
                  containerStyle={{
                    container: {
                      borderRadius: 0,
                    },
                  }}
                />
              </View>
            )}
          </>
        )}
      </ChatKeyboardAvoidingView>

      {selectedMsg && (
        <MessageAction
          ref={actionSheetRef}
          item={selectedMsg}
          onClose={onClose}
          handleEdit={handleEdit}
          threadChatType="channel"
        />
      )}

      <MediaPickerSheet
        ref={pickerSheetRef}
        setPendingMedia={setPendingMedia}
        setIsEditorVisible={setIsEditorVisible}
      />

      {pendingMedia && (
        <MediaEditorModal
          visible={isEditorVisible}
          media={pendingMedia}
          onClose={() => {
            setIsEditorVisible(false);
            setPendingMedia(null);
          }}
          onSend={handleSendFromEditor}
        />
      )}

      <MentionUserBottomSheet ref={mentionUserSheetRef} />
    </Container>
  );
};

export default ChannelChatScreen;
