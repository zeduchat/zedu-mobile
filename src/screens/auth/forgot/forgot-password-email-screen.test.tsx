/**
 * @format
 */

import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import { ThemeProvider } from '@/theme/ThemeProvider';
import { PostRequest } from '@/utils/requests';
import { ACTIONS } from '@/store/types';
import ForgotPasswordEmailScreen from '@/screens/auth/forgot/ForgotPasswordEmailScreen';

const mockDispatch = jest.fn();
const mockNavigate = jest.fn();

jest.mock('@/utils/requests', () => ({
  PostRequest: jest.fn(),
}));

jest.mock('@/store/useDataContext', () => ({
  useDataContext: () => ({ state: {}, dispatch: mockDispatch }),
}));

jest.mock('@/components/layout/container', () => ({
  __esModule: true,
  default: ({ children }: { children: React.ReactNode }) => children,
}));

jest.mock('@react-navigation/native', () => ({
  ...jest.requireActual('@react-navigation/native'),
  useNavigation: () => ({ navigate: mockNavigate, goBack: jest.fn() }),
}));

const mockPostRequest = PostRequest as jest.MockedFunction<typeof PostRequest>;

// The first render loads the theme and UI modules from cold, which can pass Jest's 5s default in CI.
jest.setTimeout(30000);

describe('ForgotPasswordEmailScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const renderScreen = async () => {
    let renderer: ReactTestRenderer.ReactTestRenderer | undefined;
    await ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(
        <ThemeProvider>
          <ForgotPasswordEmailScreen />
        </ThemeProvider>,
      );
    });
    return renderer as ReactTestRenderer.ReactTestRenderer;
  };

  const submitButton = (renderer: ReactTestRenderer.ReactTestRenderer) =>
    renderer.root.find(
      node => typeof node.type !== 'string' && node.props.title === 'Submit',
    );

  const typeEmail = async (
    renderer: ReactTestRenderer.ReactTestRenderer,
    text: string,
  ) => {
    const input = renderer.root.find(
      node =>
        typeof node.type !== 'string' && node.props.label === 'Email Address',
    );
    await ReactTestRenderer.act(() => {
      input.props.onChangeText(text);
    });
  };

  const pressSubmit = async (renderer: ReactTestRenderer.ReactTestRenderer) => {
    await ReactTestRenderer.act(async () => {
      await submitButton(renderer).props.onPress();
    });
  };

  it('disables Submit while the email box is empty or only spaces', async () => {
    const renderer = await renderScreen();
    expect(submitButton(renderer).props.disabled).toBe(true);

    await typeEmail(renderer, '   ');
    expect(submitButton(renderer).props.disabled).toBe(true);

    await typeEmail(renderer, 'abc');
    expect(submitButton(renderer).props.disabled).toBe(false);
  });

  it('shows an error and sends nothing for an invalid email', async () => {
    const renderer = await renderScreen();
    await typeEmail(renderer, 'abc');
    await pressSubmit(renderer);

    expect(mockPostRequest).not.toHaveBeenCalled();
    expect(mockDispatch).toHaveBeenCalledWith({
      type: ACTIONS.ERROR,
      payload: 'Please enter a valid email address',
    });
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it('sends the trimmed email and opens the code screen for a valid email', async () => {
    mockPostRequest.mockResolvedValue({
      data: { message: 'Reset code sent' },
      error: null,
    } as any);
    const renderer = await renderScreen();
    await typeEmail(renderer, '  user@example.com  ');
    await pressSubmit(renderer);

    expect(mockPostRequest).toHaveBeenCalledWith('/auth/password-reset', {
      email: 'user@example.com',
    });
    expect(mockDispatch).toHaveBeenCalledWith({
      type: ACTIONS.AUTH_FLOW,
      payload: { email: 'user@example.com', code: '' },
    });
    expect(mockNavigate).toHaveBeenCalledWith('ForgotPasswordCode');
  });
});
