import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { AppText } from '@/components/ui/text';
import { useTheme } from '@/theme/ThemeProvider';
import { useFileManagementStyles } from '@/components/files/file-management.styles';

type RenameFileModalProps = {
  visible: boolean;
  initialName: string;
  loading?: boolean;
  onClose: () => void;
  onSubmit: (name: string) => void;
};

const RenameFileModal: React.FC<RenameFileModalProps> = ({
  visible,
  initialName,
  loading = false,
  onClose,
  onSubmit,
}) => {
  const { colors } = useTheme();
  const styles = useFileManagementStyles();
  const [name, setName] = useState(initialName);

  useEffect(() => {
    if (visible) setName(initialName);
  }, [visible, initialName]);

  const handleSubmit = () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    onSubmit(trimmed);
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable
        style={styles.modalBackdrop}
        onPress={loading ? undefined : onClose}
      >
        <Pressable style={styles.modalCard} onPress={e => e.stopPropagation()}>
          <AppText variant="bold" size={18} style={styles.modalTitle}>
            Rename file
          </AppText>
          <AppText size={14} style={styles.modalSubtitle}>
            Enter a new name for this file.
          </AppText>

          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="File name"
            placeholderTextColor={colors.messageMeta}
            style={styles.modalInput}
            editable={!loading}
            autoFocus
          />

          <View style={styles.modalActions}>
            <TouchableOpacity
              style={styles.modalCancelBtn}
              onPress={onClose}
              disabled={loading}
            >
              <AppText
                variant="medium"
                size={15}
                style={styles.modalCancelText}
              >
                Cancel
              </AppText>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.modalPrimaryBtn,
                (!name.trim() || loading) && styles.modalPrimaryBtnDisabled,
              ]}
              onPress={handleSubmit}
              disabled={!name.trim() || loading}
            >
              {loading ? (
                <ActivityIndicator color={colors.white} size="small" />
              ) : (
                <AppText
                  variant="bold"
                  size={15}
                  style={styles.modalPrimaryText}
                >
                  Save
                </AppText>
              )}
            </TouchableOpacity>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
};

export default RenameFileModal;
