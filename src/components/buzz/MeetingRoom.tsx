import React, {
  useRef,
  useState,
  useCallback,
  useMemo,
  useEffect,
} from 'react';
import { View, ImageBackground, TouchableOpacity, Modal } from 'react-native';
import { AppText } from '@/components/ui/text';
import AppBottomSheet, {
  AppBottomSheetRef,
} from '@/components/ui/bottom-sheet';
import { AddMembersToCall } from '@/components/buzz/add-members-to-call';
import MenuOptions from '@/components/buzz/menu-options';
import EmojiPicker from 'rn-emoji-keyboard';
import { useDataContext } from '@/store/useDataContext';
import { ACTIONS } from '@/store/types';
import { PostRequest } from '@/utils/requests';
import { ShowNotify } from '@/components/ui/toast';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Feather from 'react-native-vector-icons/Feather';
import AgoraService from '@/services/agora.service';
import { CallControls } from '@/components/buzz/CallControls';
import ChatSidebar, { ChatMessage } from '@/components/buzz/ChatSidebar';
import ParticipantsSidebar from '@/components/buzz/ParticipantsSidebar';
import FloatingEmojiOverlay from '@/components/buzz/FloatingEmojiOverlay';
import BuzzTimeout from '@/components/buzz/BuzzTimeout';
import GeneralTimeout from '@/components/buzz/GeneralTimeout';
import { ParticipantsGrid } from '@/components/buzz/ParticipantsGrid';
import { useTheme } from '@/theme/ThemeProvider';
import { createBuzzMeetingRoomStyles } from '@/theme/createBuzzStyles';
import RecordingIndicator from '@/components/buzz/RecordingIndicator';

const DEFAULT_EMOJIS = ['🙌', '🔥', '😍', '🙏', '👍', '💯', '😎'];

interface MeetingRoomProps {
  isMuted: boolean;
  showVideo: boolean;
  emojiTray: boolean;
  defaultEmoji: boolean;
  globalParticipants: any[];
  currentUser: any;
  isScreenSharing?: boolean;
  handleToggleMic: () => void;
  handleToggleVideo: () => void;
  handleEndCall: () => void;
  handleEmojiSelect: (
    emojiObject: any,
    anchor?: { x: number; y: number },
  ) => void;
  handleToggleScreenShare?: () => void;
  handleClose: () => void;
  setDefaultEmoji: (value: boolean) => void;
  setEmojiTray: (value: boolean) => void;
  joinLoading?: boolean;
  onMinimize?: () => void;
  showChatButton?: boolean;
  enableAddPeople?: boolean;
  onAddMembersToCall?: (members: any[]) => Promise<void> | void;
}

