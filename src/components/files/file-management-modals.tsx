import React from 'react';
import FileActionsSheet from '@/components/files/file-actions-sheet';
import FolderActionsSheet from '@/components/files/folder-actions-sheet';
import FolderFormModal from '@/components/files/folder-form-modal';
import MoveToFolderSheet from '@/components/files/move-to-folder-sheet';
import RenameFileModal from '@/components/files/rename-file-modal';
import UploadConfirmationModal from '@/components/files/upload-confirmation-modal';
import { decodeFileName } from '@/utils/file-helpers';
import { UseFileManagementReturn } from '@/hooks/useFileManagement';
import FileFilterSheet from './file-filter-sheet';

type FileManagementModalsProps = {
  vm: UseFileManagementReturn;
};

const FileManagementModals: React.FC<FileManagementModalsProps> = ({ vm }) => (
  <>
    <FileActionsSheet
      visible={vm.fileActionsVisible}
      file={vm.actionFile}
      isOwner={vm.actionFile ? vm.isFileOwner(vm.actionFile) : false}
      onClose={vm.closeFileActions}
      onAction={vm.handleFileAction}
    />

    <FolderActionsSheet
      visible={vm.folderActionsVisible}
      folder={vm.actionFolder}
      isOwner={vm.actionFolder ? vm.isFolderOwner(vm.actionFolder) : false}
      onClose={vm.closeFolderActions}
      onAction={vm.handleFolderAction}
    />

    <MoveToFolderSheet
      visible={vm.moveSheetVisible}
      folders={vm.pickerFolders}
      loading={vm.foldersLoading}
      movingFolderId={vm.movingFolderId}
      selectedCount={vm.selectedFileIds.size}
      onClose={() => !vm.movingFolderId && vm.setMoveSheetVisible(false)}
      onSelectFolder={vm.handleMoveToFolder}
    />

    <RenameFileModal
      visible={vm.renameModalVisible}
      initialName={
        vm.renamingFile ? decodeFileName(vm.renamingFile.file_name) : ''
      }
      loading={vm.renameSaving}
      onClose={() => {
        if (vm.renameSaving) return;
        vm.setRenameModalVisible(false);
        vm.setRenamingFile(null);
      }}
      onSubmit={vm.handleRenameSubmit}
    />

    <UploadConfirmationModal
      visible={vm.uploadConfirmVisible}
      files={vm.pendingUploadFiles}
      uploading={vm.isUploading}
      onClose={() => {
        if (vm.isUploading) return;
        vm.setUploadConfirmVisible(false);
        vm.setPendingUploadFiles([]);
      }}
      onConfirm={vm.handleConfirmUpload}
      onRemove={vm.handleRemovePendingFile}
    />

    <FolderFormModal
      visible={vm.folderModalVisible}
      mode={vm.editingFolder ? 'edit' : 'create'}
      initialName={vm.editingFolder?.name || ''}
      loading={vm.folderSaving}
      onClose={vm.closeFolderModal}
      onSubmit={vm.handleFolderSubmit}
    />

    <FileFilterSheet
      activeSheet={vm.activeSheet}
      sheetSearch={vm.sheetSearch}
      fileTypeFilter={vm.fileTypeFilter}
      uploadedByFilter={vm.uploadedByFilter}
      dateFilter={vm.dateFilter}
      sortBy={vm.sortBy}
      sheetUsers={vm.sheetUsers}
      onSheetSearchChange={vm.setSheetSearch}
      onFileTypeFilterChange={vm.setFileTypeFilter}
      onUploadedByFilterChange={vm.setUploadedByFilter}
      onDateFilterChange={vm.setDateFilter}
      onSortByChange={vm.setSortBy}
      onClose={vm.closeFilterSheet}
    />
  </>
);

export default FileManagementModals;
