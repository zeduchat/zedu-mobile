import React, { useState, useMemo } from 'react';
import { View, Image, Platform } from 'react-native';
import { AppText } from '@/components/ui/text';
import { AppInput } from '@/components/ui/input';
import { AppButton } from '@/components/ui/button';
import { useNavigation } from '@react-navigation/native';
import Container from '@/components/layout/container';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { PostRequest } from '@/utils/requests';
import { useDataContext } from '@/store/useDataContext';
import { ACTIONS } from '@/store/types';
import { useTheme } from '@/theme/ThemeProvider';
import { createAuthStyles } from '@/theme/createScreenStyles';

const ForgotPasswordEmailScreen: React.FC = () => {
  const { colors } = useTheme();
  const styles = useMemo(() => createAuthStyles(colors), [colors]);
  const navigation = useNavigation();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const { dispatch } = useDataContext();

  const handleSubmit = async () => {
    setLoading(true);

    const { data, error } = await PostRequest('/auth/password-reset', {
      email: email,
    });

    if (!error) {
      dispatch({
        type: ACTIONS.AUTH_FLOW,
        payload: { email: email, code: '' },
      });
      dispatch({ type: ACTIONS.SUCCESS, payload: data.message });
      navigation.navigate('ForgotPasswordCode');
    } else {
      dispatch({ type: ACTIONS.ERROR, payload: error || 'An error occurred' });
    }

    setLoading(false);
  };

  return (
    <Container>
      <KeyboardAwareScrollView
        contentContainerStyle={styles.scrollContent}
        enableOnAndroid={true}
        enableAutomaticScroll={true}
        extraScrollHeight={Platform.OS === 'ios' ? 50 : 100}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.logoContainer}>
          <Image
            source={require('@/assets/splash-logo.png')}
            style={styles.logoForgot}
            resizeMode="contain"
          />
        </View>

        <AppText variant="bold" size={23} style={styles.titleCompact}>
          Forgot password
        </AppText>
        <AppText size={18} style={styles.subtitle}>
          Enter the email you used in creating your account, we will send you
          instructions on how to reset your password.
        </AppText>

        <AppInput
          label="Email Address"
          placeholder="Email"
          value={email}
          onChangeText={setEmail}
          style={styles.input}
        />
        <AppButton
          title="Submit"
          onPress={handleSubmit}
          loading={loading}
          style={styles.submitBtn}
        />
        <AppButton
          title="Back to Login"
          onPress={() => navigation.goBack()}
          variant="secondary"
        />
      </KeyboardAwareScrollView>
    </Container>
  );
};

export default ForgotPasswordEmailScreen;
