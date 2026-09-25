import { Folder, Media } from '@/types/thread';
import {
  matchesFolderDateFilter,
  sortFiles,
  sortFolders,
} from '@/utils/file-helpers';
import { FileManagementFilters } from '@/types/file-management';

type FolderFilterContext = Pick<
  FileManagementFilters,
  'mode' | 'uploadedByFilter' | 'dateFilter' | 'searchQuery' | 'sortBy'
> & {
  currentUserId?: string;
};

export const sortFileResults = (
  files: Media[],
  sortBy: FileManagementFilters['sortBy'],
): Media[] => {
  return sortFiles(files, sortBy);
};

export const filterFolders = (
  folders: Folder[],
  context: FolderFilterContext,
): Folder[] => {
  const { uploadedByFilter, dateFilter, searchQuery, sortBy } = context;

  let result = [...folders];

  if (uploadedByFilter) {
    const query = uploadedByFilter.trim().toLowerCase();
    result = result.filter(folder => {
      const ownerLabel = folder.user_id?.toLowerCase() || '';
      return ownerLabel.includes(query);
    });
  }
  if (dateFilter !== 'any') {
    result = result.filter(folder =>
      matchesFolderDateFilter(folder, dateFilter),
    );
  }
  if (searchQuery.trim()) {
    const query = searchQuery.trim().toLowerCase();
    result = result.filter(folder => folder.name.toLowerCase().includes(query));
  }

  return sortFolders(result, sortBy);
};
