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

type FolderFormModalProps = {
  visible: boolean;
  mode: 'create' | 'edit';
  initialName?: string;
  loading?: boolean;
  onClose: () => void;
  onSubmit: (name: string) => void;
};

const FolderFormModal: React.FC<FolderFormModalProps> = ({
  visible,
  mode,
  initialName = '',
  loading = false,
  onClose,
  onSubmit,
}) => {
  const { colors } = useTheme();
  const styles = useFileManagementStyles();
  const [name, setName] = useState(initialName);
  const isBusy = loading;

  useEffect(() => {
    if (visible) {
      setName(initialName);
    }
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
        onPress={isBusy ? undefined : onClose}
      >
        <Pressable style={styles.modalCard} onPress={e => e.stopPropagation()}>
          <AppText variant="bold" size={18} style={styles.modalTitle}>
            {mode === 'create' ? 'New Folder' : 'Edit Folder'}
          </AppText>
          <AppText size={14} style={styles.modalSubtitle}>
            {mode === 'create'
              ? 'Enter a name for your new folder.'
              : 'Update the folder name.'}
          </AppText>

          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="Folder name"
            placeholderTextColor={colors.messageMeta}
            style={styles.modalInput}
            editable={!isBusy}
            autoFocus
          />

          <View style={styles.modalActions}>
            <TouchableOpacity
              style={styles.modalCancelBtn}
              onPress={onClose}
              disabled={isBusy}
              activeOpacity={0.8}
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
                (!name.trim() || isBusy) && styles.modalPrimaryBtnDisabled,
              ]}
              onPress={handleSubmit}
              disabled={!name.trim() || isBusy}
              activeOpacity={0.8}
            >
              {loading ? (
                <ActivityIndicator color={colors.white} size="small" />
              ) : (
                <AppText
                  variant="bold"
                  size={15}
                  style={styles.modalPrimaryText}
                >
                  {mode === 'create' ? 'Create' : 'Save'}
                </AppText>
              )}
            </TouchableOpacity>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
};

export default FolderFormModal;
