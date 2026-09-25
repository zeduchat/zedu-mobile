import React, { useMemo, useState } from 'react';
import {
  View,
  Modal,
  TouchableOpacity,
  TouchableWithoutFeedback,
  ActivityIndicator,
} from 'react-native';
import { AppText } from '@/components/ui/text';
import { clearAllData } from '@/utils/helper';
import { useDataContext } from '@/store/useDataContext';
import { ACTIONS } from '@/store/types';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '@/theme/ThemeProvider';
import { createLogoutModalStyles } from '@/theme/createChatOverlayStyles';

interface LogoutModalProps {
  visible: boolean;
  onClose: () => void;
}

const LogoutConfirmationModal = ({ visible, onClose }: LogoutModalProps) => {
  const { colors } = useTheme();
  const styles = useMemo(() => createLogoutModalStyles(colors), [colors]);
  const { dispatch } = useDataContext();
  const _navigation = useNavigation();
  const [loading, setLoading] = useState(false);

  const logout = async () => {
    try {
      setLoading(true);
      await clearAllData();

      dispatch({ type: ACTIONS.TOKEN, payload: null });
      dispatch({ type: ACTIONS.USER, payload: null });
      dispatch({ type: ACTIONS.ORG_DATA, payload: null });
      dispatch({ type: ACTIONS.DMS, payload: [] });
      dispatch({ type: ACTIONS.DMS_CHAT, payload: { data: [], page: 1 } });
    } catch (e) {
      console.error('Logout error', e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback>
            <View style={styles.modalContainer}>
              <AppText variant="bold" style={styles.title}>
                Log Out
              </AppText>
              <AppText style={styles.message}>
                Are you sure you want to log out? You will need to sign in again
                to access your account.
              </AppText>

              <View style={styles.buttonContainer}>
                <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
                  <AppText style={styles.cancelText}>Cancel</AppText>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.logoutButton}
                  onPress={logout}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator color={colors.white} size="small" />
                  ) : (
                    <AppText variant="bold" style={styles.logoutText}>
                      Log Out
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

export default LogoutConfirmationModal;
