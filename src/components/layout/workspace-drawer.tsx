import React, { useMemo } from 'react';
import {
  View,
  TouchableOpacity,
  FlatList,
  Dimensions,
  Platform,
  StatusBar,
  Linking,
} from 'react-native';
import { DrawerContentComponentProps } from '@react-navigation/drawer';
import { AppText } from '@/components/ui/text';
import Feather from 'react-native-vector-icons/Feather';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useDataContext } from '@/store/useDataContext';
import { Org } from '@/types/organisation';
import { SafeAreaView } from 'react-native-safe-area-context';
import { PutRequest } from '@/utils/requests';
import { ACTIONS } from '@/store/types';
import { storeMultipleData } from '@/utils/helper';
import { CLIENT_URL } from '@env';
import FastImage from 'react-native-fast-image';
import { useTheme } from '@/theme/ThemeProvider';
import { createWorkspaceDrawerStyles } from '@/theme/createScreenStyles';

const { width } = Dimensions.get('window');

const WorkspaceDrawer = (props: DrawerContentComponentProps) => {
  const { state, dispatch } = useDataContext();
  const { colors, isDark } = useTheme();
  const styles = useMemo(
    () => createWorkspaceDrawerStyles(colors, width * 0.85),
    [colors],
  );

  const { org, orgId, callback } = state;
  const { navigation } = props;

  const handleOrg = async (item: any) => {
    const payload = {
      current_org: item.id,
    };

    const { data, error } = await PutRequest('/users/switch-org', payload);

    if (!error) {
      await storeMultipleData([
        ['token', data.data.access_token],
        ['current_org', data.data.organisation.id],
        ['organisation', data.data.organisation],
      ]);

      dispatch({ type: ACTIONS.CALLBACK, payload: !callback });
      dispatch({ type: ACTIONS.TOKEN, payload: data.data.access_token });
      dispatch({ type: ACTIONS.ORG_ID, payload: data.data.organisation.id });
      dispatch({ type: ACTIONS.ORG_DATA, payload: data.data.organisation });
      dispatch({ type: ACTIONS.USER_CHANNELS, payload: [] });

      setTimeout(() => {
        navigation.closeDrawer();
      }, 200);
    }
  };

  const WorkspaceItem = ({ item }: { item: Org }) => {
    const isActive = item.id === orgId;

    return (
      <TouchableOpacity
        style={[styles.workspaceItem, isActive && styles.activeWorkspaceItem]}
        activeOpacity={0.7}
        delayPressIn={Platform.OS === 'ios' ? 0 : 40}
        onPress={() => handleOrg(item)}
      >
        {isActive && <View style={styles.activeIndicator} />}
        <View
          style={[
            styles.logoContainer,
            { borderWidth: isActive ? 1 : 0, borderColor: colors.primary },
          ]}
        >
          {item.logo_url ? (
            <FastImage source={{ uri: item.logo_url }} style={styles.logo} />
          ) : (
            <View
              style={[
                styles.placeholderLogo,
                { borderWidth: isActive ? 1 : 0, borderColor: colors.primary },
              ]}
            >
              <AppText variant="bold" style={styles.placeholderText}>
                {item.name.charAt(0).toUpperCase()}
                {item.name.charAt(1).toUpperCase()}
              </AppText>
            </View>
          )}
        </View>
        <View style={styles.workspaceInfo}>
          <AppText variant="bold" size={16}>
            {item.name}
          </AppText>
        </View>
        {isActive && (
          <Ionicons name="checkmark-circle" size={20} color={colors.primary} />
        )}
      </TouchableOpacity>
    );
  };

  const ActionItem = ({ label, icon, isIonicons = false, onPress }: any) => (
    <TouchableOpacity style={styles.actionItem} onPress={onPress}>
      {isIonicons ? (
        <Ionicons
          name={icon}
          size={22}
          color={colors.primary}
          style={styles.actionIcon}
        />
      ) : (
        <Feather
          name={icon}
          size={22}
          color={colors.primary}
          style={styles.actionIcon}
        />
      )}
      <AppText size={16}>{label}</AppText>
    </TouchableOpacity>
  );

  return (
    <View style={styles.drawerContainer}>
      <SafeAreaView style={{ flex: 1 }}>
        <StatusBar
          barStyle={isDark ? 'light-content' : 'dark-content'}
          backgroundColor={colors.surface}
        />
        <View style={styles.header}>
          <AppText variant="bold" size={20}>
            Organisations
          </AppText>
        </View>
        <FlatList
          data={org}
          keyExtractor={item => item.id}
          renderItem={({ item }) => <WorkspaceItem item={item} />}
          showsVerticalScrollIndicator={false}
          style={{ flex: 1 }}
          contentContainerStyle={styles.scrollContent}
          scrollEnabled={true}
          bounces={true}
        />
        <View style={styles.staticFooter}>
          <View style={styles.divider} />
          <ActionItem
            label="Add new organisation"
            icon="plus"
            onPress={() => {
              navigation.closeDrawer();
              navigation.navigate('SettingStack', {
                screen: 'AddOrganisation',
              });
            }}
          />
          <ActionItem
            label="File management"
            icon="folder"
            onPress={() => {
              navigation.closeDrawer();
              navigation.navigate('FileStack', { screen: 'FileManagement' });
            }}
          />
          <ActionItem
            label="Help"
            icon="help-circle"
            onPress={() =>
              Linking.openURL(
                `${CLIENT_URL || 'https://zedu.chat'}/contact-sales`,
              )
            }
          />
        </View>
      </SafeAreaView>
    </View>
  );
};

export default WorkspaceDrawer;
