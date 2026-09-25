import React, { useMemo } from 'react';
import { View, FlatList, TouchableOpacity } from 'react-native';
import Modal from 'react-native-modal';
import { AppText } from '@/components/ui/text';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useTheme } from '@/theme/ThemeProvider';
import { createBuzzSidebarStyles } from '@/theme/createBuzzStyles';
import FastImage from 'react-native-fast-image';
import { UserStatusIcon } from '@/components/ui/user-status-icon';

interface Participant {
  id: string;
  name: string;
  avatar?: string;
  isMe?: boolean;
  isMuted?: boolean;
  isVideoOn?: boolean;
  role?: string;
  icon?: string;
  text?: string;
  online?: boolean;
}

interface ParticipantsSidebarProps {
  visible: boolean;
  onClose: () => void;
  participants: Participant[];
  currentUserId: string;
  onMuteToggle?: (id: string) => void;
  onRoleChange?: (id: string, role: string) => void;
}

const ParticipantsSidebar: React.FC<ParticipantsSidebarProps> = ({
  visible,
  onClose,
  participants,
  currentUserId: _currentUserId,
  onMuteToggle,
  onRoleChange: _onRoleChange,
}) => {
  const { colors } = useTheme();
  const styles = useMemo(() => createBuzzSidebarStyles(colors), [colors]);

  const renderParticipant = ({ item }: { item: Participant }) => {
    const nameInitial = (item.name?.trim()?.charAt(0) || '?').toUpperCase();

    return (
      <View style={styles.participantRow}>
        <UserStatusIcon user={item} style={styles.statusIcon} />
        <View style={styles.avatarContainer}>
          {item.avatar ? (
            <FastImage source={{ uri: item.avatar }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <AppText variant="bold" style={styles.avatarInitial}>
                {nameInitial}
              </AppText>
            </View>
          )}
        </View>
        <View style={styles.infoContainer}>
          <AppText variant="bold" style={styles.nameText}>
            {item.isMe ? 'You' : item.name || 'User'}
          </AppText>
          <AppText style={styles.roleText}>
            {item.role || 'Participant'}
          </AppText>
        </View>
        <View style={styles.actionsContainer}>
          <TouchableOpacity
            onPress={() => onMuteToggle && onMuteToggle(item.id)}
          >
            <Ionicons
              name={item.isMuted ? 'mic-off' : 'mic'}
              size={20}
              color={item.isMuted ? colors.textMuted : colors.primary}
            />
          </TouchableOpacity>
          <Ionicons
            name={item.isVideoOn ? 'videocam' : 'videocam-off'}
            size={20}
            color={item.isVideoOn ? colors.primary : colors.textMuted}
            style={{ marginLeft: 12 }}
          />
        </View>
      </View>
    );
  };

  return (
    <Modal
      isVisible={visible}
      onBackdropPress={onClose}
      onSwipeComplete={onClose}
      swipeDirection="right"
      animationIn="slideInRight"
      animationOut="slideOutRight"
      style={styles.modal}
      backdropOpacity={0.4}
      propagateSwipe
      useNativeDriver
      hideModalContentWhileAnimating
      backdropTransitionOutTiming={0}
      animationInTiming={600}
      animationOutTiming={600}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <AppText variant="bold" style={styles.headerTitle}>
            Participants
          </AppText>
          <TouchableOpacity onPress={onClose} style={styles.closeCircle}>
            <Ionicons name="close" size={24} color={colors.textPrimary} />
          </TouchableOpacity>
        </View>
        <FlatList
          data={participants}
          renderItem={renderParticipant}
          keyExtractor={(item, index) => `${item.id}-${index}`}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      </View>
    </Modal>
  );
};

export default ParticipantsSidebar;
