import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import OngoingDirectCallScreen from '@/screens/direct-calls/ongoing-call-screen';
import IncomingDirectCallScreen from '@/screens/direct-calls/incoming-call-screen';
import { IncomingBuzzInvite } from '@/services/direct-call-invite-queue.service';

export type DirectCallStackParamList = {
  IncomingDirectCall: {
    invite: IncomingBuzzInvite;
  };
  OngoingDirectCall: {
    buzzCode: string;
    buzzData: any;
    callId?: string;
    shouldInitiate?: boolean;
    calleeUserIds?: string[];
  };
};

const Stack = createStackNavigator<DirectCallStackParamList>();

export const DirectCallStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen
      name="IncomingDirectCall"
      component={IncomingDirectCallScreen}
    />
    <Stack.Screen
      name="OngoingDirectCall"
      component={OngoingDirectCallScreen}
    />
  </Stack.Navigator>
);
