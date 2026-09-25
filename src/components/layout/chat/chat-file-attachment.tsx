import React, { useMemo } from 'react';
import { Dimensions, StyleSheet, TouchableOpacity, View } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { AppText } from '@/components/ui/text';
import { useTheme } from '@/theme/ThemeProvider';
import type { ThemeColors } from '@/theme/types';
import {
  decodeFileName,
  formatFileSize,
  getFileTheme,
} from '@/utils/file-helpers';
import { InAppDocumentViewer } from './in-app-document-viewer';

const { width } = Dimensions.get('window');

type FileLike = {
  file_name?: string;
  name?: string;
  size?: number;
  file_link?: string;
  uri?: string;
  mime_type?: string;
  file_mime_type?: string;
  id?: string;
};

function getDisplayName(file: FileLike): string {
  return decodeFileName(file.file_name || file.name || 'Attachment');
}

function getFileSizeLabel(file: FileLike, fallbackSize?: string): string {
  if (typeof file.size === 'number' && file.size > 0) {
    return formatFileSize(file.size);
  }
  return fallbackSize || '';
}

function SpreadsheetPreviewMock({
  accent,
  sheetColor,
  lineColor,
}: {
  accent: string;
  sheetColor: string;
  lineColor: string;
}) {
  return (
    <View style={[styles.mockSpreadsheet, { borderColor: lineColor }]}>
      {[0, 1, 2, 3].map(row => (
        <View
          key={row}
          style={[styles.mockSpreadsheetRow, { borderBottomColor: lineColor }]}
        >
          <View
            style={[
              styles.mockSpreadsheetCell,
              styles.mockSpreadsheetHeader,
              { backgroundColor: accent, borderRightColor: lineColor },
            ]}
          />
          <View
            style={[
              styles.mockSpreadsheetCell,
              { backgroundColor: sheetColor, borderRightColor: lineColor },
            ]}
          />
          <View
            style={[
              styles.mockSpreadsheetCell,
              { backgroundColor: sheetColor, borderRightColor: lineColor },
            ]}
          />
        </View>
      ))}
    </View>
  );
}

function PresentationPreviewMock({
  accent,
  sheetColor,
  lineColor,
}: {
  accent: string;
  sheetColor: string;
  lineColor: string;
}) {
  return (
    <View style={styles.mockPresentation}>
      <View
        style={[
          styles.mockSlide,
          { borderColor: accent, backgroundColor: sheetColor },
        ]}
      >
        <View style={[styles.mockSlideTitle, { backgroundColor: accent }]} />
        <View style={[styles.mockSlideLine, { backgroundColor: lineColor }]} />
        <View
          style={[
            styles.mockSlideLine,
            styles.mockSlideLineShort,
            { backgroundColor: lineColor },
          ]}
        />
        <View
          style={[
            styles.mockSlideLine,
            styles.mockSlideLineShort,
            { backgroundColor: lineColor },
          ]}
        />
      </View>
    </View>
  );
}

function DocumentPreviewMock({
  accent,
  label,
  sheetColor,
  lineColor,
}: {
  accent: string;
  label: string;
  sheetColor: string;
  lineColor: string;
}) {
  return (
    <View style={styles.mockDocument}>
      <View
        style={[
          styles.mockDocumentSheet,
          { borderColor: accent, backgroundColor: sheetColor },
        ]}
      >
        <View style={[styles.mockDocumentBadge, { backgroundColor: accent }]}>
          <AppText variant="bold" style={styles.mockDocumentBadgeText}>
            {label}
          </AppText>
        </View>
        <View
          style={[styles.mockDocumentLine, { backgroundColor: lineColor }]}
        />
        <View
          style={[
            styles.mockDocumentLine,
            styles.mockSlideLineShort,
            { backgroundColor: lineColor },
          ]}
        />
        <View
          style={[
            styles.mockDocumentLine,
            styles.mockSlideLineShort,
            { backgroundColor: lineColor },
          ]}
        />
      </View>
    </View>
  );
}

export function FileAttachmentPreviewPanel({
  fileName,
  size = 'message',
}: {
  fileName: string;
  size?: 'message' | 'editor' | 'modal';
}) {
  const { colors, isDark } = useTheme();
  const theme = getFileTheme(fileName);
  const previewBackground = isDark
    ? `${theme.color}28`
    : theme.previewBackground;
  const sheetColor = isDark ? colors.surface : colors.white;
  const lineColor = isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.08)';
  const panelStyle =
    size === 'modal'
      ? styles.previewPanelModal
      : size === 'editor'
      ? styles.previewPanelEditor
      : styles.previewPanelMessage;

  return (
    <View style={[panelStyle, { backgroundColor: previewBackground }]}>
      {theme.kind === 'spreadsheet' && (
        <SpreadsheetPreviewMock
          accent={theme.previewAccent}
          sheetColor={sheetColor}
          lineColor={lineColor}
        />
      )}
      {theme.kind === 'presentation' && (
        <PresentationPreviewMock
          accent={theme.previewAccent}
          sheetColor={sheetColor}
          lineColor={lineColor}
        />
      )}
      {(theme.kind === 'document' || theme.kind === 'file') && (
        <DocumentPreviewMock
          accent={theme.color}
          label={theme.label}
          sheetColor={sheetColor}
          lineColor={lineColor}
        />
      )}
      <View style={[styles.previewTypePill, { backgroundColor: theme.color }]}>
        <Ionicons name={theme.icon} size={12} color="#FFF" />
        <AppText variant="bold" size={10} style={styles.previewTypePillText}>
          {theme.kindLabel}
        </AppText>
      </View>
    </View>
  );
}

