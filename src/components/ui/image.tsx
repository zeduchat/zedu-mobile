import React from 'react';
import FastImage, {
  FastImageProps,
  ResizeMode,
  Source,
} from 'react-native-fast-image';

interface AppImageProps extends Omit<FastImageProps, 'source'> {
  uri?: string;
  style?: any;
  resizeMode?: ResizeMode;
  fallback?: any;
}

const AppImage = ({
  uri,
  style,
  resizeMode = FastImage.resizeMode.cover,
  fallback = require('@/assets/images/user.png'),
  ...props
}: AppImageProps) => {
  const source: Source =
    uri && uri.trim() !== ''
      ? {
          uri,
          priority: FastImage.priority.high,
          cache: FastImage.cacheControl.immutable,
        }
      : fallback;

  return (
    <FastImage
      style={style}
      source={source}
      resizeMode={resizeMode}
      {...props}
    />
  );
};

export default AppImage;
