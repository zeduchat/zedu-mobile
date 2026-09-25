import React from 'react';
import { useKeepAwake } from '@sayem314/react-native-keep-awake';
import { StackScreenProps } from '@react-navigation/stack';
import Container from '@/components/layout/container';
import { DirectCallStackParamList } from '@/navigation/stacks/direct-calls';
import { useDataContext } from '@/store/useDataContext';
import { ACTIONS } from '@/store/types';
import { useCallScreen } from '@/hooks/useCallScreen';
import { MeetingRoom } from '@/components/buzz/MeetingRoom';
import BuzzService from '@/services/buzz.service';
import { ShowNotify } from '@/components/ui/toast';
import DMConnection from '@/centrifugoo/dm-connection';

type Props = StackScreenProps<DirectCallStackParamList, 'OngoingDirectCall'>;

import { useFocusEffect } from '@react-navigation/native';
import { Platform } from 'react-native';

const OngoingDirectCallScreen = ({ route, navigation }: Props) => {
  useKeepAwake();
  const { buzzCode, buzzData } = route.params;
  const { state, dispatch } = useDataContext();
  const isMinimized = state?.isCallMinimized ?? false;

  // Disable iOS swipe back gesture
  useFocusEffect(
    React.useCallback(() => {
      if (Platform.OS === 'ios') {
        navigation.getParent()?.setOptions?.({ gestureEnabled: false });
      }
      return () => {
        if (Platform.OS === 'ios') {
          navigation.getParent()?.setOptions?.({ gestureEnabled: true });
        }
      };
    }, [navigation]),
  );

  const handleMinimize = () => {
    prepareForMinimize();
    dispatch({ type: ACTIONS.CALL_MINIMIZED, payload: true });
    dispatch({
      type: ACTIONS.CALL_MINIMIZED_FROM,
      payload: 'OngoingDirectCall',
    });
    navigation.goBack();
  };

  const {
    isMuted,
    showVideo,
    emojiTray,
    defaultEmoji,
    globalParticipants,
    currentUser,
    isScreenSharing,
    handleToggleMic,
    handleToggleVideo,
    handleEndCall,
    handleEmojiSelect,
    handleClose,
    handleToggleScreenShare,
    prepareForMinimize,
    setDefaultEmoji,
    setEmojiTray,
    joinLoading,
  } = useCallScreen({
    buzzCode,
    buzzData,
    disableEffect: isMinimized,
    isDirectCall: true,
  });

  const handleAddMembersToCall = async (members: any[]) => {
    if (!members?.length) return;

    const channelId = String(
      buzzData?.channel_id || state?.buzzData?.channel_id || '',
    );

    if (!channelId) {
      ShowNotify('Error', 'Channel ID is missing for direct call invite');
      return;
    }

    const result = await BuzzService.directBuzzCall(channelId);

    if (result.error || !result.data) {
      ShowNotify('Error', result.error || 'Failed to add members to call');
      return;
    }

    ShowNotify('Success', 'Call invite sent');
  };

  const handleLeave = async () => {
    dispatch({ type: ACTIONS.CALL_MINIMIZED, payload: false });
    await handleEndCall();
    if (navigation.canGoBack()) {
      navigation.goBack();
    }
  };

  return (
    <Container dark>
      <DMConnection id={buzzData?.channel_id as string} />

      <MeetingRoom
        isMuted={isMuted}
        showVideo={showVideo}
        emojiTray={emojiTray}
        defaultEmoji={defaultEmoji}
        globalParticipants={globalParticipants}
        currentUser={currentUser}
        isScreenSharing={isScreenSharing}
        handleToggleMic={handleToggleMic}
        handleToggleVideo={handleToggleVideo}
        handleEndCall={handleLeave}
        handleEmojiSelect={handleEmojiSelect}
        handleToggleScreenShare={handleToggleScreenShare}
        handleClose={handleClose}
        setDefaultEmoji={setDefaultEmoji}
        setEmojiTray={setEmojiTray}
        joinLoading={joinLoading}
        onMinimize={handleMinimize}
        showChatButton={false}
        enableAddPeople
        onAddMembersToCall={handleAddMembersToCall}
      />
    </Container>
  );
};

export default OngoingDirectCallScreen;
