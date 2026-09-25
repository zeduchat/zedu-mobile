import React from 'react';
import { View } from 'react-native';
import { AppText } from '@/components/ui/text';
import { useFileManagementStyles } from './file-management.styles';

type FileManagementEmptyStateProps = {
  title: string;
  subtitle: string;
  icon?: React.ReactNode;
  inline?: boolean;
};

const FileManagementEmptyState: React.FC<FileManagementEmptyStateProps> = ({
  title,
  subtitle,
  icon,
  inline = false,
}) => {
  const styles = useFileManagementStyles();

  return (
    <View style={inline ? styles.emptyStateInline : styles.emptyState}>
      {icon}
      <AppText style={styles.emptyTitle}>{title}</AppText>
      <AppText style={styles.emptySubtitle}>{subtitle}</AppText>
    </View>
  );
};

export default FileManagementEmptyState;
