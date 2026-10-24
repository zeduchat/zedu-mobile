import { onTokenRefresh } from '@react-native-firebase/messaging';
import { PostRequest, request } from '@/utils/requests';

jest.mock('react-native', () => ({
  Platform: { OS: 'android', Version: 34 },
  PermissionsAndroid: {
    PERMISSIONS: {
      POST_NOTIFICATIONS: 'android.permission.POST_NOTIFICATIONS',
    },
    RESULTS: { GRANTED: 'granted' },
    request: jest.fn(() => Promise.resolve('granted')),
  },
}));

jest.mock('@/utils/requests', () => ({
  PostRequest: jest.fn(() => Promise.resolve({ data: {}, error: null })),
  request: jest.fn(() => Promise.resolve({ data: {}, error: null })),
}));

const {
  registerAndroidPushDevice,
  toAppNotification,
  unregisterAndroidPushDevice,
} = require('@/services/push-notifications.service');

describe('push-notifications.service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('shapes an FCM message like a OneSignal notification', () => {
    const notification = toAppNotification({
      notification: { title: '#general', body: '(Ada): hello' },
      data: { notification_type: 'channel', channel_id: 'chan-1' },
    });

    expect(notification).toEqual({
      title: '#general',
      body: '(Ada): hello',
      additionalData: { notification_type: 'channel', channel_id: 'chan-1' },
    });
    expect(toAppNotification(null)).toBeNull();
  });

  it('registers the FCM token as an android device and re-registers on refresh', async () => {
    await registerAndroidPushDevice();

    expect(PostRequest).toHaveBeenCalledWith('/users/push-devices', {
      token: 'test-fcm-token',
      platform: 'android',
    });

    const refresh = (onTokenRefresh as jest.Mock).mock.calls[0][1];
    refresh('refreshed-token');

    expect(PostRequest).toHaveBeenLastCalledWith('/users/push-devices', {
      token: 'refreshed-token',
      platform: 'android',
    });
  });

  it('unregisters the registered token on logout', async () => {
    await registerAndroidPushDevice();
    await unregisterAndroidPushDevice();

    expect(request).toHaveBeenCalledWith({
      method: 'DELETE',
      url: '/users/push-devices',
      data: { token: 'test-fcm-token' },
    });
  });
});
