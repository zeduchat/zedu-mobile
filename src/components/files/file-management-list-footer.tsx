import React from 'react';
import { ActivityIndicator, View } from 'react-native';
import { useTheme } from '@/theme/ThemeProvider';
import { useFileManagementStyles } from './file-management.styles';

type FileManagementListFooterProps = {
  visible: boolean;
};

const FileManagementListFooter: React.FC<FileManagementListFooterProps> = ({
  visible,
}) => {
  const styles = useFileManagementStyles();
  const { colors } = useTheme();
  if (!visible) return null;

  return (
    <View style={styles.footerLoader}>
      <ActivityIndicator color={colors.primary} />
    </View>
  );
};

export default FileManagementListFooter;
