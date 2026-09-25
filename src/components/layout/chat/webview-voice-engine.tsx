import React, { useEffect, useMemo, useRef } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { WebView, WebViewMessageEvent } from 'react-native-webview';

const NativeWebView = WebView as unknown as React.ComponentType<any>;
import RNFS from 'react-native-fs';
import { toFileUri } from '@/utils/voice-message';

type WebViewVoiceEngineProps = {
  localUri: string;
  remoteUri?: string;
  isPlaying: boolean;
  shouldResume: boolean;
  onReady: (durationMs: number) => void;
  onProgress: (currentMs: number, durationMs: number) => void;
  onEnded: () => void;
  onError: () => void;
};

type WebViewVoiceMessage =
  | { type: 'ready'; duration: number }
  | { type: 'progress'; current: number; duration: number }
  | { type: 'ended' }
  | { type: 'error' };

const buildVoiceHtml = (fileUri: string, remoteUri?: string) => `<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
  </head>
  <body style="margin:0;background:transparent;">
    <audio id="voice" playsinline webkit-playsinline preload="auto"></audio>
    <script>
      const audio = document.getElementById('voice');
      const fallbackUri = ${JSON.stringify(remoteUri || '')};
      const post = (payload) => {
        if (window.ReactNativeWebView) {
          window.ReactNativeWebView.postMessage(JSON.stringify(payload));
        }
      };

      audio.src = ${JSON.stringify(fileUri)};
      audio.addEventListener('loadedmetadata', () => {
        post({ type: 'ready', duration: (audio.duration || 0) * 1000 });
      });
      audio.addEventListener('timeupdate', () => {
        post({
          type: 'progress',
          current: audio.currentTime * 1000,
          duration: (audio.duration || 0) * 1000,
        });
      });
      audio.addEventListener('ended', () => post({ type: 'ended' }));
      audio.addEventListener('error', () => {
        if (!audio.dataset.fallback && fallbackUri) {
          audio.dataset.fallback = '1';
          audio.src = fallbackUri;
          audio.load();
          return;
        }
        post({ type: 'error' });
      });

      const startPlayback = () => {
        const play = () => audio.play().catch(() => post({ type: 'error' }));
        if (audio.readyState >= 2) {
          play();
        } else {
          audio.addEventListener('canplay', play, { once: true });
        }
      };

      window.playVoice = () => startPlayback();
      window.restartVoice = () => {
        audio.currentTime = 0;
        startPlayback();
      };
      window.pauseVoice = () => audio.pause();
    </script>
  </body>
</html>`;

export const WebViewVoiceEngine = ({
  localUri,
  remoteUri,
  isPlaying,
  shouldResume,
  onReady,
  onProgress,
  onEnded,
  onError,
}: WebViewVoiceEngineProps) => {
  const webViewRef = useRef<any>(null);
  const html = useMemo(
    () => buildVoiceHtml(toFileUri(localUri), remoteUri),
    [localUri, remoteUri],
  );
  const readAccessUrl = useMemo(
    () =>
      Platform.OS === 'ios' ? toFileUri(RNFS.CachesDirectoryPath) : undefined,
    [],
  );

  useEffect(() => {
    if (!isPlaying) {
      webViewRef.current?.injectJavaScript(
        'window.pauseVoice && window.pauseVoice(); true;',
      );
    }
  }, [isPlaying]);

  const injectPlaybackCommand = () => {
    if (!isPlaying) {
      return;
    }

    const command = shouldResume
      ? 'window.playVoice && window.playVoice();'
      : 'window.restartVoice && window.restartVoice();';
    webViewRef.current?.injectJavaScript(`${command} true;`);
  };

  useEffect(() => {
    injectPlaybackCommand();
  }, [isPlaying, shouldResume]);

  const handleMessage = (event: WebViewMessageEvent) => {
    try {
      const data = JSON.parse(event.nativeEvent.data) as WebViewVoiceMessage;
      if (data.type === 'ready') {
        onReady(data.duration);
        return;
      }
      if (data.type === 'progress') {
        onProgress(data.current, data.duration);
        return;
      }
      if (data.type === 'ended') {
        onEnded();
        return;
      }
      if (data.type === 'error') {
        onError();
      }
    } catch {
      onError();
    }
  };

  return (
    <View pointerEvents="none" style={styles.hidden}>
      <NativeWebView
        ref={webViewRef}
        source={{ html }}
        onMessage={handleMessage}
        onLoadEnd={injectPlaybackCommand}
        originWhitelist={['*']}
        allowingReadAccessToURL={readAccessUrl}
        allowFileAccessFromFileURLs
        allowUniversalAccessFromFileURLs
        allowsInlineMediaPlayback
        mediaPlaybackRequiresUserAction={false}
        javaScriptEnabled
        domStorageEnabled
        scrollEnabled={false}
        style={styles.webview}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  hidden: {
    width: 0,
    height: 0,
    opacity: 0,
    overflow: 'hidden',
  },
  webview: {
    width: 1,
    height: 1,
    backgroundColor: 'transparent',
  },
});
