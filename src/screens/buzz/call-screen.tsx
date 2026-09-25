import React from 'react';
import { useKeepAwake } from '@sayem314/react-native-keep-awake';
import { StackScreenProps } from '@react-navigation/stack';
import Container from '@/components/layout/container';
import AgoraConnection from '@/centrifugoo/agora-connection';
import { useDataContext } from '@/store/useDataContext';
import { ACTIONS } from '@/store/types';
import { BuzzStackParamList } from '@/navigation/stacks/buzz';
import { useCallScreen } from '@/hooks/useCallScreen';
import { MeetingRoom } from '@/components/buzz/MeetingRoom';
import { useTheme } from '@/theme/ThemeProvider';

type CallScreenProps = StackScreenProps<BuzzStackParamList, 'CallScreen'>;

import { useFocusEffect } from '@react-navigation/native';
import { Platform } from 'react-native';

const CallScreen = ({ route, navigation }: CallScreenProps) => {
  useKeepAwake();
  const { colors } = useTheme();
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
    dispatch({ type: ACTIONS.CALL_MINIMIZED_FROM, payload: 'CallScreen' });
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
  });

  const handleLeave = async () => {
    dispatch({ type: ACTIONS.CALL_MINIMIZED, payload: false });
    await handleEndCall();
    if (navigation.canGoBack()) {
      navigation.goBack();
    }
  };

  return (
    <Container color={colors.secondary} dark>
      <AgoraConnection id={buzzCode} />

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
      />
    </Container>
  );
};

export default CallScreen;
