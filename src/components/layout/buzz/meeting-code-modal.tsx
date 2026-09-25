import React, { useMemo } from 'react';
import {
  View,
  Modal,
  TouchableOpacity,
  Image,
  Pressable,
  Clipboard,
  Share,
} from 'react-native';
import { AppText } from '@/components/ui/text';
import { useTheme } from '@/theme/ThemeProvider';
import { createBuzzModalStyles } from '@/theme/createBuzzStyles';
import { ShowNotify } from '@/components/ui/toast';

interface Props {
  visible: boolean;
  onClose: () => void;
  link: string;
}

const MeetingLinkModal = ({ visible, onClose, link }: Props) => {
  const { colors } = useTheme();
  const styles = useMemo(() => createBuzzModalStyles(colors), [colors]);

  const copyToClipboard = async () => {
    try {
      await Clipboard.setString(link);
      ShowNotify('Success', 'Meeting link copied to clipboard');
    } catch (_error) {
      ShowNotify('Error', 'Failed to copy link');
    }
  };

  const handleShareInvite = async () => {
    try {
      await Share.share({
        message: `Join my meeting:`,
        title: 'Buzz Meeting Invite',
        url: link,
      });
    } catch (_error) {
      ShowNotify('Error', 'Failed to share invite');
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.modalCard}>
          <AppText variant="bold" style={styles.title}>
            Here’s the link to your meeting
          </AppText>

          <AppText variant="regular" style={styles.description}>
            Copy this link and send it to people that you want to meet with. Be
            sure that you save it so you can use it later, too.
          </AppText>

          <View style={styles.linkContainer}>
            <AppText numberOfLines={1} style={styles.linkText}>
              {link}
            </AppText>
            <TouchableOpacity
              onPress={copyToClipboard}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Image
                source={require('@/assets/icons/share.png')}
                style={styles.copyIcon}
              />
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={styles.shareBtn}
            onPress={handleShareInvite}
            activeOpacity={0.8}
          >
            <Image
              source={require('@/assets/icons/share.png')}
              style={styles.shareIcon}
            />
            <AppText variant="semiBold" style={styles.shareText}>
              Share invite
            </AppText>
          </TouchableOpacity>
        </Pressable>
      </Pressable>
    </Modal>
  );
};

export default MeetingLinkModal;
