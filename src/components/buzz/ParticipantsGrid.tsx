import React, { useMemo } from 'react';
import {
  FlatList,
  View,
  Dimensions,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { ParticipantCard } from '@/components/buzz/ParticipantCard';
import { AppText } from '@/components/ui/text';
import { useTheme } from '@/theme/ThemeProvider';
import { createBuzzParticipantStyles } from '@/theme/createBuzzStyles';

const { width } = Dimensions.get('window');

interface ParticipantsGridProps {
  participants: any[];
  currentUser: any;
  joinLoading?: boolean;
}

export const ParticipantsGrid = ({
  participants,
  currentUser,
  joinLoading,
}: ParticipantsGridProps) => {
  const { colors } = useTheme();
  const styles = useMemo(() => createBuzzParticipantStyles(colors), [colors]);

  const list = participants || [];

  if (list.length === 1) {
    const p = list[0];
    const userId = p.user_id;
    const isMe =
      String(userId) === String(currentUser?.user_id ?? currentUser?.id);
    const displayName = isMe ? 'You' : p.username || p.full_name || 'User';
    const hasvideoTrack = p.videoTrack ?? false;
    const hasaudioTrack = p.audioTrack ?? false;
    const hasScreenTrack = p.screenTrack ?? false;
    const agoraUid = isMe ? 0 : p.agoraNumericUid ?? 0;
    const screenAgoraUid = isMe ? 0 : p.screenAgoraNumericUid ?? 0;

    return (
      <View style={styles.singleParticipantContainer}>
        {joinLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator color={colors.white} />
            <AppText variant="bold" style={styles.loadingText}>
              Joining the call...
            </AppText>
          </View>
        ) : (
          <ParticipantCard
            key={userId}
            userId={String(userId)}
            displayName={displayName}
            avatarUrl={p.avatar_url || p.default_avatar_url}
            handsRaised={Boolean(p.handsRaised)}
            hasvideoTrack={hasvideoTrack}
            hasaudioTrack={hasaudioTrack}
            hasScreenTrack={hasScreenTrack}
            isMe={isMe}
            agoraUid={agoraUid}
            screenAgoraUid={screenAgoraUid}
            cardWidth={width - 40}
            joinStatus={p.join_status}
            color={p.color}
          />
        )}
      </View>
    );
  }

  if (list.length === 2) {
    return (
      <ScrollView
        style={styles.twoParticipantContainer}
        contentContainerStyle={styles.twoParticipantScrollContent}
        showsVerticalScrollIndicator={false}
        bounces={true}
      >
        {joinLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator color={colors.white} />
            <AppText variant="bold" style={styles.loadingText}>
              Joining the call...
            </AppText>
          </View>
        ) : (
          list.map((p: any, index: number) => {
            const userId = p.user_id ?? p.id ?? String(index);
            const isMe =
              String(userId) ===
              String(currentUser?.user_id ?? currentUser?.id);
            const displayName = isMe
              ? 'You'
              : p.full_name || p.username || p.name || 'User';
            const hasvideoTrack = p.videoTrack ?? false;
            const hasaudioTrack = p.audioTrack ?? false;
            const hasScreenTrack = p.screenTrack ?? false;
            const agoraUid = isMe ? 0 : p.agoraNumericUid ?? 0;
            const screenAgoraUid = isMe ? 0 : p.screenAgoraNumericUid ?? 0;

            return (
              <View
                key={userId}
                style={[
                  styles.twoParticipantItem,
                  index !== list.length - 1 && styles.twoParticipantItemSpacing,
                ]}
              >
                <ParticipantCard
                  userId={String(userId)}
                  displayName={displayName}
                  avatarUrl={p.avatar_url || p.default_avatar_url}
                  handsRaised={Boolean(p.handsRaised)}
                  hasvideoTrack={hasvideoTrack}
                  hasaudioTrack={hasaudioTrack}
                  hasScreenTrack={hasScreenTrack}
                  isMe={isMe}
                  agoraUid={agoraUid}
                  screenAgoraUid={screenAgoraUid}
                  cardWidth={width - 40}
                  joinStatus={p.join_status}
                  color={p.color}
                />
              </View>
            );
          })
        )}
      </ScrollView>
    );
  }

  const cardWidth = (width - 60) / 2;

  const renderItem = ({ item: p }: { item: any }) => {
    const userId = p.user_id ?? p.id;
    const isMe =
      String(userId) === String(currentUser?.user_id ?? currentUser?.id);
    const displayName = isMe
      ? 'You'
      : p.full_name || p.username || p.name || 'User';
    const hasvideoTrack = p.videoTrack ?? false;
    const hasaudioTrack = p.audioTrack ?? false;
    const hasScreenTrack = p.screenTrack ?? false;
    const agoraUid = isMe ? 0 : p.agoraNumericUid ?? 0;
    const screenAgoraUid = isMe ? 0 : p.screenAgoraNumericUid ?? 0;

    return (
      <ParticipantCard
        userId={String(userId)}
        displayName={displayName}
        avatarUrl={p.avatar_url || p.default_avatar_url}
        handsRaised={Boolean(p.handsRaised)}
        hasvideoTrack={hasvideoTrack}
        hasaudioTrack={hasaudioTrack}
        hasScreenTrack={hasScreenTrack}
        isMe={isMe}
        agoraUid={agoraUid}
        screenAgoraUid={screenAgoraUid}
        cardWidth={cardWidth}
        joinStatus={p.join_status}
        color={p.color}
      />
    );
  };

  return (
    <FlatList
      data={joinLoading ? [] : list}
      renderItem={renderItem}
      keyExtractor={item => String(item.user_id ?? item.id)}
      numColumns={2}
      scrollEnabled={true}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.listContent}
      ListEmptyComponent={
        joinLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator color={colors.white} />
            <AppText variant="bold" style={styles.loadingText}>
              Joining the call...
            </AppText>
          </View>
        ) : null
      }
    />
  );
};
