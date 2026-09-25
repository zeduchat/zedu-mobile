export interface Org {
  Users: any;
  channels: any;
  channels_count: number;
  country: string;
  created_at: string;
  credit_balance: number;
  description: string;
  email: string;
  id: string;
  location: string;
  logo_url: string;
  name: string;
  org_plan_id: string;
  org_roles: any;
  organisation_slug: string;
  owner_id: string;
  pinned: boolean;
  total_messages_count: number;
  type: string;
  updated_at: string;
}

export interface OrgMembers {
  created_at: string;
  email: string;
  entity_type: string;
  id: string;
  name: string;
  phone_number: string;
  profile_url: string;
  role: string;
  status: string;
  username: string;
  default_avatar_url: string;
  avatar_url: string;
}
