import React, { useMemo } from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Container from '@/components/layout/container';
import { AppText } from '@/components/ui/text';
import { useTheme } from '@/theme/ThemeProvider';
import type { ThemePreference } from '@/theme/types';
import { normalize } from '@/utils/normalize';

type AppearanceOption = {
  value: ThemePreference;
  label: string;
  subtitle: string;
  icon: string;
};

const APPEARANCE_OPTIONS: AppearanceOption[] = [
  {
    value: 'light',
    label: 'Light',
    subtitle: 'Always use light appearance',
    icon: 'sunny-outline',
  },
  {
    value: 'dark',
    label: 'Dark',
    subtitle: 'Always use dark appearance',
    icon: 'moon-outline',
  },
  {
    value: 'system',
    label: 'System default',
    subtitle: 'Match your device settings',
    icon: 'phone-portrait-outline',
  },
];

export function getThemePreferenceLabel(preference: ThemePreference): string {
  switch (preference) {
    case 'light':
      return 'Light';
    case 'dark':
      return 'Dark';
    case 'system':
      return 'System default';
  }
}

const AppearanceScreen = () => {
  const navigation = useNavigation();
  const { colors, preference, setPreference } = useTheme();

  const styles = useMemo(
    () =>
      StyleSheet.create({
        header: {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: normalize(16),
          paddingVertical: normalize(14),
          borderBottomWidth: StyleSheet.hairlineWidth,
          borderBottomColor: colors.border,
          backgroundColor: colors.background,
        },
        backBtn: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: 8,
        },
        headerTitle: {
          fontSize: 18,
          color: colors.textPrimary,
        },
        content: {
          paddingHorizontal: normalize(16),
          paddingTop: normalize(16),
          paddingBottom: normalize(40),
        },
        description: {
          color: colors.textSecondary,
          marginBottom: normalize(16),
          lineHeight: normalize(20),
        },
        groupCard: {
          backgroundColor: colors.surface,
          borderRadius: 12,
          overflow: 'hidden',
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: colors.border,
        },
        optionRow: {
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: normalize(14),
          paddingVertical: normalize(14),
        },
        iconContainer: {
          width: 32,
          alignItems: 'center',
        },
        textContainer: {
          flex: 1,
          marginLeft: normalize(12),
        },
        optionTitle: {
          fontSize: 16,
          color: colors.textPrimary,
        },
        optionSubtitle: {
          fontSize: 13,
          color: colors.textSecondary,
          marginTop: 2,
        },
        divider: {
          height: StyleSheet.hairlineWidth,
          backgroundColor: colors.border,
          marginLeft: normalize(58),
        },
      }),
    [colors],
  );

  return (
    <Container>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backBtn}
        >
          <Ionicons name="chevron-back" size={24} color={colors.iconDefault} />
          <AppText variant="bold" style={styles.headerTitle}>
            Appearance
          </AppText>
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        <AppText size={14} style={styles.description}>
          Choose whether Zedu looks light or dark, or follows your device
          settings.
        </AppText>

        <View style={styles.groupCard}>
          {APPEARANCE_OPTIONS.map((option, index) => {
            const isSelected = preference === option.value;

            return (
              <React.Fragment key={option.value}>
                {index > 0 && <View style={styles.divider} />}
                <TouchableOpacity
                  style={styles.optionRow}
                  activeOpacity={0.7}
                  onPress={() => setPreference(option.value)}
                >
                  <View style={styles.iconContainer}>
                    <Ionicons
                      name={option.icon}
                      size={22}
                      color={colors.iconDefault}
                    />
                  </View>
                  <View style={styles.textContainer}>
                    <AppText variant="medium" style={styles.optionTitle}>
                      {option.label}
                    </AppText>
                    <AppText style={styles.optionSubtitle}>
                      {option.subtitle}
                    </AppText>
                  </View>
                  {isSelected && (
                    <Ionicons
                      name="checkmark"
                      size={22}
                      color={colors.primary}
                    />
                  )}
                </TouchableOpacity>
              </React.Fragment>
            );
          })}
        </View>
      </View>
    </Container>
  );
};

export default AppearanceScreen;
