import { GetRequest, PostRequest } from '@/utils/requests';
import { DirectCallSession } from '@/types/direct-call';
import { BuzzData } from './buzz.service';

interface DirectCallResponse {
  status?: string;
  status_code?: number;
  message?: string;
  data?: any;
}

class DirectCallService {
  private normalizeBuzzData(raw: any): BuzzData | undefined {
    const payload = raw?.data || raw;
    const buzz =
      payload?.buzz_data || payload?.buzz || payload?.session || payload;

    if (!buzz?.buzz_code) return undefined;
    return buzz as BuzzData;
  }

  private normalizeSession(raw: any): DirectCallSession | null {
    const payload = raw?.data || raw;
    const callId = String(
      payload?.call_id || payload?.id || payload?.session_id || '',
    );

    if (!callId) return null;

    return {
      call_id: callId,
      status: payload?.status || 'ringing',
      buzz_code:
        payload?.buzz_code ||
        payload?.buzz_data?.buzz_code ||
        payload?.buzz?.buzz_code,
      buzz_data: this.normalizeBuzzData(payload),
      participants:
        payload?.participants ||
        payload?.buzz_data?.participants ||
        payload?.buzz?.participants ||
        [],
      caller: payload?.caller,
      callee: payload?.callee,
      expires_at: payload?.expires_at,
      created_at: payload?.created_at,
    };
  }

  parseIncomingInvite(payload: any): DirectCallSession | null {
    if (!payload) return null;

    const isDirectCallEvent =
      payload?.notification_type === 'incoming_call' ||
      payload?.event === 'incoming_call' ||
      payload?.type === 'incoming_call' ||
      payload?.type === 'direct_call_incoming' ||
      Boolean(payload?.call_id);

    if (!isDirectCallEvent) return null;

    return this.normalizeSession(payload?.data || payload);
  }

  async createDirectCall(
    calleeUserId: string,
  ): Promise<{ data: DirectCallSession | null; error: string | null }> {
    const response = await PostRequest<DirectCallResponse>('/buzz/create', {
      callee_user_id: calleeUserId,
    });

    if (response.error) {
      return { data: null, error: response.error };
    }

    const session = this.normalizeSession(response.data);
    if (!session) {
      return {
        data: null,
        error: response.data?.message || 'Failed to create direct call',
      };
    }

    return { data: session, error: null };
  }

  async createDirectCallBuzz(params: {
    callId: string;
    calleeUserId?: string;
  }): Promise<{ data: BuzzData | null; error: string | null }> {
    const response = await PostRequest<DirectCallResponse>(
      '/buzz/create-buzz',
      {
        call_id: params.callId,
        callee_user_id: params.calleeUserId,
      },
    );

    if (response.error) {
      return { data: null, error: response.error };
    }

    const buzzData = this.normalizeBuzzData(response.data);
    if (!buzzData) {
      return {
        data: null,
        error:
          response.data?.message || 'Failed to create buzz for direct call',
      };
    }

    return { data: buzzData, error: null };
  }

  async acceptDirectCall(
    callId: string,
  ): Promise<{ data: DirectCallSession | null; error: string | null }> {
    const response = await PostRequest<DirectCallResponse>(
      `/buzz/${callId}/accept`,
    );

    if (response.error) {
      return { data: null, error: response.error };
    }

    const session = this.normalizeSession(response.data);
    if (!session) {
      return {
        data: null,
        error: response.data?.message || 'Failed to accept call',
      };
    }

    return { data: session, error: null };
  }

  async declineDirectCall(
    callId: string,
  ): Promise<{ success: boolean; error: string | null }> {
    const response = await PostRequest<DirectCallResponse>(
      `/buzz/${callId}/decline`,
    );

    if (response.error) {
      return { success: false, error: response.error };
    }

    return { success: true, error: null };
  }

  async cancelDirectCall(
    callId: string,
  ): Promise<{ success: boolean; error: string | null }> {
    const response = await PostRequest<DirectCallResponse>(
      `/buzz/${callId}/cancel`,
    );

    if (response.error) {
      return { success: false, error: response.error };
    }

    return { success: true, error: null };
  }

  async getDirectCall(
    callId: string,
  ): Promise<{ data: DirectCallSession | null; error: string | null }> {
    const response = await GetRequest<DirectCallResponse>(`/buzz/${callId}`);

    if (response.error) {
      return { data: null, error: response.error };
    }

    const session = this.normalizeSession(response.data);
    if (!session) {
      return {
        data: null,
        error: response.data?.message || 'Failed to get call status',
      };
    }

    return { data: session, error: null };
  }
}

export default new DirectCallService();
