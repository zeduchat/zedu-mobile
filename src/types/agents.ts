export interface Agent {
  agent_slug: string;
  avatar: string;
  description: string;
  id: string;
  is_active: boolean;
  last_read_at: string;
  last_thread_id: string;
  name: string;
  stars: number;
  thread_count: number;
  title: string;
  tone: string;
  visibility: string;
  preview_thread: any;
  preview_message: string;
  benefits: string;
  why_use: string;
  how_it_works: string;
  system_prompts: string[];
}

export interface Avatar {
  id: string;
  name: string;
  url: string;
  size: number;
}
