/**
 * @format
 */

import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import { Text } from 'react-native';
import WelcomeScreen from './welcomescreen';
import { ThemeProvider } from '../theme/ThemeProvider';

jest.mock('@react-navigation/native', () => ({
  ...jest.requireActual('@react-navigation/native'),
  useNavigation: () => ({ navigate: jest.fn() }),
}));

jest.mock('../lib/permissions', () => ({
  requestAppPermissions: jest.fn().mockResolvedValue(true),
}));

test('shows the learning community tagline', async () => {
  let renderer: ReactTestRenderer.ReactTestRenderer | undefined;
  await ReactTestRenderer.act(() => {
    renderer = ReactTestRenderer.create(
      <ThemeProvider>
        <WelcomeScreen />
      </ThemeProvider>,
    );
  });

  const texts = renderer!.root
    .findAllByType(Text)
    .map(node => node.props.children);
  expect(texts).toContain('Built for bootcamps and learning communities');
  expect(texts).not.toContain(
    'Seamless video calls and meetings for every learning community.',
  );

  await ReactTestRenderer.act(() => {
    renderer?.unmount();
  });
}, 30000);
