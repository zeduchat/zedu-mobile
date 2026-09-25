import { BuzzData } from '@/services/buzz.service';

export type DirectCallStatus =
  | 'idle'
  | 'ringing'
  | 'accepted'
  | 'declined'
  | 'cancelled'
  | 'missed'
  | 'ended';

export type DirectCallJoinStatus =
  | 'pending'
  | 'accepted'
  | 'declined'
  | 'timeout';

export interface DirectCallUser {
  user_id: string;
  username?: string;
  full_name?: string;
  avatar_url?: string;
  join_status?: DirectCallJoinStatus;
}

export interface DirectCallSession {
  call_id: string;
  status: DirectCallStatus;
  buzz_code?: string;
  buzz_data?: BuzzData;
  participants?: DirectCallUser[];
  caller?: DirectCallUser;
  callee?: DirectCallUser;
  expires_at?: string;
  created_at?: string;
}
