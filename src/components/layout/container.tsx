import React, { useEffect, useMemo } from 'react';
import { Platform, StatusBar, StyleSheet, View } from 'react-native';
import { s } from 'react-native-size-matters';
import { AppText } from '../ui/text';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useDataContext } from '@/store/useDataContext';
import { isAndroid15Plus, statusBarTopPadding } from '@/utils/status-bar-inset';
import { ACTIONS } from '@/store/types';
import { useTheme } from '@/theme/ThemeProvider';
import Animated, { FadeInUp, FadeOutUp } from 'react-native-reanimated';

interface Props {
  children: any;
  /** Brand header band with light status bar content. */
  dark?: boolean;
  color?: string;
}

const Container = (props: Props) => {
  const { colors } = useTheme();
  const { state, dispatch } = useDataContext();
  const insets = useSafeAreaInsets();
  const topPadding = statusBarTopPadding(insets.top);
  const toastTopPadding =
    Platform.OS === 'ios' ? 60 : isAndroid15Plus ? insets.top + 15 : 30;

  const styles = useMemo(
    () =>
      StyleSheet.create({
        error: {
          backgroundColor: colors.error,
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 9999,
          paddingBottom: 15,
          elevation: 5,
          shadowColor: colors.black,
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.2,
          shadowRadius: 4,
        },
        success: {
          backgroundColor: colors.online,
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 9999,
          paddingBottom: 15,
          elevation: 5,
          shadowColor: colors.black,
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.2,
          shadowRadius: 4,
        },
      }),
    [colors],
  );

  const headerBackground = props.dark
    ? colors.secondary
    : props.color ?? colors.statusBarBackground;

  const statusBarBackground = state?.error
    ? colors.error
    : state?.success
    ? colors.online
    : props.color ?? headerBackground;

  const statusBarStyle =
    state?.error || state?.success || props.dark
      ? 'light-content'
      : colors.statusBarStyle;

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    if (state?.success || state?.error) {
      timer = setTimeout(() => {
        dispatch({
          type: state.success ? ACTIONS.SUCCESS : ACTIONS.ERROR,
          payload: null,
        });
      }, 3000);
    }
    return () => {
      if (timer) {
        clearTimeout(timer);
      }
    };
  }, [state.error, state.success, dispatch]);

  return (
    <View
      style={{
        backgroundColor: headerBackground,
        flex: 1,
        paddingTop: topPadding,
      }}
    >
      <StatusBar
        translucent={false}
        barStyle={statusBarStyle}
        backgroundColor={statusBarBackground}
      />

      {state?.error && (
        <Animated.View
          entering={FadeInUp.duration(400)}
          exiting={FadeOutUp.duration(400)}
          style={[styles.error, { paddingTop: toastTopPadding }]}
        >
          <AppText
            style={{ color: colors.white, fontSize: s(12), fontWeight: '600' }}
          >
            {state?.error}
          </AppText>
        </Animated.View>
      )}

      {state?.success && (
        <Animated.View
          entering={FadeInUp.duration(400)}
          exiting={FadeOutUp.duration(400)}
          style={[styles.success, { paddingTop: toastTopPadding }]}
        >
          <AppText
            style={{ color: colors.white, fontSize: s(12), fontWeight: '600' }}
          >
            {state?.success}
          </AppText>
        </Animated.View>
      )}

      <View style={{ backgroundColor: colors.background, flex: 1 }}>
        {props.children}
      </View>
    </View>
  );
};

export default Container;
