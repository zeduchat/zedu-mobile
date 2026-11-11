/**
 * @format
 */

import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import { Image, Text, TextInput, TouchableOpacity } from 'react-native';
import ChangePasswordScreen from '@/screens/settings/change-password';
import { PutRequest } from '@/utils/requests';
import { ACTIONS } from '@/store/types';
import { AppInput } from '@/components/ui/input';

const mockDispatch = jest.fn();

jest.mock('@/store/useDataContext', () => ({
  useDataContext: () => ({ state: {}, dispatch: mockDispatch }),
}));

jest.mock('@/utils/requests', () => ({
  PutRequest: jest.fn(),
}));

jest.mock('@/theme/ThemeProvider', () => ({
  useTheme: () => ({
    colors: require('@/theme/palettes').lightColors,
    isDark: false,
  }),
}));

const mockPutRequest = PutRequest as jest.Mock;

type Renderer = ReactTestRenderer.ReactTestRenderer;

const renderScreen = async () => {
  const navigation = { goBack: jest.fn(), navigate: jest.fn() };
  let renderer: Renderer | undefined;
  await ReactTestRenderer.act(() => {
    renderer = ReactTestRenderer.create(
      <ChangePasswordScreen navigation={navigation} />,
    );
  });
  return { renderer: renderer!, navigation };
};

const texts = (renderer: Renderer) =>
  renderer.root
    .findAllByType(Text)
    .map(node => [node.props.children].flat().join(''));

// Fields in screen order: current, new, confirm.
const typeInto = async (renderer: Renderer, index: number, value: string) => {
  const input = renderer.root.findAllByType(TextInput)[index];
  await ReactTestRenderer.act(() => {
    input.props.onChangeText(value);
  });
};

const saveButton = (renderer: Renderer) =>
  renderer.root
    .findAllByType(TouchableOpacity)
    .find(node =>
      node.findAllByType(Text).some(t => t.props.children === 'Save Changes'),
    )!;

const fillForm = async (renderer: Renderer, confirm: string) => {
  await typeInto(renderer, 0, 'oldpass123');
  await typeInto(renderer, 1, 'newpass123');
  await typeInto(renderer, 2, confirm);
};

describe('ChangePasswordScreen password confirmation', () => {
  let current: Renderer | undefined;

  beforeEach(() => {
    mockDispatch.mockClear();
    mockPutRequest.mockReset();
  });

  afterEach(async () => {
    await ReactTestRenderer.act(() => {
      current?.unmount();
    });
    current = undefined;
  });

  it('shows no match feedback before the confirmation is typed', async () => {
    const { renderer } = await renderScreen();
    current = renderer;

    await typeInto(renderer, 1, 'newpass123');

    expect(texts(renderer)).not.toContain("Passwords don't match");
    expect(texts(renderer)).not.toContain('✓ Passwords match');
  });

  it('shows "Passwords don\'t match" under the field while typing a different password', async () => {
    const { renderer } = await renderScreen();
    current = renderer;

    await fillForm(renderer, 'newpass124');

    expect(texts(renderer)).toContain("Passwords don't match");
    // The error goes through AppInput's `error` prop, which gives the field its red border.
    expect(renderer.root.findAllByType(AppInput)[2].props.error).toBe(
      "Passwords don't match",
    );
    expect(texts(renderer)).not.toContain('✓ Passwords match');
    expect(saveButton(renderer).props.disabled).toBe(true);
  });

  it('replaces the error with "✓ Passwords match" once they match', async () => {
    const { renderer } = await renderScreen();
    current = renderer;

    await fillForm(renderer, 'newpass124');
    await typeInto(renderer, 2, 'newpass123');

    expect(texts(renderer)).not.toContain("Passwords don't match");
    expect(texts(renderer)).toContain('✓ Passwords match');
    expect(saveButton(renderer).props.disabled).toBe(false);
  });

  it('shows the error again when the new password is edited after matching', async () => {
    const { renderer } = await renderScreen();
    current = renderer;

    await fillForm(renderer, 'newpass123');
    await typeInto(renderer, 1, 'newpass1234');

    expect(texts(renderer)).toContain("Passwords don't match");
    expect(saveButton(renderer).props.disabled).toBe(true);
  });

  it('keeps Save disabled until the current password is filled too', async () => {
    const { renderer } = await renderScreen();
    current = renderer;

    await typeInto(renderer, 1, 'newpass123');
    await typeInto(renderer, 2, 'newpass123');

    expect(saveButton(renderer).props.disabled).toBe(true);
  });

  it('does not send the request or show a popup while the passwords differ', async () => {
    const { renderer } = await renderScreen();
    current = renderer;

    await fillForm(renderer, 'newpass124');
    await ReactTestRenderer.act(async () => {
      await saveButton(renderer).props.onPress();
    });

    expect(mockPutRequest).not.toHaveBeenCalled();
    expect(mockDispatch).not.toHaveBeenCalled();
  });

  it('still saves a matching change and returns to Settings', async () => {
    mockPutRequest.mockResolvedValue({
      data: { message: 'Password updated' },
      error: null,
    });
    const { renderer, navigation } = await renderScreen();
    current = renderer;

    await fillForm(renderer, 'newpass123');
    await ReactTestRenderer.act(async () => {
      await saveButton(renderer).props.onPress();
    });

    expect(mockPutRequest).toHaveBeenCalledWith('/auth/change-password', {
      old_password: 'oldpass123',
      new_password: 'newpass123',
    });
    expect(mockDispatch).toHaveBeenCalledWith({
      type: ACTIONS.SUCCESS,
      payload: 'Password updated',
    });
    expect(navigation.goBack).toHaveBeenCalled();
  });

  it('still shows server errors such as a wrong current password', async () => {
    mockPutRequest.mockResolvedValue({
      data: null,
      error: 'Old password is incorrect',
    });
    const { renderer, navigation } = await renderScreen();
    current = renderer;

    await fillForm(renderer, 'newpass123');
    await ReactTestRenderer.act(async () => {
      await saveButton(renderer).props.onPress();
    });

    expect(mockDispatch).toHaveBeenCalledWith({
      type: ACTIONS.ERROR,
      payload: 'Old password is incorrect',
    });
    expect(navigation.goBack).not.toHaveBeenCalled();
  });

  it('shows the note in an info box with the info icon', async () => {
    const { renderer } = await renderScreen();
    current = renderer;

    const note = renderer.root
      .findAllByType(Text)
      .find(node =>
        [node.props.children]
          .flat()
          .join('')
          .includes('You would need to login again'),
      )!;
    // Text -> AppText -> the note box.
    const box = note.parent!.parent!;
    const icons = box
      .findAllByType(Image)
      .map(node => node.props.source)
      .filter(source => source === require('@/assets/icons/info-circle.png'));

    expect(icons).toHaveLength(1);
  });
});
