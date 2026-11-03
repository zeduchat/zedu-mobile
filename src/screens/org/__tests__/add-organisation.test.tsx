/**
 * @format
 */

import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import { TextInput, TouchableOpacity } from 'react-native';
import AddOrganisationScreen from '@/screens/org/add-organisation';
import { PostRequest, PutRequest } from '@/utils/requests';

jest.mock('@/utils/requests', () => ({
  PostRequest: jest.fn(),
  PutRequest: jest.fn(),
}));

jest.mock('@/utils/helper', () => ({ storeMultipleData: jest.fn() }));

jest.mock('@/store/useDataContext', () => ({
  useDataContext: () => ({
    state: { user: { email: 'owner@example.com' } },
    dispatch: jest.fn(),
  }),
}));

jest.mock('@/theme/ThemeProvider', () => ({
  useTheme: () => ({ colors: require('@/theme/palettes').lightColors }),
}));

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ goBack: jest.fn() }),
}));

// Stand-in for the country modal; the test calls its onSelect directly.
jest.mock('react-native-country-picker-modal', () => () => null);

// The first render loads the screen's whole module graph, which can pass the 5s default on a cold CI runner.
jest.setTimeout(30000);

const mockPostRequest = PostRequest as jest.Mock;
const mockPutRequest = PutRequest as jest.Mock;

const renderScreen = async () => {
  let renderer: ReactTestRenderer.ReactTestRenderer | undefined;
  await ReactTestRenderer.act(async () => {
    renderer = ReactTestRenderer.create(<AddOrganisationScreen />);
  });
  return renderer!;
};

const fillAndSubmit = async (renderer: ReactTestRenderer.ReactTestRenderer) => {
  const [nameInput, typeInput] = renderer.root.findAllByType(TextInput);
  const countryPicker = renderer.root.find(
    node => typeof node.props.onSelect === 'function',
  );

  await ReactTestRenderer.act(async () => {
    nameInput.props.onChangeText('QA Org');
    typeInput.props.onChangeText('Teach');
    countryPicker.props.onSelect({
      cca2: 'NG',
      name: { common: 'Nigeria' },
    });
  });

  const submit = renderer.root
    .findAllByType(TouchableOpacity)
    .find(
      node =>
        node.findAll(child => child.props.children === 'Submit').length > 0,
    );
  await ReactTestRenderer.act(async () => {
    submit!.props.onPress();
  });
};

describe('AddOrganisationScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockPostRequest.mockResolvedValue({
      data: { data: { id: 'org-2' } },
      error: null,
    });
    mockPutRequest.mockResolvedValue({
      data: {
        data: { access_token: 'token', organisation: { id: 'org-2' } },
      },
      error: null,
    });
  });

  it("sends the signed-in user's email when creating an organisation", async () => {
    const renderer = await renderScreen();

    await fillAndSubmit(renderer);

    expect(mockPostRequest).toHaveBeenCalledWith('/organisations', {
      name: 'QA Org',
      type: 'Teach',
      country: 'Nigeria',
      email: 'owner@example.com',
    });
  });
});
