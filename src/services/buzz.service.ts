import { PostRequest, GetRequest, buildQueryString } from '@/utils/requests';
import { OrgBuzz, OrgBuzzListResponse, OrgBuzzPagination } from '@/types/buzz';
import { OrgBuzzFilter } from '@/utils/org-buzz';

export interface AgoraTokenData {
  token: string;
  app_id: string;
  channel_name: string;
  uid: string;
}

export interface BuzzAgoraTokenRequest {
  buzz_id: string;
  uid: string | number;
}

export interface BuzzAgoraTokenResult {
  token: string;
  uid: string | number;
}

export const getScreenShareAccount = (uid: string | number): string =>
  `screen-${String(uid)}`;

export interface Participant {
  user_id: string;
  username: string;
  full_name: string;
  avatar_url: string;
  joined_at: string;
  status: 'active' | 'inactive';
}

export interface BuzzData {
  buzz_id: string;
  buzz_code: string;
  host_id: string;
  channel_id: string;
  status: 'active' | 'ended';
  created_at: string;
  started_at: string;
  ended_at?: string;
  participants_id: string[];
  participants: Participant[];
  agora_token: AgoraTokenData;
  host_name?: string;
}

export interface BuzzResponse {
  status: string;
  status_code: number;
  message: string;
  data: BuzzData;
}

export type DirectCallResponseAction =
  | 'accept'
  | 'decline'
  | 'timeout'
  | 'cancel';

class BuzzService {
  async createBuzz(): Promise<{ data: BuzzData | null; error: string | null }> {
    try {
      const response = await PostRequest<BuzzResponse>('/buzz/org/create');

      if (response.error) {
        return { data: null, error: response.error };
      }

      if (!response.data || response.data.status_code !== 201) {
        const errorMsg = response.data?.message || 'Failed to create buzz';
        return { data: null, error: errorMsg };
      }

      return { data: response.data.data, error: null };
    } catch (error: any) {
      const message = error?.message || 'Error creating buzz';
      return { data: null, error: message };
    }
  }

  async createChannelBuzz(
    channel_id: string,
  ): Promise<{ data: BuzzData | null; error: string | null }> {
    try {
      const response = await PostRequest<BuzzResponse>('/buzz/create', {
        channel_id,
      });

      if (response.error) {
        return { data: null, error: response.error };
      }

      if (!response.data || response.data.status_code !== 201) {
        const errorMsg = response.data?.message || 'Failed to create buzz';
        return { data: null, error: errorMsg };
      }

      return { data: response.data.data, error: null };
    } catch (error: any) {
      const message = error?.message || 'Error creating buzz';
      return { data: null, error: message };
    }
  }

  async directBuzzCall(
    channel_id: string,
  ): Promise<{ data: BuzzData | null; error: string | null }> {
    try {
      const payload = {
        channel_id,
      };
      const response = await PostRequest<BuzzResponse>(
        '/buzz/direct-call',
        payload,
      );

      if (response.error) {
        return { data: null, error: response.error };
      }

      if (!response.data || response.data.status_code !== 201) {
        const errorMsg = response.data?.message || 'Failed to create buzz';
        return { data: null, error: errorMsg };
      }

      return { data: response.data.data, error: null };
    } catch (error: any) {
      const message = error?.message || 'Error creating buzz';
      return { data: null, error: message };
    }
  }

  async joinBuzz(
    buzzCode: string,
  ): Promise<{ data: BuzzData | null; error: string | null }> {
    try {
      const response = await PostRequest<BuzzResponse>(
        `/buzz/${buzzCode}/join`,
      );

      if (response.error) {
        return { data: null, error: response.error };
      }

      if (!response.data || response.data.status_code !== 200) {
        const errorMsg = response.data?.message || 'Failed to join buzz';
        return { data: null, error: errorMsg };
      }

      return { data: response.data.data, error: null };
    } catch (error: any) {
      const message = error?.message || 'Error joining buzz';
      return { data: null, error: message };
    }
  }

  async getBuzzMetadata(
    buzzCode: string,
  ): Promise<{ data: BuzzData | null; error: string | null }> {
    try {
      const response = await GetRequest<BuzzResponse>(
        `/buzz/${buzzCode}/metadata`,
      );

      if (response.error) {
        return { data: null, error: response.error };
      }

      if (!response.data || response.data.status_code !== 200) {
        const errorMsg = response.data?.message || 'Failed to fetch metadata';
        return { data: null, error: errorMsg };
      }

      return { data: response.data.data, error: null };
    } catch (error: any) {
      const message = error?.message || 'Error fetching metadata';
      return { data: null, error: message };
    }
  }

  async leaveBuzz(
    buzzCode: string,
  ): Promise<{ success: boolean; error: string | null }> {
    try {
      const response = await PostRequest(`/buzz/${buzzCode}/leave`);

      if (response.error) {
        return { success: false, error: response.error };
      }

      return { success: true, error: null };
    } catch (error: any) {
      const message = error?.message || 'Error leaving buzz';
      return { success: false, error: message };
    }
  }

  async endBuzz(
    buzzCode: string,
  ): Promise<{ success: boolean; error: string | null }> {
    try {
      const response = await PostRequest(`/buzz/${buzzCode}/end`);

      if (response.error) {
        return { success: false, error: response.error };
      }

      return { success: true, error: null };
    } catch (error: any) {
      const message = error?.message || 'Error ending buzz';
      return { success: false, error: message };
    }
  }

  // async getDirectBuzzByBuzzId(buzzId: string): Promise<{ buzzCode: string | null; error: string | null }> {
  //     try {
  //         const response = await GetRequest<any>(`/buzz/direct-call/${buzzId}`);

