import React, { useMemo, useState } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  Platform,
  KeyboardAvoidingView,
  ScrollView,
  ActivityIndicator,
  Dimensions,
  StatusBar,
  type FlatListProps,
} from 'react-native';
import { AppText } from '@/components/ui/text';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useTheme } from '@/theme/ThemeProvider';
import { createOrgScreenStyles } from '@/theme/createStep10Styles';
import { useNavigation } from '@react-navigation/native';
import CountryPicker, {
  Country,
  CountryCode,
} from 'react-native-country-picker-modal';
import { SafeAreaView } from 'react-native-safe-area-context';
import { PostRequest, PutRequest } from '@/utils/requests';
import { storeMultipleData } from '@/utils/helper';
import { ACTIONS } from '@/store/types';
import { useDataContext } from '@/store/useDataContext';

// Library FlatList needs an explicit height; fill everything below the
// search/close header so the list isn't cut off mid-screen.
const COUNTRY_HEADER_HEIGHT = 56;
const LIST_HEIGHT = Math.round(
  Dimensions.get('window').height -
    COUNTRY_HEADER_HEIGHT -
    (Platform.OS === 'android' ? StatusBar.currentHeight ?? 24 : 44),
);

const AddOrganisationScreen = () => {
  const { colors } = useTheme();
  const styles = useMemo(() => createOrgScreenStyles(colors), [colors]);
  const countryPickerTheme = useMemo(
    () => ({
      backgroundColor: colors.surface,
      onBackgroundTextColor: colors.textPrimary,
      primaryColor: colors.border,
      primaryColorVariant: colors.reactionBackground,
      filterPlaceholderTextColor: colors.textMuted,
      // Keep library defaults so FlatList row layout does not collapse.
      itemHeight: 50,
      fontSize: 16,
      flagSize: Platform.OS === 'android' ? 20 : 30,
      flagSizeButton: Platform.OS === 'android' ? 20 : 30,
    }),
    [colors],
  );
  const navigation = useNavigation();
  const [orgName, setOrgName] = useState('');
  const [orgType, setOrgType] = useState('');
  const [country, setCountry] = useState<Country | null>(null);
  const [countryCode, setCountryCode] = useState<CountryCode>('US');
  const [showCountryPicker, setShowCountryPicker] = useState(false);
  const [loading, setLoading] = useState(false);
  const { state, dispatch } = useDataContext();
  const { user } = state;

  const resetForm = () => {
    setOrgName('');
    setOrgType('');
    setCountry(null);
    setCountryCode('US');
  };

  const handleSubmit = async () => {
    setLoading(true);

    const payload = {
      name: orgName,
      type: orgType,
      country: country
        ? typeof country.name === 'string'
          ? country.name
          : country.name.common
        : null,
      email: user?.email,
    };

    const { data: res, error } = await PostRequest('/organisations', payload);

    if (!error) {
      const switchPayload = {
        current_org: res.data.id,
      };

      const { data, error } = await PutRequest(
        '/users/switch-org',
        switchPayload,
      );

      if (!error) {
        await storeMultipleData([
          ['token', data.data.access_token],
          ['current_org', data.data.organisation.id],
          ['organisation', data.data.organisation],
        ]);

        dispatch({ type: ACTIONS.TOKEN, payload: data.data.access_token });
        dispatch({ type: ACTIONS.ORG_ID, payload: data.data.organisation.id });
        dispatch({ type: ACTIONS.ORG_DATA, payload: data.data.organisation });
      }

      resetForm();
      navigation.goBack();
      setLoading(false);
    } else {
      dispatch({ type: ACTIONS.ERROR, payload: error });
      setLoading(false);
    }
  };

  const onSelect = (selectedCountry: Country) => {
    setCountryCode(selectedCountry.cca2);
    setCountry(selectedCountry);
    setShowCountryPicker(false);
  };

  return (
    <>
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContainer}
            keyboardShouldPersistTaps="handled"
          >
            <TouchableOpacity
              style={styles.backBtn}
              onPress={() => navigation.goBack()}
            >
              <Ionicons name="arrow-back" size={24} color={colors.primary} />
            </TouchableOpacity>

            <AppText variant="bold" size={28} style={styles.title}>
              Create Your Organisation
            </AppText>
            <AppText size={16} style={styles.subtitle}>
              Input the details of your organisation below
            </AppText>

            <View style={styles.formGroup}>
              <AppText size={15} style={styles.label}>
                Organisation Name
              </AppText>
              <TextInput
                style={styles.input}
                placeholder="Enter your organisation Name"
                placeholderTextColor={colors.textMuted}
                value={orgName}
                onChangeText={setOrgName}
              />
            </View>

            <View style={styles.formGroup}>
              <AppText size={15} style={styles.label}>
                Organisation Type
              </AppText>
              <TextInput
                style={styles.input}
                placeholder="What does your organisation do"
                placeholderTextColor={colors.textMuted}
                value={orgType}
                onChangeText={setOrgType}
              />
            </View>

            <View style={styles.formGroup}>
              <AppText size={15} style={styles.label}>
                Country
              </AppText>
              <TouchableOpacity
                style={styles.countrySelector}
                onPress={() => setShowCountryPicker(true)}
                activeOpacity={0.8}
              >
                <AppText
                  size={15}
                  style={
                    country
                      ? styles.countrySelectorText
                      : styles.countrySelectorPlaceholder
                  }
                >
                  {country
                    ? typeof country.name === 'string'
                      ? country.name
                      : country.name.common
                    : 'Select an option...'}
                </AppText>
                <Ionicons
                  name="chevron-down"
                  size={20}
                  color={colors.textMuted}
                />
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={[
                styles.submitBtn,
                (loading || !orgName || !orgType || !country) && {
                  opacity: 0.5,
                },
              ]}
              onPress={handleSubmit}
              activeOpacity={0.8}
              disabled={loading || !orgName || !orgType || !country}
            >
              {loading && <ActivityIndicator color={colors.white} />}

              <AppText variant="bold" size={18} style={{ color: colors.white }}>
                Submit
              </AppText>
            </TouchableOpacity>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>

      {/*
        Mount outside KeyboardAvoidingView/ScrollView so the modal gets a real
        height. The library FlatList otherwise collapses to only the search bar.
      */}
      <CountryPicker
        countryCode={countryCode}
        visible={showCountryPicker}
        withFilter
        withFlag
        withEmoji
        withFlagButton={false}
        withCountryNameButton={false}
        withAlphaFilter={false}
        withCloseButton
        onSelect={onSelect}
        onClose={() => setShowCountryPicker(false)}
        theme={countryPickerTheme}
        renderFlagButton={() => null}
        flatListProps={
          {
            style: { height: LIST_HEIGHT },
            contentContainerStyle: { paddingBottom: 24 },
            keyboardShouldPersistTaps: 'handled',
          } as Partial<FlatListProps<Country>> as FlatListProps<Country>
        }
        modalProps={{
          visible: showCountryPicker,
          ...(Platform.OS === 'ios'
            ? { presentationStyle: 'pageSheet' as const }
            : null),
        }}
      />
    </>
  );
};

export default AddOrganisationScreen;
