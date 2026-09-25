import React from 'react';
import { TouchableOpacity, View } from 'react-native';
import FastImage from 'react-native-fast-image';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { AppText } from '@/components/ui/text';
import { Media } from '@/types/thread';
import {
  capitalizeAccess,
  decodeFileName,
  formatFileSize,
  getFileTheme,
  getInitials,
  isImageFile,
  isVideoFile,
} from '@/utils/file-helpers';
import { useTheme } from '@/theme/ThemeProvider';
import { useFileManagementStyles } from '@/components/files/file-management.styles';

type FileListItemProps = {
  file: Media;
  ownerName: string;
  selected?: boolean;
  onPress: () => void;
};

const FileListItem: React.FC<FileListItemProps> = ({
  file,
  ownerName,
  selected = false,
  onPress,
}) => {
  const { colors } = useTheme();
  const styles = useFileManagementStyles();
  const theme = getFileTheme(file.file_name);
  const displayName = decodeFileName(file.file_name);
  const showThumbnail = isImageFile(file) || isVideoFile(file);

  return (
    <TouchableOpacity
      activeOpacity={0.75}
      onPress={onPress}
      style={[styles.listRow, selected && styles.listRowSelected]}
    >
      <View style={styles.listNameCell}>
        <View
          style={[styles.listIconWrap, { backgroundColor: `${theme.color}14` }]}
        >
          {showThumbnail ? (
            <FastImage
              source={{ uri: file.file_link }}
              style={styles.listThumbnail}
              resizeMode={FastImage.resizeMode.cover}
            />
          ) : (
            <Ionicons name={theme.icon} size={18} color={theme.color} />
          )}
          {isVideoFile(file) && (
            <View style={styles.listPlayBadge}>
              <Ionicons name="play" size={10} color={colors.white} />
            </View>
          )}
        </View>
        <AppText
          variant="medium"
          size={14}
          numberOfLines={1}
          style={styles.listFileName}
        >
          {displayName}
        </AppText>
      </View>

      <View style={styles.listOwnerCell}>
        <View style={styles.listAvatar}>
          <AppText variant="bold" size={11} style={styles.listAvatarText}>
            {getInitials(ownerName)}
          </AppText>
        </View>
        <AppText size={12} numberOfLines={1} style={styles.listOwnerName}>
          {ownerName}
        </AppText>
      </View>

      <View style={styles.listAccessCell}>
        <AppText size={12} style={styles.listAccessText}>
          {capitalizeAccess(file.access_type)}
        </AppText>
      </View>

      <AppText size={12} style={styles.listSizeText}>
        {formatFileSize(file.size)}
      </AppText>
    </TouchableOpacity>
  );
};

export default FileListItem;
