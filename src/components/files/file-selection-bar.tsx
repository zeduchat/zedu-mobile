import React from 'react';
import { TouchableOpacity, View } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { AppText } from '@/components/ui/text';
import { useTheme } from '@/theme/ThemeProvider';
import { useFileManagementStyles } from './file-management.styles';

type FileSelectionBarProps = {
  selectedCount: number;
  onDelete: () => void;
  onMove: () => void;
};

const FileSelectionBar: React.FC<FileSelectionBarProps> = ({
  selectedCount,
  onDelete,
  onMove,
}) => {
  const styles = useFileManagementStyles();
  const { colors } = useTheme();
  if (selectedCount === 0) return null;

  const canMove = selectedCount === 1;

  return (
    <View style={styles.selectionBar}>
      <AppText variant="medium" size={14} style={styles.selectionCount}>
        {selectedCount} selected
      </AppText>
      <View style={styles.selectionActions}>
        <TouchableOpacity style={styles.selectionDeleteBtn} onPress={onDelete}>
          <Ionicons name="trash-outline" size={18} color={colors.white} />
          <AppText variant="bold" size={14} style={styles.selectionDeleteText}>
            Delete
          </AppText>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.selectionMoveBtn,
            !canMove && styles.selectionMoveBtnDisabled,
          ]}
          onPress={() => canMove && onMove()}
          disabled={!canMove}
        >
          <Ionicons name="folder-outline" size={18} color={colors.white} />
          <AppText variant="bold" size={14} style={styles.selectionMoveText}>
            Move
          </AppText>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default FileSelectionBar;
