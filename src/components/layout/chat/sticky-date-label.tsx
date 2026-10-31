import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { AppText } from '@/components/ui/text';
import { useTheme } from '@/theme/ThemeProvider';
import { ThemeColors } from '@/theme/types';

const LABEL_OFFSET = 8;

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    overlay: {
      position: 'absolute',
      left: 0,
      right: 0,
      alignItems: 'center',
      zIndex: 1,
    },
    pill: {
      backgroundColor: colors.dateHeaderBackground,
      paddingHorizontal: 12,
      paddingVertical: 4,
      borderRadius: 8,
    },
    text: {
      color: colors.messageMeta,
      fontSize: 12,
      fontWeight: '500',
    },
  });

// Keeps the current day's date pinned at the top edge of a chat list
const StickyDateLabel = ({ label, top }: { label: string; top: number }) => {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const position = useMemo(() => ({ top: top + LABEL_OFFSET }), [top]);

  if (!label) return null;

  return (
    <View pointerEvents="none" style={[styles.overlay, position]}>
      <View style={styles.pill}>
        <AppText style={styles.text}>{label}</AppText>
      </View>
    </View>
  );
};

export default StickyDateLabel;
