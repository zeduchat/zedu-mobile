export interface BuzzParticipant {
  user_id: string;
  id?: string;
  username?: string;
  full_name?: string;
  avatar_url?: string;
  audioTrack?: boolean;
  videoTrack?: boolean;
  handsRaised: boolean;
  isPinned: boolean;
  status: string;
}

export interface BuzzChat {
  message_id: string;
  sender_id: string;
  content: string;
  timestamp: string;
  reactions: any[];
}

export interface OrgBuzz {
  buzz_id: string;
  buzz_code: string;
  channel_id: string;
  channel_name?: string;
  channel_type: string;
  host_id: string;
  org_id: string;
  status: string;
  participant_count: number;
  buzz_type: string;
  created_at: string;
  started_at: string;
  ended_at?: string;
}

export interface OrgBuzzPagination {
  current_page: number;
  page_count: number;
  total_pages_count: number;
  total_items: number;
}

export interface OrgBuzzListResponse {
  status: string;
  message: string;
  status_code: number;
  data: {
    buzzes: OrgBuzz[];
    pagination: OrgBuzzPagination;
  };
}
