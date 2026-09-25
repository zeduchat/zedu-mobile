import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import BuzzHome from '@/screens/buzz';
import JoinMeetingScreen from '@/screens/buzz/joining-screen';
import CallScreen from '@/screens/buzz/call-screen';
import GreenRoom from '@/screens/buzz/greenroom';
import { BuzzData } from '@/services/buzz.service';
import ChannelCallScreen from '@/screens/buzz/channel-call-screen';

export type BuzzStackParamList = {
  BuzzHome: undefined;
  JoiningMeeting: undefined;
  GreenRoom: {
    buzzCode: string;
    buzzData: BuzzData;
  };
  CallScreen: {
    buzzCode: string;
    buzzData: BuzzData;
  };
  ChannelCall: {
    buzzCode: string;
    buzzData: BuzzData;
  };
};

const Stack = createStackNavigator<BuzzStackParamList>();

export const BuzzStack = () => (
  <Stack.Navigator
    screenOptions={{
      headerShown: false,
      // ...TransitionPresets.SlideFromRightIOS,
    }}
  >
    <Stack.Screen name="BuzzHome" component={BuzzHome} />
    <Stack.Screen name="JoiningMeeting" component={JoinMeetingScreen} />
    <Stack.Screen name="GreenRoom" component={GreenRoom} />
    <Stack.Screen name="CallScreen" component={CallScreen} />
    <Stack.Screen name="ChannelCall" component={ChannelCallScreen} />
  </Stack.Navigator>
);
