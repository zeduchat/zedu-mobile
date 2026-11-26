/**
 * @format
 */

import { Dimensions } from 'react-native';
import { truncateUsernameForChannel } from '@/utils/truncate-username';

const LONG_NAME = 'Anidu Hassanat Oluwaseyi Adebayo Cybertron Team'; // 47 characters

const setScreenWidth = (width: number) => {
  jest
    .spyOn(Dimensions, 'get')
    .mockReturnValue({ width, height: 800, scale: 2, fontScale: 1 });
};

afterEach(() => {
  jest.restoreAllMocks();
});

describe('truncateUsernameForChannel', () => {
  it.each([320, 375, 430, 768])(
    'ends a name over the limit with an ellipsis on a %ipx wide screen',
    width => {
      setScreenWidth(width);
      const result = truncateUsernameForChannel(LONG_NAME);
      expect(result.endsWith('…')).toBe(true);
      expect(result.length).toBeLessThanOrEqual(31);
    },
  );

  it('shows a short name unchanged', () => {
    setScreenWidth(375);
    expect(truncateUsernameForChannel('hassanat')).toBe('hassanat');
  });

  it('shows a name of exactly 30 characters unchanged on a wide screen', () => {
    setScreenWidth(768);
    const name = 'a'.repeat(30);
    expect(truncateUsernameForChannel(name)).toBe(name);
  });

  it('trims spaces and returns an empty string for a missing name', () => {
    setScreenWidth(375);
    expect(truncateUsernameForChannel('  ada  ')).toBe('ada');
    expect(truncateUsernameForChannel('   ')).toBe('');
    expect(truncateUsernameForChannel(undefined)).toBe('');
    expect(truncateUsernameForChannel(null)).toBe('');
  });
});
