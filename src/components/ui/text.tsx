import React, { useMemo } from 'react';
import { Platform, Text, TextProps, StyleSheet, TextStyle } from 'react-native';
import { fonts } from '../../theme/typography';
import { s } from 'react-native-size-matters';
import { useTheme } from '@/theme/ThemeProvider';

interface AppTextProps extends TextProps {
  variant?: 'bold' | 'semiBold' | 'medium' | 'regular';
  size?: number;
  children: React.ReactNode;
}

const HEADING_VARIANTS = new Set(['bold', 'semiBold']);
const HEADING_SIZE_FLOOR = 16;
const HEADING_SIZE_REDUCTION = 2;

const ANDROID_HEADING_EXTRA_REDUCTION = 4;

export const AppText: React.FC<AppTextProps> = ({
  style,
  variant = 'regular',
  size = 15,
  ...props
}) => {
  const { colors } = useTheme();

  const resolvedStyle = useMemo(() => {
    const flattened = StyleSheet.flatten([
      styles.base,
      styles[variant],
      { fontSize: s(size), color: colors.textPrimary },
      style,
    ]) as TextStyle;

    if (
      HEADING_VARIANTS.has(variant) &&
      typeof flattened.fontSize === 'number' &&
      flattened.fontSize >= s(HEADING_SIZE_FLOOR)
    ) {
      let fontSize = flattened.fontSize - s(HEADING_SIZE_REDUCTION);

      if (Platform.OS === 'android') {
        fontSize -= ANDROID_HEADING_EXTRA_REDUCTION;
      }

      flattened.fontSize = Math.max(
        s(HEADING_SIZE_FLOOR - HEADING_SIZE_REDUCTION),
        fontSize,
      );
    }

    return flattened;
  }, [colors.textPrimary, size, style, variant]);

  return <Text allowFontScaling={false} style={resolvedStyle} {...props} />;
};

const styles = StyleSheet.create({
  base: {
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  bold: { fontFamily: fonts.bold },
  semiBold: { fontFamily: fonts.semiBold },
  medium: { fontFamily: fonts.medium },
  regular: { fontFamily: fonts.regular },
});
