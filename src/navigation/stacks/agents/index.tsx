import React from 'react';
import {
  createStackNavigator,
  TransitionPresets,
} from '@react-navigation/stack';
import AgentHome from '@/screens/agents';
import Marketplace from '@/screens/agents/marketplace';
import AgentDetailsScreen from '@/screens/agents/agent-details';
import CreateAgentScreen from '@/screens/agents/create-agent';

export type AgentStackParamList = {
  AgentList: undefined;
  Marketplace: undefined;
  AgentDetails: {
    id: string;
  };
  CreateAgent: undefined;
};

const Stack = createStackNavigator<AgentStackParamList>();

export const AgentStack = () => (
  <Stack.Navigator
    screenOptions={{
      headerShown: false,
      ...TransitionPresets.SlideFromRightIOS,
    }}
  >
    <Stack.Screen name="AgentList" component={AgentHome} />
    <Stack.Screen name="Marketplace" component={Marketplace} />
    <Stack.Screen name="AgentDetails" component={AgentDetailsScreen} />
    <Stack.Screen name="CreateAgent" component={CreateAgentScreen} />
  </Stack.Navigator>
);
