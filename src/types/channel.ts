export interface Channel {
  access: boolean;
  channel_slug: string;
  channel_id: string;
  thread_id: string;
  channels_id: string;
  created_at: string;
  description: string;
  message: string;
  is_private: boolean;
  last_post_time: string;
  member_avatars: string[];
  members_count: number;
  users_count: number;
  name: string;
  organisation_id: string;
  owner_id: string;
  owner_name: string;
  topic: string;
  mention_count: number;
  thread_count: number;
  preview_thread: ChannelChat[];
  preview_message: string;
  participants: Participant[];
  preview_media: any;
  active_buzz?: {
    buzz_id: string;
    host_id: string;
    host_name: string;
    participant_count: number;
    started_at: string;
  };
  last_read_at: string;
}

interface Participant {
  avatar_url: string;
  default_avatar_url: string;
  email: string;
  user_id: string;
  username: string;
  is_admin: boolean;
  title: string;
  user_type: string;
  online: boolean;
}

export interface ChannelChat {
  avatar_url: string;
  channel_name: string;
  channel_type: string;
  channels_id: string;
  created_at: string;
  current_status: string;
  edited: boolean;
  email: string;
  full_name: string;
  is_pinned: boolean;
  last_reply: string;
  message: string;
  org_id: string;
  pinned_details: any;
  reactions: any;
  status: string;
  thread_id: string;
  type: string;
  user_id: string;
  user_type: string;
  username: string;
  isOptimistic: string;
}
