import React from 'react';
import TestRenderer, { act } from 'react-test-renderer';
import { ActivityIndicator } from 'react-native';
import MediaPreviewModal, { PreviewMediaItem } from './MediaPreviewModal';
import { AppButton } from '@/components/ui/button';
import { AppText } from '@/components/ui/text';

const mockSeek = jest.fn();
const mockPlayers = new Set<object>();
jest.mock('react-native-video', () => {
  const ReactModule = require('react');
  return {
    __esModule: true,
    default: ReactModule.forwardRef((props: object, ref: unknown) => {
      ReactModule.useImperativeHandle(ref, () => ({ seek: mockSeek }));
      ReactModule.useEffect(() => {
        const player = {};
        mockPlayers.add(player);
        return () => mockPlayers.delete(player);
      }, []);
      return ReactModule.createElement('PreviewMediaEngine', props);
    }),
  };
});
jest.mock('react-native-vector-icons/Ionicons', () => 'Icon');
jest.mock('@/components/media/ZoomableImage', () => 'ZoomableImage');
jest.mock('@/theme/ThemeProvider', () => ({
  useTheme: () => ({ colors: require('@/theme/palettes').lightColors }),
}));

const audio: PreviewMediaItem = {
  id: 'audio-1',
  file_name: 'recording.wav',
  file_type: 'wav',
  mime_type: 'audio/wav',
  file_link: 'file:///fixtures/recording.wav',
  user_id: 'user-1',
  created_at: '',
  updated_at: '',
};
let tree: TestRenderer.ReactTestRenderer;
const render = async (item = audio, visible = true) => {
  await act(async () => {
    tree = TestRenderer.create(
      <MediaPreviewModal visible={visible} item={item} onClose={jest.fn()} />,
    );
  });
};
const engine = () => tree.root.findByType('PreviewMediaEngine' as never);
const button = () => tree.root.findByType(AppButton);
const progress = () =>
  tree.root
    .findAllByType(AppText)
    .find(node => node.props.accessibilityRole === 'progressbar');

afterEach(async () => {
  await act(async () => tree?.unmount());
  mockSeek.mockClear();
  expect(mockPlayers.size).toBe(0);
});

test('opens a WAV with loading, play/pause, progress and replay', async () => {
  await render();
  expect(button().props.title).toBe('Play audio');
  expect(button().props.disabled).toBe(true);
  expect(tree.root.findAllByType(ActivityIndicator).length).toBeGreaterThan(0);
  await act(async () => engine().props.onLoad({ duration: 62 }));
  expect(button().props.disabled).toBe(false);
  await act(async () => button().props.onPress());
  expect(engine().props.paused).toBe(false);
  expect(button().props.title).toBe('Pause audio');
  await act(async () => engine().props.onProgress({ currentTime: 20 }));
  expect(progress()?.props.children).toEqual(['0:20', ' / ', '1:02']);
  await act(async () => button().props.onPress());
  expect(engine().props.paused).toBe(true);
  await act(async () => engine().props.onEnd());
  await act(async () => button().props.onPress());
  expect(mockSeek).toHaveBeenCalledWith(0);
  expect(engine().props.paused).toBe(false);
}, 30000);

test.each([
  {
    file_name: 'song.MP3',
    file_type: '',
    mime_type: 'application/octet-stream',
  },
  { file_name: 'voice.m4a', file_type: 'm4a', mime_type: 'video/mp4' },
  { file_name: 'recording', file_type: 'wav', mime_type: '' },
  {
    file_name: 'download',
    file_type: '',
    mime_type: '',
    file_link: 'file:///fixtures/hello%20world.mp3?token=fixture',
  },
])('recognises audio metadata: %s', async fields => {
  await render({ ...audio, ...fields });
  expect(button().props.title).toBe('Play audio');
  expect(engine().props.controls).not.toBe(true);
});

test('shows a useful error and retries with a fresh paused player', async () => {
  await render();
  await act(async () => engine().props.onError());
  expect(
    tree.root
      .findAllByType(AppText)
      .some(node => node.props.children === 'Unable to play this audio file.'),
  ).toBe(true);
  expect(button().props.title).toBe('Retry audio');
  await act(async () => button().props.onPress());
  expect(mockPlayers.size).toBe(1);
  expect(button().props.title).toBe('Play audio');
  expect(button().props.disabled).toBe(true);
  expect(engine().props.paused).toBe(true);
});

test('releases playback when hidden and resets it when the item changes', async () => {
  await render();
  await act(async () => engine().props.onLoad({ duration: 2 }));
  await act(async () => button().props.onPress());
  await act(async () =>
    tree.update(
      <MediaPreviewModal visible={false} item={audio} onClose={jest.fn()} />,
    ),
  );
  expect(mockPlayers.size).toBe(0);
  await act(async () =>
    tree.update(
      <MediaPreviewModal
        visible
        item={{
          ...audio,
          id: 'audio-2',
          file_link: 'file:///fixtures/next.wav',
        }}
        onClose={jest.fn()}
      />,
    ),
  );
  expect(engine().props.paused).toBe(true);
  expect(engine().props.source.uri).toBe('file:///fixtures/next.wav');
  await act(async () => engine().props.onLoad({ duration: 3 }));
  await act(async () => button().props.onPress());
  await act(async () =>
    tree.update(<MediaPreviewModal visible item={audio} onClose={jest.fn()} />),
  );
  expect(engine().props.paused).toBe(true);
  expect(button().props.disabled).toBe(true);
  expect(mockPlayers.size).toBe(1);
});

test('preserves video controls and image/document previews', async () => {
  await render({
    ...audio,
    mime_type: 'video/mp4',
    file_name: 'clip.mp4',
    file_link: 'file:///fixtures/clip.mp4',
    file_type: 'mp4',
  });
  expect(engine().props.controls).toBe(true);
  expect(tree.root.findAllByType(AppButton)).toHaveLength(0);
  await act(async () =>
    tree.update(
      <MediaPreviewModal
        visible
        item={{
          ...audio,
          file_name: 'photo.png',
          file_link: 'file:///fixtures/photo.png',
          file_type: 'png',
          mime_type: 'image/png',
        }}
        onClose={jest.fn()}
      />,
    ),
  );
  expect(tree.root.findAllByType('ZoomableImage' as never)).toHaveLength(1);
  expect(mockPlayers.size).toBe(0);
  await act(async () =>
    tree.update(
      <MediaPreviewModal
        visible
        item={{
          ...audio,
          file_name: 'notes.pdf',
          file_link: 'file:///fixtures/notes.pdf',
          file_type: 'pdf',
          mime_type: 'application/pdf',
        }}
        onClose={jest.fn()}
      />,
    ),
  );
  expect(
    tree.root
      .findAllByType(AppText)
      .some(node => node.props.children === 'notes.pdf'),
  ).toBe(true);
  expect(tree.root.findAllByType(AppButton)).toHaveLength(0);
});