export function ChatFileAttachmentCard({
  file,
  fallbackSize,
  onPress,
  widthRatio = 0.72,
}: {
  file: FileLike;
  fallbackSize?: string;
  onPress?: () => void;
  widthRatio?: number;
}) {
  const { colors } = useTheme();
  const stylesThemed = useMemo(
    () => createAttachmentCardStyles(colors),
    [colors],
  );
  const displayName = getDisplayName(file);
  const theme = getFileTheme(displayName);
  const sizeLabel = getFileSizeLabel(file, fallbackSize);

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={onPress}
      style={[stylesThemed.card, { width: width * widthRatio }]}
    >
      <FileAttachmentPreviewPanel fileName={displayName} size="message" />
      <View style={stylesThemed.cardFooter}>
        <View style={[styles.fileIconBox, { backgroundColor: theme.color }]}>
          <AppText variant="bold" style={styles.fileExtText}>
            {theme.label}
          </AppText>
        </View>
        <View style={styles.fileInfo}>
          <AppText numberOfLines={2} style={stylesThemed.fileNameText}>
            {displayName}
          </AppText>
          <AppText size={11} style={stylesThemed.fileMetaText}>
            {[sizeLabel, theme.kindLabel].filter(Boolean).join(' • ')}
          </AppText>
        </View>
        <Ionicons name="chevron-forward" size={16} color={colors.iconMuted} />
      </View>
    </TouchableOpacity>
  );
}

export function ChatFilePreviewModal({
  visible,
  file,
  onClose,
}: {
  visible: boolean;
  file: FileLike | null;
  onClose: () => void;
}) {
  return (
    <InAppDocumentViewer
      visible={visible}
      file={file}
      onClose={onClose}
      variant="modal"
    />
  );
}

function createAttachmentCardStyles(colors: ThemeColors) {
  return StyleSheet.create({
    card: {
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface,
      overflow: 'hidden',
      marginBottom: 4,
    },
    cardFooter: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 12,
      paddingVertical: 10,
      borderTopWidth: 1,
      borderTopColor: colors.border,
      backgroundColor: colors.surface,
    },
    fileNameText: {
      fontSize: 14,
      color: colors.textPrimary,
      fontWeight: '600',
    },
    fileMetaText: {
      color: colors.messageMeta,
      marginTop: 2,
    },
  });
}

const styles = StyleSheet.create({
  previewPanelMessage: {
    height: 132,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  previewPanelEditor: {
    width: '100%',
    height: 220,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 16,
    overflow: 'hidden',
  },
  previewPanelModal: {
    width: '100%',
    height: 280,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 16,
    overflow: 'hidden',
  },
  previewTypePill: {
    position: 'absolute',
    top: 10,
    left: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
  },
  previewTypePillText: {
    color: '#FFF',
  },
  mockSpreadsheet: {
    width: '78%',
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 1,
  },
  mockSpreadsheetRow: {
    flexDirection: 'row',
    height: 18,
    borderBottomWidth: 1,
  },
  mockSpreadsheetCell: {
    flex: 1,
    borderRightWidth: 1,
  },
  mockSpreadsheetHeader: {
    maxWidth: 42,
  },
  mockPresentation: {
    width: '72%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mockSlide: {
    width: '100%',
    height: 92,
    borderRadius: 8,
    borderWidth: 1,
    padding: 12,
  },
  mockSlideTitle: {
    width: '55%',
    height: 10,
    borderRadius: 4,
    marginBottom: 10,
  },
  mockSlideLine: {
    height: 6,
    borderRadius: 3,
    marginBottom: 6,
    width: '88%',
  },
  mockSlideLineShort: {
    width: '62%',
  },
  mockDocument: {
    width: '68%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mockDocumentSheet: {
    width: '100%',
    minHeight: 96,
    borderRadius: 8,
    borderWidth: 1,
    padding: 12,
  },
  mockDocumentBadge: {
    alignSelf: 'flex-start',
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginBottom: 10,
  },
  mockDocumentBadgeText: {
    color: '#FFF',
    fontSize: 10,
  },
  mockDocumentLine: {
    height: 6,
    borderRadius: 3,
    marginBottom: 6,
    width: '90%',
  },
  fileIconBox: {
    width: 36,
    height: 36,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  fileExtText: {
    color: '#FFFFFF',
    fontSize: 10,
  },
  fileInfo: {
    flex: 1,
    paddingRight: 6,
  },
});
