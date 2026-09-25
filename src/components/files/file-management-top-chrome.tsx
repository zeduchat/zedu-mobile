import React from 'react';
import { ScrollView, TextInput, TouchableOpacity, View } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { AppText } from '@/components/ui/text';
import { useTheme } from '@/theme/ThemeProvider';
import {
  DATE_MODIFIED_OPTIONS,
  FILE_CATEGORY_OPTIONS,
  FILE_MODE_OPTIONS,
  FileCategory,
  FileMode,
} from '@/utils/file-helpers';
import {
  ActiveFilterSheet,
  DateFilterKey,
  FileManagementTab,
} from '@/types/file-management';
import { useFileManagementStyles } from './file-management.styles';

type FilterChipProps = {
  label: string;
  active: boolean;
  onPress: () => void;
};

const FilterChip: React.FC<FilterChipProps> = ({ label, active, onPress }) => {
  const styles = useFileManagementStyles();
  const { colors } = useTheme();

  return (
    <TouchableOpacity
      style={[styles.filterChip, active && styles.filterChipActive]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <AppText
        size={13}
        style={[styles.filterChipText, active && styles.filterChipTextActive]}
      >
        {label}
      </AppText>
      <Ionicons
        name="chevron-down"
        size={14}
        color={active ? colors.primary : colors.messageMeta}
      />
    </TouchableOpacity>
  );
};

type FileManagementTopChromeProps = {
  mode: FileMode;
  onModeChange: (mode: FileMode) => void;
  searchQuery: string;
  onSearchChange: (value: string) => void;
  isFoldersTab: boolean;
  fileTypeFilter: FileCategory | null;
  uploadedByFilter: string | null;
  dateFilter: DateFilterKey;
  activeTab: FileManagementTab;
  onTabChange: (tab: FileManagementTab) => void;
  onOpenFilterSheet: (sheet: ActiveFilterSheet) => void;
};

const FileManagementTopChrome: React.FC<FileManagementTopChromeProps> = ({
  mode,
  onModeChange,
  searchQuery,
  onSearchChange,
  isFoldersTab,
  fileTypeFilter,
  uploadedByFilter,
  dateFilter,
  activeTab,
  onTabChange,
  onOpenFilterSheet,
}) => {
  const styles = useFileManagementStyles();
  const { colors } = useTheme();

  return (
    <View style={styles.topChrome}>
      <View style={styles.modeBar}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          bounces={false}
          contentContainerStyle={styles.modeScrollContent}
        >
          {FILE_MODE_OPTIONS.map(option => {
            const active = mode === option.key;
            return (
              <TouchableOpacity
                key={option.key}
                style={[styles.modeChip, active && styles.modeChipActive]}
                onPress={() => onModeChange(option.key)}
              >
                <AppText
                  size={13}
                  variant={active ? 'bold' : 'regular'}
                  style={[
                    styles.modeChipText,
                    active && styles.modeChipTextActive,
                  ]}
                >
                  {option.label}
                </AppText>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      <View style={styles.searchWrap}>
        <Ionicons name="search" size={18} color={colors.messageMeta} />
        <TextInput
          value={searchQuery}
          onChangeText={onSearchChange}
          placeholder={
            isFoldersTab ? 'Search folders...' : 'Search files by name...'
          }
          placeholderTextColor={colors.messageMeta}
          style={styles.searchInput}
          autoCapitalize="none"
          returnKeyType="search"
        />
      </View>

      <View style={styles.filtersBar}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          bounces={false}
          contentContainerStyle={styles.filtersContent}
        >
          {!isFoldersTab && (
            <FilterChip
              label={
                fileTypeFilter
                  ? FILE_CATEGORY_OPTIONS.find(o => o.key === fileTypeFilter)
                      ?.label || 'File Type'
                  : 'File Type'
              }
              active={Boolean(fileTypeFilter)}
              onPress={() => onOpenFilterSheet('type')}
            />
          )}
          <FilterChip
            label={uploadedByFilter || 'Uploaded By'}
            active={Boolean(uploadedByFilter)}
            onPress={() => onOpenFilterSheet('user')}
          />
          <FilterChip
            label={
              DATE_MODIFIED_OPTIONS.find(o => o.key === dateFilter)?.label ||
              'Date Modified'
            }
            active={dateFilter !== 'any'}
            onPress={() => onOpenFilterSheet('date')}
          />
        </ScrollView>
      </View>

      <View style={styles.toolbar}>
        <View style={styles.tabs}>
          <TouchableOpacity
            onPress={() => onTabChange('folders')}
            style={styles.tabBtn}
          >
            <AppText
              variant={activeTab === 'folders' ? 'bold' : 'regular'}
              style={[
                styles.tabText,
                activeTab === 'folders' && styles.tabTextActive,
              ]}
            >
              Folders
            </AppText>
            {activeTab === 'folders' && <View style={styles.tabUnderline} />}
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => onTabChange('files')}
            style={styles.tabBtn}
          >
            <AppText
              variant={activeTab === 'files' ? 'bold' : 'regular'}
              style={[
                styles.tabText,
                activeTab === 'files' && styles.tabTextActive,
              ]}
            >
              Files
            </AppText>
            {activeTab === 'files' && <View style={styles.tabUnderline} />}
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={styles.sortBtn}
          onPress={() => onOpenFilterSheet('sort')}
        >
          <AppText size={13} style={styles.sortText}>
            Sort
          </AppText>
          <Ionicons name="chevron-down" size={14} color={colors.messageMeta} />
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default FileManagementTopChrome;
