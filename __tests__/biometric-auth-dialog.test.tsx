import React from 'react';
import renderer, { act } from 'react-test-renderer';
import { BiometricAuthDialog } from '@/components/ui/biometric-auth-dialog';

jest.mock('@/theme/ThemeProvider', () => ({
  useTheme: () => ({
    colors: {
      surface: '#ffffff',
      surfaceElevated: '#f5f5f5',
      primary: '#007aff',
      online: '#34c759',
      error: '#ff3b30',
      border: '#e5e5e5',
      black: '#000000',
      white: '#ffffff',
      textPrimary: '#111111',
      textSecondary: '#666666',
    },
  }),
}));

jest.mock('@/utils/normalize', () => ({
  normalize: (size: number) => size,
}));

jest.mock('@/components/ui/text', () => {
  const { Text } = require('react-native');
  return { AppText: Text };
});

jest.mock(
  'react-native-vector-icons/MaterialCommunityIcons',
  () => 'MaterialCommunityIcons',
);
jest.mock('react-native-vector-icons/Ionicons', () => 'Ionicons');

describe('BiometricAuthDialog', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('renders correctly when visible', () => {
    let tree: renderer.ReactTestRenderer | undefined;
    act(() => {
      tree = renderer.create(
        <BiometricAuthDialog
          visible={true}
          onClose={jest.fn()}
          title="Biometric Test"
          subtitle="Test Subtitle"
        />,
      );
    });

    const root = tree!.root;
    const title = root.findByProps({ testID: 'biometric-auth-title' });
    const subtitle = root.findByProps({ testID: 'biometric-auth-subtitle' });
    const authButton = root.findByProps({ testID: 'biometric-auth-button' });
    const cancelButton = root.findByProps({
      testID: 'biometric-cancel-button',
    });

    expect(title.props.children).toBe('Biometric Test');
    expect(subtitle.props.children).toBe('Test Subtitle');
    expect(authButton).toBeDefined();
    expect(cancelButton).toBeDefined();
  });

  it('calls onClose when Cancel button is pressed', () => {
    const handleClose = jest.fn();
    let tree: renderer.ReactTestRenderer | undefined;
    act(() => {
      tree = renderer.create(
        <BiometricAuthDialog visible={true} onClose={handleClose} />,
      );
    });

    const cancelButton = tree!.root.findByProps({
      testID: 'biometric-cancel-button',
    });
    act(() => {
      cancelButton.props.onPress();
    });

    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  it('renders fallback button when onFallback is supplied', () => {
    const handleFallback = jest.fn();
    const handleClose = jest.fn();
    let tree: renderer.ReactTestRenderer | undefined;
    act(() => {
      tree = renderer.create(
        <BiometricAuthDialog
          visible={true}
          onClose={handleClose}
          onFallback={handleFallback}
          fallbackLabel="Enter PIN"
        />,
      );
    });

    const fallbackButton = tree!.root.findByProps({
      testID: 'biometric-fallback-button',
    });
    expect(fallbackButton).toBeDefined();

    act(() => {
      fallbackButton.props.onPress();
    });

    expect(handleFallback).toHaveBeenCalledTimes(1);
    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  it('triggers authentication flow and calls onSuccess', () => {
    const handleSuccess = jest.fn();
    const handleClose = jest.fn();
    let tree: renderer.ReactTestRenderer | undefined;
    act(() => {
      tree = renderer.create(
        <BiometricAuthDialog
          visible={true}
          onClose={handleClose}
          onSuccess={handleSuccess}
        />,
      );
    });

    const authButton = tree!.root.findByProps({
      testID: 'biometric-auth-button',
    });
    act(() => {
      authButton.props.onPress();
    });

    // Advance simulated scan timer
    act(() => {
      jest.advanceTimersByTime(700);
    });

    // Advance completion timer
    act(() => {
      jest.advanceTimersByTime(500);
    });

    expect(handleSuccess).toHaveBeenCalledTimes(1);
    expect(handleClose).toHaveBeenCalledTimes(1);
  });
});
