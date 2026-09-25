import React, { useMemo } from 'react';
import { AppText } from '@/components/ui/text';
import { ShowNotify } from '@/components/ui/toast';
import { useDataContext } from '@/store/useDataContext';
import { ACTIONS } from '@/store/types';
import { PostRequest } from '@/utils/requests';
import { TouchableOpacity, View } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { CLIENT_URL } from '@env';
import { useTheme } from '@/theme/ThemeProvider';
import { createBuzzCallControlStyles } from '@/theme/createBuzzStyles';
import { Clipboard } from 'react-native';

interface MenuOptionsProps {
  onParticipantsClick?: () => void;
  onScreenShareToggle?: (enabled: boolean) => void;
  isScreenSharing?: boolean;
}

const MenuOptions = ({ onParticipantsClick }: MenuOptionsProps) => {
  const { colors } = useTheme();
  const styles = useMemo(() => createBuzzCallControlStyles(colors), [colors]);
  const { state, dispatch } = useDataContext();
  const currentParticipants = state?.buzzParticipants || [];
  const currentUser = state?.user;
  const buzzData = state?.buzzData;
  const _isHost = String(buzzData?.host_id) === String(currentUser?.user_id);
  const localParticipant = currentParticipants.find(
    (participant: any) =>
      String(participant?.user_id) === String(currentUser?.user_id),
  );
  const isHandRaised = localParticipant?.handsRaised ?? false;

  const copyToClipboard = async () => {
    const link = `${CLIENT_URL}/client/buzz/${state?.buzzData?.buzz_code}`;
    try {
      await Clipboard.setString(link);
      ShowNotify('Success', 'Meeting link copied to clipboard');
    } catch (_error) {
      ShowNotify('Error', 'Failed to copy link');
    }
  };

  const toggleHandRaise = async () => {
    const buzzId = state?.buzzData?.buzz_id;
    const myUserId = currentUser?.user_id;

    if (!buzzId || !myUserId) {
      ShowNotify('Info', 'Raise hand is unavailable right now');
      return;
    }

    const newHandState = !isHandRaised;
    const updatedParticipants = currentParticipants.map((participant: any) =>
      String(participant?.user_id) === String(myUserId)
        ? { ...participant, handsRaised: newHandState }
        : participant,
    );

    dispatch({
      type: ACTIONS.BUZZ_PARTICIPANTS,
      payload: updatedParticipants,
    });

    const payload = {
      sticker: newHandState ? 'raise_hand' : 'away',
    };

    const response = await PostRequest(`/buzz/${buzzId}/sticker`, payload);

    if (response?.error) {
      dispatch({
        type: ACTIONS.BUZZ_PARTICIPANTS,
        payload: currentParticipants,
      });
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <TouchableOpacity style={styles.menuItem} onPress={toggleHandRaise}>
          <AppText style={styles.menuText}>
            {isHandRaised ? 'Lower Hand' : 'Raise Hand'}
          </AppText>
          <MaterialIcons
            name="back-hand"
            size={22}
            color={isHandRaised ? colors.primary : colors.textPrimary}
          />
        </TouchableOpacity>
        <View style={styles.divider} />
        {/* <TouchableOpacity
          style={styles.menuItem}
          onPress={() => onScreenShareToggle?.(!isScreenSharing)}
        >
          <AppText style={styles.menuText}>
            {isScreenSharing ? 'Stop Sharing' : 'Share Screen'}
          </AppText>
          <MaterialCommunityIcons
            name="monitor-share"a
            size={22}
            color={isScreenSharing ? colors.primary : colors.textPrimary}
          />
        </TouchableOpacity> */}
        <View style={styles.divider} />
        <TouchableOpacity style={styles.menuItem} onPress={copyToClipboard}>
          <View>
            <AppText style={styles.menuText}>Copy buzz link</AppText>
            <AppText size={12}>{state?.buzzData?.buzz_code}</AppText>
          </View>
          <MaterialCommunityIcons
            name="link-variant"
            size={22}
            color={colors.textPrimary}
          />
        </TouchableOpacity>
        <View style={styles.divider} />
        <TouchableOpacity style={styles.menuItem} onPress={onParticipantsClick}>
          <AppText style={styles.menuText}>Participants</AppText>
          <MaterialCommunityIcons
            name="account-group"
            size={22}
            color={colors.textPrimary}
          />
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default MenuOptions;
