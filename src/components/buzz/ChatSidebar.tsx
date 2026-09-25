import React, { useMemo, useRef, useState } from 'react';
import {
  View,
  TextInput,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { AppText } from '@/components/ui/text';
import Modal from 'react-native-modal';
import EmojiPicker from 'rn-emoji-keyboard';
import { useTheme } from '@/theme/ThemeProvider';
import { createBuzzSidebarStyles } from '@/theme/createBuzzStyles';
import Ionicons from 'react-native-vector-icons/Ionicons';
import FastImage from 'react-native-fast-image';
import ChatKeyboardAvoidingView from '@/components/layout/chat/chat-keyboard-avoiding-view';

export interface ChatMessage {
  id: string;
  user: { id: string; name: string; avatar?: string };
  text: string;
  timestamp: string;
  reactions?: { [emoji: string]: string[] };
  thread?: ChatMessage[];
  replyingTo?: string;
}

interface ChatSidebarProps {
  visible: boolean;
  onClose: () => void;
  currentUser: { id: string; name: string; avatar?: string };
  messages: ChatMessage[];
  onSend: (msg: string, replyTo?: string) => void;
  typingUsers: string[];
}

export const ChatSidebar: React.FC<ChatSidebarProps> = ({
  visible,
  onClose,
  currentUser,
  messages,
  onSend,
  typingUsers,
}) => {
  const { colors } = useTheme();
  const styles = useMemo(() => createBuzzSidebarStyles(colors), [colors]);
  const [input, setInput] = useState('');
  const [replyTo, setReplyTo] = useState<ChatMessage | undefined>(undefined);
  const [showEmoji, setShowEmoji] = useState(false);
  const inputRef = useRef<TextInput>(null);

  // Close modal
  const handleClose = () => {
    onClose();
  };

  const handleSend = () => {
    if (input.trim()) {
      onSend(input, replyTo?.id);
      setInput('');
      setReplyTo(undefined);
    }
  };

  const handleEmojiSelect = (emoji: any) => {
    setInput(prev => prev + (emoji.emoji || emoji));
    setShowEmoji(false);
    inputRef.current?.focus();
  };

  const renderMessage = ({ item }: { item: ChatMessage }) => {
    const isMe = item.user.id === currentUser.id;
    return (
      <View style={styles.messageRow}>
        <View style={styles.avatarContainer}>
          {item.user.avatar ? (
            <FastImage
              source={{ uri: item.user.avatar }}
              style={styles.avatar}
            />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <AppText variant="bold" style={styles.avatarInitial}>
                {item.user.name.charAt(0)}
              </AppText>
            </View>
          )}
        </View>

        <View style={styles.messageContent}>
          <View style={styles.messageHeader}>
            <AppText variant="bold" style={styles.senderName}>
              {isMe ? 'You' : item.user.name}
            </AppText>
            <AppText style={styles.timestamp}>{item.timestamp}</AppText>
          </View>

          <AppText style={styles.messageText}>{item.text}</AppText>
        </View>
      </View>
    );
  };

  return (
    <Modal
      isVisible={visible}
      onBackdropPress={handleClose}
      onSwipeComplete={handleClose}
      swipeDirection="right"
      animationIn="slideInRight"
      animationOut="slideOutRight"
      style={styles.modal}
      backdropOpacity={0.4}
      propagateSwipe={true}
      useNativeDriver={true}
      hideModalContentWhileAnimating={true}
      backdropTransitionOutTiming={0}
      animationInTiming={600}
      animationOutTiming={600}
      // coverScreen={true}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <View>
            <AppText variant="bold" style={styles.headerTitle}>
              In-meeting Chat
            </AppText>
            <AppText style={styles.headerSub}>
              Visible to everyone in the call
            </AppText>
          </View>
          <TouchableOpacity onPress={handleClose} style={styles.closeCircle}>
            <Ionicons name="close" size={24} color={colors.textPrimary} />
          </TouchableOpacity>
        </View>

        <FlatList
          data={messages}
          renderItem={renderMessage}
          inverted
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />

        <ChatKeyboardAvoidingView>
          <View style={styles.inputWrapper}>
            {typingUsers.length > 0 && (
              <View style={styles.typingIndicator}>
                <ActivityIndicator
                  size="small"
                  color={colors.messageMeta}
                  style={{ transform: [{ scale: 0.6 }] }}
                />
                <AppText style={styles.typingText}>
                  {typingUsers[0]} is typing...
                </AppText>
              </View>
            )}

            {replyTo && (
              <View style={styles.replyingBar}>
                <View style={styles.replyingBarContent}>
                  <Ionicons
                    name="arrow-undo"
                    size={12}
                    color={colors.primary}
                  />
                  <AppText style={styles.replyingToText} numberOfLines={1}>
                    Replying to{' '}
                    <AppText variant="bold">{replyTo.user.name}</AppText>
                  </AppText>
                </View>
                <TouchableOpacity onPress={() => setReplyTo(undefined)}>
                  <Ionicons
                    name="close-circle"
                    size={18}
                    color={colors.messageMeta}
                  />
                </TouchableOpacity>
              </View>
            )}

            <View style={styles.inputBox}>
              <TextInput
                ref={inputRef}
                style={styles.input}
                value={input}
                onChangeText={setInput}
                placeholder="Send a message"
                placeholderTextColor={colors.textMuted}
                multiline
                onFocus={() => setShowEmoji(false)}
              />
              <View style={styles.inputActions}>
                <TouchableOpacity
                  style={styles.attachmentIcon}
                  onPress={() => setShowEmoji(v => !v)}
                >
                  <Ionicons
                    name="happy-outline"
                    size={20}
                    color={colors.messageMeta}
                  />
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.sendCircle,
                    !input.trim() && {
                      backgroundColor: colors.surfaceElevated,
                    },
                  ]}
                  onPress={handleSend}
                  disabled={!input.trim()}
                >
                  <Ionicons
                    name="send"
                    size={18}
                    color={input.trim() ? colors.white : colors.textMuted}
                  />
                </TouchableOpacity>
              </View>
            </View>
            <EmojiPicker
              open={showEmoji}
              onClose={() => setShowEmoji(false)}
              onEmojiSelected={handleEmojiSelect}
              enableSearchBar
              enableRecentlyUsed
              disableSafeArea={true}
              emojiSize={25}
              styles={{
                container: {
                  borderTopLeftRadius: 16,
                  borderTopRightRadius: 16,
                  backgroundColor: colors.surface,
                },
              }}
            />
          </View>
        </ChatKeyboardAvoidingView>
      </View>
    </Modal>
  );
};

export default ChatSidebar;
