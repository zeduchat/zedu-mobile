import React from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  TouchableOpacity,
  View,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { AppText } from '@/components/ui/text';
import { formatFileSize } from '@/utils/file-helpers';
import { useTheme } from '@/theme/ThemeProvider';
import { useFileManagementStyles } from '@/components/files/file-management.styles';

export type PendingUploadFile = {
  uri: string;
  name: string;
  type?: string;
  size?: number | null;
};

type UploadConfirmationModalProps = {
  visible: boolean;
  files: PendingUploadFile[];
  uploading: boolean;
  onClose: () => void;
  onConfirm: () => void;
  onRemove: (index: number) => void;
};

const UploadConfirmationModal: React.FC<UploadConfirmationModalProps> = ({
  visible,
  files,
  uploading,
  onClose,
  onConfirm,
  onRemove,
}) => {
  const { colors } = useTheme();
  const styles = useFileManagementStyles();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable
        style={styles.modalBackdrop}
        onPress={uploading ? undefined : onClose}
      >
        <Pressable style={styles.modalCard} onPress={e => e.stopPropagation()}>
          <AppText variant="bold" size={18} style={styles.modalTitle}>
            Upload files
          </AppText>
          <AppText size={14} style={styles.modalSubtitle}>
            Review the selected files before uploading.
          </AppText>

          <ScrollView
            style={styles.modalList}
            keyboardShouldPersistTaps="handled"
          >
            {files.map((file, index) => (
              <View key={`${file.uri}-${index}`} style={styles.modalFileRow}>
                <View style={styles.modalFileIcon}>
                  <Ionicons
                    name="document-outline"
                    size={20}
                    color={colors.primary}
                  />
                </View>
                <View style={styles.modalFileInfo}>
                  <AppText
                    size={14}
                    numberOfLines={2}
                    style={styles.modalFileName}
                  >
                    {file.name}
                  </AppText>
                  {file.size != null && (
                    <AppText size={12} style={styles.modalFileSize}>
                      {formatFileSize(file.size)}
                    </AppText>
                  )}
                </View>
                {!uploading && (
                  <TouchableOpacity
                    onPress={() => onRemove(index)}
                    style={styles.modalRemoveBtn}
                  >
                    <Ionicons
                      name="close-circle"
                      size={22}
                      color={colors.messageMeta}
                    />
                  </TouchableOpacity>
                )}
              </View>
            ))}
          </ScrollView>

          <View style={styles.modalActions}>
            <TouchableOpacity
              style={styles.modalCancelBtn}
              onPress={onClose}
              disabled={uploading}
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
                (uploading || !files.length) && styles.modalPrimaryBtnDisabled,
              ]}
              onPress={onConfirm}
              disabled={uploading || !files.length}
              activeOpacity={0.8}
            >
              {uploading ? (
                <ActivityIndicator color={colors.white} size="small" />
              ) : (
                <AppText
                  variant="bold"
                  size={15}
                  style={styles.modalPrimaryText}
                >
                  Upload {files.length > 1 ? `(${files.length})` : ''}
                </AppText>
              )}
            </TouchableOpacity>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
};

export default UploadConfirmationModal;
