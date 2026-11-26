/**
 * @format
 */

import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import { ThemeProvider } from '@/theme/ThemeProvider';
import { PostRequest } from '@/utils/requests';
import { ACTIONS } from '@/store/types';
import StatusSheet from '@/components/layout/settings/StatusSheet';

const mockDispatch = jest.fn();
const savedUser = { text: '', icon: '', status_timeout: 'dont' };
let mockUser: typeof savedUser | null = savedUser;

jest.mock('@/utils/requests', () => ({
  PostRequest: jest.fn(),
}));

// The real ThemeProvider loads AsyncStorage, which is native; use the light palette.
jest.mock('@/theme/ThemeProvider', () => {
  const { lightColors } = require('@/theme/palettes');
  return {
    useTheme: () => ({ colors: lightColors }),
    ThemeProvider: ({ children }: { children: React.ReactNode }) => children,
  };
});

jest.mock('@/store/useDataContext', () => ({
  useDataContext: () => ({
    state: { user: mockUser },
    dispatch: mockDispatch,
  }),
}));

// The sheet and emoji picker are native UI; render their children directly.
jest.mock('@/components/ui/bottom-sheet', () => {
  const ReactMock = require('react');
  return {
    __esModule: true,
    default: ReactMock.forwardRef(
      ({ children }: { children: React.ReactNode }, _ref: unknown) => children,
    ),
  };
});

jest.mock('@/components/ui/themed-emoji-keyboard', () => ({
  ThemedEmojiPicker: () => null,
}));

const mockPostRequest = PostRequest as jest.MockedFunction<typeof PostRequest>;

// The first render loads the theme and UI modules from cold, which can pass Jest's 5s default in CI.
jest.setTimeout(30000);

describe('StatusSheet', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUser = savedUser;
  });

  const renderSheet = async (onChange: jest.Mock) => {
    let renderer: ReactTestRenderer.ReactTestRenderer | undefined;
    await ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(
        <ThemeProvider>
          <StatusSheet onChange={onChange} />
        </ThemeProvider>,
      );
    });
    return renderer as ReactTestRenderer.ReactTestRenderer;
  };

  const pressPreset = async (
    renderer: ReactTestRenderer.ReactTestRenderer,
    label: string,
  ) => {
    const preset = renderer.root.find(
      node =>
        typeof node.type !== 'string' &&
        node.props.onPress &&
        node.findAll(
          child =>
            typeof child.type === 'string' && child.props.children === label,
        ).length > 0 &&
        node.props.onPress.toString().includes('handlePresetSelection'),
    );
    await ReactTestRenderer.act(() => {
      preset.props.onPress();
    });
  };

  const pressSave = async (renderer: ReactTestRenderer.ReactTestRenderer) => {
    const save = renderer.root.find(
      node =>
        typeof node.type !== 'string' &&
        node.props.onPress &&
        node.props.onPress.name === 'handleSubmit',
    );
    await ReactTestRenderer.act(async () => {
      await save.props.onPress();
    });
  };

  it('does not update Settings when a preset is picked but not saved', async () => {
    const onChange = jest.fn();
    const renderer = await renderSheet(onChange);

    await pressPreset(renderer, 'In a meeting');

    expect(onChange).not.toHaveBeenCalled();
  });

  it('updates Settings only after the status is saved', async () => {
    mockPostRequest.mockResolvedValue({ data: {}, error: null } as any);
    const onChange = jest.fn();
    const renderer = await renderSheet(onChange);

    await pressPreset(renderer, 'In a meeting');
    await pressSave(renderer);

    expect(mockPostRequest).toHaveBeenCalledWith(
      '/profile/change-status',
      expect.objectContaining({ text: 'In a meeting', icon: '🗓️' }),
    );
    expect(onChange).toHaveBeenCalledWith('🗓️', 'In a meeting', '1h');
  });

  it('shows an error and leaves Settings unchanged when saving fails', async () => {
    mockPostRequest.mockResolvedValue({
      data: null,
      error: 'Network error',
    } as any);
    const onChange = jest.fn();
    const renderer = await renderSheet(onChange);

    await pressPreset(renderer, 'In a meeting');
    await pressSave(renderer);

    expect(onChange).not.toHaveBeenCalled();
    expect(mockDispatch).toHaveBeenCalledWith({
      type: ACTIONS.ERROR,
      payload: 'Network error',
    });
  });

  it('ignores a second tap on save while the first save is in progress', async () => {
    let finishSave: (value: any) => void = () => {};
    mockPostRequest.mockReturnValue(
      new Promise(resolve => {
        finishSave = resolve;
      }) as any,
    );
    const onChange = jest.fn();
    const renderer = await renderSheet(onChange);
    const save = renderer.root.find(
      node =>
        typeof node.type !== 'string' &&
        node.props.onPress &&
        node.props.onPress.name === 'handleSubmit',
    );

    await ReactTestRenderer.act(async () => {
      save.props.onPress();
      save.props.onPress();
    });
    await ReactTestRenderer.act(async () => {
      finishSave({ data: {}, error: null });
    });

    expect(mockPostRequest).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledTimes(1);
  });

  it('discards an unsaved preset when the sheet is closed with ✕', async () => {
    const onChange = jest.fn();
    const renderer = await renderSheet(onChange);
    const statusInput = () =>
      renderer.root.find(
        node =>
          typeof node.type !== 'string' &&
          node.props.placeholder === "What's your status?",
      );

    await pressPreset(renderer, 'In a meeting');
    expect(statusInput().props.value).toBe('In a meeting');

    const closeButton = renderer.root.find(
      node =>
        typeof node.type !== 'string' &&
        node.props.onPress &&
        node.props.onPress.name === 'close',
    );
    await ReactTestRenderer.act(() => {
      closeButton.props.onPress();
    });

    expect(statusInput().props.value).toBe('');
    expect(onChange).not.toHaveBeenCalled();
  });

  it('restores the status that loads after the sheet opens when closed with ✕', async () => {
    mockUser = null;
    const onChange = jest.fn();
    const renderer = await renderSheet(onChange);
    const statusInput = () =>
      renderer.root.find(
        node =>
          typeof node.type !== 'string' &&
          node.props.placeholder === "What's your status?",
      );

    mockUser = { text: 'On holiday', icon: '🌴', status_timeout: 'dont' };
    await ReactTestRenderer.act(() => {
      renderer.update(
        <ThemeProvider>
          <StatusSheet onChange={onChange} />
        </ThemeProvider>,
      );
    });

    await pressPreset(renderer, 'In a meeting');
    const closeButton = renderer.root.find(
      node =>
        typeof node.type !== 'string' &&
        node.props.onPress &&
        node.props.onPress.name === 'close',
    );
    await ReactTestRenderer.act(() => {
      closeButton.props.onPress();
    });

    expect(statusInput().props.value).toBe('On holiday');
    expect(onChange).not.toHaveBeenCalled();
  });
});
