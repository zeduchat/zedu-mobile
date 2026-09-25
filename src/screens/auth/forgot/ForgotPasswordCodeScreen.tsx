import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  View,
  Image,
  TextInput,
  NativeSyntheticEvent,
  TextInputKeyPressEventData,
  Platform,
  Keyboard,
  TouchableOpacity,
} from 'react-native';
import { AppText } from '@/components/ui/text';
import { AppButton } from '@/components/ui/button';
import { useNavigation } from '@react-navigation/native';
import { normalize } from '@/utils/normalize';
import { useTheme } from '@/theme/ThemeProvider';
import { createAuthStyles } from '@/theme/createScreenStyles';
import Container from '@/components/layout/container';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { useDataContext } from '@/store/useDataContext';
import { ACTIONS } from '@/store/types';
import { PostRequest } from '@/utils/requests';

const CODE_LENGTH = 6;
const RESEND_TIMER = 30;

const ForgotPasswordCodeScreen: React.FC = () => {
  const { colors } = useTheme();
  const styles = useMemo(() => createAuthStyles(colors), [colors]);
  const navigation = useNavigation<any>();
  const [code, setCode] = useState<string[]>(Array(CODE_LENGTH).fill(''));
  const [focusedIndex, setFocusedIndex] = useState<number>(0);
  const inputRefs = useRef<(TextInput | null)[]>([]);
  const [loading, setLoading] = useState(false);
  const [timer, setTimer] = useState(RESEND_TIMER);
  const [canResend, setCanResend] = useState(false);
  const { state, dispatch } = useDataContext();
  const email = state?.authFlow?.email || '';

  const maskEmail = (userEmail: string) => {
    if (!userEmail) return '';
    const [name, domain] = userEmail.split('@');
    if (name.length <= 2) return `${name}***@${domain}`;
    return `${name.substring(0, 2)}***@${domain}`;
  };

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (timer > 0) {
      interval = setInterval(() => {
        setTimer(prev => prev - 1);
      }, 1000);
    } else {
      setCanResend(true);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [timer]);

  useEffect(() => {
    const fullCode = code.join('');
    if (fullCode.length === CODE_LENGTH) {
      Keyboard.dismiss();
      handleConfirm();
    }
  }, [code]);

  const handleCodeChange = (value: string, idx: number) => {
    const cleanValue = value.replace(/[^0-9]/g, '');
    if (!cleanValue) {
      const newCode = [...code];
      newCode[idx] = '';
      setCode(newCode);
      return;
    }

    const newCode = [...code];
    if (cleanValue.length > 1) {
      const pastedCode = cleanValue.slice(0, CODE_LENGTH).split('');
      for (let i = 0; i < pastedCode.length; i++) {
        if (idx + i < CODE_LENGTH) {
          newCode[idx + i] = pastedCode[i];
        }
      }
      setCode(newCode);
      const nextIdx = Math.min(idx + pastedCode.length, CODE_LENGTH - 1);
      inputRefs.current[nextIdx]?.focus();
    } else {
      newCode[idx] = cleanValue.slice(-1);
      setCode(newCode);
      if (idx < CODE_LENGTH - 1) {
        inputRefs.current[idx + 1]?.focus();
      }
    }
  };

  const handleKeyPress = (
    e: NativeSyntheticEvent<TextInputKeyPressEventData>,
    idx: number,
  ) => {
    if (e.nativeEvent.key === 'Backspace') {
      if (code[idx] === '' && idx > 0) {
        const newCode = [...code];
        newCode[idx - 1] = '';
        setCode(newCode);
        inputRefs.current[idx - 1]?.focus();
      }
    }
  };

  const handleResend = async () => {
    if (!canResend) return;
    setTimer(RESEND_TIMER);
    setCanResend(false);
    setCode(Array(CODE_LENGTH).fill(''));
    inputRefs.current[0]?.focus();

    const { data, error } = await PostRequest('/auth/email-request', {
      email: email,
    });
    if (!error) {
      dispatch({
        type: ACTIONS.SUCCESS,
        payload: data.message || 'Verification code resent',
      });
    } else {
      dispatch({
        type: ACTIONS.ERROR,
        payload: error || 'An error occurred while resending code',
      });
    }
  };

  const handleConfirm = () => {
    if (code.join('').length < CODE_LENGTH || loading) return;
    setLoading(true);
    setTimeout(() => {
      dispatch({
        type: ACTIONS.AUTH_FLOW,
        payload: { email: email, code: code.join('') },
      });
      setLoading(false);
      navigation.navigate('ForgotPasswordReset');
    }, 1500);
  };

  const isCodeIncomplete = code.join('').length < CODE_LENGTH;

  return (
    <Container>
      <KeyboardAwareScrollView
        contentContainerStyle={styles.scrollContent}
        enableOnAndroid={true}
        extraScrollHeight={Platform.OS === 'ios' ? 50 : 120}
        keyboardShouldPersistTaps="always"
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
          Reset password
        </AppText>
        <AppText size={16} style={styles.subtitleCode}>
          We've sent a 6-digit code to your email{`\n`}
          <AppText variant="bold" style={{ color: colors.textPrimary }}>
            {maskEmail(email)}
          </AppText>
        </AppText>

        <View style={styles.codeRow}>
          {code.map((digit, idx) => (
            <View
              key={idx}
              style={[
                styles.codeBox,
                focusedIndex === idx && styles.codeBoxFocused,
                digit !== '' && styles.codeBoxFilled,
              ]}
            >
              <TextInput
                ref={ref => {
                  inputRefs.current[idx] = ref;
                }}
                value={digit}
                onChangeText={val => handleCodeChange(val, idx)}
                keyboardType={Platform.OS === 'ios' ? 'number-pad' : 'numeric'}
                maxLength={idx === 0 ? CODE_LENGTH : 1}
                style={styles.codeInput}
                onKeyPress={e => handleKeyPress(e, idx)}
                onFocus={() => setFocusedIndex(idx)}
                onBlur={() => setFocusedIndex(-1)}
                selectionColor={colors.primary}
                textContentType="oneTimeCode"
                autoComplete="sms-otp"
                blurOnSubmit={false}
                caretHidden={true}
                underlineColorAndroid="transparent"
              />
            </View>
          ))}
        </View>

        <AppButton
          title="Confirm code"
          onPress={handleConfirm}
          loading={loading}
          style={isCodeIncomplete ? styles.disabledBtn : {}}
        />

        <AppButton
          title="Back to Login"
          onPress={() => navigation.navigate('Signin')}
          variant="secondary"
          style={{ marginTop: normalize(16) }}
        />

        <TouchableOpacity
          onPress={handleResend}
          disabled={!canResend}
          style={styles.resendContainer}
        >
          {canResend ? (
            <AppText style={styles.resendActive}>Resend Code</AppText>
          ) : (
            <AppText style={styles.resendText}>
              Resend Code after{' '}
              <AppText style={styles.resendTime}>{timer}s</AppText>
            </AppText>
          )}
        </TouchableOpacity>
      </KeyboardAwareScrollView>
    </Container>
  );
};

export default ForgotPasswordCodeScreen;
