import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  NativeEventEmitter,
  NativeModules,
  PermissionsAndroid,
  Platform,
} from 'react-native';
import { PostRequest, request } from '@/utils/requests';

const TOKEN_KEY = 'fcm_token';
const nativeModule =
  Platform.OS === 'ios'
    ? NativeModules.FirebasePushIOS
    : NativeModules.FirebasePushAndroid;
const platformName = Platform.OS === 'ios' ? 'ios' : 'android';

export type AndroidPushData = Record<string, string>;

export type AndroidPushNotification = {
  title: string;
  body: string;
  additionalData: AndroidPushData;
};

type PushHandlers = {
  onOpened: (notification: AndroidPushNotification) => void;
  onForeground: (notification: AndroidPushNotification) => void;
};

const toNotification = (data: AndroidPushData): AndroidPushNotification => ({
  title: data.title || 'Zedu',
  body: data.body || data.content || '',
  additionalData: data,
});

const syncToken = async (nextToken: string) => {
  const previous = await AsyncStorage.getItem(TOKEN_KEY);
  if (previous && previous !== nextToken) {
    await request({
      method: 'DELETE',
      url: '/fcmtoken',
      data: { fcm_token: previous },
    });
  }

  await AsyncStorage.setItem(TOKEN_KEY, nextToken);
  return PostRequest('/fcmtoken', {
    fcm_token: nextToken,
    platform: platformName,
  });
};

export const requestAndroidNotificationPermission = async () => {
  if (Platform.OS === 'ios') {
    if (!nativeModule?.requestPermission) {
      return false;
    }
    const granted = await nativeModule.requestPermission();
    return granted !== false;
  }

  if (Platform.OS !== 'android' || Number(Platform.Version) < 33) {
    return true;
  }

  const result = await PermissionsAndroid.request(
    PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
  );
  return result === PermissionsAndroid.RESULTS.GRANTED;
};

export const registerAndroidPushToken = async () => {
  if ((Platform.OS !== 'android' && Platform.OS !== 'ios') || !nativeModule) {
    console.log('[FCM] push module unavailable on', Platform.OS);
    return null;
  }

  try {
    await requestAndroidNotificationPermission();
    const token = await nativeModule.getToken();
    if (!token) {
      console.log(
        '[FCM] no device token (permission denied or APNs token not ready)',
      );
      return null;
    }

    console.log('[FCM] device token:', token);
    return syncToken(token);
  } catch (error) {
    console.log('[FCM] failed to read device token', error);
    throw error;
  }
};

export const unregisterAndroidPushToken = async () => {
  if (Platform.OS !== 'android' && Platform.OS !== 'ios') {
    return;
  }

  const token = await AsyncStorage.getItem(TOKEN_KEY);
  if (token) {
    await request({
      method: 'DELETE',
      url: '/fcmtoken',
      data: { fcm_token: token },
    });
  }

  if (nativeModule) {
    try {
      await nativeModule.deleteToken();
    } catch {
      // The server copy is already removed. A later launch can mint a new token.
    }
  }

  await AsyncStorage.removeItem(TOKEN_KEY);
};

export const subscribeAndroidPush = (handlers: PushHandlers) => {
  if ((Platform.OS !== 'android' && Platform.OS !== 'ios') || !nativeModule) {
    return () => {};
  }

  const emitter = new NativeEventEmitter(nativeModule);

  const messageSub = emitter.addListener(
    'FirebasePushMessage',
    (data: AndroidPushData) => {
      handlers.onForeground(toNotification(data || {}));
    },
  );
  const openedSub = emitter.addListener(
    'FirebasePushOpened',
    (data: AndroidPushData) => {
      handlers.onOpened(toNotification(data || {}));
    },
  );
  const tokenSub = emitter.addListener(
    'FirebasePushToken',
    (payload: { token?: string }) => {
      if (payload?.token) {
        console.log('[FCM] device token:', payload.token);
        syncToken(payload.token).catch(error => {
          console.log('[FCM] failed to sync device token', error);
        });
      }
    },
  );

  nativeModule
    .getInitialNotification()
    .then((data: AndroidPushData | null) => {
      if (data) {
        handlers.onOpened(toNotification(data));
      }
    })
    .catch(() => {});

  return () => {
    messageSub.remove();
    openedSub.remove();
    tokenSub.remove();
  };
};
