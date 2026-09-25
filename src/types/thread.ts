export type ChannelType = 'DM' | 'GROUP' | string;

export type UserType = 'user' | 'admin' | 'bot' | string;

export type MessageType = 'message' | 'system' | string;

export type Reaction = {
  emoji: string;
  user_id: string;
  username: string;
};

export type Media = {
  id: string;
  file_name: string;
  file_type: string;
  mime_type: string;
  file_link: string;
  size: number;
  organisation_id: string;
  user_id: string;
  folder_id: string | null;
  channel_id: string | null;
  message_id: string | null;
  created_at: string;
  updated_at: string;
  last_accessed_at: string;
  deleted_at: string | null;
  access_type: 'private' | 'public' | string;
  is_shareable: boolean;
};

export type Folder = {
  id: string;
  organisation_id: string;
  user_id: string;
  name: string;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  item_count: number;
};

export type Message = {
  id: string;
  message: string;
  org_id: string;
  channels_id: string;
  user_id: string;
  username: string;
  created_at: string;
  updated_at: string;
  user_type: UserType;
  thread_id: string;
  avatar_url: string;
  default_avatar_url: string;
  edited: boolean;
  full_name: string;
  email: string;
  is_pinned: boolean;
  is_saved: boolean;
  pinned_details: Record<string, unknown>;
  reactions: Reaction[] | null;
};

export type ThreadMessage = {
  thread_id: string;
  channels_id: string;
  org_id: string;
  username: string;
  status: string;
  created_at: string;
  updated_at: string;
  message_count: number;
  last_reply: string;
  avatar_url: string;
  default_avatar_url: string;
  user_type: UserType;
  type: MessageType;
  message: string;
  channel_name: string;
  channel_type: ChannelType;
  current_status: string;
  full_name: string;
  email: string;
  user_id: string;
  edited: boolean;
  is_pinned: boolean;
  messages: Message[];
  media: Media[];
  pinned_details: Record<string, unknown>;
  reactions: Reaction[] | null;
};

export type ThreadListItem = {
  thread_id: string;
  thread_messages: ThreadMessage[];
  channel_name: string;
  participants: string;
  previe_message: string;
  sender_avatar_url: string;
  sender_default_avatar_url: string;
  channel_type: ChannelType;
};

export type OrganisationThreadsData = {
  unseen_thread_count: number;
  threads: ThreadListItem[];
};

export type ThreadListResponse = ThreadListItem[];
