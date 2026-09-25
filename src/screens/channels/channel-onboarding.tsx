import React, { forwardRef, useMemo } from 'react';
import { View, Image, TouchableOpacity } from 'react-native';
import { AppText } from '@/components/ui/text';
import { useTheme } from '@/theme/ThemeProvider';
import { createChannelSetupStyles } from '@/theme/createStep10Styles';
import { AppBottomSheetRef } from '@/components/ui/bottom-sheet';
import { useNavigation } from '@react-navigation/native';

const ChannelOnboardingSheet = forwardRef<AppBottomSheetRef, {}>(
  (props, ref) => {
    const { colors } = useTheme();
    const styles = useMemo(
      () => createChannelSetupStyles(colors).channelOnboarding,
      [colors],
    );
    const navigation = useNavigation();

    const createChannel = () => {
      navigation.navigate('ChannelStack', { screen: 'CreateChannel' });

      setTimeout(() => {
        if (ref && 'current' in ref) {
          ref.current?.close();
        }
      }, 1000);
    };

    //

    return (
      <View style={styles.container}>
        {/* Illustration Area */}
        <View style={styles.illustrationContainer}>
          <View style={styles.imageCard}>
            <Image
              source={require('@/assets/images/channel-intro.png')}
              style={styles.illustration}
              resizeMode="contain"
            />
          </View>
        </View>

        {/* Text Content */}
        <View style={styles.content}>
          <AppText variant="bold" style={styles.title}>
            What is a Channel?
          </AppText>

          <AppText style={styles.description}>
            Channels are a one-to-many space where you can share updates with an
            unlimited audience.
          </AppText>
        </View>

        {/* Action Button */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.button}
            activeOpacity={0.8}
            onPress={createChannel}
          >
            <AppText variant="bold" style={{ color: '#FFFFFF', fontSize: 16 }}>
              Get Started
            </AppText>
          </TouchableOpacity>
        </View>
      </View>
    );
  },
);

export default ChannelOnboardingSheet;
