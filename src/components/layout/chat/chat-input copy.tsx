import React, { useRef, useState } from 'react';
import {
  StyleSheet,
  View,
  Image,
  TextInput,
  TouchableOpacity,
  Keyboard,
} from 'react-native';
import { Colors } from '@/theme/colors';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import { VoiceRecorder } from './voice-recorder';

const ChatInput = ({
  message,
  setMessage,
  onSend,
  onPickImage,
  onMediaPicker,
  onOpenEmoji,
  isEmojiOpen,
  onCloseEmoji,
  onFocus,
}: any) => {
  const [isRecording, setIsRecording] = useState(false);
  const inputRef = useRef<TextInput>(null);
  const [inputHeight, setInputHeight] = useState(40);

  const handleOpenEmoji = () => {
    Keyboard.dismiss();

    setTimeout(() => {
      onOpenEmoji();
      onFocus();
    }, 1);
  };

  const handleCloseEmoji = () => {
    if (!isEmojiOpen) return;
    onCloseEmoji();
    setTimeout(() => {
      inputRef.current?.focus();
    }, 100);
  };

  const handleMediaPicker = () => {
    Keyboard.dismiss();
    onMediaPicker();
  };

  //

  return (
    <View style={styles.inputContainer}>
      {isEmojiOpen ? (
        <TouchableOpacity style={styles.iconBtn} onPress={handleCloseEmoji}>
          <FontAwesome name="keyboard-o" size={22} color="#54656F" />
        </TouchableOpacity>
      ) : (
        <TouchableOpacity style={styles.iconBtn} onPress={handleMediaPicker}>
          <Image
            source={require('@/assets/icons/plus-black.png')}
            style={styles.inputIcon}
          />
        </TouchableOpacity>
      )}

      <View style={styles.textInputWrapper}>
        <TextInput
          ref={inputRef}
          style={[
            styles.input,
            { height: Math.min(120, Math.max(40, inputHeight)) },
          ]}
          placeholder="Type a message"
          value={message}
          onChangeText={setMessage}
          multiline
          onContentSizeChange={event => {
            setInputHeight(event.nativeEvent.contentSize.height);
          }}
          textAlignVertical="center"
          onPressIn={() => {
            if (isEmojiOpen) {
              onCloseEmoji();
            }
          }}
          onFocus={() => {
            if (!isEmojiOpen) {
              onFocus();
            }
          }}
        />
        {!isEmojiOpen && (
          <TouchableOpacity style={styles.emojiBtn} onPress={handleOpenEmoji}>
            <Image
              source={require('@/assets/icons/emoji.png')}
              style={styles.inputIcon}
            />
          </TouchableOpacity>
        )}
      </View>

      {message.length === 0 ? (
        <View style={styles.rightIcons}>
          <TouchableOpacity style={styles.iconBtn} onPress={onPickImage}>
            <Image
              source={require('@/assets/icons/camera.png')}
              style={styles.inputIcon}
            />
          </TouchableOpacity>

          {/* <VoiceRecorder
                        onRecordingStart={() => setIsRecording(true)}
                        onRecordingStop={(uri: string) => {
                            setIsRecording(false);
                            onSend(uri, 'voice');
                        }}
                        onRecordingCancel={() => setIsRecording(false)}
                    /> */}
        </View>
      ) : (
        <TouchableOpacity
          style={styles.sendBtn}
          onPress={() => onSend(message, 'text')}
        >
          <Image
            source={require('@/assets/icons/send.png')}
            style={styles.sendIcon}
          />
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    paddingVertical: 20,
    backgroundColor: Colors.topNavigation,
  },
  textInputWrapper: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: Colors.white,
    borderRadius: 25,
    marginHorizontal: 8,
    paddingHorizontal: 12,
    alignItems: 'center',
  },
  input: { flex: 1, paddingVertical: 8, maxHeight: 100, fontSize: 16 },
  iconBtn: { padding: 8 },
  inputIcon: { width: 24, height: 24, tintColor: '#54656F' },
  emojiBtn: { padding: 4 },
  rightIcons: { flexDirection: 'row', alignItems: 'center' },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 22,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendIcon: {
    width: 18,
    height: 18,
    objectFit: 'contain',
    tintColor: Colors.white,
  },
});

export default ChatInput;