export const MeetingRoom = ({
  isMuted,
  showVideo,
  emojiTray,
  defaultEmoji,
  // globalParticipants,
  currentUser,
  isScreenSharing = false,
  handleToggleMic,
  handleToggleVideo,
  handleEndCall,
  handleEmojiSelect,
  handleToggleScreenShare,
  handleClose,
  setDefaultEmoji,
  setEmojiTray,
  joinLoading,
  onMinimize,
  showChatButton = true,
  enableAddPeople = false,
  onAddMembersToCall,
}: MeetingRoomProps) => {
  const { colors } = useTheme();
  const styles = useMemo(() => createBuzzMeetingRoomStyles(colors), [colors]);
  const menuSheetRef = useRef<AppBottomSheetRef>(null);
  const { state, dispatch } = useDataContext();
  const globalParticipants = state?.buzzParticipants || [];

  const [chatVisible, setChatVisible] = useState(false);
  const [participantsSidebarVisible, setParticipantsSidebarVisible] =
    useState(false);
  const [addMembersModalVisible, setAddMembersModalVisible] = useState(false);

  // Sync microphone state with Agora
  useEffect(() => {
    const syncMicState = async () => {
      try {
        if (isMuted) {
          await AgoraService.toggleMicrophone(false);
        } else {
          await AgoraService.toggleMicrophone(true);
        }
      } catch (error) {
        console.error('Error syncing mic state:', error);
      }
    };
    syncMicState();
  }, [isMuted]);

  // Sync camera state with Agora
  useEffect(() => {
    const syncCameraState = async () => {
      try {
        await AgoraService.toggleCamera(showVideo);
      } catch (error) {
        console.error('Error syncing camera state:', error);
      }
    };
    syncCameraState();
  }, [showVideo]);

  // useEffect(() => {
  //     const getMetadata = async () => {
  //          const result = await buzzService.getBuzzMetadata(state?.buzzData?.buzz_code);
  //     }
  //     getMetadata();
  // }, []);

  // current user for chat
  const chatUser = currentUser
    ? {
        id: String(currentUser.user_id ?? currentUser.id),
        name:
          currentUser.full_name ||
          currentUser.username ||
          currentUser.name ||
          'You',
        avatar: currentUser.avatar_url,
      }
    : { id: 'me', name: 'You' };

  const formatTime = useCallback((value: string | undefined) => {
    if (!value) return '';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;

    return date.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  }, []);

  const chatMessages = useMemo<ChatMessage[]>(() => {
    const list = state?.buzzChats || [];

    return [...list]
      .reverse()
      .map((item: any, index: number) => {
        const raw = item?.data || item;
        const sender = raw?.sender || raw?.user || raw?.from || {};
        const senderId = String(
          raw?.sender_id ??
            raw?.user_id ??
            sender?.user_id ??
            sender?.id ??
            raw?.created_by ??
            'unknown',
        );

        const senderName =
          raw?.sender_name ||
          raw?.full_name ||
          raw?.username ||
          sender?.full_name ||
          sender?.username ||
          sender?.name ||
          'User';

        const messageText = raw?.content || raw?.message || raw?.text || '';

        return {
          id: String(
            raw?.message_id ??
              raw?.id ??
              `${senderId}-${raw?.timestamp ?? index}`,
          ),
          user: {
            id: senderId,
            name: senderName,
            avatar: raw?.avatar_url || sender?.avatar_url || sender?.avatar,
          },
          text: messageText,
          timestamp: formatTime(
            raw?.timestamp || raw?.created_at || raw?.sent_at,
          ),
          reactions: {},
          thread: [],
          replyingTo: raw?.reply_to,
        };
      })
      .filter(message => Boolean(message.text?.trim()));
  }, [formatTime, state?.buzzChats]);

  const handleSendMessage = useCallback(
    async (text: string, replyTo?: string) => {
      const buzzId = state?.buzzData?.buzz_id;
      const content = text?.trim();

      if (!buzzId || !content) return;

      const payload: any = { content };
      if (replyTo) {
        payload.reply_to = replyTo;
      }

      const response = await PostRequest(`/buzz/${buzzId}/message`, payload);

      if (response?.error) {
        ShowNotify('Error', 'Failed to send message');
      }
    },
    [state?.buzzData?.buzz_id],
  );

  return (
    <ImageBackground
      // source={require('@/assets/images/call-bg.png')}
      style={[styles.container, { backgroundColor: colors.secondary }]}
    >
      <FloatingEmojiOverlay floatingEmojis={state?.floatingEmojis || []} />
      <GeneralTimeout buzzData={state?.buzzData} onLeave={handleEndCall} />
      <BuzzTimeout
        participantCount={globalParticipants?.length || 0}
        buzzCode={state?.buzzData?.buzz_code || ''}
        onLeave={handleEndCall}
      />
      <View style={styles.safeArea}>
        <RecordingIndicator />
        {/* Header */}
        <View style={styles.titleContainer}>
          <TouchableOpacity style={styles.headerButton} onPress={onMinimize}>
            <Feather name="minimize-2" size={20} color={colors.white} />
          </TouchableOpacity>

          <View style={{ width: 40, height: 40 }} />

          <AppText variant="bold" style={styles.buzzCodeText}>
            {state?.buzzData?.buzz_code || ''}
          </AppText>

          <View style={{ width: 40, height: 40 }} />

          {enableAddPeople ? (
            <TouchableOpacity
              style={styles.headerButton}
              onPress={() => setAddMembersModalVisible(true)}
            >
              <Ionicons name="person-add" size={20} color={colors.white} />
            </TouchableOpacity>
          ) : (
            <View style={{ width: 40, height: 40 }} />
          )}
        </View>

        {/* Participants Grid */}
        <View style={styles.centerContent}>
          <ParticipantsGrid
            participants={globalParticipants}
            currentUser={currentUser}
            joinLoading={joinLoading}
          />
        </View>

        {/* Call Controls */}
        <CallControls
          isMuted={isMuted}
          showVideo={showVideo}
          defaultEmoji={defaultEmoji}
          onToggleMic={handleToggleMic}
          onToggleVideo={handleToggleVideo}
          onToggleEmoji={() => setDefaultEmoji(!defaultEmoji)}
          onToggleEmojiTray={() => setEmojiTray(!emojiTray)}
          onEmojiSelect={handleEmojiSelect}
          onEndCall={handleEndCall}
          onMenuOpen={() => menuSheetRef.current?.expand()}
          defaultEmojis={DEFAULT_EMOJIS}
          onChatOpen={() => setChatVisible(true)}
          showChatButton={showChatButton}
        />

        {/* Chat Sidebar Modal */}
        <ChatSidebar
          visible={chatVisible}
          onClose={() => setChatVisible(false)}
          currentUser={chatUser}
          messages={chatMessages}
          onSend={handleSendMessage}
          typingUsers={[]}
        />

        {/* Participants Sidebar Modal */}
        <ParticipantsSidebar
          visible={participantsSidebarVisible}
          onClose={() => setParticipantsSidebarVisible(false)}
          participants={
            globalParticipants?.map((p: any) => ({
              id: String(p.user_id ?? p.id),
              name: p.full_name || p.username || p.name || 'User',
              avatar: p.avatar_url || p.default_avatar_url,
              isMe:
                String(p.user_id ?? p.id) ===
                String(currentUser?.user_id ?? currentUser?.id),
              isMuted: p.audioTrack === false,
              isVideoOn: p.videoTrack === true,
              isScreenSharing: p.screenTrack === true,
              role: p.role || 'Participant',
              icon: p.icon,
              text: p.text,
              online: p.online,
            })) || []
          }
          currentUserId={chatUser.id}
        />

        {/* Add Members Modal */}
        <Modal
          visible={addMembersModalVisible}
          animationType="slide"
          transparent
          presentationStyle="overFullScreen"
          onRequestClose={() => setAddMembersModalVisible(false)}
        >
          <View style={styles.addMembersModalOverlay}>
            <View style={styles.addMembersModalContainer}>
              <AddMembersToCall
                onClose={() => setAddMembersModalVisible(false)}
                existingParticipants={globalParticipants}
                onAddMembers={async (transformedMembers: any[]) => {
                  if (onAddMembersToCall) {
                    await onAddMembersToCall(transformedMembers);
                  }

                  dispatch({
                    type: ACTIONS.BUZZ_PARTICIPANTS,
                    payload: [...globalParticipants, ...transformedMembers],
                  });
                }}
              />
            </View>
          </View>
        </Modal>

        {/* Menu Options Bottom Sheet */}
        <AppBottomSheet ref={menuSheetRef} snapPoints={['40%']}>
          <MenuOptions
            onParticipantsClick={() => {
              setParticipantsSidebarVisible(true);
              setTimeout(() => menuSheetRef.current?.close(), 1000);
            }}
            onScreenShareToggle={handleToggleScreenShare}
            isScreenSharing={isScreenSharing}
          />
        </AppBottomSheet>

        {/* Emoji Picker */}
        <EmojiPicker
          onEmojiSelected={emoji => handleEmojiSelect(emoji)}
          open={emojiTray}
          onClose={handleClose}
          categoryPosition="bottom"
          enableSearchBar
          enableRecentlyUsed
          disableSafeArea={true}
          allowMultipleSelections
          emojiSize={25}
          styles={{
            container: {
              borderBottomLeftRadius: 0,
              borderBottomRightRadius: 0,
              backgroundColor: colors.surface,
            },
          }}
        />
      </View>
    </ImageBackground>
  );
};
