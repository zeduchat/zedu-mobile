import React from 'react';
import { View } from 'react-native';
import Container from '@/components/layout/container';
import { FileManagementPopover } from '@/components/files/file-management-popover';
import FileManagementHeader from '@/components/files/file-management-header';
import FileManagementModals from '@/components/files/file-management-modals';
import FileManagementTabContent from '@/components/files/file-management-tab-content';
import FileSelectionBar from '@/components/files/file-selection-bar';
import { useFileManagementStyles } from '@/components/files/file-management.styles';
import { useFileManagement } from '@/hooks/useFileManagement';
import { FileManagementNavigation } from '@/types/file-management';

type Props = {
  navigation: FileManagementNavigation;
};

const FileManagementScreen: React.FC<Props> = ({ navigation }) => {
  const styles = useFileManagementStyles();
  const vm = useFileManagement(navigation);

  const headerTitle = vm.selectionMode
    ? `${vm.selectedFileIds.size} selected`
    : vm.openFolder
    ? vm.openFolder.name
    : 'File Management';

  return (
    <Container>
      <FileManagementHeader
        title={headerTitle}
        selectionMode={vm.selectionMode}
        onBack={vm.handleHeaderBack}
        onCancelSelection={vm.exitSelectionMode}
      />

      <View style={styles.contentArea}>
        <FileManagementTabContent vm={vm} />
      </View>

      {!vm.selectionMode && (
        <FileManagementPopover
          onUploadFile={vm.handlePickFiles}
          onNewFolder={vm.handleNewFolder}
        />
      )}

      {vm.selectionMode && (
        <FileSelectionBar
          selectedCount={vm.selectedFileIds.size}
          onDelete={vm.handleDeleteSelectedFiles}
          onMove={() => vm.setMoveSheetVisible(true)}
        />
      )}

      <FileManagementModals vm={vm} />
    </Container>
  );
};

export default FileManagementScreen;
