import {
  createAgoraRtcEngine,
  ChannelProfileType,
  ClientRoleType,
  RtcConnection,
  IRtcEngineEventHandler,
} from 'react-native-agora';

export interface AgoraServiceConfig {
  appId: string;
  token: string;
  channelName: string;
  uid: string;
}

export interface AgoraEventHandlers {
  onUserJoined?: (uid: number) => void;
  onUserOffline?: (uid: number) => void;
  onJoinChannelSuccess?: () => void;
  onLeaveChannel?: () => void;
  onError?: (code: number, message: string) => void;
  // Keep these as your custom bridge names
  onUserPublished?: (uid: number, mediaType: 'audio' | 'video') => void;
  onUserUnpublished?: (uid: number, mediaType: 'audio' | 'video') => void;
}

class AgoraService {
  private engine: any = null;
  private eventHandler: IRtcEngineEventHandler | null = null;
  private config: AgoraServiceConfig | null = null;
  private handlers: AgoraEventHandlers = {};
  private isInitialized = false;
  private isJoined = false;
  private localUid: number | null = null;

  private parseNumericUid(uid: string): number | null {
    if (!/^\d+$/.test(uid)) return null;
    const parsed = Number(uid);
    if (!Number.isInteger(parsed)) return null;
    if (parsed < 1 || parsed > 4294967295) return null;
    return parsed;
  }

  // Permissions logic moved to WelcomeScreen
  async requestPermissions(): Promise<boolean> {
    return true;
  }

  async initialize(config: AgoraServiceConfig): Promise<boolean> {
    try {
      if (this.isInitialized) return true;

      // Permissions are now handled globally on WelcomeScreen

      this.config = config;
      this.localUid = this.parseNumericUid(config.uid);

      this.engine = createAgoraRtcEngine();
      await this.engine.initialize({
        appId: config.appId,
        logConfig: { level: 0 },
      });

      await this.engine.enableVideo();
      await this.engine.enableAudio();
      await this.engine.enableLocalAudio(false);
      await this.engine.enableLocalVideo(false);

      this.registerNativeEventHandler();

      this.isInitialized = true;
      return true;
    } catch (error) {
      return false;
    }
  }

  setEventHandlers(handlers: AgoraEventHandlers): void {
    this.handlers = handlers;
    this.registerNativeEventHandler();
  }

  private emitRemoteMediaState(
    uid: number,
    mediaType: 'audio' | 'video',
    isPublished: boolean,
    source: string,
  ): void {
    if (isPublished) this.handlers.onUserPublished?.(uid, mediaType);
    else this.handlers.onUserUnpublished?.(uid, mediaType);
  }

  private registerNativeEventHandler(): void {
    if (!this.engine) return;

    const nextHandler: IRtcEngineEventHandler = {
      onJoinChannelSuccess: () => {
        this.handlers.onJoinChannelSuccess?.();
      },
      onLeaveChannel: () => {
        this.handlers.onLeaveChannel?.();
      },
      onError: (err: any) => {
        const code = typeof err === 'number' ? err : (err as any)?.err ?? -1;
        this.handlers.onError?.(code, `Agora error: ${code}`);
      },
      onUserJoined: (_connection: any, uid: number) => {
        this.handlers.onUserJoined?.(uid);
      },
      onUserOffline: (_connection: any, uid: number) => {
        this.handlers.onUserOffline?.(uid);
      },
      onRemoteAudioStateChanged: (
        _connection: any,
        uid: number,
        state: number,
      ) => {
        if (state === 2)
          this.emitRemoteMediaState(
            uid,
            'audio',
            true,
            'onRemoteAudioStateChanged',
          );
        else if (state === 0)
          this.emitRemoteMediaState(
            uid,
            'audio',
            false,
            'onRemoteAudioStateChanged',
          );
      },
      onRemoteVideoStateChanged: (
        _connection: any,
        uid: number,
        state: number,
      ) => {
        if (state === 2)
          this.emitRemoteMediaState(
            uid,
            'video',
            true,
            'onRemoteVideoStateChanged',
          );
        else if (state === 0)
          this.emitRemoteMediaState(
            uid,
            'video',
            false,
            'onRemoteVideoStateChanged',
          );
      },
    };

    this.eventHandler = nextHandler;
    this.engine.registerEventHandler(nextHandler);
  }

