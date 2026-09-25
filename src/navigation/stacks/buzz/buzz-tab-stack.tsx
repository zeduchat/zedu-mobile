import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import BuzzHome from '@/screens/buzz';
import AllBuzzesScreen from '@/screens/buzz/all-buzzes';

export type BuzzTabStackParamList = {
  BuzzHome: undefined;
  AllBuzzes: undefined;
};

const Stack = createStackNavigator<BuzzTabStackParamList>();

export const BuzzTabStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="BuzzHome" component={BuzzHome} />
    <Stack.Screen name="AllBuzzes" component={AllBuzzesScreen} />
  </Stack.Navigator>
);
