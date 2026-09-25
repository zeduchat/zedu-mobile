import React from 'react';
import {
  StyleSheet,
  View,
  TouchableOpacity,
  FlatList,
  Dimensions,
  Platform,
  StatusBar,
} from 'react-native';
import { DrawerContentComponentProps } from '@react-navigation/drawer';
import { AppText } from '@/components/ui/text';
import Feather from 'react-native-vector-icons/Feather';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useDataContext } from '@/store/useDataContext';
import { Org } from '@/types/organisation';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '@/theme/colors';
import { PutRequest } from '@/utils/requests';
import { ACTIONS } from '@/store/types';
import { storeData, storeMultipleData } from '@/utils/helper';
import FastImage from 'react-native-fast-image';

const { width } = Dimensions.get('window');

const WorkspaceDrawer = (props: DrawerContentComponentProps) => {
  const { state, dispatch } = useDataContext();

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
            { borderWidth: isActive ? 1 : 0, borderColor: Colors.primary },
          ]}
        >
          {item.logo_url ? (
            <FastImage source={{ uri: item.logo_url }} style={styles.logo} />
          ) : (
            <View
              style={[
                styles.placeholderLogo,
                { borderWidth: isActive ? 1 : 0, borderColor: Colors.primary },
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
          <Ionicons name="checkmark-circle" size={20} color={Colors.primary} />
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
          color="#4A154B"
          style={styles.actionIcon}
        />
      ) : (
        <Feather
          name={icon}
          size={22}
          color="#4A154B"
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
          barStyle="light-content"
          backgroundColor={Colors.secondary}
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
              navigation.navigate('AddOrganisation');
            }}
          />
          <ActionItem label="Preferences" icon="settings" />
          <ActionItem label="Help" icon="help-circle" />
        </View>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  // modal: { margin: 0 },
  drawerContainer: {
    width: width * 0.85,
    height: '100%',
    backgroundColor: 'white',
    paddingTop: Platform.OS === 'ios' ? 0 : 20,
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  scrollContent: {
    paddingBottom: 10,
  },
  workspaceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  activeWorkspaceItem: {
    backgroundColor: '#F4EDF4',
  },
  activeIndicator: {
    position: 'absolute',
    left: 0,
    width: 4,
    height: '100%',
    backgroundColor: '#4A154B',
    borderTopRightRadius: 4,
    borderBottomRightRadius: 4,
  },
  logoContainer: {
    width: 48,
    height: 48,
    borderRadius: 8,
    backgroundColor: '#F0F0F0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  logo: { width: 48, height: 48, borderRadius: 8 },
  placeholderLogo: {
    width: 48,
    height: 48,
    borderRadius: 8,
    backgroundColor: '#E8E8E8',
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: { fontSize: 17, color: '#1D1C1D' },
  workspaceInfo: { flex: 1 },
  urlText: { color: '#616061', marginTop: 2 },
  staticFooter: {
    backgroundColor: 'white',
    paddingBottom: Platform.OS === 'ios' ? 10 : 20,
  },
  divider: {
    height: 1,
    backgroundColor: '#F0F0F0',
    marginVertical: 10,
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  actionIcon: { marginRight: 15, width: 25 },
});

export default WorkspaceDrawer;
