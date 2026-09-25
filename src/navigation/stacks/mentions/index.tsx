import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import MentionsScreen from '@/screens/mentions';
import MentionThreadScreen from '@/screens/mentions/mention-thread';

export type MentionStackParamList = {
  MentionList: undefined;
  MentionThread: {
    thread_id: string;
    channel_id: string;
    mention: any;
  };
};

const Stack = createStackNavigator<MentionStackParamList>();

export const MentionStack = () => (
  <Stack.Navigator
    screenOptions={{
      headerShown: false,
      // ...TransitionPresets.SlideFromRightIOS,
    }}
  >
    <Stack.Screen name="MentionList" component={MentionsScreen} />
    <Stack.Screen name="MentionThread" component={MentionThreadScreen} />
  </Stack.Navigator>
);
