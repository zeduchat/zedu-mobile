import React, { useMemo } from 'react';
import { View, TouchableOpacity, Image } from 'react-native';
import { useTheme } from '@/theme/ThemeProvider';
import { createChatPopoverStyles } from '@/theme/createChatOverlayStyles';

export const AppPopover = ({ handleOpen }: any) => {
  const { colors } = useTheme();
  const styles = useMemo(() => createChatPopoverStyles(colors), [colors]);

  return (
    <View style={styles.wrapper} pointerEvents="box-none">
      <TouchableOpacity
        style={styles.fab}
        onPress={handleOpen}
        activeOpacity={0.9}
      >
        <Image
          source={require('@/assets/icons/plus.png')}
          style={styles.plusIcon}
        />
      </TouchableOpacity>
    </View>
  );
};
