import { appleAuth } from '@invertase/react-native-apple-authentication';

export const signInWithApple = async () => {
  try {
    const appleAuthRequestResponse = await appleAuth.performRequest({
      requestedOperation: appleAuth.Operation.LOGIN,
      requestedScopes: [appleAuth.Scope.EMAIL, appleAuth.Scope.FULL_NAME],
    });

    // You may want to send appleAuthRequestResponse.identityToken to your backend for verification
    return appleAuthRequestResponse;
  } catch (error) {
    console.error('Apple Sign-In Error:', error);
    throw error;
  }
};

/** True when the user closed the Apple sheet, which should stay silent. */
export const isAppleSignInCancel = (error: unknown) =>
  (error as { code?: string } | null)?.code === appleAuth.Error.CANCELED;
