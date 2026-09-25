import React, {
  useRef,
  useState,
  useEffect,
  useMemo,
  useCallback,
} from 'react';
import {
  View,
  Image,
  Text,
  TextInput,
  TouchableOpacity,
  Keyboard,
  Animated,
  ActivityIndicator,
  Platform,
  LayoutChangeEvent,
  NativeSyntheticEvent,
  TextInputContentSizeChangeEventData,
} from 'react-native';
import { useTheme } from '@/theme/ThemeProvider';
import { createChatInputStyles } from '@/theme/createMessageStyles';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import FontAwesome5 from 'react-native-vector-icons/FontAwesome5';
import { VoiceRecorder } from './voice-recorder';
import { AppText } from '@/components/ui/text';
import AudioRecorderPlayer from 'react-native-audio-recorder-player';
import {
  getActiveMention,
  parseComposerMentionSegments,
} from '@/utils/message-text';
import TypingUsers from '@/components/layout/chat/typing-users';
import {
  MIN_COMPOSER_HEIGHT,
  clampComposerHeight,
  formatComposerMeasureText,
  contentSizeToComposerHeight,
  shouldEnableComposerScroll,
  getComposerTextAreaWidth,
  isComposerExpanded,
} from '@/utils/composer-input-height';

// Isolated player instance for the preview bar only
const previewPlayer = new AudioRecorderPlayer();

// Static waveform bar heights (pseudo-natural shape, computed once)
const BARS = 36;
const BAR_HEIGHTS: number[] = Array.from(
  { length: BARS },
  (_, i) => 4 + Math.abs(Math.sin(i * 0.65 + 1) * 11 + Math.cos(i * 0.38) * 5),
);

interface VoicePreview {
  uri: string;
  durationSec: number;
}

