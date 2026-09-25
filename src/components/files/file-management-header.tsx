import React from 'react';
import { TouchableOpacity, View } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { AppText } from '@/components/ui/text';
import { useTheme } from '@/theme/ThemeProvider';
import { useFileManagementStyles } from './file-management.styles';

type FileManagementHeaderProps = {
  title: string;
  selectionMode: boolean;
  onBack: () => void;
  onCancelSelection: () => void;
};

const FileManagementHeader: React.FC<FileManagementHeaderProps> = ({
  title,
  selectionMode,
  onBack,
  onCancelSelection,
}) => {
  const styles = useFileManagementStyles();
  const { colors } = useTheme();

  return (
    <View style={styles.header}>
      <TouchableOpacity onPress={onBack} style={styles.iconBtn}>
        <Ionicons name="arrow-back" size={24} color={colors.iconDefault} />
      </TouchableOpacity>
      <AppText variant="bold" style={styles.headerTitle} numberOfLines={1}>
        {title}
      </AppText>
      {selectionMode ? (
        <TouchableOpacity onPress={onCancelSelection} style={styles.iconBtn}>
          <AppText size={14} style={styles.cancelSelectText}>
            Cancel
          </AppText>
        </TouchableOpacity>
      ) : (
        <View style={styles.iconBtn} />
      )}
    </View>
  );
};

export default FileManagementHeader;
