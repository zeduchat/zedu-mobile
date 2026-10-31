/**
 * @format
 */

import { getFileExtension } from '@/utils/file-helpers';

describe('getFileExtension', () => {
  it('reads the extension after the last dot', () => {
    expect(getFileExtension('report.PDF')).toBe('pdf');
    expect(getFileExtension('archive.tar.gz')).toBe('gz');
  });

  it('falls back to the file type when the name has no dot', () => {
    expect(getFileExtension('Makefile', 'pdf')).toBe('pdf');
    expect(getFileExtension('notes', 'TXT')).toBe('txt');
  });

  it('treats a leading dot or a trailing dot as no extension', () => {
    expect(getFileExtension('.gitignore', 'text')).toBe('text');
    expect(getFileExtension('draft.', 'docx')).toBe('docx');
  });

  it('returns an empty string when there is nothing to go on', () => {
    expect(getFileExtension('Makefile')).toBe('');
    expect(getFileExtension('')).toBe('');
  });
});
