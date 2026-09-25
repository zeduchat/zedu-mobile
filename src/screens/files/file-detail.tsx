import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  ScrollView,
  Share,
  TouchableOpacity,
  View,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import RNFS from 'react-native-fs';
import { viewDocument } from '@react-native-documents/viewer';
import { RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import moment from 'moment';
import Container from '@/components/layout/container';
import FilePreview from '@/components/files/file-preview';
import { AppText } from '@/components/ui/text';
import { fetchFileById } from '@/hooks/useFiles';
import UseGetOrgMembers from '@/services/org/get-org-members';
import { useDataContext } from '@/store/useDataContext';
import { Media } from '@/types/thread';
import {
  capitalizeAccess,
  decodeFileName,
  formatFileSize,
  getInitials,
} from '@/utils/file-helpers';
import { FileStackParamList } from '@/navigation/stacks/files';
import { ShowNotify } from '@/components/ui/toast';
import { useTheme } from '@/theme/ThemeProvider';
import { useFileManagementStyles } from '@/components/files/file-management.styles';

type Props = {
  navigation: StackNavigationProp<FileStackParamList, 'FileDetail'>;
  route: RouteProp<FileStackParamList, 'FileDetail'>;
};

const FileDetailScreen: React.FC<Props> = ({ navigation, route }) => {
  const { colors } = useTheme();
  const styles = useFileManagementStyles();
  const { fileId } = route.params;
  const { state } = useDataContext();
  const { orgMembers = [], userChannels = [] } = state;
  UseGetOrgMembers();

  const [file, setFile] = useState<Media | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    const loadFile = async () => {
      setLoading(true);
      const { file: nextFile, error: fetchError } = await fetchFileById(fileId);
      if (!mounted) return;
      if (fetchError || !nextFile) {
        setError('Unable to load file details.');
        setFile(null);
      } else {
        setFile(nextFile);
        setError(null);
      }
      setLoading(false);
    };
    loadFile();
    return () => {
      mounted = false;
    };
  }, [fileId]);

  const ownerName = useMemo(() => {
    if (!file) return 'Unknown';
    const member = orgMembers.find(item => item.id === file.user_id);
    return member?.name || member?.username || member?.email || 'Unknown';
  }, [file, orgMembers]);

  const channelName = useMemo(() => {
    if (!file?.channel_id) return '—';
    const channel = userChannels.find(
      item =>
        item.channel_id === file.channel_id ||
        item.channels_id === file.channel_id,
    );
    return channel?.name ? `# ${channel.name}` : '—';
  }, [file, userChannels]);

  const handleDownload = async () => {
    if (!file?.file_link || !file) return;
    try {
      // Prefer native document viewer over dumping the raw CDN URL in a browser.
      const safeName = decodeFileName(file.file_name).replace(
        /[^a-zA-Z0-9._-]/g,
        '_',
      );
      const localPath = `${RNFS.CachesDirectoryPath}/download_${file.id}_${safeName}`;
      const exists = await RNFS.exists(localPath);
      if (!exists) {
        await RNFS.downloadFile({
          fromUrl: file.file_link,
          toFile: localPath,
        }).promise;
      }
      const uri = Platform.OS === 'android' ? `file://${localPath}` : localPath;
      await viewDocument({
        uri,
        mimeType: file.mime_type || 'application/octet-stream',
        presentationStyle: 'fullScreen',
      });
    } catch {
      ShowNotify('Download', 'Unable to open this file on your device.');
    }
  };

  const handleShare = async () => {
    if (!file) return;
    try {
      await Share.share({
        message: `${decodeFileName(file.file_name)}\n${file.file_link}`,
        url: file.file_link,
      });
    } catch {
      ShowNotify('Share', 'Unable to share this file.');
    }
  };

  const DetailRow = ({ label, value }: { label: string; value: string }) => (
    <View style={styles.detailRow}>
      <AppText size={13} style={styles.detailLabel}>
        {label}
      </AppText>
      <AppText size={14} variant="medium" style={styles.detailValue}>
        {value}
      </AppText>
    </View>
  );

  return (
    <Container>
      <View style={styles.detailHeader}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.detailIconBtn}
        >
          <Ionicons name="arrow-back" size={24} color={colors.iconDefault} />
        </TouchableOpacity>
        <AppText
          variant="bold"
          style={styles.detailHeaderTitle}
          numberOfLines={1}
        >
          File Details
        </AppText>
        <View style={styles.detailHeaderActions}>
          <TouchableOpacity onPress={handleShare} style={styles.detailIconBtn}>
            <Ionicons
              name="share-outline"
              size={22}
              color={colors.iconDefault}
            />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handleDownload}
            style={styles.detailIconBtn}
          >
            <Ionicons
              name="download-outline"
              size={22}
              color={colors.iconDefault}
            />
          </TouchableOpacity>
        </View>
      </View>

      {loading ? (
        <View style={styles.detailCentered}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : error || !file ? (
        <View style={styles.detailCentered}>
          <AppText style={styles.detailErrorText}>
            {error || 'File not found'}
          </AppText>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.detailContent}
          showsVerticalScrollIndicator={false}
        >
          <FilePreview file={file} ownerName={ownerName} />

          <View style={styles.detailInfoCard}>
            <AppText variant="bold" size={18} style={styles.detailFileName}>
              {decodeFileName(file.file_name)}
            </AppText>

            <View style={styles.detailOwnerRow}>
              <View style={styles.detailAvatar}>
                <AppText
                  variant="bold"
                  size={12}
                  style={styles.detailAvatarText}
                >
                  {getInitials(ownerName)}
                </AppText>
              </View>
              <View>
                <AppText size={12} style={styles.detailMetaLabel}>
                  Owner
                </AppText>
                <AppText variant="medium" size={15}>
                  {ownerName}
                </AppText>
              </View>
            </View>

            <View style={styles.detailDivider} />

            <DetailRow
              label="Access"
              value={capitalizeAccess(file.access_type)}
            />
            <DetailRow label="Size" value={formatFileSize(file.size)} />
            <DetailRow
              label="Type"
              value={(file.file_type || '').toUpperCase()}
            />
            <DetailRow label="Channel" value={channelName} />
            <DetailRow
              label="Created"
              value={moment(file.created_at).format('MMM D, YYYY • h:mm A')}
            />
            <DetailRow
              label="Modified"
              value={moment(file.updated_at).format('MMM D, YYYY • h:mm A')}
            />
            <DetailRow
              label="Last accessed"
              value={
                file.last_accessed_at
                  ? moment(file.last_accessed_at).format('MMM D, YYYY • h:mm A')
                  : '—'
              }
            />
            <DetailRow
              label="Shareable"
              value={file.is_shareable ? 'Yes' : 'No'}
            />
          </View>
        </ScrollView>
      )}
    </Container>
  );
};

export default FileDetailScreen;
