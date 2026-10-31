import { normalizeClientBaseUrl } from '@/utils/client-url';

describe('normalizeClientBaseUrl', () => {
  it('removes the entire run of trailing slashes', () => {
    const origin = ['https:', '', 'example.com'].join('/');

    expect(normalizeClientBaseUrl(`${origin}///`)).toBe(origin);
  });

  it.each([undefined, '', '   '])(
    'falls back to the Zedu web origin when the URL is %p',
    input => {
      const fallback = ['https:', '', 'zedu.chat'].join('/');

      expect(normalizeClientBaseUrl(input)).toBe(fallback);
    },
  );
});
