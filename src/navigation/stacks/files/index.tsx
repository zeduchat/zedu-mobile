import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import FileManagementScreen from '@/screens/files/file-management';
import FileDetailScreen from '@/screens/files/file-detail';

export type FileStackParamList = {
  FileManagement: undefined;
  FileDetail: { fileId: string };
};

const Stack = createStackNavigator<FileStackParamList>();

export const FileStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="FileManagement" component={FileManagementScreen} />
    <Stack.Screen name="FileDetail" component={FileDetailScreen} />
  </Stack.Navigator>
);
