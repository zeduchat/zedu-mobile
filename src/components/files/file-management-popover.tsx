import React, { useRef, useState } from 'react';
import { Animated, Pressable, TouchableOpacity, View } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { AppText } from '@/components/ui/text';
import FastImage from 'react-native-fast-image';
import { useTheme } from '@/theme/ThemeProvider';
import { useFileManagementStyles } from '@/components/files/file-management.styles';

type FileManagementPopoverProps = {
  onUploadFile: () => void;
  onNewFolder: () => void;
};

export const FileManagementPopover: React.FC<FileManagementPopoverProps> = ({
  onUploadFile,
  onNewFolder,
}) => {
  const { colors } = useTheme();
  const styles = useFileManagementStyles();
  const [isVisible, setIsVisible] = useState(false);
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  const toggle = (show: boolean) => {
    if (show) {
      setIsVisible(true);
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 50,
          friction: 7,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(scaleAnim, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }),
      ]).start(() => {
        setIsVisible(false);
        scaleAnim.setValue(0);
        opacityAnim.setValue(0);
      });
    }
  };

  const handleUpload = () => {
    toggle(false);
    onUploadFile();
  };

  const handleNewFolder = () => {
    toggle(false);
    onNewFolder();
  };

  return (
    <View style={styles.popoverWrapper} pointerEvents="box-none">
      {isVisible && (
        <>
          <Pressable
            style={styles.popoverOverlay}
            onPress={() => toggle(false)}
          />
          <Animated.View
            style={[
              styles.popoverCard,
              {
                opacity: opacityAnim,
                transform: [
                  { scale: scaleAnim },
                  {
                    translateY: scaleAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [20, 0],
                    }),
                  },
                ],
              },
            ]}
          >
            <TouchableOpacity
              style={styles.popoverMenuItem}
              onPress={handleUpload}
            >
              <Ionicons
                name="cloud-upload-outline"
                size={22}
                color={colors.textPrimary}
                style={styles.popoverMenuIcon}
              />
              <AppText
                variant="medium"
                size={15}
                style={styles.popoverMenuText}
              >
                Upload file
              </AppText>
            </TouchableOpacity>

            <View style={styles.popoverSeparator} />

            <TouchableOpacity
              style={styles.popoverMenuItem}
              onPress={handleNewFolder}
            >
              <Ionicons
                name="folder-outline"
                size={22}
                color={colors.textPrimary}
                style={styles.popoverMenuIcon}
              />
              <AppText
                variant="medium"
                size={15}
                style={styles.popoverMenuText}
              >
                New Folder
              </AppText>
            </TouchableOpacity>
          </Animated.View>
        </>
      )}

      <TouchableOpacity
        style={[styles.popoverFab, isVisible && styles.popoverFabActive]}
        onPress={() => toggle(!isVisible)}
        activeOpacity={0.9}
      >
        <Animated.View
          style={{
            transform: [
              {
                rotate: opacityAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: ['0deg', '45deg'],
                }),
              },
            ],
          }}
        >
          <FastImage
            source={require('@/assets/icons/plus.png')}
            style={styles.popoverPlusIcon}
          />
        </Animated.View>
      </TouchableOpacity>
    </View>
  );
};
