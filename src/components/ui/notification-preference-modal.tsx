import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { AppText } from './text';
import { useTheme } from '@/theme/ThemeProvider';
import { createNotificationPrefModalStyles } from '@/theme/createChatOverlayStyles';
import { ShowNotify } from './toast';
import { GetRequest, PostRequest } from '@/utils/requests';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation } from '@react-navigation/native';

interface NotificationPreferenceModalProps {
  visible: boolean;
  onClose: () => void;
  channelId: string;
  channelName?: string;
}

const notificationOptions = [
  { key: 'all', label: 'All new messages' },
  { key: 'mentions', label: 'Mentions' },
  { key: 'channel', label: 'Channels' },
];

const NotificationPreferenceScreen: React.FC<
  NotificationPreferenceModalProps
> = ({ channelId }) => {
  const { colors } = useTheme();
  const styles = useMemo(
    () => createNotificationPrefModalStyles(colors),
    [colors],
  );
  const navigation = useNavigation();
  const [notificationLevel, setNotificationLevel] = useState<
    'all' | 'mentions' | 'channel'
  >('all');
  const [muted, setMuted] = useState(false);
  const [threadReplies, setThreadReplies] = useState(true);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);

  useEffect(() => {
    fetchCurrentPreferences();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchCurrentPreferences = async () => {
    setFetching(true);
    const { data, error } = await GetRequest(
      `/channels/${channelId}/notification-preference`,
    );
    if (!error && data) {
      if (data.all) setNotificationLevel('all');
      else if (data.at_mentions) setNotificationLevel('mentions');
      else if (data.at_channel) setNotificationLevel('channel');

      setMuted(data.muted);
      setThreadReplies(data.thread_replies);
    }
    setFetching(false);
  };

  const handleSave = async () => {
    setLoading(true);
    const payload = {
      muted,
      at_mentions: notificationLevel === 'mentions',
      at_channel: notificationLevel === 'channel',
      all: notificationLevel === 'all',
      thread_replies: threadReplies,
      device_type: Platform.OS === 'ios' ? 'ios' : 'android',
    };

    const { error, data } = await PostRequest(
      `/channels/${channelId}/notification-preference`,
      payload,
    );

    if (!error) {
      ShowNotify('Success', data.message);
      navigation.goBack();
    } else {
      ShowNotify('Error', error);
    }
    setLoading(false);
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#fff' }}>
      <View style={styles.headerRow}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="arrow-back" size={24} color="#64748B" />
        </TouchableOpacity>
        <AppText variant="bold" style={styles.title}>
          Channel Notifications
        </AppText>
        <View style={{ width: 24 }} />
      </View>
      <View style={styles.container}>
        {fetching ? (
          <ActivityIndicator
            size="large"
            color={colors.primary}
            style={{ marginVertical: 40 }}
          />
        ) : (
          <>
            <AppText style={styles.sectionLabel}>
              Send a notification for
            </AppText>

            <View style={styles.optionsGroup}>
              {notificationOptions.map(option => (
                <TouchableOpacity
                  key={option.key}
                  style={styles.radioRow}
                  onPress={() => setNotificationLevel(option.key as any)}
                  activeOpacity={0.7}
                >
                  <MaterialCommunityIcons
                    name={
                      notificationLevel === option.key
                        ? 'radiobox-marked'
                        : 'radiobox-blank'
                    }
                    size={24}
                    color={
                      notificationLevel === option.key ? '#7165E3' : '#94A3B8'
                    }
                  />
                  <AppText style={styles.radioLabel}>{option.label}</AppText>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.checkboxGroup}>
              <TouchableOpacity
                style={styles.checkboxRow}
                onPress={() => setThreadReplies(v => !v)}
                activeOpacity={0.7}
              >
                <MaterialCommunityIcons
                  name={
                    threadReplies ? 'checkbox-marked' : 'checkbox-blank-outline'
                  }
                  size={24}
                  color={threadReplies ? '#7165E3' : '#94A3B8'}
                />
                <AppText style={styles.checkboxLabel}>
                  Get notified about all thread replies in this channel
                </AppText>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.checkboxRow}
                onPress={() => setMuted(v => !v)}
                activeOpacity={0.7}
              >
                <MaterialCommunityIcons
                  name={muted ? 'checkbox-marked' : 'checkbox-blank-outline'}
                  size={24}
                  color={muted ? '#7165E3' : '#94A3B8'}
                />
                <AppText style={styles.checkboxLabel}>Mute channel</AppText>
              </TouchableOpacity>
            </View>

            <AppText style={styles.note}>
              Note: You can set notification keywords and change your
              workspace-wide settings in your{' '}
              <AppText style={styles.link}>settings</AppText>.
            </AppText>

            <View style={styles.buttonRow}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => navigation.goBack()}
                disabled={loading}
              >
                <AppText style={styles.cancelText}>Cancel</AppText>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.saveButton}
                onPress={handleSave}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <AppText style={styles.saveText}>Save Changes</AppText>
                )}
              </TouchableOpacity>
            </View>
          </>
        )}
      </View>
    </View>
  );
};

export default NotificationPreferenceScreen;
