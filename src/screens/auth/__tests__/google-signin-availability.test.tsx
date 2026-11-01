import React from 'react';
import ReactTestRenderer, { act } from 'react-test-renderer';
import { Platform, Text } from 'react-native';
import * as googleAuth from '@/lib/google-auth';
import { ThemeProvider } from '@/theme/ThemeProvider';
import SigninScreen from '../signin';
import SignupScreen from '../signup';

jest.mock('@/lib/google-auth', () => ({
  __esModule: true,
  configureGoogleSignIn: jest.fn(),
  isGoogleSignInAvailable: false,
  signInWithGoogle: jest.fn(),
}));

jest.mock('@react-navigation/native', () => ({
  ...jest.requireActual('@react-navigation/native'),
  useNavigation: () => ({ navigate: jest.fn() }),
}));

jest.mock('@/store/useDataContext', () => ({
  useDataContext: () => ({ state: {}, dispatch: jest.fn() }),
}));

afterEach(() => jest.restoreAllMocks());

it.each([
  ['android', true],
  ['android', false],
  ['ios', true],
  ['ios', false],
] as const)(
  'only offers configured social authentication (%s, Google: %s)',
  async (platform, available) => {
    jest.replaceProperty(Platform, 'OS', platform);
    jest.replaceProperty(googleAuth, 'isGoogleSignInAvailable', available);
    for (const [Screen, label] of [
      [SigninScreen, 'Sign in with Google'],
      [SignupScreen, 'Sign up with Google'],
    ] as const) {
      let renderer!: ReactTestRenderer.ReactTestRenderer;
      await act(async () => {
        renderer = ReactTestRenderer.create(
          <ThemeProvider>
            <Screen />
          </ThemeProvider>,
        );
      });
      const labels = renderer.root
        .findAllByType(Text)
        .map(node => node.props.children);
      await act(async () => renderer.unmount());
      expect(labels.includes(label)).toBe(available);
      expect(labels.includes('OR')).toBe(available || platform === 'ios');
    }
  },
  30000,
);
