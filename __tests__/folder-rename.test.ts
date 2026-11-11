import { updateFolder } from '@/services/files/folders';
import { PatchRequest, PutRequest } from '@/utils/requests';

jest.mock('@/utils/requests', () => ({
  PutRequest: jest.fn(),
  PatchRequest: jest.fn(),
}));

describe('folder rename API contract', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (PatchRequest as jest.Mock).mockResolvedValue({
      data: null,
      error: '404 page not found',
    });
  });

  it('uses PUT, the method supported by the folder rename endpoint', async () => {
    const response = {
      data: { data: { id: 'folder-1', name: 'Course notes' } },
      error: null,
    };
    (PutRequest as jest.Mock).mockResolvedValue(response);

    await expect(updateFolder('folder-1', 'Course notes')).resolves.toEqual(
      response,
    );
    expect(PutRequest).toHaveBeenCalledWith('/files/folders/folder-1', {
      folder_name: 'Course notes',
    });
    expect(PatchRequest).not.toHaveBeenCalled();
  });

  it('preserves a failed rename response for the caller to handle', async () => {
    const response = { data: null, error: 'Permission denied' };
    (PutRequest as jest.Mock).mockResolvedValue(response);

    await expect(updateFolder('folder-1', 'Course notes')).resolves.toEqual(
      response,
    );
  });
});
