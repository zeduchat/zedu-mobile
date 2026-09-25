import AgoraService, { AgoraServiceConfig } from '@/services/agora.service';

type JoinDirectCallAgoraOptions = {
  isMuted: boolean;
  showVideo: boolean;
};

export const joinDirectCallAgoraChannel = async (
  buzzData: any,
  options: JoinDirectCallAgoraOptions,
): Promise<boolean> => {
  const agoraToken = buzzData?.agora_token;
  if (
    !agoraToken?.app_id ||
    !agoraToken?.token ||
    !agoraToken?.channel_name ||
    !agoraToken?.uid
  ) {
    return false;
  }

  const config: AgoraServiceConfig = {
    appId: agoraToken.app_id,
    token: agoraToken.token,
    channelName: agoraToken.channel_name,
    uid: agoraToken.uid,
  };

  if (AgoraService.isJoinedToChannel(config.channelName)) {
    await AgoraService.toggleMicrophone(!options.isMuted);
    await AgoraService.toggleCamera(options.showVideo);
    return true;
  }

  const initialized = await AgoraService.initialize(config);
  if (!initialized) {
    return false;
  }

  const joined = await AgoraService.joinChannel();
  if (!joined) {
    return false;
  }

  await AgoraService.toggleMicrophone(!options.isMuted);
  await AgoraService.toggleCamera(options.showVideo);
  return true;
};
