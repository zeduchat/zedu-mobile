import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { Appearance, useColorScheme, type ColorSchemeName } from 'react-native';
import type { Theme as NavigationTheme } from '@react-navigation/native';
import { retrieveData, storeData } from '@/utils/helper';
import { buildNavigationTheme } from './navigation-theme';
import { darkColors, lightColors } from './palettes';
import type { AppTheme, ResolvedColorScheme, ThemePreference } from './types';

const THEME_PREFERENCE_KEY = 'themePreference';

const isThemePreference = (value: unknown): value is ThemePreference =>
  value === 'light' || value === 'dark' || value === 'system';

const resolveColorScheme = (
  preference: ThemePreference,
  systemScheme: ColorSchemeName,
): ResolvedColorScheme => {
  if (preference === 'system') {
    return systemScheme === 'dark' ? 'dark' : 'light';
  }
  return preference;
};

type ThemeContextValue = {
  preference: ThemePreference;
  setPreference: (preference: ThemePreference) => Promise<void>;
  colorScheme: ResolvedColorScheme;
  isDark: boolean;
  colors: AppTheme['colors'];
  theme: AppTheme;
  navigationTheme: NavigationTheme;
  isReady: boolean;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

type ThemeProviderProps = {
  children: React.ReactNode;
};

export function ThemeProvider({ children }: ThemeProviderProps) {
  const systemColorScheme = useColorScheme();
  const [preference, setPreferenceState] = useState<ThemePreference>('light');
  const [isReady, setIsReady] = useState(false);
  const [systemScheme, setSystemScheme] = useState<ColorSchemeName>(
    Appearance.getColorScheme() ?? 'light',
  );

  useEffect(() => {
    let isMounted = true;

    const loadPreference = async () => {
      const stored = await retrieveData(THEME_PREFERENCE_KEY);
      if (!isMounted) {
        return;
      }

      if (isThemePreference(stored)) {
        setPreferenceState(stored);
      }

      setIsReady(true);
    };

    loadPreference();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    const subscription = Appearance.addChangeListener(({ colorScheme }) => {
      setSystemScheme(colorScheme);
    });

    return () => subscription.remove();
  }, []);

  const effectiveSystemScheme = systemColorScheme ?? systemScheme ?? 'light';
  const colorScheme = resolveColorScheme(preference, effectiveSystemScheme);
  const isDark = colorScheme === 'dark';

  const theme = useMemo<AppTheme>(
    () => ({
      colorScheme,
      isDark,
      colors: isDark ? darkColors : lightColors,
    }),
    [colorScheme, isDark],
  );

  const navigationTheme = useMemo(() => buildNavigationTheme(theme), [theme]);

  const setPreference = useCallback(async (next: ThemePreference) => {
    setPreferenceState(next);
    await storeData(THEME_PREFERENCE_KEY, next);
  }, []);

  const value = useMemo<ThemeContextValue>(
    () => ({
      preference,
      setPreference,
      colorScheme,
      isDark,
      colors: theme.colors,
      theme,
      navigationTheme,
      isReady,
    }),
    [
      preference,
      setPreference,
      colorScheme,
      isDark,
      theme,
      navigationTheme,
      isReady,
    ],
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);

  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }

  return context;
}

export { THEME_PREFERENCE_KEY };
