import React, { useMemo, useState } from 'react';
import {
  View,
  TouchableOpacity,
  ScrollView,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { AppText } from '@/components/ui/text';
import { useTheme } from '@/theme/ThemeProvider';
import { createChannelSetupStyles } from '@/theme/createStep10Styles';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Container from '@/components/layout/container';
import { useDataContext } from '@/store/useDataContext';
import { PostRequest } from '@/utils/requests';
import { ACTIONS } from '@/store/types';

const CreateChannelScreen = ({ navigation }: any) => {
  const { colors } = useTheme();
  const styles = useMemo(
    () => createChannelSetupStyles(colors).createChannel,
    [colors],
  );
  const [channelName, setChannelName] = useState('');
  const [description, setDescription] = useState('');
  const [channelType, setChannelType] = useState<'Public' | 'Private'>(
    'Public',
  );
  const [buttonLoading, setButtonLoading] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [isFocusedDescription, setIsFocusedDescription] = useState(false);
  const { state, dispatch } = useDataContext();
  const { orgId, user } = state;

  const createChannel = async () => {
    setButtonLoading(true);

    const payload = {
      name: channelName,
      organisation_id: orgId,
      is_private: channelType === 'Private' ? true : false,
      Username: user?.username || user?.email,
    };

    const { data, error } = await PostRequest(`/channels`, payload);

    if (!error) {
      dispatch({ type: ACTIONS.CHANNEL, payload: data.data });
      navigation.replace('ChannelStack', { screen: 'AddMembers' });
      dispatch({
        type: ACTIONS.CHANNEL_CALLBACK,
        payload: !state?.callback,
      });
    } else {
      dispatch({
        type: ACTIONS.ERROR,
        payload: error || 'An error occurred while creating channel',
      });
    }
    setButtonLoading(false);
  };

  return (
    <Container>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.headerBtn}
        >
          <Ionicons name="chevron-back" size={24} color={colors.primary} />
          <AppText
            style={{ color: colors.primary, fontSize: 17, marginLeft: -4 }}
          >
            Back
          </AppText>
        </TouchableOpacity>

        <AppText
          variant="bold"
          style={{ fontSize: 17, color: colors.textPrimary }}
        >
          Create New Channel
        </AppText>

        <TouchableOpacity
          onPress={() => {
            /* Handle Next */
          }}
          style={styles.headerBtn}
          disabled={!channelName.trim()}
        />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} bounces={false}>
        <View style={styles.inputCard}>
          <View
            style={[
              styles.nameInputRow,
              isFocused && { borderColor: colors.primary, borderWidth: 1.5 },
            ]}
          >
            <TouchableOpacity style={styles.avatarPicker}>
              <View style={styles.hashCircle}>
                <AppText
                  variant="bold"
                  style={{ color: colors.iconDefault, fontSize: 20 }}
                >
                  #
                </AppText>
              </View>
            </TouchableOpacity>
            <View style={{ flex: 1 }}>
              <TextInput
                placeholder="Channel Name"
                placeholderTextColor={colors.iconMuted}
                value={channelName}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                onChangeText={text => {
                  const formatted = text.replace(/\s/g, '-').toLowerCase();
                  setChannelName(formatted);
                }}
                style={{
                  fontSize: 16,
                  paddingVertical: 20,
                  color: colors.textPrimary,
                }}
              />
            </View>
          </View>

          <View style={styles.divider} />
        </View>

        <View
          style={[
            styles.inputCard,
            { padding: 10, backgroundColor: colors.surfaceElevated },
            isFocusedDescription && {
              borderColor: colors.primary,
              borderWidth: 1.5,
            },
          ]}
        >
          <TextInput
            placeholder="Description(optional)"
            value={description}
            onChangeText={setDescription}
            style={{ paddingVertical: 8, color: colors.textPrimary }}
            placeholderTextColor={colors.iconMuted}
            onFocus={() => setIsFocusedDescription(true)}
            onBlur={() => setIsFocusedDescription(false)}
          />
        </View>

        <AppText size={13} style={styles.helperText}>
          You can provide an optional description for your channel
        </AppText>

        {/* Type Section */}
        <AppText variant="medium" size={13} style={styles.sectionLabel}>
          TYPE
        </AppText>
        <View style={styles.inputCard}>
          <TouchableOpacity
            style={styles.selectionRow}
            onPress={() => setChannelType('Public')}
          >
            <AppText style={{ fontSize: 16, color: colors.textPrimary }}>
              Public
            </AppText>
            {channelType === 'Public' && (
              <Ionicons name="checkmark" size={20} color={colors.primary} />
            )}
          </TouchableOpacity>

          <View style={styles.divider} />

          <TouchableOpacity
            style={styles.selectionRow}
            onPress={() => setChannelType('Private')}
          >
            <AppText style={{ fontSize: 16, color: colors.textPrimary }}>
              Private
            </AppText>
            {channelType === 'Private' && (
              <Ionicons name="checkmark" size={20} color={colors.primary} />
            )}
          </TouchableOpacity>
        </View>
        <AppText size={13} style={styles.helperText}>
          Public channels can be found in browse channels, anyone can join them
        </AppText>

        <TouchableOpacity
          style={styles.button}
          activeOpacity={0.8}
          onPress={createChannel}
        >
          {buttonLoading && <ActivityIndicator color="white" />}
          <AppText variant="bold" style={{ color: '#FFFFFF', fontSize: 16 }}>
            Create Channel
          </AppText>
        </TouchableOpacity>
      </ScrollView>
    </Container>
  );
};

export default CreateChannelScreen;
