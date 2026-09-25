import AudioRecorderPlayer from 'react-native-audio-recorder-player';
import {
  VoiceMedia,
  buildVoiceMediaFromUrl,
  ensureCachedVoiceAudio,
  getVoicePlaybackEngine,
  isWebRecordedVoice,
  toFileUri,
  VoicePlaybackEngine,
} from '@/utils/voice-message';
import { getFocusedRouteInfo } from '@/navigation/root-navigation';

export type VoiceNoteChatKind = 'dm' | 'group' | 'channel';

export type VoiceNoteSource = {
  parentStack: 'ChatStack' | 'ChannelStack';
  channel_id: string;
  chatKind: VoiceNoteChatKind;
};

export type VoiceNoteTrack = {
  trackId: string;
  audioUrl: string;
  voiceMedia: VoiceMedia;
  item?: any;
};

export type VoiceNotePlaybackState = {
  activeTrack: VoiceNoteTrack | null;
  source: VoiceNoteSource | null;
  isPlaying: boolean;
  isLoading: boolean;
  isPaused: boolean;
  currentMs: number;
  durationMs: number;
  engine: VoicePlaybackEngine | null;
  cachedUri: string | null;
  webShouldResume: boolean;
  showWidget: boolean;
};

const INLINE_CHAT_SCREENS = new Set([
  'ChatDetails',
  'GroupChatDetails',
  'ChannelChat',
  'ChannelThread',
  'GroupChatThreadScreen',
  'ChatThreadScreen',
]);

const sharedPlayer = new AudioRecorderPlayer();
const listeners = new Set<() => void>();

let state: VoiceNotePlaybackState = {
  activeTrack: null,
  source: null,
  isPlaying: false,
  isLoading: false,
  isPaused: false,
  currentMs: 0,
  durationMs: 0,
  engine: null,
  cachedUri: null,
  webShouldResume: false,
  showWidget: false,
};

function emit() {
  listeners.forEach(listener => listener());
}

function setState(patch: Partial<VoiceNotePlaybackState>) {
  state = { ...state, ...patch };
  emit();
}

function getChannelIdFromParams(params?: Record<string, any>): string | null {
  if (!params) return null;
  return String(params.channel_id || params.channels_id || '');
}

function inferChatKind(
  parentStack?: string,
  screenName?: string,
  params?: Record<string, any>,
): VoiceNoteChatKind {
  if (parentStack === 'ChannelStack') {
    return 'channel';
  }

  if (
    screenName === 'GroupChatDetails' ||
    screenName === 'GroupChatThreadScreen'
  ) {
    return 'group';
  }

  if (params?.chatType === 'group_dm') {
    return 'group';
  }

  if (params?.chatType === 'channel') {
    return 'channel';
  }

  return 'dm';
}

function captureSourceFromNavigation(): VoiceNoteSource | null {
  const focused = getFocusedRouteInfo();
  if (!focused?.parentStack || !focused.params) {
    return null;
  }

  const channel_id = getChannelIdFromParams(focused.params);
  if (!channel_id) {
    return null;
  }

  if (
    focused.parentStack !== 'ChatStack' &&
    focused.parentStack !== 'ChannelStack'
  ) {
    return null;
  }

  return {
    parentStack: focused.parentStack,
    channel_id,
    chatKind: inferChatKind(focused.parentStack, focused.name, focused.params),
  };
}

function shouldShowWidget(): boolean {
  if (!state.activeTrack) {
    return false;
  }

  if (!state.isPlaying && !state.isPaused) {
    return false;
  }

  const focused = getFocusedRouteInfo();
  if (!focused || !state.source) {
    return true;
  }

  const channelId = getChannelIdFromParams(focused.params);
  const isSameConversation =
    channelId === state.source.channel_id &&
    focused.parentStack === state.source.parentStack &&
    INLINE_CHAT_SCREENS.has(focused.name);

  return !isSameConversation;
}

function syncWidgetVisibility() {
  const showWidget = shouldShowWidget();
  if (showWidget !== state.showWidget) {
    setState({ showWidget });
  }
}

async function resolvePlaybackUri(
  voiceMedia: VoiceMedia,
  audioUrl: string,
): Promise<string> {
  if (isWebRecordedVoice(voiceMedia)) {
    const localPath = await ensureCachedVoiceAudio(voiceMedia);
    setState({ cachedUri: localPath });
    return toFileUri(localPath);
  }

  return audioUrl;
}