const ChatInput = ({
  message,
  setMessage,
  onSend,
  onVoiceRecorded,
  onVoiceSendReady,
  onVoiceCancel,
  isVoiceUploading,
  onPickImage,
  onMediaPicker,
  onOpenEmoji,
  isEmojiOpen,
  onCloseEmoji,
  onFocus,
  onMentionTrigger,
  onMentionCancel,
  highlightMentions = false,
  composerMentions = [],
  onTypingChange,
}: any) => {
  const { colors } = useTheme();
  const styles = useMemo(() => createChatInputStyles(colors), [colors]);
  const [isVoiceRecording, setIsVoiceRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [voicePreview, setVoicePreview] = useState<VoicePreview | null>(null);

  // Preview player state
  const [previewPlaying, setPreviewPlaying] = useState(false);
  const [previewCurrentMs, setPreviewCurrentMs] = useState(0);
  const [previewDurationMs, setPreviewDurationMs] = useState(0);

  const inputRef = useRef<TextInput>(null);
  const [contentHeight, setContentHeight] = useState(MIN_COMPOSER_HEIGHT);
  const [textAreaWidth, setTextAreaWidth] = useState(0);
  const [_selection, setSelection] = useState({ start: 0, end: 0 });
  const selectionRef = useRef({ start: 0, end: 0 });
  const messageRef = useRef(message);
  const skipSelectionMentionSync = useRef(false);
  const isFocusedRef = useRef(false);

  useEffect(() => {
    messageRef.current = message;
    if (!message.trim()) {
      setContentHeight(MIN_COMPOSER_HEIGHT);
    }
  }, [message]);

  useEffect(() => {
    if (!isFocusedRef.current || !onTypingChange) return;
    onTypingChange(message.trim().length > 0);
  }, [message, onTypingChange]);

  const slideX = useRef(new Animated.Value(0)).current;
  const dotOpacity = useRef(new Animated.Value(1)).current;

  // Stop preview player on unmount
  useEffect(() => {
    return () => {
      previewPlayer.stopPlayer().catch(() => {});
      previewPlayer.removePlayBackListener();
    };
  }, []);

  // ── Helpers ────────────────────────────────────────────────────────────────
  const fmtMs = (ms: number) => {
    const t = Math.floor(ms / 1000);
    const m = Math.floor(t / 60);
    const s = t % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };
  const fmtSec = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const stopPreviewPlayer = async () => {
    previewPlayer.removePlayBackListener();
    await previewPlayer.stopPlayer().catch(() => {});
    setPreviewPlaying(false);
  };

  // ── Preview player: play / pause ───────────────────────────────────────────
  const handlePreviewPlayPause = async () => {
    if (!voicePreview) return;
    if (previewPlaying) {
      await previewPlayer.pausePlayer().catch(() => {});
      previewPlayer.removePlayBackListener();
      setPreviewPlaying(false);
    } else {
      try {
        await previewPlayer.startPlayer(voicePreview.uri);
        setPreviewPlaying(true);
        previewPlayer.addPlayBackListener(e => {
          setPreviewCurrentMs(e.currentPosition);
          if (e.duration > 0) setPreviewDurationMs(e.duration);
          if (e.duration > 0 && e.currentPosition >= e.duration - 150) {
            previewPlayer.removePlayBackListener();
            setPreviewPlaying(false);
            setPreviewCurrentMs(0);
          }
        });
      } catch (err) {
        console.warn('[PreviewPlayer]', err);
      }
    }
  };

  // ── Delete preview ─────────────────────────────────────────────────────────
  const handleVoiceDelete = async () => {
    await stopPreviewPlayer();
    setVoicePreview(null);
    setPreviewCurrentMs(0);
    setPreviewDurationMs(0);
    onVoiceCancel?.();
  };

  // ── Send voice ─────────────────────────────────────────────────────────────
  const handleVoiceSend = async () => {
    await stopPreviewPlayer();
    setVoicePreview(null);
    setPreviewCurrentMs(0);
    setPreviewDurationMs(0);
    onVoiceSendReady?.();
  };

  // ── Text input handlers ────────────────────────────────────────────────────
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

  const updateMentionTrigger = (text: string, cursorPos: number) => {
    const mention = getActiveMention(text, cursorPos);
    if (mention) {
      onMentionTrigger?.(mention.query, mention.pos);
    } else {
      onMentionCancel?.();
    }
  };

  const handleTextChange = (text: string) => {
    const previousText = messageRef.current;
    const prevCursor = selectionRef.current.start;
    const lengthDelta = text.length - previousText.length;

    let nextCursor = prevCursor;
    if (lengthDelta > 0) {
      nextCursor =
        prevCursor >= previousText.length
          ? text.length
          : prevCursor + lengthDelta;
    } else if (lengthDelta < 0) {
      nextCursor = Math.max(0, prevCursor + lengthDelta);
    }

    nextCursor = Math.max(0, Math.min(text.length, nextCursor));
    selectionRef.current = { start: nextCursor, end: nextCursor };
    setSelection(selectionRef.current);
    setMessage(text);
    updateMentionTrigger(text, nextCursor);
    skipSelectionMentionSync.current = true;
  };

  const handleSelectionChange = (event: any) => {
    const nextSelection = event.nativeEvent.selection;
    selectionRef.current = nextSelection;
    setSelection(nextSelection);

    if (skipSelectionMentionSync.current) {
      skipSelectionMentionSync.current = false;
      return;
    }

    updateMentionTrigger(messageRef.current, nextSelection.start);
  };

  // ── Derived values for waveform progress ───────────────────────────────────
  const progress =
    previewDurationMs > 0
      ? Math.min(previewCurrentMs / previewDurationMs, 1)
      : 0;
  const timeLabel = previewPlaying
    ? fmtMs(previewCurrentMs)
    : voicePreview
    ? fmtSec(voicePreview.durationSec)
    : '0:00';

  const composerSegments = useMemo(() => {
    if (!highlightMentions || !message) {
      return [];
    }

    return parseComposerMentionSegments(message, composerMentions);
  }, [composerMentions, highlightMentions, message]);

  const resolvedInputHeight = clampComposerHeight(contentHeight);
  const composerScrollEnabled = shouldEnableComposerScroll(contentHeight);
  const isExpanded = isComposerExpanded(contentHeight, message);

  const setComposerContentHeight = useCallback((nextHeight: number) => {
    if (!messageRef.current.trim()) {
      setContentHeight(MIN_COMPOSER_HEIGHT);
      return;
    }

    setContentHeight(Math.max(MIN_COMPOSER_HEIGHT, nextHeight));
  }, []);

  const handleContentSizeChange = (
    event: NativeSyntheticEvent<TextInputContentSizeChangeEventData>,
  ) => {
    if (Platform.OS === 'ios' && textAreaWidth > 0) return;
    if (!messageRef.current.trim()) {
      setContentHeight(MIN_COMPOSER_HEIGHT);
      return;
    }

    setComposerContentHeight(
      contentSizeToComposerHeight(event.nativeEvent.contentSize.height),
    );
  };

  const handleMeasureTextLayout = (event: LayoutChangeEvent) => {
    if (Platform.OS !== 'ios') return;
    if (!messageRef.current.trim()) {
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

  // ══════════════════════════════════════════════════════════════════════════
  // RENDER — Voice preview bar (WhatsApp style)
  // ══════════════════════════════════════════════════════════════════════════
  if (voicePreview) {
    return (
      <View style={styles.inputAreaWrapper}>
        <TypingUsers />
        <View style={[styles.inputContainer]}>
          {/* Trash — discard recording */}
          <TouchableOpacity style={styles.iconBtn} onPress={handleVoiceDelete}>
            <FontAwesome5 name="trash" size={20} color="red" />
          </TouchableOpacity>

          {/* Player pill */}
          <View style={styles.voiceBar}>
            <TouchableOpacity
              style={styles.previewPlayBtn}
              onPress={handlePreviewPlayPause}
              activeOpacity={0.8}
            >
              <FontAwesome5
                name={previewPlaying ? 'pause' : 'play'}
                size={13}
                color={colors.white}
                style={previewPlaying ? undefined : { marginLeft: 2 }}
              />
            </TouchableOpacity>

            <View style={styles.waveformRow}>
              {BAR_HEIGHTS.map((h, i) => (
                <View
                  key={i}
                  style={[
                    styles.wavebar,
                    {
                      height: h,
                      backgroundColor:
                        i / BARS <= progress
                          ? colors.primary
                          : colors.waveformInactive,
                      borderRadius: h / 2,
                    },
                  ]}
                />
              ))}
            </View>

            <AppText size={11} style={styles.previewTimer}>
              {timeLabel}
            </AppText>
          </View>

          {/* Send — disabled while uploading */}
          <TouchableOpacity
            style={[styles.sendBtn, isVoiceUploading && styles.sendBtnDisabled]}
            onPress={handleVoiceSend}
            disabled={!!isVoiceUploading}
            activeOpacity={0.8}
          >
            {isVoiceUploading ? (
              <ActivityIndicator size="small" color={colors.white} />
            ) : (
              <Image
                source={require('@/assets/icons/send.png')}
                style={styles.sendIcon}
              />
            )}
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // ══════════════════════════════════════════════════════════════════════════
  // RENDER — Normal input bar
  // ══════════════════════════════════════════════════════════════════════════
  return (
    <View style={styles.inputAreaWrapper}>
      <TypingUsers />
      <View style={[styles.inputContainer]}>
        {/* Left button — hidden while recording */}
        {!isVoiceRecording &&
          (isEmojiOpen ? (
            <TouchableOpacity style={styles.iconBtn} onPress={handleCloseEmoji}>
              <FontAwesome
                name="keyboard-o"
                size={22}
                color={colors.iconDefault}
              />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={styles.iconBtn}
              onPress={() => {
                Keyboard.dismiss();
                onMediaPicker();
              }}
            >
              <Image
                source={require('@/assets/icons/plus-black.png')}
                style={styles.inputIcon}
              />
            </TouchableOpacity>
          ))}

        {/* Centre — live recording bar OR text input */}
        {isVoiceRecording ? (
          <View style={styles.recordingBar}>
            <View style={styles.timerRow}>
              <Animated.View style={[styles.redDot, { opacity: dotOpacity }]} />
              <AppText style={styles.timerText}>
                {fmtSec(recordingSeconds)}
              </AppText>
            </View>
            <Animated.View style={{ transform: [{ translateX: slideX }] }}>
              <AppText style={styles.slideHint}>{'◄  Slide to cancel'}</AppText>
            </Animated.View>
          </View>
        ) : (
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
                allowFontScaling={false}
                pointerEvents="none"
                style={[styles.composerMeasureText, { width: textAreaWidth }]}
                onLayout={handleMeasureTextLayout}
              >
                {formatComposerMeasureText(message)}
              </Text>
            ) : null}

            {highlightMentions && composerSegments.length > 0 ? (
              <AppText
                pointerEvents="none"
                style={[
                  styles.input,
                  styles.inputOverlay,
                  isExpanded ? { height: resolvedInputHeight } : null,
                ]}
              >
                {composerSegments.map((segment, index) => {
                  if (segment.type === 'channelMention') {
                    return (
                      <AppText
                        key={`composer-segment-${index}`}
                        style={styles.composerChannelMentionText}
                      >
                        {segment.content}
                      </AppText>
                    );
                  }

                  if (segment.type === 'userMention') {
                    return (
                      <AppText
                        key={`composer-segment-${index}`}
                        style={styles.composerMentionText}
                      >
                        {segment.content}
                      </AppText>
                    );
                  }

                  return segment.content;
                })}
              </AppText>
            ) : null}

            <TextInput
              ref={inputRef}
              allowFontScaling={false}
              style={[
                styles.input,
                highlightMentions && styles.inputTransparentText,
                isExpanded ? { height: resolvedInputHeight } : null,
              ]}
              placeholder="Type a message"
              value={message}
              onChangeText={handleTextChange}
              onSelectionChange={handleSelectionChange}
              multiline
              scrollEnabled={composerScrollEnabled}
              blurOnSubmit={false}
              onContentSizeChange={handleContentSizeChange}
              textAlignVertical="top"
              onPressIn={() => {
                if (isEmojiOpen) onCloseEmoji();
              }}
              onFocus={() => {
                isFocusedRef.current = true;
                if (!isEmojiOpen) onFocus();
              }}
              onBlur={() => {
                isFocusedRef.current = false;
                onTypingChange?.(false);
              }}
            />

            {!isEmojiOpen && (
              <TouchableOpacity
                style={styles.emojiBtn}
                onPress={handleOpenEmoji}
              >
                <Image
                  source={require('@/assets/icons/emoji.png')}
                  style={styles.inputIcon}
                />
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Right — camera + mic, or send button */}
        {message.length === 0 ? (
          <View style={styles.rightIcons}>
            {!isVoiceRecording && (
              <TouchableOpacity style={styles.iconBtn} onPress={onPickImage}>
                <Image
                  source={require('@/assets/icons/camera.png')}
                  style={styles.inputIcon}
                />
              </TouchableOpacity>
            )}
            <VoiceRecorder
              isRecording={isVoiceRecording}
              slideX={slideX}
              dotOpacity={dotOpacity}
              onSecondsChange={setRecordingSeconds}
              onRecordingStart={() => {
                isFocusedRef.current = false;
                onTypingChange?.(false);
                setIsVoiceRecording(true);
              }}
              onRecordingStop={(uri: string) => {
                const durationSec = recordingSeconds;
                setIsVoiceRecording(false);
                setRecordingSeconds(0);
                setVoicePreview({ uri, durationSec });
                onVoiceRecorded?.(uri);
              }}
              onRecordingCancel={() => {
                setIsVoiceRecording(false);
                setRecordingSeconds(0);
              }}
            />
          </View>
        ) : (
          <TouchableOpacity
            style={styles.sendBtn}
            onPress={() => onSend(message)}
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
