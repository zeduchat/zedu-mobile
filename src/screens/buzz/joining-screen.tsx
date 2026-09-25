import React, { useMemo, useState } from 'react';
import { View, TouchableOpacity, Image } from 'react-native';
import { AppText } from '@/components/ui/text';
import { normalize } from '@/utils/normalize';
import Container from '@/components/layout/container';
import Ionicons from 'react-native-vector-icons/Ionicons';
import FastImage from 'react-native-fast-image';
import { useTheme } from '@/theme/ThemeProvider';
import { createBuzzJoiningStyles } from '@/theme/createBuzzStyles';

const JoinMeetingScreen = () => {
  const { colors } = useTheme();
  const styles = useMemo(() => createBuzzJoiningStyles(colors), [colors]);
  const [isVideoOn, setIsVideoOn] = useState(true);
  const [isMicOn, setIsMicOn] = useState(true);

  return (
    <Container>
      <View style={styles.safeArea}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton}>
            <FastImage
              source={require('@/assets/icons/back.png')}
              style={styles.headerIcon}
            />
          </TouchableOpacity>
          <AppText variant="medium" style={styles.headerTitle}>
            Buzz
          </AppText>
          <View style={styles.headerPlaceholder} />
        </View>

        <View style={styles.titleSection}>
          <AppText variant="bold" style={styles.meetingCode}>
            abc-mnop-xyz
          </AppText>
        </View>

        <View style={styles.previewContainer}>
          <View style={styles.videoCard}>
            <AppText style={styles.userName}>Toyosi</AppText>

            <View style={styles.avatarWrapper}>
              <Image
                source={require('@/assets/images/user.png')}
                style={styles.previewAvatar}
              />
            </View>

            <View style={styles.controlsRow}>
              <TouchableOpacity
                style={[styles.roundBtn, !isVideoOn && styles.btnOff]}
                onPress={() => setIsVideoOn(!isVideoOn)}
                activeOpacity={0.8}
              >
                <Ionicons
                  name={isVideoOn ? 'videocam' : 'videocam-off'}
                  size={normalize(20)}
                  color={colors.white}
                />
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.roundBtn, !isMicOn && styles.btnOff]}
                onPress={() => setIsMicOn(!isMicOn)}
                activeOpacity={0.8}
              >
                <Ionicons
                  name={isMicOn ? 'mic' : 'mic-off'}
                  size={normalize(20)}
                  color={colors.white}
                />
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity style={styles.shareScreenBtn}>
            <Image
              source={require('@/assets/icons/monitor.png')}
              style={styles.shareScreenIcon}
            />
            <AppText variant="semiBold" style={styles.shareScreenText}>
              Share screen
            </AppText>
          </TouchableOpacity>

          <AppText style={styles.statusText}>No one is on the call yet</AppText>
        </View>

        <View style={styles.dividerFull} />

        <View style={styles.infoSection}>
          <View style={styles.infoTitleRow}>
            <View style={styles.infoTitleLabel}>
              <Image
                source={require('@/assets/icons/info-circle.png')}
                style={styles.infoIcon}
              />
              <AppText variant="bold" style={styles.infoTitleText}>
                Joining information
              </AppText>
            </View>
          </View>

          <AppText style={styles.labelSmall}>Meeting link</AppText>

          <View style={styles.linkBox}>
            <AppText numberOfLines={1} style={styles.linkUrl}>
              app.chat/join/general-channel-xyz
            </AppText>
            <TouchableOpacity>
              <Image
                source={require('@/assets/icons/copy-white.png')}
                style={styles.copyIconSmall}
              />
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.joinBtn}>
            <AppText variant="bold" style={styles.joinBtnText}>
              Join
            </AppText>
          </TouchableOpacity>
        </View>
      </View>
    </Container>
  );
};

export default JoinMeetingScreen;
