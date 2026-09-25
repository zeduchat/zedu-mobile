import React, { useMemo, useState } from 'react';
import { View, TouchableOpacity, ActivityIndicator } from 'react-native';
import Feather from 'react-native-vector-icons/Feather';
import moment from 'moment';
import { useNavigation } from '@react-navigation/native';
import { AppText } from '@/components/ui/text';
import { useTheme } from '@/theme/ThemeProvider';
import { createBuzzListStyles } from '@/theme/createBuzzStyles';
import { OrgBuzz } from '@/types/buzz';
import BuzzService from '@/services/buzz.service';
import { useDataContext } from '@/store/useDataContext';
import { ACTIONS } from '@/store/types';
import { ShowNotify } from '@/components/ui/toast';
import {
  getOrgBuzzLabel,
  isChannelOrgBuzz,
  isOrgBuzzActive,
  getOrgBuzzStatusLabel,
  getOrgBuzzStatusColor,
} from '@/utils/org-buzz';

interface BuzzListItemProps {
  buzz: OrgBuzz;
}

export const BuzzListItem = ({ buzz }: BuzzListItemProps) => {
  const { colors } = useTheme();
  const styles = useMemo(() => createBuzzListStyles(colors), [colors]);
  const navigation = useNavigation<any>();
  const { state, dispatch } = useDataContext();
  const { user, buzzIsMuted, buzzShowVideo } = state;
  const [isJoining, setIsJoining] = useState(false);

  const isActive = isOrgBuzzActive(buzz);
  const statusLabel = getOrgBuzzStatusLabel(buzz.status);
  const statusColor = getOrgBuzzStatusColor(buzz.status);

  const handleJoinBuzz = async () => {
    if (!isActive) {
      ShowNotify('Info', 'This buzz has ended');
      return;
    }
    setIsJoining(true);
    try {
      const result = await BuzzService.joinBuzz(buzz.buzz_code);

      if (result.error || !result.data) {
        throw new Error(result.error || 'Failed to join buzz');
      }

      const buzzData = result.data;
      dispatch({ type: ACTIONS.BUZZ_DATA, payload: buzzData });

      const isMuted = buzzIsMuted ?? true;
      const showVideo = buzzShowVideo ?? false;
      const currentUserId = user?.user_id ?? user?.id;

      const participantsWithLocalMediaState = (buzzData.participants || []).map(
        (participant: any) => {
          const participantUserId = participant.user_id ?? participant.id;

          if (String(participantUserId) === String(currentUserId)) {
            return {
              ...participant,
              audioTrack: !isMuted,
              videoTrack: showVideo,
            };
          }

          return participant;
        },
      );

      dispatch({
        type: ACTIONS.BUZZ_PARTICIPANTS,
        payload: participantsWithLocalMediaState,
      });

      const screen = isChannelOrgBuzz(buzz) ? 'ChannelCall' : 'CallScreen';
      navigation.navigate('BuzzStack', {
        screen,
        params: {
          buzzCode: buzz.buzz_code,
          buzzData,
        },
      });
    } catch (joinError) {
      const errorMessage =
        joinError instanceof Error ? joinError.message : 'Failed to join buzz';
      ShowNotify('Error', errorMessage);
    } finally {
      setIsJoining(false);
    }
  };

  return (
    <View style={styles.buzzRow}>
      <View
        style={[styles.buzzIconWrap, !isActive && styles.buzzIconWrapEnded]}
      >
        <Feather
          name="video"
          size={18}
          color={isActive ? colors.online : colors.textMuted}
        />
        {isActive && <View style={styles.liveDot} />}
      </View>

      <View style={styles.buzzInfo}>
        <View style={styles.titleRow}>
          <AppText
            variant="bold"
            size={14}
            numberOfLines={1}
            style={styles.titleText}
          >
            {getOrgBuzzLabel(buzz)}
          </AppText>
          <View
            style={[
              styles.statusBadge,
              { backgroundColor: `${statusColor}22` },
            ]}
          >
            <AppText size={11} variant="medium" style={{ color: statusColor }}>
              {statusLabel}
            </AppText>
          </View>
        </View>
        <AppText size={12} style={styles.buzzMeta}>
          {buzz.participant_count} participant
          {buzz.participant_count === 1 ? '' : 's'}
          {' · '}
          {moment(buzz.started_at).fromNow()}
        </AppText>
      </View>

      {isActive ? (
        <TouchableOpacity
          style={styles.joinBtn}
          activeOpacity={0.8}
          disabled={isJoining}
          onPress={handleJoinBuzz}
        >
          {isJoining ? (
            <ActivityIndicator size="small" color={colors.white} />
          ) : (
            <AppText variant="bold" size={13} style={styles.joinText}>
              Join
            </AppText>
          )}
        </TouchableOpacity>
      ) : (
        <View style={styles.endedPill}>
          <AppText size={12} style={styles.endedText}>
            Ended
          </AppText>
        </View>
      )}
    </View>
  );
};

interface LiveBuzzesListProps {
  buzzes: OrgBuzz[];
  loading?: boolean;
  loadingMore?: boolean;
  error?: string | null;
  hasMore?: boolean;
  showTitle?: boolean;
  onLoadMore?: () => void;
}

export const LiveBuzzesList = ({
  buzzes,
  loading,
  loadingMore,
  error,
  showTitle = true,
}: LiveBuzzesListProps) => {
  const { colors } = useTheme();
  const styles = useMemo(() => createBuzzListStyles(colors), [colors]);

  return (
    <View style={styles.sectionContainer}>
      {showTitle && (
        <AppText variant="bold" style={styles.sectionTitle}>
          Live Buzzes
        </AppText>
      )}

      {loading && buzzes.length === 0 ? (
        <View style={styles.stateWrap}>
          <ActivityIndicator color={colors.primary} />
        </View>
      ) : error ? (
        <View style={styles.stateWrap}>
          <AppText size={13} style={styles.emptyText}>
            {error}
          </AppText>
        </View>
      ) : buzzes.length === 0 ? (
        <View style={styles.stateWrap}>
          <Feather name="video-off" size={20} color={colors.textMuted} />
          <AppText size={13} style={styles.emptyText}>
            No buzzes found
          </AppText>
        </View>
      ) : (
        <>
          {buzzes.map(item => (
            <BuzzListItem key={item.buzz_id} buzz={item} />
          ))}

          {loadingMore && (
            <ActivityIndicator
              color={colors.primary}
              style={styles.footerLoader}
            />
          )}
        </>
      )}
    </View>
  );
};
