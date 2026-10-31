import { GetRequest } from '@/utils/requests';
import { fetchFileInfoById } from '@/hooks/useFiles';
import { resolveFileOwnerName } from '@/utils/file-owner-name';

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

describe('resolveFileOwnerName', () => {
  it('prefers and trims a real owner returned by the API', () => {
    expect(
      resolveFileOwnerName({
        fileUserId: 'user-1',
        apiOwner: '  Grace Hopper  ',
        orgMembers: [{ id: 'user-1', name: 'Old Local Name' }],
        currentUser: null,
      }),
    ).toBe('Grace Hopper');
  });

  it('falls back to an organisation member when the API returns the user id', () => {
    expect(
      resolveFileOwnerName({
        fileUserId: 'user-2',
        apiOwner: 'user-2',
        orgMembers: [{ id: 'user-2', username: 'sender_name' }],
        currentUser: null,
      }),
    ).toBe('sender_name');
  });

  it('resolves the current account before organisation members load', () => {
    expect(
      resolveFileOwnerName({
        fileUserId: 'user-3',
        apiOwner: '',
        orgMembers: [],
        currentUser: { user_id: 'user-3', full_name: 'Current Sender' },
      }),
    ).toBe('Current Sender');
  });

  it('normalizes ids when resolving member names', () => {
    expect(
      resolveFileOwnerName({
        fileUserId: '42',
        apiOwner: undefined,
        orgMembers: [{ id: 42, email: 'sender@example.com' }],
        currentUser: null,
      }),
    ).toBe('sender@example.com');
  });

  it('returns Unknown when no uploader name can be resolved', () => {
    expect(
      resolveFileOwnerName({
        fileUserId: 'missing-user',
        apiOwner: '   ',
        orgMembers: [],
        currentUser: null,
      }),
    ).toBe('Unknown');
  });
});
