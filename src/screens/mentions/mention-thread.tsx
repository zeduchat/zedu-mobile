import React, { useState, useRef, useMemo } from 'react';
import {
  View,
  Image,
  FlatList,
  TouchableOpacity,
  Keyboard,
  ActivityIndicator,
} from 'react-native';
import { AppText } from '@/components/ui/text';
import { useTheme } from '@/theme/ThemeProvider';
import { createChatDetailStyles } from '@/theme/createScreenStyles';
import Container from '@/components/layout/container';
import { launchCamera } from 'react-native-image-picker';
import { ThemedEmojiKeyboard } from '@/components/ui/themed-emoji-keyboard';
import ChatInput from '@/components/layout/chat/chat-input';
import ChatKeyboardAvoidingView from '@/components/layout/chat/chat-keyboard-avoiding-view';
import { useTyping } from '@/hooks/useTyping';
import { MessageAction } from '@/components/layout/channels/message-action';
import { MediaPickerSheet } from '@/components/layout/chat/media-picker';
import MediaEditorModal from '@/components/layout/chat/media-editor';
import ThreadItem from '@/components/layout/channels/thread-item';
import { Channel } from '@/types/channel';
import { useDataContext } from '@/store/useDataContext';
import UseReplyChat from '@/services/channels/use-reply';
import { ACTIONS } from '@/store/types';
import { PostRequest } from '@/utils/requests';
import { useFileUpload } from '@/hooks/useFileUpload';
import ReplyConnection from '@/centrifugoo/reply-connection';
import ThreadMessageItem from '@/components/layout/channels/thread-message-item';
import { ShowNotify } from '@/components/ui/toast';
import uuid from 'react-native-uuid';
import ChatBackground from '@/components/layout/chat/chat-background';
import { MentionSheet } from '@/components/layout/chat/mention-sheet';
import { buildMentionHtmlTag } from '@/utils/message-text';

const MentionThreadScreen = ({ navigation, route }: any) => {
  const { colors } = useTheme();
  const styles = useMemo(() => createChatDetailStyles(colors), [colors]);
  const [message, setMessage] = useState('');
  const [isEmojiOpen, setIsEmojiOpen] = useState(false);
  const [mentionState, setMentionState] = useState<{
    query: string;
    pos: number;
  } | null>(null);
  const [mentionsMetadata, setMentionsMetadata] = useState<any[]>([]);
  const flatListRef = useRef<FlatList>(null);
  const actionSheetRef = useRef<any>(null);
  const pickerSheetRef = useRef<any>(null);
  const [selectedMsg, setSelectedMsg] = useState<Channel | null>(null);
  const [pendingMedia, setPendingMedia] = useState<{
    uri: string;
    type: 'image' | 'file';
  } | null>(null);
  const [isEditorVisible, setIsEditorVisible] = useState(false);
  const { state, dispatch } = useDataContext();
  const { handleTyping } = useTyping(state.replySubscription);
  const {
    media,
    replyChat,
    selectedMsg: selectedMessage,
    channel: _channel,
    channelDetails,
    participant,
  } = state;
  const { thread_id, channel_id, mention } = route.params;

  const isChannelThread =
    mention?.channel_type !== 'DM' && mention?.channel_type !== 'GroupDm';

  const mentionParticipants = useMemo(() => {
    if (isChannelThread) {
      return channelDetails?.participants || _channel?.participants || [];
    }
    return Array.isArray(participant) ? participant : [];
  }, [
    isChannelThread,
    channelDetails?.participants,
    _channel?.participants,
    participant,
  ]);

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

  const { loadMore, isFetchingMore } = UseReplyChat({
    channel_id: channel_id as string,
    thread_id: thread_id,
  });

  const { uploadFiles, clearUploads } = useFileUpload();

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

  const handleSendMessage = async (content: string, medias: any[] = []) => {
    if (!content.trim() && medias.length === 0) return;

    handleTyping(false);

    let formattedContent = content;
    mentionsMetadata.forEach(m => {
      const mentionTag = buildMentionHtmlTag(m);
      formattedContent = formattedContent.replace(`@${m.label}`, mentionTag);
    });
    const finalHtml = `<p>${formattedContent}</p>`;

    const optimisticMessage = {
      channels_id: channel_id,
      id: channel_id,
      thread_id: thread_id,
      username: state.user?.username || 'You',
      avatar_url: state.user?.avatar_url,
      message: finalHtml,
      created_at: new Date().toISOString(),
      status: 'pending',
      type: 'message',
      media: media,
      user_id: state.user?.user_id,
      reactions: null,
      isOptimistic: true,
    };

    dispatch({
      type: ACTIONS.REPLY_CHAT,
      payload: { newMessage: optimisticMessage },
    });

    setMessage('');
    setMentionsMetadata([]);

    const payload = {
      channels_id: channel_id,
      thread_id: thread_id,
      content: finalHtml,
      media: medias,
      user_id: state.user?.user_id,
      mentions: mentionsMetadata,
    };

    if (mention?.channel_type === 'DM') {
      await PostRequest(`/dms/messages/${channel_id}`, payload);
    } else if (mention?.channel_type === 'GroupDm') {
      await PostRequest(`/group-dms/messages/${channel_id}`, payload);
    } else {
      await PostRequest(`/channels/${channel_id}/messages`, payload);
    }

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

  return (
    <Container color={colors.topNavigation}>
      <ReplyConnection id={thread_id as string} />
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backBtn}
        >
          <Image
            source={require('@/assets/icons/back.png')}
            style={styles.headerIcon}
          />
        </TouchableOpacity>

        <View style={styles.headerInfo}>
          <AppText variant="bold" size={15}>
            Thread
          </AppText>
        </View>

        <TouchableOpacity />
      </View>

      <ChatBackground />

      <FlatList
        ref={flatListRef}
        data={replyChat}
        inverted
        keyExtractor={item => String(item.id ?? item.message_id)}
        extraData={replyChat}
        renderItem={({ item, index }) => (
          <ThreadMessageItem
            item={{
              ...item,
              id: item.id ?? item.message_id,
              text: item.message || '',
              message: item.message || '',
            }}
            index={index}
            messages={replyChat}
            inverted={true}
            onLongPress={() => handleLongPress(item)}
          />
        )}
        ListFooterComponent={<ThreadItem item={selectedMessage} />}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        onEndReached={loadMore}
        onEndReachedThreshold={0.1}
        ListHeaderComponent={() =>
          isFetchingMore ? (
            <ActivityIndicator
              size="small"
              color={colors.primary}
              style={{ margin: 10 }}
            />
          ) : null
        }
      />

      {selectedMsg && (
        <MessageAction
          ref={actionSheetRef}
          item={selectedMsg}
          onClose={onClose}
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

      <ChatKeyboardAvoidingView>
        {mentionState && (
          <MentionSheet
            query={mentionState.query}
            showChannelMention={isChannelThread}
            participants={mentionParticipants}
            onSelect={handleMentionSelect}
          />
        )}

        <ChatInput
          message={message}
          setMessage={setMessage}
          onTypingChange={handleTyping}
          onSend={(content: any) => handleSendMessage(content)}
          onVoiceRecorded={handleVoiceRecorded}
          onVoiceSendReady={handleVoiceSendReady}
          onVoiceCancel={handleVoiceCancel}
          isVoiceUploading={isVoiceUploading}
          onPickImage={pickImage}
          onMediaPicker={() => pickerSheetRef.current?.expand()}
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
      </ChatKeyboardAvoidingView>
    </Container>
  );
};

export default MentionThreadScreen;
