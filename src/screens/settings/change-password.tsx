import React, { useState, useMemo } from 'react';
import {
  View,
  ScrollView,
  TouchableOpacity,
  Image,
  Platform,
  ActivityIndicator,
  KeyboardAvoidingView,
} from 'react-native';
import { AppText } from '@/components/ui/text';
import { AppInput } from '@/components/ui/input';
import Container from '@/components/layout/container';
import { useDataContext } from '@/store/useDataContext';
import { useTheme } from '@/theme/ThemeProvider';
import { createSettingsSubScreenStyles } from '@/theme/createScreenStyles';
import { PutRequest } from '@/utils/requests';
import { ACTIONS } from '@/store/types';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const ChangePasswordScreen = ({ navigation }: any) => {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const styles = useMemo(() => createSettingsSubScreenStyles(colors), [colors]);
  const { dispatch } = useDataContext();
  const [isSaving, setIsSaving] = useState(false);

  const [passwords, setPasswords] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const updateField = (field: keyof typeof passwords, value: string) => {
    setPasswords(prev => ({ ...prev, [field]: value }));
  };

  const hasConfirmed = passwords.confirmPassword.length > 0;
  const passwordsMatch =
    hasConfirmed && passwords.newPassword === passwords.confirmPassword;

  const isFormValid = Boolean(passwords.oldPassword) && passwordsMatch;

  const handleSave = async () => {
    if (!isFormValid) {
      return;
    }

    setIsSaving(true);
    try {
      const { error, data } = await PutRequest('/auth/change-password', {
        old_password: passwords.oldPassword,
        new_password: passwords.newPassword,
      });

      if (!error) {
        dispatch({ type: ACTIONS.SUCCESS, payload: data.message });
        navigation.goBack();
      } else {
        dispatch({ type: ACTIONS.ERROR, payload: error });
      }
    } catch (_err) {
      dispatch({
        type: ACTIONS.ERROR,
        payload: 'An unexpected error occurred',
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Container safeBottom>
      <View style={styles.stackHeaderCompact}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backBtnCompact}
        >
          <Image
            source={require('@/assets/icons/back.png')}
            style={styles.headerIcon}
          />
          <AppText variant="bold" style={styles.headerTitle}>
            Update password
          </AppText>
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            paddingHorizontal: 20,
            paddingTop: 20,
            paddingBottom: insets.bottom > 0 ? insets.bottom + 12 : 20,
            flexGrow: 1,
            justifyContent: 'space-between',
          }}
        >
          <View style={{ marginTop: 10 }}>
            <AppInput
              label="Old Password"
              value={passwords.oldPassword}
              onChangeText={val => updateField('oldPassword', val)}
              placeholder="********"
              secureTextEntry
            />

            <AppInput
              label="New Password"
              value={passwords.newPassword}
              onChangeText={val => updateField('newPassword', val)}
              placeholder="********"
              secureTextEntry
            />

            <AppInput
              label="Confirm Password"
              value={passwords.confirmPassword}
              onChangeText={val => updateField('confirmPassword', val)}
              placeholder="********"
              secureTextEntry
              error={
                hasConfirmed && !passwordsMatch
                  ? "Passwords don't match"
                  : undefined
              }
              style={passwordsMatch ? styles.passwordMatchInput : undefined}
            />

            {passwordsMatch && (
              <AppText size={12} style={styles.passwordMatchText}>
                ✓ Passwords match
              </AppText>
            )}

            <View style={styles.noteBox}>
              <Image
                source={require('@/assets/icons/info-circle.png')}
                style={styles.noteIcon}
              />
              <AppText style={[styles.noteText, styles.noteBoxText]}>
                Note: You would need to login again to effect this change.
              </AppText>
            </View>
          </View>

          <View style={{ marginTop: 28 }}>
            <TouchableOpacity
              style={[
                styles.saveButtonCompact,
                { width: '100%' },
                (!isFormValid || isSaving) && styles.disabledButton,
              ]}
              activeOpacity={0.8}
              onPress={handleSave}
              disabled={!isFormValid || isSaving}
            >
              {isSaving && (
                <ActivityIndicator
                  size="small"
                  color={colors.white}
                  style={{ marginRight: 8 }}
                />
              )}
              <AppText variant="bold" style={styles.saveButtonText}>
                Save Changes
              </AppText>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Container>
  );
};

export default ChangePasswordScreen;
