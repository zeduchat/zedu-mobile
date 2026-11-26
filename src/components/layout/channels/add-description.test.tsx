/**
 * @format
 */

import React from 'react';
import { Keyboard } from 'react-native';
import ReactTestRenderer from 'react-test-renderer';
import { lightColors } from '@/theme/palettes';
import type { ThemeColors } from '@/theme/types';
import { PatchRequest } from '@/utils/requests';
import { AddDescription } from '@/components/layout/channels/add-description';

const mockDispatch = jest.fn();
const mockColors: ThemeColors = lightColors;

// The real ThemeProvider reads saved settings from AsyncStorage, which has no
// native module under Jest; the light palette is enough here.
jest.mock('@/theme/ThemeProvider', () => ({
  useTheme: () => ({ colors: mockColors }),
}));

jest.mock('@/utils/requests', () => ({
  PatchRequest: jest.fn(),
}));

jest.mock('@/store/useDataContext', () => ({
  useDataContext: () => ({
    state: { channelCallback: false, channelDetails: { description: '' } },
    dispatch: mockDispatch,
  }),
}));

// The sheet is native UI; render its children directly.
jest.mock('@/components/ui/bottom-sheet', () => {
  const ReactMock = require('react');
  return {
    __esModule: true,
    default: ReactMock.forwardRef(
      ({ children }: { children: React.ReactNode }, _ref: unknown) => children,
    ),
  };
});

const mockPatchRequest = PatchRequest as jest.MockedFunction<
  typeof PatchRequest
>;

// The first render loads the theme and UI modules from cold, which can pass Jest's 5s default in CI.
jest.setTimeout(30000);

