import { OrganisationThreadsData, ThreadListItem } from '@/types/thread';

export const parseOrganisationThreadsResponse = (
  data:
    | { data?: OrganisationThreadsData | ThreadListItem[] }
    | null
    | undefined,
): { threads: ThreadListItem[]; unseenThreadCount: number } => {
  const payload = data?.data;

  if (!payload || Array.isArray(payload)) {
    return {
      threads: Array.isArray(payload) ? payload : [],
      unseenThreadCount: 0,
    };
  }

  return {
    threads: payload.threads ?? [],
    unseenThreadCount: payload.unseen_thread_count ?? 0,
  };
};
