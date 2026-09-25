import React, { useEffect, useMemo, useState } from 'react';
import { View, Image, StatusBar, Alert, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppText } from '../components/ui/text';
import { AppButton } from '../components/ui/button';
import { normalize } from '../utils/normalize';
import { useTheme } from '@/theme/ThemeProvider';
import { createWelcomeScreenStyles } from '@/theme/createBuzzStyles';
import { useNavigation } from '@react-navigation/native';
import { OneSignal } from 'react-native-onesignal';
import { requestAppPermissions } from '@/lib/permissions';
import { CLIENT_URL } from '@env';

const clientBaseUrl = (CLIENT_URL || 'https://zedu.chat').replace(/\/$/, '');

const WelcomeScreen: React.FC = () => {
  const { colors } = useTheme();
  const styles = useMemo(() => createWelcomeScreenStyles(colors), [colors]);
  const navigation = useNavigation();
  const [permissionsGranted, setPermissionsGranted] = useState(false);
  const [_loading, setLoading] = useState(false);

  useEffect(() => {
    if (!permissionsGranted) {
      handleAcceptPermissions();
    }
  }, [permissionsGranted]);

  const handleAcceptPermissions = async () => {
    setLoading(true);
    try {
      // Request camera + audio permissions immediately on welcome screen
      const granted = await requestAppPermissions();
      // Request notification permission
      await OneSignal.Notifications.requestPermission(true);
      if (granted) {
        setPermissionsGranted(true);
      } else {
        setPermissionsGranted(false);
        Alert.alert(
          'Permissions Required',
          'Please grant camera and microphone permissions to proceed.',
        );
      }
    } catch (_e) {
      setPermissionsGranted(false);
      Alert.alert('Error', 'An error occurred while requesting permissions.');
    } finally {
      setLoading(false);
    }
  };

  const openURL = async (url: string) => {
    const supported = await Linking.canOpenURL(url);
    if (supported) {
      await Linking.openURL(url);
    } else {
      Alert.alert('Error', `Don't know how to open this URL: ${url}`);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <StatusBar
        barStyle={colors.statusBarStyle}
        backgroundColor={colors.statusBarBackground}
      />

      <View style={styles.topSection}>
        <View style={styles.logoContainer}>
          <Image
            source={require('../assets/splash-logo.png')}
            style={styles.logo}
            resizeMode="contain"
          />
        </View>
        <AppText variant="regular" style={styles.slogan}>
          Seamless video calls and meetings for every learning community.
        </AppText>
      </View>

      <View style={styles.middleSection}>
        <AppText variant="bold" style={styles.welcomeTitle}>
          Welcome to Zedu
        </AppText>

        <AppText size={13} style={styles.legalText}>
          By proceeding, you consent to our{'\n'}
          <AppText
            size={13}
            style={styles.linkText}
            onPress={() => openURL(`${clientBaseUrl}/policy`)}
          >
            Privacy Policy
          </AppText>{' '}
          and our{' '}
          <AppText
            size={13}
            style={styles.linkText}
            onPress={() => openURL(`${clientBaseUrl}/terms-of-service`)}
          >
            Terms of Service
          </AppText>
        </AppText>
      </View>

      <View style={styles.bottomSection}>
        <AppButton
          title="Create Account"
          onPress={() => navigation.navigate('Signup')}
          style={{ marginBottom: normalize(14) }}
        />
        <AppButton
          title="Login"
          variant="secondary"
          onPress={() => navigation.navigate('Signin')}
        />
      </View>
    </SafeAreaView>
  );
};

export default WelcomeScreen;
