/**
 * @format
 */

import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import { ThemeProvider } from '@/theme/ThemeProvider';
import { PostRequest } from '@/utils/requests';
import CreateChannelScreen from '@/screens/channels/create-channel';

const mockDispatch = jest.fn();

jest.mock('@/utils/requests', () => ({
  PostRequest: jest.fn(),
}));

jest.mock('@/store/useDataContext', () => ({
  useDataContext: () => ({
    state: { orgId: 'org-1', user: { username: 'moronke' } },
    dispatch: mockDispatch,
  }),
}));

jest.mock('@/components/layout/container', () => ({
  __esModule: true,
  default: ({ children }: { children: React.ReactNode }) => children,
}));

const mockPostRequest = PostRequest as jest.MockedFunction<typeof PostRequest>;

// The first render loads the theme and UI modules from cold, which can pass Jest's 5s default in CI.
jest.setTimeout(30000);

describe('CreateChannelScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockPostRequest.mockResolvedValue({
      data: { data: {} },
      error: null,
    } as any);
  });

  const renderScreen = async () => {
    let renderer: ReactTestRenderer.ReactTestRenderer | undefined;
    await ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(
        <ThemeProvider>
          <CreateChannelScreen
            navigation={{ goBack: jest.fn(), replace: jest.fn() }}
          />
        </ThemeProvider>,
      );
    });
    return renderer as ReactTestRenderer.ReactTestRenderer;
  };

  const typeInto = async (
    renderer: ReactTestRenderer.ReactTestRenderer,
    placeholder: string,
    text: string,
  ) => {
    const input = renderer.root.find(
      node =>
        typeof node.type !== 'string' && node.props.placeholder === placeholder,
    );
    await ReactTestRenderer.act(() => {
      input.props.onChangeText(text);
    });
  };

  const pressCreate = async (renderer: ReactTestRenderer.ReactTestRenderer) => {
    const createButton = renderer.root.find(
      node =>
        typeof node.type !== 'string' &&
        node.props.onPress &&
        node.props.onPress.name === 'createChannel',
    );
    await ReactTestRenderer.act(async () => {
      await createButton.props.onPress();
    });
  };

  it('sends the typed description when creating a channel', async () => {
    const renderer = await renderScreen();

    await typeInto(renderer, 'Channel Name', 'desc-test');
    await typeInto(
      renderer,
      'Description(optional)',
      '  This should be saved  ',
    );
    await pressCreate(renderer);

    expect(mockPostRequest).toHaveBeenCalledWith(
      '/channels',
      expect.objectContaining({
        name: 'desc-test',
        description: 'This should be saved',
      }),
    );
  });
});
