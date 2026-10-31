/**
 * @format
 */

import { formatFileSize } from '@/utils/file-helpers';

describe('formatFileSize', () => {
  it.each([
    [0, '0 B'],
    [-5, '0 B'],
    [512, '512 B'],
    [1023, '1023 B'],
    [1024, '1.00 KB'],
    [1536, '1.50 KB'],
    [1048575, '1.00 MB'],
    [1048576, '1.00 MB'],
    [5 * 1024 * 1024, '5.00 MB'],
    [1073741823, '1.00 GB'],
    [1073741824, '1.00 GB'],
    [2684354560, '2.50 GB'],
  ])('formats %d bytes as %s', (bytes, expected) => {
    expect(formatFileSize(bytes)).toBe(expected);
  });
});
