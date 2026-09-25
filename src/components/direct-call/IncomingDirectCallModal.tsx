import React, { useEffect, useMemo, useState } from 'react';
import { Modal } from 'react-native';
import { DirectCallSession } from '@/types/direct-call';
import { RingtonePlayer } from './RingtonePlayer';
import IncomingCallContent from './IncomingCallContent';
import DirectCallService from '@/services/direct-call.service';
import { ShowNotify } from '@/components/ui/toast';
import { navigate } from '@/navigation/root-navigation';
import { useDataContext } from '@/store/useDataContext';
import { ACTIONS } from '@/store/types';
import BuzzService from '@/services/buzz.service';

interface Props {
  invite: DirectCallSession | null;
  visible: boolean;
  onClose: () => void;
}

const IncomingDirectCallModal = ({ invite, visible, onClose }: Props) => {
  const [isLoading, setIsLoading] = useState(false);
  const [isRingtonePlaying, setIsRingtonePlaying] = useState(false);
  const [countdown, setCountdown] = useState(30);
  const { dispatch } = useDataContext();

  useEffect(() => {
    if (!visible) {
      setIsRingtonePlaying(false);
      return;
    }

    setIsRingtonePlaying(true);
    setCountdown(30);

    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          onClose();
          return 0;
        }

        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [onClose, visible]);

  const callerName = useMemo(() => {
    return (
      invite?.caller?.full_name || invite?.caller?.username || 'Incoming call'
    );
  }, [invite?.caller?.full_name, invite?.caller?.username]);

  const callerAvatar = invite?.caller?.avatar_url;

  const handleActionPressIn = () => {
    setIsRingtonePlaying(false);
  };

  const handleDecline = async () => {
    setIsRingtonePlaying(false);

    if (!invite?.call_id) {
      onClose();
      return;
    }

    setIsLoading(true);
    await DirectCallService.declineDirectCall(invite.call_id);
    setIsLoading(false);
    onClose();
  };

  const handleAccept = async () => {
    setIsRingtonePlaying(false);

    if (!invite?.call_id) {
      onClose();
      return;
    }

    setIsLoading(true);
    const response = await DirectCallService.acceptDirectCall(invite.call_id);
    setIsLoading(false);

    if (response.error || !response.data) {
      ShowNotify('Error', response.error || 'Failed to accept call');
      return;
    }

    const buzzCode =
      response.data.buzz_code || response.data.buzz_data?.buzz_code;

    if (!buzzCode) {
      ShowNotify('Error', 'Call accepted but call data is missing');
      onClose();
      return;
    }

    const joinResult = await BuzzService.joinBuzz(buzzCode);

    if (joinResult.error || !joinResult.data) {
      ShowNotify('Error', joinResult.error || 'Failed to join call room');
      return;
    }

    dispatch({ type: ACTIONS.BUZZ_DATA, payload: joinResult.data });
    dispatch({
      type: ACTIONS.BUZZ_PARTICIPANTS,
      payload: joinResult.data?.participants || [],
    });
    dispatch({ type: ACTIONS.HAS_JOINED, payload: false });

    onClose();

    navigate('DirectCallStack', {
      screen: 'OngoingDirectCall',
      params: {
        buzzCode,
        callId: invite.call_id,
        shouldInitiate: false,
      },
    } as any);
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleDecline}
    >
      <>
        <RingtonePlayer
          type="incoming"
          playing={visible && !isLoading && isRingtonePlaying}
        />

        <IncomingCallContent
          callerName={callerName}
          callerAvatar={callerAvatar}
          countdown={countdown}
          isLoading={isLoading}
          onActionPressIn={handleActionPressIn}
          onDecline={handleDecline}
          onAccept={handleAccept}
        />
      </>
    </Modal>
  );
};

export default IncomingDirectCallModal;
