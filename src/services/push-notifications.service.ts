import { PermissionsAndroid, Platform } from 'react-native';
import {
  getInitialNotification,
  getMessaging,
  getToken,
  onMessage,
  onNotificationOpenedApp,
  onTokenRefresh,
  setBackgroundMessageHandler,
} from '@react-native-firebase/messaging';
import type { RemoteMessage } from '@react-native-firebase/messaging';
import { PostRequest, request } from '@/utils/requests';

// Firebase Cloud Messaging is used on Android only; iOS still receives pushes through OneSignal.
export const isFcmPlatform = Platform.OS === 'android';

const PUSH_DEVICES_URL = '/users/push-devices';

let registeredToken: string | null = null;

/**
 * Shapes an FCM message like the OneSignal notification objects the existing
 * call and chat handlers parse, so they work unchanged on both transports.
 */
export const toAppNotification = (
  message: RemoteMessage | null | undefined,
) => {
  if (!message) return null;

  return {
    title: message.notification?.title,
    body: message.notification?.body,
    additionalData: message.data || {},
  };
};

export const requestAndroidNotificationPermission = async () => {
  if (!isFcmPlatform) return false;

  if (Number(Platform.Version) < 33) return true;

  const result = await PermissionsAndroid.request(
    PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
  );
  return result === PermissionsAndroid.RESULTS.GRANTED;
};

const sendToken = async (token: string) => {
  const { error } = await PostRequest(PUSH_DEVICES_URL, {
    token,
    platform: 'android',
  });
  if (!error) {
    registeredToken = token;
  }
};

/** Registers this device's FCM token with the backend and keeps it current. Returns an unsubscribe. */
export const registerAndroidPushDevice = async (): Promise<() => void> => {
  if (!isFcmPlatform) return () => {};

  const messaging = getMessaging();

  try {
    await sendToken(await getToken(messaging));
  } catch (e) {
    console.warn('[FCM] failed to register push token', e);
  }

  return onTokenRefresh(messaging, token => {
    sendToken(token).catch(() => {});
  });
};

/** Stops pushes for the signed-out account. Call before the auth token is cleared. */
export const unregisterAndroidPushDevice = async () => {
  if (!isFcmPlatform || !registeredToken) return;

  await request({
    method: 'DELETE',
    url: PUSH_DEVICES_URL,
    data: { token: registeredToken },
  });
  registeredToken = null;
};

type AppNotification = NonNullable<ReturnType<typeof toAppNotification>>;

export interface PushListeners {
  onForeground: (notification: AppNotification) => void;
  onOpened: (notification: AppNotification) => void;
}

/** Subscribes to foreground messages and notification taps, including the tap that launched the app. */
export const subscribeToAndroidPush = ({
  onForeground,
  onOpened,
}: PushListeners): (() => void) => {
  if (!isFcmPlatform) return () => {};

  const messaging = getMessaging();

  const unsubscribeMessage = onMessage(messaging, message => {
    const notification = toAppNotification(message);
    if (notification) onForeground(notification);
  });

  const unsubscribeOpened = onNotificationOpenedApp(messaging, message => {
    const notification = toAppNotification(message);
    if (notification) onOpened(notification);
  });

  getInitialNotification(messaging)
    .then(message => {
      const notification = toAppNotification(message);
      if (notification) onOpened(notification);
    })
    .catch(() => {});

  return () => {
    unsubscribeMessage();
    unsubscribeOpened();
  };
};

/**
 * Must run at startup, outside React. Incoming calls and cancellations are handled natively by
 * ZeduFirebaseMessagingService; other data messages need no work while the app is in the background.
 */
export const registerBackgroundPushHandler = () => {
  if (!isFcmPlatform) return;

  setBackgroundMessageHandler(getMessaging(), async () => {});
};