describe('AddDescription', () => {
  let hideKeyboard: (() => void) | undefined;
  let removeListener: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    hideKeyboard = undefined;
    mockPatchRequest.mockResolvedValue({
      data: { message: 'Channel updated' },
      error: null,
    } as any);
    jest.spyOn(Keyboard, 'dismiss').mockImplementation(() => {});
    jest
      .spyOn(Keyboard, 'addListener')
      .mockImplementation((_event: any, listener: any) => {
        hideKeyboard = listener;
        removeListener = jest.fn();
        return { remove: removeListener } as any;
      });
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  const renderSheet = async (onClose: jest.Mock) => {
    let renderer: ReactTestRenderer.ReactTestRenderer | undefined;
    await ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(
        <AddDescription onClose={onClose} channel_id="ch-1" />,
      );
    });
    return renderer as ReactTestRenderer.ReactTestRenderer;
  };

  const typeAndSave = async (renderer: ReactTestRenderer.ReactTestRenderer) => {
    const input = renderer.root.find(
      node =>
        typeof node.type !== 'string' &&
        node.props.placeholder === 'Add description',
    );
    await ReactTestRenderer.act(() => {
      input.props.onChangeText('Weekly updates');
    });
    const add = renderer.root.find(
      node =>
        typeof node.type !== 'string' &&
        node.props.onPress &&
        node.props.onPress.name === 'handleSave',
    );
    await ReactTestRenderer.act(async () => {
      await add.props.onPress();
    });
  };

  it('waits for the keyboard to hide before closing the sheet', async () => {
    jest.spyOn(Keyboard, 'isVisible').mockReturnValue(true);
    const onClose = jest.fn();
    const renderer = await renderSheet(onClose);

    await typeAndSave(renderer);

    expect(Keyboard.dismiss).toHaveBeenCalled();
    expect(onClose).not.toHaveBeenCalled();

    await ReactTestRenderer.act(() => {
      hideKeyboard?.();
    });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('closes straight away when the keyboard is already hidden', async () => {
    jest.spyOn(Keyboard, 'isVisible').mockReturnValue(false);
    const onClose = jest.fn();
    const renderer = await renderSheet(onClose);

    await typeAndSave(renderer);

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('closes after a timeout when keyboardDidHide never arrives', async () => {
    jest.useFakeTimers();
    jest.spyOn(Keyboard, 'isVisible').mockReturnValue(true);
    const onClose = jest.fn();
    const renderer = await renderSheet(onClose);

    await typeAndSave(renderer);
    expect(onClose).not.toHaveBeenCalled();

    await ReactTestRenderer.act(() => {
      jest.advanceTimersByTime(600);
    });
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(removeListener).toHaveBeenCalled();

    // A late keyboardDidHide does not close the sheet a second time.
    await ReactTestRenderer.act(() => {
      hideKeyboard?.();
    });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('closes only once when Cancel is tapped while waiting for the keyboard', async () => {
    jest.useFakeTimers();
    jest.spyOn(Keyboard, 'isVisible').mockReturnValue(true);
    const onClose = jest.fn();
    const renderer = await renderSheet(onClose);

    await typeAndSave(renderer);
    const cancel = renderer.root.find(
      node =>
        typeof node.type !== 'string' &&
        node.props.onPress &&
        node.props.onPress.name === 'handleClose',
    );
    await ReactTestRenderer.act(() => {
      cancel.props.onPress();
    });
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(removeListener).toHaveBeenCalled();

    await ReactTestRenderer.act(() => {
      jest.advanceTimersByTime(600);
    });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('does not save again while the sheet waits for the keyboard to hide', async () => {
    jest.useFakeTimers();
    jest.spyOn(Keyboard, 'isVisible').mockReturnValue(true);
    const onClose = jest.fn();
    const renderer = await renderSheet(onClose);

    await typeAndSave(renderer);
    const add = renderer.root.find(
      node =>
        typeof node.type !== 'string' &&
        node.props.onPress &&
        node.props.onPress.name === 'handleSave',
    );
    expect(add.props.disabled).toBe(true);
    await ReactTestRenderer.act(async () => {
      await add.props.onPress();
    });
    expect(mockPatchRequest).toHaveBeenCalledTimes(1);

    await ReactTestRenderer.act(() => {
      jest.advanceTimersByTime(600);
    });
    expect(onClose).toHaveBeenCalledTimes(1);
    // Still disabled while the sheet animates closed.
    expect(add.props.disabled).toBe(true);

    // The sheet reports it has closed; Add works again next time it opens.
    const sheet = renderer.root.find(
      node =>
        typeof node.type !== 'string' &&
        node.props.onClose &&
        node.props.onClose.name === 'handleClose',
    );
    await ReactTestRenderer.act(() => {
      sheet.props.onClose();
    });
    expect(add.props.disabled).toBe(false);
  });

  it('does not close the sheet again when a save finishes after Cancel', async () => {
    jest.spyOn(Keyboard, 'isVisible').mockReturnValue(false);
    let finishSave: (value: any) => void = () => {};
    mockPatchRequest.mockReturnValue(
      new Promise(resolve => {
        finishSave = resolve;
      }) as any,
    );
    const onClose = jest.fn();
    const renderer = await renderSheet(onClose);
    const input = renderer.root.find(
      node =>
        typeof node.type !== 'string' &&
        node.props.placeholder === 'Add description',
    );
    await ReactTestRenderer.act(() => {
      input.props.onChangeText('Weekly updates');
    });
    const add = renderer.root.find(
      node =>
        typeof node.type !== 'string' &&
        node.props.onPress &&
        node.props.onPress.name === 'handleSave',
    );
    const cancel = renderer.root.find(
      node =>
        typeof node.type !== 'string' &&
        node.props.onPress &&
        node.props.onPress.name === 'handleClose',
    );

    // Start the save, then Cancel while it is still in flight.
    await ReactTestRenderer.act(() => {
      add.props.onPress();
    });
    await ReactTestRenderer.act(() => {
      cancel.props.onPress();
    });
    expect(onClose).toHaveBeenCalledTimes(1);

    await ReactTestRenderer.act(async () => {
      finishSave({ data: { message: 'Channel updated' }, error: null });
    });

    // The save still succeeds, but the (possibly reopened) sheet stays open
    // and Add is usable.
    expect(mockDispatch).toHaveBeenCalledWith(
      expect.objectContaining({ payload: 'Channel updated' }),
    );
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(add.props.disabled).toBe(false);
  });
});
