import React from 'react';
import { RefreshControl, RefreshControlProps } from 'react-native';
import { useTheme } from '@/theme/ThemeProvider';

export function ThemedRefreshControl(props: RefreshControlProps) {
  const { colors, isDark } = useTheme();

  return (
    <RefreshControl
      {...props}
      tintColor={colors.primary}
      colors={[colors.primary]}
      progressBackgroundColor={isDark ? colors.surface : colors.white}
    />
  );
}
