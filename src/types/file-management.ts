import { StackNavigationProp } from '@react-navigation/stack';
import { FileStackParamList } from '@/navigation/stacks/files';
import {
  DATE_MODIFIED_OPTIONS,
  FileCategory,
  FileMode,
  FileSortOption,
} from '@/utils/file-helpers';

export type FileManagementNavigation = StackNavigationProp<
  FileStackParamList,
  'FileManagement'
>;

export type FileManagementTab = 'folders' | 'files';

export type ActiveFilterSheet = 'type' | 'user' | 'date' | 'sort' | null;

export type DateFilterKey = (typeof DATE_MODIFIED_OPTIONS)[number]['key'];

export type FileManagementFilters = {
  mode: FileMode;
  sortBy: FileSortOption;
  fileTypeFilter: FileCategory | null;
  uploadedByFilter: string | null;
  dateFilter: DateFilterKey;
  searchQuery: string;
};
