import React from 'react';
import { TextInput, View } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useTheme } from '@/theme/ThemeProvider';
import { useFileManagementStyles } from './file-management.styles';

type FileManagementFolderHeaderProps = {
  searchQuery: string;
  onSearchChange: (value: string) => void;
};

const FileManagementFolderHeader: React.FC<FileManagementFolderHeaderProps> = ({
  searchQuery,
  onSearchChange,
}) => {
  const styles = useFileManagementStyles();
  const { colors } = useTheme();

  return (
    <View style={styles.topChrome}>
      <View style={styles.searchWrap}>
        <Ionicons name="search" size={18} color={colors.messageMeta} />
        <TextInput
          value={searchQuery}
          onChangeText={onSearchChange}
          placeholder="Search files in folder..."
          placeholderTextColor={colors.messageMeta}
          style={styles.searchInput}
        />
      </View>
    </View>
  );
};

export default FileManagementFolderHeader;
