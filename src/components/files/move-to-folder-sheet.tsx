import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { AppText } from '@/components/ui/text';
import { Folder } from '@/types/thread';
import { formatItemCount } from '@/utils/file-helpers';
import { useTheme } from '@/theme/ThemeProvider';
import { useFileManagementStyles } from '@/components/files/file-management.styles';

type MoveToFolderSheetProps = {
  visible: boolean;
  folders: Folder[];
  loading?: boolean;
  movingFolderId?: string | null;
  selectedCount: number;
  onClose: () => void;
  onSelectFolder: (folder: Folder) => void;
};

const MoveToFolderSheet: React.FC<MoveToFolderSheetProps> = ({
  visible,
  folders,
  loading = false,
  movingFolderId = null,
  selectedCount,
  onClose,
  onSelectFolder,
}) => {
  const { colors } = useTheme();
  const styles = useFileManagementStyles();
  const isMoving = Boolean(movingFolderId);
  const [search, setSearch] = useState('');

  const filteredFolders = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return folders;
    return folders.filter(folder => folder.name.toLowerCase().includes(query));
  }, [folders, search]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <Pressable
        style={styles.sheetBackdrop}
        onPress={isMoving ? undefined : onClose}
      >
        <Pressable
          style={styles.sheetContainer}
          onPress={e => e.stopPropagation()}
        >
          <View style={styles.sheetHandle} />
          <AppText variant="bold" size={17} style={styles.sheetTitle}>
            Move to folder
          </AppText>
          <AppText size={14} style={styles.moveSheetSubtitle}>
            {selectedCount} file{selectedCount === 1 ? '' : 's'} selected
          </AppText>

          <View style={styles.sheetSearchWrap}>
            <Ionicons name="search" size={18} color={colors.messageMeta} />
            <TextInput
              value={search}
              onChangeText={setSearch}
              placeholder="Search folders..."
              placeholderTextColor={colors.messageMeta}
              style={styles.sheetSearchInput}
            />
          </View>

          {loading ? (
            <View style={styles.moveSheetLoader}>
              <ActivityIndicator color={colors.primary} />
            </View>
          ) : (
            <ScrollView
              style={styles.sheetList}
              keyboardShouldPersistTaps="handled"
            >
              {filteredFolders.length === 0 ? (
                <View style={styles.moveSheetEmpty}>
                  <AppText size={14} style={styles.moveSheetEmptyText}>
                    No folders found
                  </AppText>
                </View>
              ) : (
                filteredFolders.map(folder => {
                  const isSelectedFolder = movingFolderId === folder.id;

                  return (
                    <TouchableOpacity
                      key={folder.id}
                      style={styles.sheetItem}
                      onPress={() => onSelectFolder(folder)}
                      disabled={isMoving}
                    >
                      <View style={styles.moveFolderIcon}>
                        <Ionicons
                          name="folder"
                          size={18}
                          color={colors.primary}
                        />
                      </View>
                      <View style={styles.moveFolderInfo}>
                        <AppText size={15} style={styles.moveFolderName}>
                          {folder.name}
                        </AppText>
                        <AppText size={12} style={styles.moveFolderCount}>
                          {formatItemCount(folder.item_count)}
                        </AppText>
                      </View>
                      {isSelectedFolder ? (
                        <ActivityIndicator
                          color={colors.primary}
                          size="small"
                        />
                      ) : (
                        <Ionicons
                          name="chevron-forward"
                          size={16}
                          color={colors.iconMuted}
                        />
                      )}
                    </TouchableOpacity>
                  );
                })
              )}
            </ScrollView>
          )}
        </Pressable>
      </Pressable>
    </Modal>
  );
};

export default MoveToFolderSheet;
