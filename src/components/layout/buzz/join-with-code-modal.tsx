import React, { useMemo, useState } from 'react';
import {
  View,
  Modal,
  TouchableOpacity,
  Pressable,
  TextInput,
  Image,
  ActivityIndicator,
  Keyboard,
} from 'react-native';
import { AppText } from '@/components/ui/text';
import { useTheme } from '@/theme/ThemeProvider';
import { createBuzzModalStyles } from '@/theme/createBuzzStyles';
import { ShowNotify } from '@/components/ui/toast';
import { extractBuzzCodeFromInput } from '@/utils/buzz';

interface Props {
  visible: boolean;
  onClose: () => void;
  onJoin?: (code: string) => void;
}

const JoinWithCodeModal = ({ visible, onClose, onJoin }: Props) => {
  const { colors } = useTheme();
  const styles = useMemo(() => createBuzzModalStyles(colors), [colors]);
  const [code, setCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleJoin = async () => {
    const extractedCode = extractBuzzCodeFromInput(code);

    if (!extractedCode) {
      ShowNotify('Error', 'Please enter a meeting code or link');
      return;
    }

    setIsLoading(true);
    try {
      onJoin?.(extractedCode);
      setCode('');
      onClose();
    } catch (_error) {
      ShowNotify('Error', 'Failed to join meeting');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setCode('');
    onClose();
  };

  const handleClear = () => {
    setCode('');
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <Pressable style={styles.overlay} onPress={handleCancel}>
        <Pressable
          style={styles.modalCard}
          onPress={e => {
            e.stopPropagation();
            Keyboard.dismiss();
          }}
        >
          <TouchableOpacity
            style={styles.closeButton}
            onPress={handleCancel}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Image
              source={require('@/assets/icons/close.png')}
              style={styles.closeIcon}
            />
          </TouchableOpacity>

          <AppText variant="bold" style={styles.title}>
            Join with a code
          </AppText>

          <AppText variant="regular" style={styles.description}>
            Enter a code or link from an organizer to join a meeting
          </AppText>

          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="Paste code or link"
              placeholderTextColor={colors.textMuted}
              value={code}
              onChangeText={setCode}
              editable={!isLoading}
              multiline
              numberOfLines={2}
            />
            {code.length > 0 && (
              <TouchableOpacity
                style={styles.clearButton}
                onPress={handleClear}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Image
                  source={require('@/assets/icons/close.png')}
                  style={styles.clearIcon}
                />
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.buttonsContainer}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={handleCancel}
              activeOpacity={0.7}
              disabled={isLoading}
            >
              <AppText variant="semiBold" style={styles.cancelButtonText}>
                Cancel
              </AppText>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.joinButton,
                !code.trim() && styles.joinButtonDisabled,
              ]}
              onPress={handleJoin}
              activeOpacity={0.8}
              disabled={!code.trim() || isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color={colors.white} size="small" />
              ) : (
                <AppText variant="semiBold" style={styles.joinButtonText}>
                  Join
                </AppText>
              )}
            </TouchableOpacity>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
};

export default JoinWithCodeModal;
