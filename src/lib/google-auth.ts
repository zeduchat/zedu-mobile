import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { GOOGLE_CLIENT_ID } from '@env';

// Without a web client ID, GoogleSignin.configure throws and takes the auth screen down with it.
export const isGoogleSignInAvailable = Boolean(GOOGLE_CLIENT_ID);

export const configureGoogleSignIn = () => {
  if (!isGoogleSignInAvailable) {
    console.warn(
      '[GoogleSignIn] GOOGLE_CLIENT_ID is not set; Google sign-in is disabled',
    );
    return;
  }

  GoogleSignin.configure({
    webClientId: GOOGLE_CLIENT_ID,
    offlineAccess: true,
    forceCodeForRefreshToken: true,
  });
};

export const signInWithGoogle = async () => {
  if (!isGoogleSignInAvailable) return null;

  try {
    await GoogleSignin.hasPlayServices();
    await GoogleSignin.signOut();

    const userInfo = await GoogleSignin.signIn();

    return userInfo.data;
  } catch (error) {
    console.error('Google Sign-In Error:', error);
    throw error;
  }
};
