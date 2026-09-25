import { Media } from '@/types/thread';
import { DeleteRequest, PutRequest } from '@/utils/requests';

export const moveFile = (fileId: string, folderId: string) =>
  PutRequest<{ data?: Media; message?: string }>(`/files/${fileId}/move`, {
    folder_id: folderId,
  });

export const deleteFile = (fileId: string) =>
  DeleteRequest<{ message?: string }>(`/files/file/${fileId}`);

export const renameFile = (fileId: string, fileName: string) =>
  PutRequest<{ data: Media; message?: string }>(`/files/file/${fileId}`, {
    file_name: fileName,
  });
