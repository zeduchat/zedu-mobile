import { GetRequest } from '@/utils/requests';
import { fetchFileInfoById } from '@/hooks/useFiles';

jest.mock('@/utils/requests', () => ({
  GetRequest: jest.fn(),
}));

const mockedGetRequest = GetRequest as jest.MockedFunction<typeof GetRequest>;

describe('fetchFileInfoById', () => {
  beforeEach(() => {
    mockedGetRequest.mockReset();
  });

  it('returns the uploader metadata from the file-info endpoint', async () => {
    mockedGetRequest.mockResolvedValue({
      data: {
        data: {
          owner: 'Ada Lovelace',
          date_uploaded: '2026-10-30T09:00:00.000Z',
          last_updated: '2026-10-30T10:00:00.000Z',
          shared_in: ['mathematics'],
        },
      },
      error: null,
    });

    await expect(fetchFileInfoById('file-123')).resolves.toEqual({
      info: {
        owner: 'Ada Lovelace',
        date_uploaded: '2026-10-30T09:00:00.000Z',
        last_updated: '2026-10-30T10:00:00.000Z',
        shared_in: ['mathematics'],
      },
      error: null,
    });
    expect(mockedGetRequest).toHaveBeenCalledWith('/files/file/file-123/info');
  });

  it('keeps metadata errors separate from file loading', async () => {
    mockedGetRequest.mockResolvedValue({
      data: null,
      error: 'Owner metadata unavailable',
    });

    await expect(fetchFileInfoById('file-123')).resolves.toEqual({
      info: null,
      error: 'Owner metadata unavailable',
    });
  });
});
