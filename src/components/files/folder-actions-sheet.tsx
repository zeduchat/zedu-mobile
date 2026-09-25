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
import { Folder } from '@/types/thread';
import { useTheme } from '@/theme/ThemeProvider';
import { useFileManagementStyles } from '@/components/files/file-management.styles';

export type FolderActionKey = 'edit' | 'delete';

type FolderAction = {
  key: FolderActionKey;
  label: string;
  icon: string;
  destructive?: boolean;
};

type FolderActionsSheetProps = {
  visible: boolean;
  folder: Folder | null;
  isOwner: boolean;
  onClose: () => void;
  onAction: (action: FolderActionKey) => void;
};

const ALL_ACTIONS: FolderAction[] = [
  { key: 'edit', label: 'Edit folder', icon: 'create-outline' },
  {
    key: 'delete',
    label: 'Delete folder',
    icon: 'trash-outline',
    destructive: true,
  },
];

const FolderActionsSheet: React.FC<FolderActionsSheetProps> = ({
  visible,
  folder,
  isOwner,
  onClose,
  onAction,
}) => {
  const { colors } = useTheme();
  const styles = useFileManagementStyles();

  if (!folder) return null;

  const actions = ALL_ACTIONS.filter(action => {
    if (action.key === 'delete' || action.key === 'edit') return isOwner;
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
            Folder actions
          </AppText>
          <AppText size={14} numberOfLines={2} style={styles.sheetSubtitle}>
            {folder.name}
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

export default FolderActionsSheet;
