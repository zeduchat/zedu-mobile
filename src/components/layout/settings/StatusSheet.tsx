import React, {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  View,
  TouchableOpacity,
  TextInput,
  Keyboard,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import AppBottomSheet, {
  AppBottomSheetRef,
} from '@/components/ui/bottom-sheet';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { AppText } from '@/components/ui/text';
import { ThemedEmojiPicker } from '@/components/ui/themed-emoji-keyboard';
import type { EmojiType } from 'rn-emoji-keyboard';
import { useTheme } from '@/theme/ThemeProvider';
import { createStatusSheetStyles } from '@/theme/createChatOverlayStyles';
import { useDataContext } from '@/store/useDataContext';
import { PostRequest } from '@/utils/requests';
import { ACTIONS } from '@/store/types';

type Props = {
  initialText?: string;
  initialEmoji?: string;
  onChange?: (emoji: string, text: string, clearAfter?: string) => void;
};

const CLEAR_OPTIONS = [
  { key: 'dont-clear', label: "Don't Clear" },
  { key: '30 minutes', label: '30 minutes' },
  { key: '1 hour', label: '1 hour' },
  { key: '4 hours', label: '4 hours' },
  { key: 'Today', label: 'Today' },
  { key: 'This week', label: 'This Week' },
  { key: 'custom', label: 'Custom' },
];

const PRESET_STATUSES = [
  {
    id: 'meeting',
    label: 'In a meeting',
    emoji: '🗓️',
    note: '1 hour',
    clearKey: '1h',
  },
  {
    id: 'commuting',
    label: 'Commuting',
    emoji: '🚌',
    note: '30 minutes',
    clearKey: '30m',
  },
  {
    id: 'outsick',
    label: 'Out sick',
    emoji: '🤒',
    note: 'Today',
    clearKey: 'today',
  },
  {
    id: 'vacation',
    label: 'Vacationing',
    emoji: '🌴',
    note: "Don't Clear",
    clearKey: 'dont',
  },
  {
    id: 'remote',
    label: 'Working remotely',
    emoji: '🏠',
    note: 'Today',
    clearKey: 'today',
  },
];

const StatusSheet = forwardRef<AppBottomSheetRef, Props>(
  ({ initialText = '', initialEmoji = '', onChange }, ref) => {
    const { colors } = useTheme();
    const styles = useMemo(() => createStatusSheetStyles(colors), [colors]);
    const sheetRef = useRef<AppBottomSheetRef>(null);
    const [text, setText] = useState(initialText);
    const [emoji, setEmoji] = useState(initialEmoji);
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [mode, setMode] = useState<'main' | 'clear'>('main');
    const [clearChoice, setClearChoice] = useState('dont');
    const [loading, setLoading] = useState(false);
    // Ignores extra taps on ✓ while a save is already in progress.
    const submittingRef = useRef(false);
    const { state, dispatch } = useDataContext();
    const { user } = state;

    // The last saved status, restored when the sheet closes without saving.
    const savedRef = useRef({ text: '', emoji: '', clearChoice: 'dont' });

    const restoreSaved = () => {
      setText(savedRef.current.text);
      setEmoji(savedRef.current.emoji);
      setClearChoice(savedRef.current.clearChoice);
      setMode('main');
    };

    useEffect(() => {
      savedRef.current = {
        text: user?.text || '',
        emoji: user?.icon || '',
        clearChoice: user?.status_timeout || 'dont',
      };
      restoreSaved();
    }, []);

    // Keeps the saved status current when the user loads or changes later,
    // without touching what is being edited.
    useEffect(() => {
      savedRef.current = {
        text: user?.text || '',
        emoji: user?.icon || '',
        clearChoice: user?.status_timeout || 'dont',
      };
    }, [user?.text, user?.icon, user?.status_timeout]);

    useImperativeHandle(ref, () => ({
      expand: () => sheetRef.current?.expand(),
      close: () => sheetRef.current?.close(),
      snapToIndex: (index: number) => sheetRef.current?.snapToIndex(index),
    }));

    const close = () => {
      restoreSaved();
      sheetRef.current?.close();
    };

    const handleEmoji = (e: EmojiType) => {
      setEmoji(e.emoji ?? String(e));
      setShowEmojiPicker(false);
    };

    const handlePresetSelection = (item: (typeof PRESET_STATUSES)[0]) => {
      setText(item.label);
      setEmoji(item.emoji);
      setClearChoice(item.clearKey);
    };

    // handle submit
    const handleSubmit = async () => {
      if (submittingRef.current) return;
      submittingRef.current = true;
      setLoading(true);

      const payload = {
        icon: emoji,
        text,
        status_timeout: clearChoice,
        clear_status: false,
        online: true,
      };

      const { error } = await PostRequest('/profile/change-status', payload);

      setLoading(false);
      submittingRef.current = false;
      if (error) {
        dispatch({ type: ACTIONS.ERROR, payload: error });
        return;
      }
      // Only update the Settings row once the status is actually saved.
      savedRef.current = { text, emoji, clearChoice };
      onChange && onChange(emoji, text, clearChoice);
      close();
    };

    return (
      <>
        <AppBottomSheet
          ref={sheetRef}
          snapPoints={['98%']}
          paddingBottom={150}
          onClose={restoreSaved}
        >
          <View style={styles.headerRow}>
            <TouchableOpacity
              onPress={mode === 'clear' ? () => setMode('main') : close}
              style={styles.iconBtn}
            >
              <Ionicons
                name={mode === 'clear' ? 'arrow-back' : 'close'}
                size={24}
                color={colors.textPrimary}
              />
            </TouchableOpacity>
            <AppText variant="bold" style={styles.title}>
              {mode === 'main' ? 'Set a status' : 'Clear after'}
            </AppText>
            <TouchableOpacity onPress={handleSubmit} style={styles.saveBtn}>
              {loading ? (
                <ActivityIndicator color={colors.primary} />
              ) : (
                <Ionicons
                  name="checkmark"
                  size={25}
                  color={text ? colors.primary : colors.textMuted}
                  style={{ opacity: text ? 1 : 0.5 }}
                />
              )}
            </TouchableOpacity>
          </View>

          {mode === 'main' ? (
            <View style={styles.content}>
              <View style={styles.inputContainer}>
                <TouchableOpacity
                  onPress={() => setShowEmojiPicker(true)}
                  style={styles.emojiBtn}
                >
                  {emoji ? (
                    <AppText size={22}>{emoji}</AppText>
                  ) : (
                    <Ionicons name="happy-outline" size={24} color="#616061" />
                  )}
                </TouchableOpacity>
                <TextInput
                  value={text}
                  onChangeText={setText}
                  placeholder="What's your status?"
                  style={styles.textInput}
                  placeholderTextColor="#ABABAD"
                  multiline={false}
                  onSubmitEditing={Keyboard.dismiss}
                />
                {text.length > 0 && (
                  <TouchableOpacity
                    onPress={() => setText('')}
                    style={styles.clearInputBtn}
                  >
                    <Ionicons name="close-circle" size={18} color="#616061" />
                  </TouchableOpacity>
                )}
              </View>

              <TouchableOpacity
                style={styles.clearAfterRow}
                onPress={() => setMode('clear')}
              >
                <View style={styles.rowLead}>
                  <Ionicons name="time-outline" size={20} color="#616061" />
                  <AppText style={styles.rowLabel}>Clear after...</AppText>
                </View>
                <View style={styles.rowTail}>
                  <AppText style={styles.rowSub}>
                    {CLEAR_OPTIONS.find(o => o.key === clearChoice)?.label}
                  </AppText>
                  <Ionicons name="chevron-forward" size={16} color="#ABABAD" />
                </View>
              </TouchableOpacity>

              <View style={styles.sectionHeader}>
                <AppText variant="bold" style={styles.sectionHeaderText}>
                  RECENTLY USED
                </AppText>
              </View>

              <FlatList
                data={PRESET_STATUSES}
                keyExtractor={item => item.id}
                scrollEnabled={false}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={styles.presetRow}
                    onPress={() => handlePresetSelection(item)}
                  >
                    <View style={styles.presetLead}>
                      <View style={styles.presetEmojiWrap}>
                        <AppText size={18}>{item.emoji}</AppText>
                      </View>
                      <AppText style={styles.presetLabel}>{item.label}</AppText>
                    </View>
                    <AppText style={styles.presetNote}>{item.note}</AppText>
                  </TouchableOpacity>
                )}
              />
            </View>
          ) : (
            <View style={styles.content}>
              {CLEAR_OPTIONS.map(opt => (
                <TouchableOpacity
                  key={opt.key}
                  style={styles.clearSelectionRow}
                  onPress={() => {
                    setClearChoice(opt.key);
                    setMode('main');
                  }}
                >
                  <AppText
                    style={[
                      styles.clearOptionText,
                      clearChoice === opt.key && { color: colors.secondary },
                    ]}
                  >
                    {opt.label}
                  </AppText>
                  {clearChoice === opt.key && (
                    <Ionicons
                      name="checkmark"
                      size={22}
                      color={colors.secondary}
                    />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          )}
        </AppBottomSheet>

        <ThemedEmojiPicker
          onEmojiSelected={handleEmoji}
          open={showEmojiPicker}
          onClose={() => setShowEmojiPicker(false)}
          enableRecentlyUsed
          categoryPosition="bottom"
          disableSafeArea
        />
      </>
    );
  },
);

export default StatusSheet;
