import React, { useEffect, useState } from 'react';
import { navigationRef, navigate } from '@/navigation/root-navigation';
import { voiceNotePlaybackService } from '@/services/voice-note-playback.service';
import { WebViewVoiceEngine } from './webview-voice-engine';
import { MinimizedVoiceNoteWidget } from './minimized-voice-note-widget';

export const VoiceNotePlaybackHost = () => {
  const [, setTick] = useState(0);

  useEffect(() => {
    return voiceNotePlaybackService.subscribe(() => {
      setTick(value => value + 1);
    });
  }, []);

  useEffect(() => {
    voiceNotePlaybackService.handleNavigationChange();

    if (!navigationRef.isReady()) {
      return;
    }

    const unsubscribe = navigationRef.addListener('state', () => {
      voiceNotePlaybackService.handleNavigationChange();
    });

    return unsubscribe;
  }, []);

  const playback = voiceNotePlaybackService.getState();
  const track = playback.activeTrack;

  const handleExpand = () => {
    const target = voiceNotePlaybackService.getExpandNavigation();
    if (!target) return;
    navigate(target.name, target.params);
    voiceNotePlaybackService.handleNavigationChange();
  };

  return (
    <>
      {playback.engine === 'webview' && playback.cachedUri && track ? (
        <WebViewVoiceEngine
          localUri={playback.cachedUri}
          remoteUri={track.voiceMedia.file_link}
          isPlaying={playback.isPlaying}
          shouldResume={playback.webShouldResume}
          onReady={voiceNotePlaybackService.handleWebViewReady}
          onProgress={voiceNotePlaybackService.handleWebViewProgress}
          onEnded={voiceNotePlaybackService.handleWebViewEnded}
          onError={voiceNotePlaybackService.handleWebViewError}
        />
      ) : null}

      <MinimizedVoiceNoteWidget
        visible={playback.showWidget}
        onExpand={handleExpand}
      />
    </>
  );
};