  //         if (response.error) {
  //             return { buzzCode: null, error: response.error };
  //         }

  //         const payload = response.data?.data || response.data;
  //         const buzzCode = payload?.buzz_code;

  //         if (!buzzCode) {
  //             return { buzzCode: null, error: 'Buzz code not found in response' };
  //         }

  //         return { buzzCode, error: null };
  //     } catch (error: any) {
  //         const message = error?.message || 'Error fetching direct buzz';
  //         return { buzzCode: null, error: message };
  //     }
  // }

  async respondToDirectCall(
    buzzId: string,
    action: DirectCallResponseAction,
  ): Promise<{ data: any | null; error: string | null }> {
    try {
      const response = await PostRequest<any>(`/buzz/${buzzId}/respond`, {
        action,
      });

      if (response.error) {
        return { data: null, error: response.error };
      }

      if (!response.data) {
        return {
          data: null,
          error: 'Invalid response from direct call action',
        };
      }

      return { data: response.data?.data || response.data, error: null };
    } catch (error: any) {
      const message = error?.message || 'Error responding to direct call';
      return { data: null, error: message };
    }
  }

  // async getActiveBuzzes(): Promise<{ data: BuzzData[] | null; error: string | null }> {
  //     try {
  //         const response = await GetRequest<{ status: string; data: BuzzData[] }>('/buzz/active');

  //         if (response.error) {
  //             return { data: null, error: response.error };
  //         }

  //         return { data: response.data?.data || [], error: null };
  //     } catch (error: any) {
  //         const message = error?.message || 'Error fetching active buzzes';
  //         return { data: null, error: message };
  //     }
  // }

  async getOrgBuzzes(
    page = 1,
    limit = 20,
    options: { search?: string; filter?: OrgBuzzFilter } = {},
  ): Promise<{
    buzzes: OrgBuzz[];
    pagination: OrgBuzzPagination | null;
    error: string | null;
  }> {
    try {
      const { search = '', filter = 'all' } = options;
      const query = buildQueryString({
        page,
        limit,
        search: search.trim() || undefined,
        channel_type:
          filter === 'channel' ? 'channel' : filter === 'dm' ? 'dm' : undefined,
      });

      const response = await GetRequest<
        OrgBuzzListResponse | { data: OrgBuzzListResponse }
      >(`/buzz/org/all?${query}`);

      if (response.error) {
        return { buzzes: [], pagination: null, error: response.error };
      }

      if (!response.data) {
        const errorMsg = 'Failed to fetch organization buzzes';
        return { buzzes: [], pagination: null, error: errorMsg };
      }

      const raw = response.data;
      const payload: OrgBuzzListResponse =
        raw &&
        typeof raw === 'object' &&
        'data' in raw &&
        typeof (raw as { data?: OrgBuzzListResponse }).data === 'object' &&
        (raw as OrgBuzzListResponse).status_code === undefined &&
        (raw as { data: OrgBuzzListResponse }).data?.status_code !== undefined
          ? (raw as { data: OrgBuzzListResponse }).data
          : (raw as OrgBuzzListResponse);

      const isSuccess =
        payload.status_code === 200 ||
        payload.status === 'success' ||
        payload.status_code === undefined;

      if (!isSuccess) {
        const errorMsg =
          payload.message || 'Failed to fetch organization buzzes';
        return { buzzes: [], pagination: null, error: errorMsg };
      }

      const listData = payload.data;
      const buzzes = listData?.buzzes ?? [];
      const pagination = listData?.pagination ?? null;

      return {
        buzzes,
        pagination,
        error: null,
      };
    } catch (error: any) {
      const message = error?.message || 'Error fetching organization buzzes';
      return { buzzes: [], pagination: null, error: message };
    }
  }

  async startRecording(
    buzzId: string,
  ): Promise<{ success: boolean; error: string | null }> {
    try {
      const response = await PostRequest(`/buzz/${buzzId}/recording/start`, {});

      if (response.error) {
        return { success: false, error: response.error };
      }

      return { success: true, error: null };
    } catch (error: any) {
      const message = error?.message || 'Error starting recording';
      return { success: false, error: message };
    }
  }

  async stopRecording(
    buzzId: string,
  ): Promise<{ success: boolean; error: string | null }> {
    try {
      const response = await PostRequest(`/buzz/${buzzId}/recording/stop`, {});

      if (response.error) {
        return { success: false, error: response.error };
      }

      return { success: true, error: null };
    } catch (error: any) {
      const message = error?.message || 'Error stopping recording';
      return { success: false, error: message };
    }
  }

  async getBuzzAgoraToken(
    payload: BuzzAgoraTokenRequest,
  ): Promise<{ data: BuzzAgoraTokenResult | null; error: string | null }> {
    try {
      const response = await PostRequest<{
        status_code?: number;
        message?: string;
        data?: BuzzAgoraTokenResult;
      }>('/buzz/token', payload);

      if (response.error) {
        return { data: null, error: response.error };
      }

      const tokenData =
        response.data?.data ??
        (response.data as BuzzAgoraTokenResult | undefined);

      if (
        !tokenData?.token ||
        tokenData.uid === undefined ||
        tokenData.uid === null
      ) {
        const errorMsg =
          response.data?.message ||
          'Buzz token response is missing required fields';
        return { data: null, error: errorMsg };
      }

      return { data: tokenData, error: null };
    } catch (error: any) {
      const message = error?.message || 'Failed to fetch buzz token';
      return { data: null, error: message };
    }
  }
}

export default new BuzzService();
