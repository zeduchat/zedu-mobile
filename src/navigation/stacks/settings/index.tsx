import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import SettingsHome from '@/screens/settings';
import ProfileScreen from '@/screens/settings/profile-screen';
import AddOrganisationScreen from '@/screens/org/add-organisation';
import DeleteAccountScreen from '@/screens/settings/delete-account';
import BillingScreen from '@/screens/settings/billing-screen';
import BillingDetailsScreen from '@/screens/settings/billing-details';
import NotificationScreen from '@/screens/settings/notifications';
import InvitePeopleScreen from '@/screens/settings/invite-screen';
import SecurityScreen from '@/screens/settings/security-screen';
import ChangePasswordScreen from '@/screens/settings/change-password';
import AppearanceScreen from '@/screens/settings/appearance';

export type SettingStackParamList = {
  Settings: undefined;
  Profile: undefined;
  AddOrganisation: undefined;
  DeleteAccount: undefined;
  Notifications: undefined;
  Appearance: undefined;
  Billing: undefined;
  BillingDetails: { planDetail: any };
  Invite: undefined;
  Security: undefined;
  ChangePassword: undefined;
};

const Stack = createStackNavigator<SettingStackParamList>();

export const SettingStack = () => (
  <Stack.Navigator
    screenOptions={{
      headerShown: false,
      // ...TransitionPresets.SlideFromRightIOS,
    }}
  >
    <Stack.Screen name="Settings" component={SettingsHome} />
    <Stack.Screen name="Profile" component={ProfileScreen} />
    <Stack.Screen name="AddOrganisation" component={AddOrganisationScreen} />
    <Stack.Screen name="DeleteAccount" component={DeleteAccountScreen} />
    <Stack.Screen name="Notifications" component={NotificationScreen} />
    <Stack.Screen name="Appearance" component={AppearanceScreen} />
    <Stack.Screen name="Billing" component={BillingScreen} />
    <Stack.Screen name="BillingDetails" component={BillingDetailsScreen} />
    <Stack.Screen name="Invite" component={InvitePeopleScreen} />
    <Stack.Screen name="Security" component={SecurityScreen} />
    <Stack.Screen name="ChangePassword" component={ChangePasswordScreen} />
  </Stack.Navigator>
);
