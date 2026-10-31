/**
 * @format
 */

import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import InvitePeopleScreen from '@/screens/settings/invite-screen';
import { GetRequest } from '@/utils/requests';

jest.mock('@/utils/requests', () => ({
  GetRequest: jest.fn(),
  PostRequest: jest.fn(),
}));

jest.mock('@/components/ui/toast', () => ({ ShowNotify: jest.fn() }));

jest.mock('@/store/useDataContext', () => ({
  useDataContext: () => ({
    state: { orgId: 'org-1', orgData: {} },
    dispatch: jest.fn(),
  }),
}));

jest.mock('@/theme/ThemeProvider', () => ({
  useTheme: () => ({ colors: require('@/theme/palettes').lightColors }),
}));

jest.mock(
  '@/components/layout/container',
  () =>
    ({ children }: { children: React.ReactNode }) =>
      children,
);

// The first render loads the screen's whole module graph, which can pass the 5s default on a cold CI runner.
jest.setTimeout(30000);

const mockGetRequest = GetRequest as jest.Mock;

const renderScreen = async () => {
  let renderer: ReactTestRenderer.ReactTestRenderer | undefined;
  await ReactTestRenderer.act(async () => {
    renderer = ReactTestRenderer.create(
      <InvitePeopleScreen navigation={{ goBack: jest.fn() }} />,
    );
  });
  return renderer!;
};

const getInput = (renderer: ReactTestRenderer.ReactTestRenderer) =>
  renderer.root.findByProps({ autoCapitalize: 'none' });

// Mimics typing: each call is the full text of the field, as onChangeText receives it.
const type = async (
  renderer: ReactTestRenderer.ReactTestRenderer,
  text: string,
) => {
  await ReactTestRenderer.act(async () => {
    getInput(renderer).props.onChangeText(text);
  });
};

const chipCount = (
  renderer: ReactTestRenderer.ReactTestRenderer,
  email: string,
) =>
  renderer.root.findAll(
    node => typeof node.type === 'string' && node.props.children === email,
  ).length;

describe('InvitePeopleScreen email separators', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetRequest.mockResolvedValue({
      data: { data: [{ id: 'role-1', name: 'Member' }] },
      error: null,
    });
  });

  it('turns an email into a chip when followed by a space', async () => {
    const renderer = await renderScreen();

    await type(renderer, 'a@test.com ');

    expect(chipCount(renderer, 'a@test.com')).toBe(1);
    expect(getInput(renderer).props.value).toBe('');
  });

  it('still turns an email into a chip when followed by a comma', async () => {
    const renderer = await renderScreen();

    await type(renderer, 'a@test.com,');

    expect(chipCount(renderer, 'a@test.com')).toBe(1);
    expect(getInput(renderer).props.value).toBe('');
  });

  it('adds several emails in a row using spaces', async () => {
    const renderer = await renderScreen();

    await type(renderer, 'a@test.com ');
    await type(renderer, 'b@test.com ');

    expect(chipCount(renderer, 'a@test.com')).toBe(1);
    expect(chipCount(renderer, 'b@test.com')).toBe(1);
  });

  it('ignores a duplicate email', async () => {
    const renderer = await renderScreen();

    await type(renderer, 'a@test.com ');
    await type(renderer, 'A@test.com ');

    expect(chipCount(renderer, 'a@test.com')).toBe(1);
    expect(getInput(renderer).props.value).toBe('');
  });

  it('keeps an invalid entry in the field without making a chip', async () => {
    const renderer = await renderScreen();

    await type(renderer, 'not-an-email ');

    expect(chipCount(renderer, 'not-an-email')).toBe(0);
    expect(getInput(renderer).props.value).toBe('not-an-email');
  });
});