async function startNativePlayback(track: VoiceNoteTrack) {
  setState({
    isLoading: true,
    engine: 'native',
    source: captureSourceFromNavigation(),
  });

  try {
    const playbackUri = await resolvePlaybackUri(
      track.voiceMedia,
      track.audioUrl,
    );

    if (state.isPaused) {
      await sharedPlayer.resumePlayer();
    } else {
      await sharedPlayer.startPlayer(playbackUri);
    }

    let firstCallback = true;
    sharedPlayer.addPlayBackListener(event => {
      if (firstCallback) {
        firstCallback = false;
        setState({ isLoading: false, isPlaying: true, isPaused: false });
        syncWidgetVisibility();
      }

      setState({
        currentMs: event.currentPosition,
        durationMs: event.duration > 0 ? event.duration : state.durationMs,
      });

      if (event.currentPosition >= event.duration - 200 && event.duration > 0) {
        sharedPlayer.removePlayBackListener();
        resetPlayback();
      }
    });
  } catch (err) {
    console.warn('[VoiceNotePlayback]', err);
    resetPlayback();
  }
}

async function startWebViewPlayback(track: VoiceNoteTrack) {
  setState({
    isLoading: true,
    engine: 'webview',
    source: captureSourceFromNavigation(),
    webShouldResume: state.isPaused,
  });

  if (!state.isPaused) {
    setState({ currentMs: 0 });
  }

  try {
    const localPath = await ensureCachedVoiceAudio(track.voiceMedia);
    setState({
      cachedUri: localPath,
      isPlaying: true,
      isPaused: false,
    });
    syncWidgetVisibility();
  } catch (err) {
    console.warn('[VoiceNotePlayback]', err);
    resetPlayback();
  }
}

function resetPlayback() {
  sharedPlayer.stopPlayer().catch(() => {});
  sharedPlayer.removePlayBackListener();
  state = {
    activeTrack: null,
    source: null,
    isPlaying: false,
    isLoading: false,
    isPaused: false,
    currentMs: 0,
    durationMs: 0,
    engine: null,
    cachedUri: null,
    webShouldResume: false,
    showWidget: false,
  };
  emit();
}

export const voiceNotePlaybackService = {
  subscribe(listener: () => void) {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },

  getState(): VoiceNotePlaybackState {
    return state;
  },

  handleNavigationChange() {
    syncWidgetVisibility();
  },

  async togglePlayback({
    trackId,
    audioUrl,
    item,
    media,
  }: {
    trackId: string;
    audioUrl: string;
    item?: any;
    media?: VoiceMedia;
  }) {
    const voiceMedia = media ?? buildVoiceMediaFromUrl(audioUrl, item);
    const playbackEngine = getVoicePlaybackEngine(voiceMedia);
    const isSameTrack = state.activeTrack?.trackId === trackId;

    if (isSameTrack && state.isPlaying) {
      if (state.engine === 'native') {
        await sharedPlayer.pausePlayer().catch(() => {});
        sharedPlayer.removePlayBackListener();
      }

      setState({
        isPlaying: false,
        isPaused: true,
        showWidget: shouldShowWidget(),
      });
      return;
    }

    if (isSameTrack && state.isPaused) {
      const track = state.activeTrack!;
      if (playbackEngine === 'webview') {
        await startWebViewPlayback(track);
        return;
      }

      await startNativePlayback(track);
      return;
    }

    resetPlayback();

    const track: VoiceNoteTrack = {
      trackId,
      audioUrl,
      voiceMedia,
      item,
    };

    setState({
      activeTrack: track,
      isPaused: false,
      currentMs: 0,
      durationMs: 0,
      cachedUri: null,
      webShouldResume: false,
    });

    if (playbackEngine === 'webview') {
      await startWebViewPlayback(track);
      return;
    }

    await startNativePlayback(track);
  },

  async stop() {
    resetPlayback();
  },

  handleWebViewReady(durationMs: number) {
    setState({
      isLoading: false,
      durationMs: durationMs > 0 ? durationMs : state.durationMs,
    });
  },

  handleWebViewProgress(currentMs: number, durationMs: number) {
    setState({
      currentMs,
      durationMs: durationMs > 0 ? durationMs : state.durationMs,
    });
  },

  handleWebViewEnded() {
    resetPlayback();
  },

  handleWebViewError() {
    resetPlayback();
  },

  getExpandNavigation() {
    if (!state.source) {
      return null;
    }

    const { parentStack, channel_id, chatKind } = state.source;

    if (parentStack === 'ChannelStack') {
      return {
        name: 'ChannelStack' as const,
        params: {
          screen: 'ChannelChat',
          params: { channel_id },
        },
      };
    }

    if (chatKind === 'group') {
      return {
        name: 'ChatStack' as const,
        params: {
          screen: 'GroupChatDetails',
          params: { channel_id },
        },
      };
    }

    return {
      name: 'ChatStack' as const,
      params: {
        screen: 'ChatDetails',
        params: { channel_id },
      },
    };
  },
};
