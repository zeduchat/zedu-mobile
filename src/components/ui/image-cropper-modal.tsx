import React, { useMemo, useState, useRef, useEffect } from 'react';
import {
  View,
  Modal,
  Image,
  TouchableOpacity,
  Dimensions,
  PanResponder,
  Animated,
  ActivityIndicator,
} from 'react-native';
import { AppText } from './text';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useTheme } from '@/theme/ThemeProvider';
import { createImageCropperStyles } from '@/theme/createStep10Styles';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface ImageCropperModalProps {
  visible: boolean;
  imagePath: string;
  onCrop: (croppedImagePath: string) => void;
  onCancel: () => void;
  aspectRatio?: 'square' | 'circle' | 'free';
}

const CROP_FRAME_SIZE = 280;

const ImageCropperModal = ({
  visible,
  imagePath,
  onCrop,
  onCancel,
  aspectRatio = 'square',
}: ImageCropperModalProps) => {
  const { colors } = useTheme();
  const styles = useMemo(() => createImageCropperStyles(colors), [colors]);
  const [imageLayout, setImageLayout] = useState({ width: 0, height: 0 });
  const [isCropping, setIsCropping] = useState(false);
  const [initialScale, setInitialScale] = useState(1);

  // Animation values
  const scale = useRef(new Animated.Value(1)).current;
  const panX = useRef(new Animated.Value(0)).current;
  const panY = useRef(new Animated.Value(0)).current;

  // Refs for pan tracking
  const lastOffsetRef = useRef({ x: 0, y: 0 });

  // State values for pan and scale
  const [currentScale, setCurrentScale] = useState(1);
  const [_currentPanX, setCurrentPanX] = useState(0);
  const [_currentPanY, setCurrentPanY] = useState(0);

  // Pan responder for moving the image
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderMove: (_, { dx, dy }) => {
        panX.setValue(lastOffsetRef.current.x + dx);
        panY.setValue(lastOffsetRef.current.y + dy);
      },
      onPanResponderRelease: (_, { dx, dy }) => {
        lastOffsetRef.current.x += dx;
        lastOffsetRef.current.y += dy;
        setCurrentPanX(lastOffsetRef.current.x);
        setCurrentPanY(lastOffsetRef.current.y);
      },
    }),
  ).current;

  useEffect(() => {
    if (visible && imagePath) {
      // Reset values when modal opens
      scale.setValue(initialScale);
      panX.setValue(0);
      panY.setValue(0);
      lastOffsetRef.current = { x: 0, y: 0 };
      setCurrentScale(initialScale);
      setCurrentPanX(0);
      setCurrentPanY(0);

      // Get image dimensions
      Image.getSize(
        imagePath,
        (width, height) => {
          setImageLayout({ width, height });
          // Calculate initial scale to fit crop frame
          const scaleX = CROP_FRAME_SIZE / width;
          const scaleY = CROP_FRAME_SIZE / height;
          const calculatedScale = Math.max(scaleX, scaleY);
          setInitialScale(calculatedScale);
          setCurrentScale(calculatedScale);
          scale.setValue(calculatedScale);
        },
        () => {
          const defaultScale = CROP_FRAME_SIZE / 400;
          setImageLayout({ width: 400, height: 400 });
          setInitialScale(defaultScale);
          setCurrentScale(defaultScale);
          scale.setValue(defaultScale);
        },
      );
    }
  }, [visible, imagePath]);

  const handleZoomIn = () => {
    const newScale = Math.min(currentScale + 0.3, 4);
    setCurrentScale(newScale);
    Animated.spring(scale, {
      toValue: newScale,
      useNativeDriver: true,
      tension: 50,
      friction: 8,
    }).start();
  };

  const handleZoomOut = () => {
    const newScale = Math.max(currentScale - 0.3, initialScale);
    setCurrentScale(newScale);
    Animated.spring(scale, {
      toValue: newScale,
      useNativeDriver: true,
      tension: 50,
      friction: 8,
    }).start();
  };

  const handleReset = () => {
    setCurrentScale(initialScale);
    setCurrentPanX(0);
    setCurrentPanY(0);
    lastOffsetRef.current = { x: 0, y: 0 };

    Animated.parallel([
      Animated.spring(scale, {
        toValue: initialScale,
        useNativeDriver: true,
      }),
      Animated.spring(panX, {
        toValue: 0,
        useNativeDriver: true,
      }),
      Animated.spring(panY, {
        toValue: 0,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handleCrop = async () => {
    setIsCropping(true);
    try {
      // For a production app, you would use native modules to crop the image
      // For now, we'll pass the image as-is with transform info
      // In a real implementation, you'd use something like:
      // - ImageEditor (React Native built-in)
      // - Native iOS/Android crop functionality

      // Simulating crop processing
      setTimeout(() => {
        onCrop(imagePath);
        setIsCropping(false);
      }, 500);
    } catch (error) {
      console.error('Error cropping image:', error);
      setIsCropping(false);
    }
  };

  const getCropFrameSize = () => {
    if (aspectRatio === 'circle') {
      return {
        width: CROP_FRAME_SIZE,
        height: CROP_FRAME_SIZE,
        borderRadius: CROP_FRAME_SIZE / 2,
      };
    }
    return {
      width: CROP_FRAME_SIZE,
      height: CROP_FRAME_SIZE,
      borderRadius: 12,
    };
  };

  const cropFrameStyle = getCropFrameSize();
  const _scaledImageWidth = imageLayout.width * currentScale;
  const _scaledImageHeight = imageLayout.height * currentScale;

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onCancel}
      statusBarTranslucent
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onCancel} disabled={isCropping}>
            <AppText style={styles.headerButtonText}>Cancel</AppText>
          </TouchableOpacity>
          <AppText variant="bold" style={styles.headerTitle}>
            Crop Image
          </AppText>
          <TouchableOpacity onPress={handleCrop} disabled={isCropping}>
            {isCropping ? (
              <ActivityIndicator color={colors.primary} size={24} />
            ) : (
              <AppText
                style={[styles.headerButtonText, { color: colors.primary }]}
              >
                Done
              </AppText>
            )}
          </TouchableOpacity>
        </View>

        {/* Image Preview Area */}
        <View style={styles.previewContainer}>
          <Animated.View
            style={[
              styles.imageContainer,
              {
                transform: [
                  { scale },
                  { translateX: panX },
                  { translateY: panY },
                ],
              },
            ]}
            {...panResponder.panHandlers}
          >
            <Image
              source={{ uri: imagePath }}
              style={{
                width: imageLayout.width || 400,
                height: imageLayout.height || 400,
              }}
            />
          </Animated.View>

          {/* Crop Overlay */}
          <View style={styles.overlayContainer}>
            {/* Top overlay */}
            <View
              style={[
                styles.overlay,
                {
                  height: (SCREEN_HEIGHT - CROP_FRAME_SIZE) / 2 - 60,
                  width: '100%',
                },
              ]}
            />

            {/* Middle section with side overlays */}
            <View style={styles.middleRow}>
              {/* Left overlay */}
              <View
                style={[
                  styles.overlay,
                  {
                    width: (SCREEN_WIDTH - CROP_FRAME_SIZE) / 2,
                    height: CROP_FRAME_SIZE,
                  },
                ]}
              />

              {/* Crop frame */}
              <View style={[styles.cropFrame, cropFrameStyle]}>
                <View style={styles.cornerTL} />
                <View style={styles.cornerTR} />
                <View style={styles.cornerBL} />
                <View style={styles.cornerBR} />
              </View>

              {/* Right overlay */}
              <View
                style={[
                  styles.overlay,
                  {
                    width: (SCREEN_WIDTH - CROP_FRAME_SIZE) / 2,
                    height: CROP_FRAME_SIZE,
                  },
                ]}
              />
            </View>

            {/* Bottom overlay */}
            <View
              style={[
                styles.overlay,
                {
                  height: (SCREEN_HEIGHT - CROP_FRAME_SIZE) / 2 - 60,
                  width: '100%',
                },
              ]}
            />
          </View>
        </View>

        {/* Controls */}
        <View style={styles.controls}>
          <TouchableOpacity
            style={styles.controlButton}
            onPress={handleZoomOut}
            disabled={isCropping}
          >
            <Ionicons name="remove-outline" size={24} color="#FFFFFF" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.controlButton}
            onPress={handleReset}
            disabled={isCropping}
          >
            <Ionicons name="refresh-outline" size={24} color="#FFFFFF" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.controlButton}
            onPress={handleZoomIn}
            disabled={isCropping}
          >
            <Ionicons name="add-outline" size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        {/* Scale indicator */}
        <View style={styles.scaleIndicator}>
          <AppText style={styles.scaleText}>
            {((currentScale / initialScale) * 100).toFixed(0)}%
          </AppText>
        </View>
      </View>
    </Modal>
  );
};

export default ImageCropperModal;
