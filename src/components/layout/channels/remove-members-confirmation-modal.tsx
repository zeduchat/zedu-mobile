import React, { useMemo } from 'react';
import {
  View,
  Modal,
  TouchableOpacity,
  TouchableWithoutFeedback,
  ActivityIndicator,
} from 'react-native';
import { AppText } from '@/components/ui/text';
import { useTheme } from '@/theme/ThemeProvider';
import { createLogoutModalStyles } from '@/theme/createChatOverlayStyles';

interface RemoveMembersConfirmationModalProps {
  visible: boolean;
  memberCount: number;
  loading?: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

const RemoveMembersConfirmationModal = ({
  visible,
  memberCount,
  loading = false,
  onClose,
  onConfirm,
}: RemoveMembersConfirmationModalProps) => {
  const { colors } = useTheme();
  const styles = useMemo(() => createLogoutModalStyles(colors), [colors]);

  const memberLabel = memberCount === 1 ? 'member' : 'members';

  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      onRequestClose={loading ? undefined : onClose}
    >
      <TouchableWithoutFeedback onPress={loading ? undefined : onClose}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback>
            <View style={styles.modalContainer}>
              <AppText variant="bold" style={styles.title}>
                Remove members
              </AppText>
              <AppText style={styles.message}>
                Remove {memberCount} {memberLabel} from this channel? They will
                no longer have access to channel messages.
              </AppText>

              <View style={styles.buttonContainer}>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={onClose}
                  disabled={loading}
                >
                  <AppText style={styles.cancelText}>Cancel</AppText>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.logoutButton}
                  onPress={onConfirm}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator color={colors.white} size="small" />
                  ) : (
                    <AppText variant="bold" style={styles.logoutText}>
                      Remove
                    </AppText>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

export default RemoveMembersConfirmationModal;