  async joinChannel(): Promise<boolean> {
    if (!this.engine || !this.config) return false;
    if (this.isJoined) return true;

    try {
      await this.engine.setChannelProfile(
        ChannelProfileType.ChannelProfileCommunication,
      );

      const options = {
        clientRoleType: ClientRoleType.ClientRoleBroadcaster,
        publishMicrophoneTrack: true,
        publishCameraTrack: true,
        autoSubscribeAudio: true,
        autoSubscribeVideo: true,
      };

      let result = -1;
      if (this.localUid !== null) {
        result = await this.engine.joinChannel(
          this.config.token,
          this.config.channelName,
          this.localUid,
          options,
        );
      } else {
        result = await this.engine.joinChannelWithUserAccount(
          this.config.token,
          this.config.channelName,
          this.config.uid,
          options,
        );
      }

      this.isJoined = result === 0;
      return result === 0;
    } catch (error) {
      console.error('[AGORA JOIN] failed', error);
      return false;
    }
  }

  async leaveChannel(): Promise<boolean> {
    try {
      if (!this.engine) return false;
      await this.engine.stopPreview();
      await this.engine.leaveChannel();
      this.isJoined = false;
      return true;
    } catch (error) {
      return false;
    }
  }

  async stopAllLocalMedia(): Promise<void> {
    try {
      if (!this.engine) return;

      await this.engine.enableLocalAudio(false);
      await this.engine.muteLocalAudioStream(true);
      await this.engine.enableLocalVideo(false);
      await this.engine.muteLocalVideoStream(true);

      if (this.isJoined) {
        await this.engine.updateChannelMediaOptions({
          publishMicrophoneTrack: false,
          publishCameraTrack: false,
          publishScreenCaptureAudio: false,
          publishScreenCaptureVideo: false,
        });
      }

      if (typeof this.engine.stopScreenCapture === 'function') {
        await this.engine.stopScreenCapture();
      }

      if (typeof this.engine.stopPreview === 'function') {
        await this.engine.stopPreview();
      }
    } catch (error) {
      console.error('[AGORA] stopAllLocalMedia failed', error);
    }
  }

  async toggleMicrophone(enabled: boolean): Promise<void> {
    try {
      if (!this.engine) return;
      // Native needs both: hardware toggle and stream mute toggle
      await this.engine.enableLocalAudio(enabled);
      await this.engine.muteLocalAudioStream(!enabled);
      if (this.isJoined) {
        await this.engine.updateChannelMediaOptions({
          publishMicrophoneTrack: enabled,
        });
      }
    } catch (error) {
      console.error(error);
    }
  }

  async toggleCamera(enabled: boolean): Promise<void> {
    try {
      if (!this.engine) return;
      await this.engine.enableLocalVideo(enabled);
      await this.engine.muteLocalVideoStream(!enabled);
      if (this.isJoined) {
        await this.engine.updateChannelMediaOptions({
          publishCameraTrack: enabled,
        });
      }
      if (enabled) await this.engine.startPreview();
      else await this.engine.stopPreview();
    } catch (error) {
      console.error(error);
    }
  }

  async release(): Promise<void> {
    try {
      if (this.engine) {
        if (
          this.eventHandler &&
          typeof this.engine.unregisterEventHandler === 'function'
        ) {
          this.engine.unregisterEventHandler(this.eventHandler);
        }
        await this.leaveChannel();
        this.engine.release();
        this.engine = null;
        this.eventHandler = null;
        this.handlers = {};
        this.isInitialized = false;
      }
    } catch (error) {
      console.error(error);
    }
  }
}

export default new AgoraService();
