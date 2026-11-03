import { Platform } from 'react-native';
import { SUPPORT_EMAIL, buildReportProblemUrl } from '@/utils/report-problem';

describe('buildReportProblemUrl', () => {
  it('addresses the support email', () => {
    expect(buildReportProblemUrl().startsWith(`mailto:${SUPPORT_EMAIL}?`)).toBe(
      true,
    );
  });

  it('fills in the app version and platform', () => {
    const url = decodeURIComponent(buildReportProblemUrl());

    expect(url).toContain('App version: ');
    expect(url).toContain(`Platform: ${Platform.OS} `);
  });

  it('adds the phone model on Android', () => {
    const os = Object.getOwnPropertyDescriptor(Platform, 'OS');
    const constants = Object.getOwnPropertyDescriptor(Platform, 'constants');
    Object.defineProperty(Platform, 'OS', {
      get: () => 'android',
      configurable: true,
    });
    Object.defineProperty(Platform, 'constants', {
      get: () => ({ Brand: 'google', Model: 'Pixel 7' }),
      configurable: true,
    });

    try {
      expect(decodeURIComponent(buildReportProblemUrl())).toContain(
        'Phone model: google Pixel 7',
      );
    } finally {
      if (os) Object.defineProperty(Platform, 'OS', os);
      if (constants) Object.defineProperty(Platform, 'constants', constants);
    }
  });

  it('leaves the phone model out where it is not available', () => {
    expect(decodeURIComponent(buildReportProblemUrl())).not.toContain(
      'Phone model:',
    );
  });

  it('leaves room for the person to describe the problem', () => {
    expect(decodeURIComponent(buildReportProblemUrl())).toContain(
      'What went wrong?',
    );
  });
});

describe('openReportProblem', () => {
  it('shows the support address when no mail app can open the link', async () => {
    const { Alert, Linking } = require('react-native');
    jest.spyOn(Linking, 'openURL').mockRejectedValueOnce(new Error('no app'));
    const alert = jest.spyOn(Alert, 'alert').mockImplementation(() => {});

    await require('@/utils/report-problem').openReportProblem();

    expect(alert).toHaveBeenCalledWith(
      'No mail app found',
      expect.stringContaining(SUPPORT_EMAIL),
    );
  });
});
