import { normalizeEmail } from '@/utils/normalize-email';

describe('normalizeEmail', () => {
  it('lowercases a capitalised email', () => {
    expect(normalizeEmail('User@Example.com')).toBe('user@example.com');
  });

  it('removes spaces before and after the email', () => {
    expect(normalizeEmail('  user@example.com  ')).toBe('user@example.com');
  });

  it('removes tabs and new lines around the email', () => {
    expect(normalizeEmail('\tuser@example.com\n')).toBe('user@example.com');
  });

  it('trims and lowercases together', () => {
    expect(normalizeEmail(' User@Example.COM ')).toBe('user@example.com');
  });

  it('leaves an already normal email unchanged', () => {
    expect(normalizeEmail('user@example.com')).toBe('user@example.com');
  });

  it('keeps spaces inside the email so validation can still reject it', () => {
    expect(normalizeEmail('us er@example.com')).toBe('us er@example.com');
  });

  it('returns an empty string for empty, blank or missing input', () => {
    expect(normalizeEmail('')).toBe('');
    expect(normalizeEmail('   ')).toBe('');
    expect(normalizeEmail(undefined)).toBe('');
    expect(normalizeEmail(null)).toBe('');
  });
});
