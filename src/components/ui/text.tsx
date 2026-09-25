import React from 'react';
import { Text, TextProps, StyleSheet } from 'react-native';
import { fonts } from '../../theme/typography';
import { s } from 'react-native-size-matters';
import { useTheme } from '@/theme/ThemeProvider';

interface AppTextProps extends TextProps {
  variant?: 'bold' | 'semiBold' | 'medium' | 'regular';
  size?: number;
  children: React.ReactNode;
}

export const AppText: React.FC<AppTextProps> = ({
  style,
  variant = 'regular',
  size = 15,
  ...props
}) => {
  const { colors } = useTheme();

  return (
    <Text
      allowFontScaling={false}
      style={[
        styles.base,
        styles[variant],
        { fontSize: s(size), color: colors.textPrimary },
        style,
      ]}
      {...props}
    />
  );
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
