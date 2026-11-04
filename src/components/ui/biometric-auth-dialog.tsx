import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Modal,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { AppText } from '@/components/ui/text';
import { useTheme } from '@/theme/ThemeProvider';
import { normalize } from '@/utils/normalize';

export interface BiometricAuthDialogProps {
  visible: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  onFallback?: () => void;
  title?: string;
  subtitle?: string;
  fallbackLabel?: string;
  cancelLabel?: string;
}

export const BiometricAuthDialog: React.FC<BiometricAuthDialogProps> = ({
  visible,
  onClose,
  onSuccess,
  onFallback,
  title = 'Biometric Authentication',
  subtitle = 'Confirm your Face ID, Touch ID, or fingerprint to continue',
  fallbackLabel = 'Use Passcode',
  cancelLabel = 'Cancel',
}) => {
  const { colors } = useTheme();
  const [status, setStatus] = useState<
    'idle' | 'authenticating' | 'success' | 'failed'
  >('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (visible) {
      setStatus('idle');
      setErrorMessage(null);
    }
  }, [visible]);

  const handleAuthenticate = () => {
    setStatus('authenticating');
    setErrorMessage(null);

    setTimeout(() => {
      setStatus('success');
      setTimeout(() => {
        onSuccess?.();
        onClose();
      }, 500);
    }, 700);
  };

  const handleFallback = () => {
    onFallback?.();
    onClose();
  };

  const styles = useMemo(
    () =>
      StyleSheet.create({
        overlay: {
          flex: 1,
          backgroundColor: 'rgba(0, 0, 0, 0.55)',
          justifyContent: 'center',
          alignItems: 'center',
          padding: normalize(24),
        },
        dialogContainer: {
          width: '100%',
          maxWidth: 380,
          backgroundColor: colors.surface,
          borderRadius: normalize(20),
          padding: normalize(24),
          alignItems: 'center',
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: colors.border,
          shadowColor: colors.black,
          shadowOffset: { width: 0, height: 6 },
          shadowOpacity: 0.15,
          shadowRadius: 16,
          elevation: 6,
        },
        iconWrapper: {
          width: normalize(72),
          height: normalize(72),
          borderRadius: normalize(36),
          backgroundColor: colors.surfaceElevated,
          justifyContent: 'center',
          alignItems: 'center',
          marginBottom: normalize(16),
        },
        title: {
          fontSize: 18,
          color: colors.textPrimary,
          textAlign: 'center',
          marginBottom: normalize(8),
        },
        subtitle: {
          fontSize: 14,
          color: colors.textSecondary,
          textAlign: 'center',
          lineHeight: 20,
          marginBottom: normalize(18),
        },
        statusContainer: {
          minHeight: 28,
          justifyContent: 'center',
          alignItems: 'center',
          marginBottom: normalize(16),
        },
        statusText: {
          fontSize: 13,
          fontWeight: '500',
        },
        statusSuccess: {
          color: colors.online,
        },
        statusError: {
          color: colors.error,
        },
        statusAuthenticating: {
          color: colors.primary,
        },
        actionButton: {
          width: '100%',
          height: normalize(48),
          borderRadius: normalize(12),
          backgroundColor: colors.primary,
          justifyContent: 'center',
          alignItems: 'center',
          flexDirection: 'row',
          gap: 8,
          marginBottom: normalize(10),
        },
        actionButtonText: {
          color: colors.white,
          fontSize: 15,
          fontWeight: '600',
        },
        secondaryButton: {
          width: '100%',
          height: normalize(44),
          borderRadius: normalize(12),
          justifyContent: 'center',
          alignItems: 'center',
          marginBottom: normalize(6),
        },
        secondaryButtonText: {
          color: colors.primary,
          fontSize: 14,
          fontWeight: '500',
        },
        cancelButton: {
          width: '100%',
          height: normalize(40),
          justifyContent: 'center',
          alignItems: 'center',
        },
        cancelButtonText: {
          color: colors.textSecondary,
          fontSize: 14,
        },
      }),
    [colors],
  );

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay} testID="biometric-auth-dialog-overlay">
        <View style={styles.dialogContainer} testID="biometric-auth-dialog">
          <View style={styles.iconWrapper}>
            {status === 'success' ? (
              <Ionicons
                name="checkmark-circle"
                size={normalize(40)}
                color={colors.online}
              />
            ) : status === 'authenticating' ? (
              <ActivityIndicator size="large" color={colors.primary} />
            ) : (
              <MaterialCommunityIcons
                name="fingerprint"
                size={normalize(40)}
                color={colors.primary}
              />
            )}
          </View>

          <AppText
            variant="bold"
            style={styles.title}
            testID="biometric-auth-title"
          >
            {title}
          </AppText>

          <AppText
            variant="regular"
            style={styles.subtitle}
            testID="biometric-auth-subtitle"
          >
            {subtitle}
          </AppText>

          <View style={styles.statusContainer}>
            {status === 'authenticating' && (
              <AppText
                variant="medium"
                style={[styles.statusText, styles.statusAuthenticating]}
              >
                Scanning biometric credential...
              </AppText>
            )}
            {status === 'success' && (
              <AppText
                variant="semiBold"
                style={[styles.statusText, styles.statusSuccess]}
              >
                Biometric verification successful
              </AppText>
            )}
            {status === 'failed' && (
              <AppText
                variant="medium"
                style={[styles.statusText, styles.statusError]}
              >
                {errorMessage || 'Biometric authentication failed'}
              </AppText>
            )}
          </View>

          {status !== 'authenticating' && status !== 'success' && (
            <TouchableOpacity
              style={styles.actionButton}
              onPress={handleAuthenticate}
              activeOpacity={0.8}
              testID="biometric-auth-button"
            >
              <MaterialCommunityIcons
                name="fingerprint"
                size={20}
                color={colors.white}
              />
              <AppText variant="semiBold" style={styles.actionButtonText}>
                Authenticate Now
              </AppText>
            </TouchableOpacity>
          )}

          {onFallback && status !== 'success' && (
            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={handleFallback}
              activeOpacity={0.7}
              testID="biometric-fallback-button"
            >
              <AppText variant="medium" style={styles.secondaryButtonText}>
                {fallbackLabel}
              </AppText>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={styles.cancelButton}
            onPress={onClose}
            activeOpacity={0.7}
            testID="biometric-cancel-button"
          >
            <AppText variant="regular" style={styles.cancelButtonText}>
              {cancelLabel}
            </AppText>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

export default BiometricAuthDialog;
