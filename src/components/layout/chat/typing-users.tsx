import React, { useEffect, useMemo } from 'react';
import { View } from 'react-native';
import { AppText } from '@/components/ui/text';
import { useTheme } from '@/theme/ThemeProvider';
import { useDataContext } from '@/store/useDataContext';
import { ACTIONS } from '@/store/types';
import { createTypingUsersStyles } from '@/theme/createMessageStyles';

const TYPING_EXPIRE_MS = 4000;

const TypingUsers = () => {
  const { colors } = useTheme();
  const styles = useMemo(() => createTypingUsersStyles(colors), [colors]);
  const { state, dispatch } = useDataContext();
  const { userTyping } = state;

  useEffect(() => {
    if (!userTyping?.length) return;

    const interval = setInterval(() => {
      const now = Date.now();
      userTyping.forEach((typer: any) => {
        if (now - (typer?.at || 0) > TYPING_EXPIRE_MS) {
          dispatch({
            type: ACTIONS.USER_TYPING,
            payload: { userId: typer.id, typing: false },
          });
        }
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [userTyping, dispatch]);

  if (!userTyping?.length) return null;

  const names = userTyping
    .map((typer: any) => (typeof typer === 'string' ? typer : typer?.username))
    .filter(Boolean);

  if (!names.length) return null;

  let label = '';
  if (names.length === 1) {
    label = `${names[0]} is typing…`;
  } else if (names.length === 2) {
    label = `${names[0]} and ${names[1]} are typing…`;
  } else {
    label = 'Several people are typing…';
  }

  return (
    <View style={styles.container}>
      <AppText style={styles.text}>{label}</AppText>
    </View>
  );
};

export default TypingUsers;
