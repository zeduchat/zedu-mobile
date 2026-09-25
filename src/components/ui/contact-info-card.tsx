import React, { useMemo } from 'react';
import { View, TouchableOpacity, Clipboard } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { AppText } from '@/components/ui/text';
import { useTheme } from '@/theme/ThemeProvider';
import { createChatInfoStyles } from '@/theme/createScreenStyles';
import { ShowNotify } from '@/components/ui/toast';

interface ContactInfoCardProps {
  icon: string;
  label: string;
  value?: string | null;
  copyable?: boolean;
}

export const ContactInfoCard = ({
  icon,
  label,
  value,
  copyable = false,
}: ContactInfoCardProps) => {
  const { colors } = useTheme();
  const styles = useMemo(() => createChatInfoStyles(colors), [colors]);
  const trimmedValue = value?.trim();
  const displayValue = trimmedValue || 'Not set';
  const canCopy = copyable && Boolean(trimmedValue);

  const handleCopy = () => {
    if (!trimmedValue) return;

    Clipboard.setString(trimmedValue);
    ShowNotify('Copied', `${label} copied to clipboard`);
  };

  return (
    <View style={styles.infoCard}>
      <Ionicons name={icon} size={20} color={colors.primary} />
      <View style={{ marginLeft: 12, flex: 1 }}>
        <AppText size={12} style={{ color: colors.messageMeta }}>
          {label}
        </AppText>
        <AppText
          variant="bold"
          style={{ color: colors.textPrimary, fontSize: 14 }}
        >
          {displayValue}
        </AppText>
      </View>
      {canCopy && (
        <TouchableOpacity
          onPress={handleCopy}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          accessibilityRole="button"
          accessibilityLabel={`Copy ${label}`}
        >
          <Ionicons name="copy-outline" size={18} color={colors.iconDefault} />
        </TouchableOpacity>
      )}
    </View>
  );
};
