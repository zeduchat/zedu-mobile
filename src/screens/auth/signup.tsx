import React, { useEffect, useState, useMemo } from 'react';
import {
  View,
  Image,
  TouchableOpacity,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { AppText } from '@/components/ui/text';
import { AppInput } from '@/components/ui/input';
import { AppButton } from '@/components/ui/button';
import { Dropdown } from 'react-native-element-dropdown';
import { COUNTRIES } from '@/data/countries';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { useNavigation } from '@react-navigation/native';
import { useDataContext } from '@/store/useDataContext';
import { ACTIONS } from '@/store/types';
import { validateSignup } from '@/utils/validation';
import Container from '@/components/layout/container';
import { PostRequest } from '@/utils/requests';
import { storeMultipleData } from '@/utils/helper';
import { configureGoogleSignIn, signInWithGoogle } from '@/lib/google-auth';
import { signInWithApple } from '@/lib/apple-auth';
import { useTheme } from '@/theme/ThemeProvider';
import { createAuthStyles } from '@/theme/createScreenStyles';
// import RNPickerSelect from 'react-native-picker-select';

const SignupScreen: React.FC = () => {
  const { colors } = useTheme();
  const styles = useMemo(() => createAuthStyles(colors), [colors]);
  const [accountType, _setAccountType] = useState<
    'Individual' | 'Organization'
  >('Individual');
  const [orgName, setOrgName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [country, setCountry] = useState<string | null>(null);
  const [isFocus, setIsFocus] = useState(false);
  const navigation = useNavigation();
  const [buttonLoading, setButtonLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [appleLoading, setAppleLoading] = useState(false);

  const handleAppleLogin = async () => {
    setAppleLoading(true);
    try {
      const appleData = await signInWithApple();
      const token = appleData?.identityToken;
      if (token) {
        const { data, error } = await PostRequest('/auth/apple', {
          id_token: token,
        });
        if (error) {
          setAppleLoading(false);
          return;
        }
        await storeMultipleData([
          ['user', data.data.user],
          ['token', data.data.access_token],
          ['current_org', data.data.user.current_org],
          ['organisation', data.data.user.organisation],
        ]);
        dispatch({ type: ACTIONS.USER, payload: data.data.user });
        dispatch({ type: ACTIONS.TOKEN, payload: data.data.access_token });
        dispatch({ type: ACTIONS.ORG_ID, payload: data.data.user.current_org });
        dispatch({
          type: ACTIONS.ORG_DATA,
          payload: data.data.user.organisation,
        });
        dispatch({ type: ACTIONS.SUCCESS, payload: data.message });
      }
    } catch (_e) {
      // Already logged in signInWithApple
    }
    setAppleLoading(false);
  };

  const { dispatch } = useDataContext();

  const countryData = COUNTRIES.map(country => ({
    label: country,
    value: country,
    color: colors.textPrimary,
  }));

  useEffect(() => {
    configureGoogleSignIn();
  }, []);

  const handleGoogleLogin = async () => {
    setGoogleLoading(true);

    const googleData = await signInWithGoogle();
    const token = googleData?.idToken;

    if (token) {
      // No try/catch needed!
      const { data, error } = await PostRequest('/auth/google', {
        grant_code: token,
      });

      if (error) {
        setGoogleLoading(false);
        return;
      }

      await storeMultipleData([
        ['user', data.data.user],
        ['token', data.data.access_token],
        ['current_org', data.data.user.current_org],
        ['organisation', data.data.user.organisation],
      ]);

      dispatch({ type: ACTIONS.USER, payload: data.data.user });
      dispatch({ type: ACTIONS.TOKEN, payload: data.data.access_token });
      dispatch({ type: ACTIONS.ORG_ID, payload: data.data.user.current_org });
      dispatch({
        type: ACTIONS.ORG_DATA,
        payload: data.data.user.organisation,
      });

      dispatch({ type: ACTIONS.SUCCESS, payload: data.message });
      setGoogleLoading(false);
    }

    setGoogleLoading(false);
  };

  const handleSubmit = async () => {
    const formData = {
      accountType,
      orgName,
      email,
      password,
      country,
    };

    const errorMessage = validateSignup(formData);

    if (errorMessage) {
      // Dispatch the error as requested
      return dispatch({
        type: ACTIONS.ERROR,
        payload: errorMessage,
      });
    }

    setButtonLoading(true);

    const { data, error } = await PostRequest(`/auth/register`, formData);
    if (error) {
      dispatch({ type: ACTIONS.ERROR, payload: error });
      setButtonLoading(false);
      return;
    }

    await storeMultipleData([
      ['user', data.data.user],
      ['token', data.data.access_token],
      ['current_org', data.data.user.current_org],
      ['organisation', data.data.user.organisation],
    ]);

    dispatch({ type: ACTIONS.USER, payload: data.data.user });
    dispatch({ type: ACTIONS.TOKEN, payload: data.data.access_token });
    dispatch({ type: ACTIONS.ORG_ID, payload: data.data.user.current_org });
    dispatch({ type: ACTIONS.ORG_DATA, payload: data.data.user.organisation });

    dispatch({ type: ACTIONS.SUCCESS, payload: data.message });
    setButtonLoading(false);
  };
  //

  return (
    <Container>
      <KeyboardAwareScrollView
        contentContainerStyle={styles.scrollContent}
        enableOnAndroid
        enableAutomaticScroll
        keyboardOpeningTime={0}
        extraScrollHeight={80}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Image
            source={require('@/assets/splash-logo.png')}
            style={styles.logo}
            resizeMode="contain"
          />
        </View>

        <AppText variant="bold" size={23} style={styles.title}>
          Create an Account
        </AppText>

        {/* <View style={styles.tabContainer}>
                    <TouchableOpacity
                        style={[styles.tab, accountType === 'Individual' && styles.activeTab]}
                        onPress={() => setAccountType('Individual')}
                    >
                        <AppText
                            variant="medium"
                            style={{ color: accountType === 'Individual' ? colors.primary : colors.textSecondary }}
                        >
                            Individual
                        </AppText>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.tab, accountType === 'Organization' && styles.activeTab]}
                        onPress={() => setAccountType('Organization')}
                    >
                        <AppText
                            variant="medium"
                            style={{ color: accountType === 'Organization' ? colors.primary : colors.textSecondary }}
                        >
                            Organization
                        </AppText>
                    </TouchableOpacity>
                </View> */}

        {accountType === 'Organization' ? (
          <View key="org-form">
            <AppInput
              label="Organization name"
              placeholder="Organization name"
              value={orgName}
              onChangeText={setOrgName}
            />

            <View style={styles.inputGap}>
              <AppText variant="medium" size={14} style={styles.labelColor}>
                Organization location (country or region)
              </AppText>

              <Dropdown
                style={[
                  styles.dropdown,
                  isFocus && { borderColor: colors.primary },
                ]}
                placeholderStyle={styles.placeholderStyle}
                selectedTextStyle={styles.selectedTextStyle}
                inputSearchStyle={styles.inputSearchStyle}
                containerStyle={styles.dropdownContainer}
                keyboardAvoiding={false}
                flatListProps={{
                  keyboardShouldPersistTaps: 'always',
                }}
                dropdownPosition="auto"
                data={countryData}
                search
                maxHeight={300}
                labelField="label"
                valueField="value"
                placeholder={'Please select...'}
                searchPlaceholder="Search country..."
                value={country}
                onFocus={() => setIsFocus(true)}
                onBlur={() => setIsFocus(false)}
                onChange={item => {
                  setCountry(item.value);
                  setIsFocus(false);
                }}
                renderRightIcon={() => (
                  <Image
                    source={require('@/assets/icons/chevron-dropdown.png')}
                    style={[
                      styles.chevron,
                      {
                        tintColor: isFocus
                          ? colors.primary
                          : colors.textSecondary,
                      },
                    ]}
                  />
                )}
              />
            </View>

            <AppInput
              label="Email Address"
              placeholder="Email"
              value={email}
              onChangeText={setEmail}
            />

            <AppInput
              label="Password"
              placeholder="Password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />
          </View>
        ) : (
          <View key="ind-form">
            <TouchableOpacity
              style={styles.socialBtn}
              onPress={handleGoogleLogin}
              disabled={googleLoading}
            >
              <Image
                source={require('@/assets/google-icon.png')}
                style={styles.socialIcon}
              />
              <AppText variant="medium" size={16}>
                Sign up with Google
              </AppText>
            </TouchableOpacity>
            {Platform.OS === 'ios' && (
              <TouchableOpacity
                style={styles.socialBtn}
                onPress={handleAppleLogin}
                disabled={appleLoading}
              >
                <Image
                  source={require('@/assets/icons/apple.png')}
                  style={styles.socialIcon}
                />
                <AppText variant="medium" size={16}>
                  Sign up with Apple
                </AppText>
                {appleLoading && <ActivityIndicator />}
              </TouchableOpacity>
            )}

            <View style={styles.dividerContainer}>
              <View style={styles.line} />
              <AppText size={14} style={styles.orText}>
                OR
              </AppText>
              <View style={styles.line} />
            </View>

            <AppInput
              label="Email Address"
              placeholder="Email"
              value={email}
              onChangeText={setEmail}
            />
            <AppInput
              label="Password"
              placeholder="Password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />
          </View>
        )}

        <AppButton
          title="Create Account"
          onPress={handleSubmit}
          style={styles.submitBtn}
          loading={buttonLoading}
          disabled={!email || !password || googleLoading}
        />

        <View style={styles.footer}>
          <AppText style={styles.footerText}>Already have an account? </AppText>
          <TouchableOpacity onPress={() => navigation.navigate('Signin')}>
            <AppText variant="medium" style={styles.linkText}>
              Log in
            </AppText>
          </TouchableOpacity>
        </View>
      </KeyboardAwareScrollView>
    </Container>
  );
};

export default SignupScreen;
