import React, { useMemo } from 'react';
import { View, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { AppText } from '@/components/ui/text';
import { useTheme } from '@/theme/ThemeProvider';
import { createChatDetailStyles } from '@/theme/createScreenStyles';
import FontAwesome5Icon from 'react-native-vector-icons/FontAwesome5';
import Ionicons from 'react-native-vector-icons/Ionicons';
import FastImage from 'react-native-fast-image';

export type ThreadReferenceType = 'channel' | 'group' | 'user';

type Props = {
  navigation: any;
  referenceType: ThreadReferenceType;
  referenceLabel: string;
  referenceAvatarUrl?: string;
  isPrivateChannel?: boolean;
};

const ThreadScreenHeader = ({
  navigation,
  referenceType,
  referenceLabel,
  referenceAvatarUrl,
  isPrivateChannel = false,
}: Props) => {
  const { colors } = useTheme();
  const styles = useMemo(() => createChatDetailStyles(colors), [colors]);
  const localStyles = useMemo(() => createLocalStyles(), []);

  const renderReferenceIcon = () => {
    if (referenceType === 'user') {
      if (referenceAvatarUrl) {
        return (
          <FastImage
            source={{ uri: referenceAvatarUrl }}
            style={localStyles.referenceAvatar}
          />
        );
      }

      return <Ionicons name="person" size={13} color={colors.textSecondary} />;
    }

    if (referenceType === 'channel') {
      return (
        <FontAwesome5Icon
          name={isPrivateChannel ? 'lock' : 'hashtag'}
          size={12}
          color={colors.textSecondary}
        />
      );
    }

    return <Ionicons name="people" size={13} color={colors.textSecondary} />;
  };

  return (
    <View style={[styles.header, localStyles.header]}>
      <TouchableOpacity
        onPress={() => navigation.goBack()}
        style={styles.backBtn}
      >
        <Image
          source={require('@/assets/icons/back.png')}
          style={styles.headerIcon}
        />
      </TouchableOpacity>

      <View style={[styles.headerInfo, localStyles.headerInfo]}>
        <AppText variant="bold" size={15}>
          Thread
        </AppText>
        <View style={localStyles.referenceRow}>
          {renderReferenceIcon()}
          <AppText
            size={12}
            numberOfLines={1}
            style={{ color: colors.textSecondary, flex: 1 }}
          >
            {referenceLabel}
          </AppText>
        </View>
      </View>

      <View style={localStyles.headerSpacer} />
    </View>
  );
};

function createLocalStyles() {
  return StyleSheet.create({
    header: {
      height: undefined,
      minHeight: 60,
      paddingVertical: 8,
    },
    headerInfo: {
      justifyContent: 'center',
    },
    referenceRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      marginTop: 2,
    },
    referenceAvatar: {
      width: 14,
      height: 14,
      borderRadius: 7,
    },
    headerSpacer: {
      width: 40,
    },
  });
}

export default ThreadScreenHeader;
