import { Folder } from '@/types/thread';
import { DeleteRequest, PatchRequest, PostRequest } from '@/utils/requests';

export const createFolder = (name: string, organisationId: string) =>
  PostRequest<{ data: Folder; message?: string }>('/files/folders', {
    name,
    parent_id: null,
    organisation_id: organisationId,
  });

export const updateFolder = (folderId: string, folderName: string) =>
  PatchRequest<{ data: Folder; message?: string }>(
    `/files/folders/${folderId}`,
    {
      folder_name: folderName,
    },
  );

export const deleteFolder = (folderId: string) =>
  DeleteRequest<{ message?: string }>(`/files/folders/${folderId}`);
