import React from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  TouchableOpacity,
  View,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { AppText } from '@/components/ui/text';
import { Media } from '@/types/thread';
import { decodeFileName } from '@/utils/file-helpers';
import { useTheme } from '@/theme/ThemeProvider';
import { useFileManagementStyles } from '@/components/files/file-management.styles';

export type FileActionKey =
  | 'select'
  | 'move'
  | 'delete'
  | 'preview'
  | 'share'
  | 'rename';

type FileAction = {
  key: FileActionKey;
  label: string;
  icon: string;
  destructive?: boolean;
};

type FileActionsSheetProps = {
  visible: boolean;
  file: Media | null;
  isOwner: boolean;
  onClose: () => void;
  onAction: (action: FileActionKey) => void;
};

const ALL_ACTIONS: FileAction[] = [
  { key: 'select', label: 'Select', icon: 'checkmark-circle-outline' },
  { key: 'move', label: 'Move', icon: 'folder-outline' },
  { key: 'delete', label: 'Delete', icon: 'trash-outline', destructive: true },
  { key: 'preview', label: 'Preview', icon: 'eye-outline' },
  { key: 'share', label: 'Share', icon: 'share-outline' },
  { key: 'rename', label: 'Rename', icon: 'create-outline' },
];

const FileActionsSheet: React.FC<FileActionsSheetProps> = ({
  visible,
  file,
  isOwner,
  onClose,
  onAction,
}) => {
  const { colors } = useTheme();
  const styles = useFileManagementStyles();

  if (!file) return null;

  const actions = ALL_ACTIONS.filter(action => {
    if (action.key === 'delete') return isOwner;
    return true;
  });

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <Pressable style={styles.sheetBackdrop} onPress={onClose}>
        <Pressable
          style={styles.sheetContainer}
          onPress={e => e.stopPropagation()}
        >
          <View style={styles.sheetHandle} />
          <AppText variant="bold" size={17} style={styles.sheetTitle}>
            File actions
          </AppText>
          <AppText size={14} numberOfLines={2} style={styles.sheetSubtitle}>
            {decodeFileName(file.file_name)}
          </AppText>

          <ScrollView
            style={styles.sheetList}
            keyboardShouldPersistTaps="handled"
          >
            {actions.map(action => (
              <TouchableOpacity
                key={action.key}
                style={styles.sheetItem}
                onPress={() => onAction(action.key)}
              >
                <Ionicons
                  name={action.icon}
                  size={20}
                  color={action.destructive ? colors.error : colors.messageMeta}
                />
                <AppText
                  size={15}
                  style={[
                    styles.sheetItemText,
                    action.destructive && styles.destructiveText,
                  ]}
                >
                  {action.label}
                </AppText>
                <Ionicons
                  name="chevron-forward"
                  size={16}
                  color={colors.iconMuted}
                />
              </TouchableOpacity>
            ))}
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
};

export default FileActionsSheet;
