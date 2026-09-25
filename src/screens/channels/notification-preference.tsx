import React, { useMemo, useState, useEffect } from 'react';
import {
  View,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
  ScrollView,
  KeyboardAvoidingView,
  Image,
} from 'react-native';
import { useTheme } from '@/theme/ThemeProvider';
import { createChannelSetupStyles } from '@/theme/createStep10Styles';
import { GetRequest, PostRequest } from '@/utils/requests';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation } from '@react-navigation/native';
import { AppText } from '@/components/ui/text';
import Container from '@/components/layout/container';
import { useDataContext } from '@/store/useDataContext';
import { ACTIONS } from '@/store/types';

interface NotificationPreferenceScreenProps {
  route?: any;
  channelId?: string;
  channelName?: string;
}

const notificationOptions = [
  { key: 'all', label: 'All new messages' },
  { key: 'mentions', label: 'Mentions' },
  { key: 'channel', label: 'Channels' },
];

const NotificationPreferenceScreen: React.FC<
  NotificationPreferenceScreenProps
> = ({ route }) => {
  const { colors } = useTheme();
  const styles = useMemo(
    () => createChannelSetupStyles(colors).notificationPreference,
    [colors],
  );
  const navigation = useNavigation();
  const channelId = route?.params?.channel_id;

  const [notificationLevel, setNotificationLevel] = useState<
    'all' | 'mentions' | 'channel'
  >('all');
  const [muted, setMuted] = useState(false);
  const [threadReplies, setThreadReplies] = useState(true);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  const { dispatch } = useDataContext();

  useEffect(() => {
    fetchCurrentPreferences();
  }, []);

  const fetchCurrentPreferences = async () => {
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
      thread_replies: threadReplies,
      device_type: 'mobile',
    };

    const { error, data } = await PostRequest(
      `/channels/${channelId}/notification-preference`,
      payload,
    );

    if (!error) {
      dispatch({
        type: ACTIONS.SUCCESS,
        payload: data?.message || 'Updated successfully',
      });
      navigation.goBack();
    } else {
      dispatch({
        type: ACTIONS.ERROR,
        payload: error || 'Failed to update preferences',
      });
    }
    setLoading(false);
  };

  return (
    <Container>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backBtn}
        >
          <Image
            source={require('@/assets/icons/back.png')}
            style={styles.headerIcon}
          />

          <AppText variant="bold" style={styles.headerTitle}>
            Channel Notifications
          </AppText>
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {fetching ? (
            <ActivityIndicator
              size="large"
              color={colors.primary}
              style={{ marginTop: 40 }}
            />
          ) : (
            <View style={styles.formContainer}>
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
                      size={26}
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
                      threadReplies
                        ? 'checkbox-marked'
                        : 'checkbox-blank-outline'
                    }
                    size={26}
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
                    size={26}
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
            </View>
          )}
        </ScrollView>

        <View style={styles.bottomActions}>
          <TouchableOpacity
            style={styles.saveButton}
            onPress={handleSave}
            disabled={loading || fetching}
          >
            {loading && <ActivityIndicator size="small" color="#fff" />}
            <AppText variant="bold" style={styles.saveText}>
              Save Changes
            </AppText>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Container>
  );
};

export default NotificationPreferenceScreen;
