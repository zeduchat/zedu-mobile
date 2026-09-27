import { DeleteRequest, GetRequest, PostRequest } from '@/utils/requests';

export type PinTarget =
  | { kind: 'thread'; channelId: string; threadId: string }
  | {
      kind: 'message';
      channelId: string;
      threadId: string;
      messageId: string;
    };

export const pinMessage = async (target: PinTarget) => {
  if (target.kind === 'thread') {
    return PostRequest(`/channels/pin/${target.channelId}/thread`, {
      thread_id: target.threadId,
    });
  }

  return PostRequest(`/channels/pin/${target.channelId}/message`, {
    thread_id: target.threadId,
    message_id: target.messageId,
  });
};

export const unpinMessage = async (target: PinTarget) => {
  if (target.kind === 'thread') {
    return DeleteRequest(
      `/channels/pin/${target.channelId}/thread/${target.threadId}`,
    );
  }

  return DeleteRequest(
    `/channels/pin/${target.channelId}/message/${target.messageId}`,
  );
};

export const fetchPinnedMessages = async (channelId: string) => {
  return GetRequest(`/channels/pin/${channelId}`);
};
