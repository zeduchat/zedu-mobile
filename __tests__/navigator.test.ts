/**
 * @format
 */

import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import { OneSignal } from 'react-native-onesignal';
import { requestAppPermissions } from '@/lib/permissions';
import * as pushNotifications from '@/services/push-notifications.service';
import App from '../App';

// The launch flow awaits the camera/audio permissions before asking for notifications. Mock them so
// the test doesn't depend on native permission stubs.
jest.mock('@/lib/permissions', () => ({
  requestAppPermissions: jest.fn(),
}));

jest.mock('@/utils/helper', () => ({
  ...jest.requireActual('@/utils/helper'),
  retrieveMultipleData: jest.fn().mockResolvedValue([]),
}));

const mockRequestAppPermissions = requestAppPermissions as jest.MockedFunction<
  typeof requestAppPermissions
>;

// Rendering the whole app in a cold worker can pass Jest's default 5s.
jest.setTimeout(30000);

describe('notification permission at launch', () => {
  const requestNotifications = jest.spyOn(
    OneSignal.Notifications,
    'requestPermission',
  );
  const requestAndroidNotifications = jest
    .spyOn(pushNotifications, 'requestAndroidNotificationPermission')
    .mockResolvedValue(true);

  beforeEach(() => {
    jest.clearAllMocks();
    requestNotifications.mockResolvedValue(true);
    mockRequestAppPermissions.mockResolvedValue(true);
  });

  afterAll(() => {
    jest.restoreAllMocks();
  });

  it.each([true, false])(
    'waits for camera/audio and requests notifications once (FCM: %s)',
    async isFcmPlatform => {
      jest.replaceProperty(pushNotifications, 'isFcmPlatform', isFcmPlatform);
      let finishMediaPermissions!: (granted: boolean) => void;
      mockRequestAppPermissions.mockReturnValue(
        new Promise(resolve => {
          finishMediaPermissions = resolve;
        }),
      );
      let renderer: ReactTestRenderer.ReactTestRenderer | undefined;
      await ReactTestRenderer.act(() => {
        renderer = ReactTestRenderer.create(React.createElement(App));
      });

      // Let the launch flow finish its awaited permission requests before counting.
      await ReactTestRenderer.act(async () => {
        await new Promise<void>(resolve => setImmediate(resolve));
      });

      expect(mockRequestAppPermissions).toHaveBeenCalledTimes(1);
      expect(requestNotifications).not.toHaveBeenCalled();
      expect(requestAndroidNotifications).not.toHaveBeenCalled();

      await ReactTestRenderer.act(async () => {
        finishMediaPermissions(true);
      });

      const requests = isFcmPlatform
        ? requestAndroidNotifications.mock.calls.length
        : requestNotifications.mock.calls.length;
      const otherRequests = isFcmPlatform
        ? requestNotifications.mock.calls.length
        : requestAndroidNotifications.mock.calls.length;

      // Unmount before asserting, so a failing assertion can't leave navigation animations running after
      // Jest tears the environment down.
      await ReactTestRenderer.act(() => {
        renderer?.unmount();
      });

      expect(requests).toBe(1);
      expect(otherRequests).toBe(0);
    },
  );
});
