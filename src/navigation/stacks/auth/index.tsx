import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import ForgotPasswordEmailScreen from '@/screens/auth/forgot/ForgotPasswordEmailScreen';
import ForgotPasswordCodeScreen from '@/screens/auth/forgot/ForgotPasswordCodeScreen';
import ForgotPasswordResetScreen from '@/screens/auth/forgot/ForgotPasswordResetScreen';

export type AuthStackParamList = {
  ForgotPasswordEmail: undefined;
  ForgotPasswordCode: undefined;
  ForgotPasswordReset: undefined;
};

const Stack = createStackNavigator<AuthStackParamList>();

const AuthStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen
      name="ForgotPasswordEmail"
      component={ForgotPasswordEmailScreen}
    />
    <Stack.Screen
      name="ForgotPasswordCode"
      component={ForgotPasswordCodeScreen}
    />
    <Stack.Screen
      name="ForgotPasswordReset"
      component={ForgotPasswordResetScreen}
    />
  </Stack.Navigator>
);

export default AuthStack;
