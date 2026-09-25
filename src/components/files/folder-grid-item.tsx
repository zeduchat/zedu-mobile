import React from 'react';
import { TouchableOpacity, View } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { AppText } from '@/components/ui/text';
import { Folder } from '@/types/thread';
import { formatItemCount } from '@/utils/file-helpers';
import { useTheme } from '@/theme/ThemeProvider';
import { useFileManagementStyles } from './file-management.styles';

type FolderGridItemProps = {
  folder: Folder;
  isSelected: boolean;
  onPress: () => void;
  onLongPress: () => void;
};

const FolderGridItem: React.FC<FolderGridItemProps> = ({
  folder,
  isSelected,
  onPress,
  onLongPress,
}) => {
  const styles = useFileManagementStyles();
  const { colors } = useTheme();

  return (
    <TouchableOpacity
      style={[styles.gridItem, isSelected && styles.gridItemSelected]}
      activeOpacity={0.85}
      onPress={onPress}
      onLongPress={onLongPress}
      delayLongPress={350}
    >
      <View style={[styles.gridPlaceholder, styles.folderPlaceholder]}>
        <Ionicons name="folder" size={34} color={colors.primary} />
      </View>
      <AppText size={12} numberOfLines={2} style={styles.gridName}>
        {folder.name}
      </AppText>
      <AppText size={11} style={styles.gridSize}>
        {formatItemCount(folder.item_count)}
      </AppText>
    </TouchableOpacity>
  );
};

export default FolderGridItem;
