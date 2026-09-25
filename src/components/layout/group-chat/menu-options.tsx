import React, { useMemo } from 'react';
import { AppText } from '@/components/ui/text';
import { TouchableOpacity, View } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { useTheme } from '@/theme/ThemeProvider';
import { createChatMenuOptionsStyles } from '@/theme/createChatOverlayStyles';

const MenuOptions = () => {
  const { colors } = useTheme();
  const menuStyles = useMemo(
    () => createChatMenuOptionsStyles(colors),
    [colors],
  );

  return (
    <View style={menuStyles.container}>
      <View style={menuStyles.card}>
        <TouchableOpacity style={menuStyles.menuItem}>
          <AppText style={menuStyles.menuText}>Raise Hand</AppText>
          <MaterialIcons
            name="back-hand"
            size={22}
            color={colors.textPrimary}
          />
        </TouchableOpacity>
        <View style={menuStyles.divider} />
        <TouchableOpacity style={menuStyles.menuItem}>
          <AppText style={menuStyles.menuText}>Share Screen</AppText>
          <MaterialCommunityIcons
            name="monitor"
            size={22}
            color={colors.textPrimary}
          />
        </TouchableOpacity>
        <View style={menuStyles.divider} />
        <TouchableOpacity style={menuStyles.menuItem}>
          <AppText style={menuStyles.menuText}>Copy buzz link</AppText>
          <MaterialCommunityIcons
            name="link-variant"
            size={22}
            color={colors.textPrimary}
          />
        </TouchableOpacity>
        <View style={menuStyles.divider} />
        <TouchableOpacity style={menuStyles.menuItem}>
          <AppText style={menuStyles.menuText}>Participants</AppText>
          <MaterialCommunityIcons
            name="account-group"
            size={22}
            color={colors.textPrimary}
          />
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default MenuOptions;
