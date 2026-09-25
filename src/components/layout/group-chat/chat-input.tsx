import React, {
  useRef,
  useState,
  useMemo,
  useEffect,
  useCallback,
} from 'react';
import {
  View,
  Image,
  Text,
  TextInput,
  TouchableOpacity,
  Keyboard,
  Platform,
  LayoutChangeEvent,
  NativeSyntheticEvent,
  TextInputContentSizeChangeEventData,
} from 'react-native';
import { useTheme } from '@/theme/ThemeProvider';
import { createChatInputStyles } from '@/theme/createMessageStyles';
import FontAwesome5Icon from 'react-native-vector-icons/FontAwesome5';
import {
  MIN_COMPOSER_HEIGHT,
  clampComposerHeight,
  formatComposerMeasureText,
  contentSizeToComposerHeight,
  shouldEnableComposerScroll,
  getComposerTextAreaWidth,
  isComposerExpanded,
} from '@/utils/composer-input-height';

const ChatInput = ({
  message,
  setMessage,
  onSend,
  onPickImage,
  onMediaPicker,
  onOpenEmoji,
  isEmojiOpen,
  onCloseEmoji,
}: any) => {
  const { colors } = useTheme();
  const styles = useMemo(() => createChatInputStyles(colors), [colors]);
  const [_isRecording, _setIsRecording] = useState(false);
  const inputRef = useRef<TextInput>(null);
  const [contentHeight, setContentHeight] = useState(MIN_COMPOSER_HEIGHT);
  const [textAreaWidth, setTextAreaWidth] = useState(0);

  const resolvedInputHeight = clampComposerHeight(contentHeight);
  const composerScrollEnabled = shouldEnableComposerScroll(contentHeight);
  const isExpanded = isComposerExpanded(contentHeight, message);

  const setComposerContentHeight = useCallback((nextHeight: number) => {
    if (!message.trim()) {
      setContentHeight(MIN_COMPOSER_HEIGHT);
      return;
    }

    setContentHeight(Math.max(MIN_COMPOSER_HEIGHT, nextHeight));
  }, []);

  useEffect(() => {
    if (!message.trim()) {
      setContentHeight(MIN_COMPOSER_HEIGHT);
    }
  }, [message]);

  const handleContentSizeChange = (
    event: NativeSyntheticEvent<TextInputContentSizeChangeEventData>,
  ) => {
    if (Platform.OS === 'ios' && textAreaWidth > 0) return;
    if (!message.trim()) {
      setContentHeight(MIN_COMPOSER_HEIGHT);
      return;
    }

    setComposerContentHeight(
      contentSizeToComposerHeight(event.nativeEvent.contentSize.height),
    );
  };

  const handleMeasureTextLayout = (event: LayoutChangeEvent) => {
    if (Platform.OS !== 'ios') return;
    if (!message.trim()) {
      setContentHeight(MIN_COMPOSER_HEIGHT);
      return;
    }

    setComposerContentHeight(event.nativeEvent.layout.height);
  };

  const handleTextInputWrapperLayout = (event: LayoutChangeEvent) => {
    const nextWidth = getComposerTextAreaWidth(event.nativeEvent.layout.width, {
      emojiVisible: !isEmojiOpen,
    });
    if (nextWidth > 0 && nextWidth !== textAreaWidth) {
      setTextAreaWidth(nextWidth);
    }
  };

  const handleOpenEmoji = () => {
    Keyboard.dismiss();
    onOpenEmoji();
  };

  const handleCloseEmoji = () => {
    onCloseEmoji();
    setTimeout(() => {
      inputRef.current?.focus();
    }, 100);
  };

  const handleMediaPicker = () => {
    Keyboard.dismiss();
    onMediaPicker();
  };

  return (
    <View style={styles.inputAreaWrapper}>
      <View style={styles.inputContainer}>
        {isEmojiOpen ? (
          <TouchableOpacity style={styles.iconBtn} onPress={handleCloseEmoji}>
            <FontAwesome5Icon
              name="keyboard"
              size={22}
              color={colors.iconDefault}
            />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={styles.iconBtn} onPress={handleMediaPicker}>
            <Image
              source={require('@/assets/icons/plus-black.png')}
              style={styles.inputIcon}
            />
          </TouchableOpacity>
        )}

        <View
          style={[
            styles.textInputWrapper,
            isExpanded
              ? { minHeight: Math.max(44, resolvedInputHeight + 8) }
              : null,
          ]}
          onLayout={handleTextInputWrapperLayout}
        >
          {Platform.OS === 'ios' && textAreaWidth > 0 ? (
            <Text
              pointerEvents="none"
              style={[styles.composerMeasureText, { width: textAreaWidth }]}
              onLayout={handleMeasureTextLayout}
            >
              {formatComposerMeasureText(message)}
            </Text>
          ) : null}

          <TextInput
            ref={inputRef}
            style={[
              styles.input,
              isExpanded ? { height: resolvedInputHeight } : null,
            ]}
            placeholder="Type a message"
            placeholderTextColor={colors.messageMeta}
            value={message}
            onChangeText={setMessage}
            multiline
            scrollEnabled={composerScrollEnabled}
            blurOnSubmit={false}
            onContentSizeChange={handleContentSizeChange}
            textAlignVertical="top"
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
    </View>
  );
};

export default ChatInput;
