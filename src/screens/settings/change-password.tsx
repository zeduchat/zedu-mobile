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

const ChangePasswordScreen = ({ navigation }: any) => {
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

  const handleSave = async () => {
    if (passwords.newPassword !== passwords.confirmPassword) {
      dispatch({ type: ACTIONS.ERROR, payload: 'Passwords do not match' });
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

  const isFormValid =
    passwords.oldPassword && passwords.newPassword && passwords.confirmPassword;

  return (
    <Container>
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
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            paddingHorizontal: 20,
            paddingBottom: 20,
            paddingTop: 20,
            flexGrow: 1,
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
            />

            <AppText style={styles.noteText}>
              Note: You would need to login again to effect this change.
            </AppText>
          </View>
        </ScrollView>

        <View style={styles.bottomActions}>
          <TouchableOpacity
            style={[
              styles.saveButtonCompact,
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
      </KeyboardAvoidingView>
    </Container>
  );
};

export default ChangePasswordScreen;
