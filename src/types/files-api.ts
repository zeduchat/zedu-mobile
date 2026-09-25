import {
  DateModifiedFilter,
  FileCategory,
  FileMode,
} from '@/utils/file-helpers';

/** Query `mode` values expected by GET /files and GET /files/folders */
export type FilesApiMode = 'all' | 'mine' | 'shared' | 'trash';

export const fileModeToApiMode = (mode: FileMode): FilesApiMode => {
  switch (mode) {
    case 'my':
      return 'mine';
    case 'deleted':
      return 'trash';
    case 'shared':
      return 'shared';
    case 'all':
    default:
      return 'all';
  }
};

export type FilesListQueryFilters = {
  type?: FileCategory | null;
  date_modified?: DateModifiedFilter;
  owner?: string | null;
  file_name?: string | null;
};

export type FilesListRequestParams = {
  mode: FilesApiMode;
  page: number;
  limit: number;
  folder_id?: string;
  type?: string;
  date_modified?: string;
  owner?: string;
  search?: string;
};

export const buildFilesListQuery = (params: FilesListRequestParams): string => {
  const parts: string[] = [];

  const append = (key: string, value: string | number | undefined) => {
    if (value === undefined || value === null || value === '') return;
    parts.push(
      `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`,
    );
  };

  append('mode', params.mode);
  append('page', params.page);
  append('limit', params.limit);
  append('folder_id', params.folder_id);
  append('file_category', params.type);
  if (params.date_modified && params.date_modified !== 'any') {
    append('date_modified', params.date_modified);
  }
  append('owner', params.owner);
  append('search', params.search);

  return parts.join('&');
};

export const mapFilesFiltersToRequest = (
  mode: FileMode,
  page: number,
  limit: number,
  folderId?: string | null,
  filters?: FilesListQueryFilters,
): FilesListRequestParams => ({
  mode: fileModeToApiMode(mode),
  page,
  limit,
  folder_id: folderId || undefined,
  type: filters?.type || undefined,
  date_modified: filters?.date_modified,
  owner: filters?.owner?.trim() || undefined,
  search: filters?.file_name?.trim() || undefined,
});
