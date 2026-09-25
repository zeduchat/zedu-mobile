import { useEffect, useState } from 'react';
import { GetRequest } from '@/utils/requests';
import { mapApiUserStatus, UserStatusDisplay } from '@/utils/user-status';

type UserStatusApiResponse = {
  data?: {
    text?: string;
    emoji?: string;
    expiry?: number;
    visibility?: string;
  };
};

export const useUserProfileStatus = (userId?: string | number | null) => {
  const [status, setStatus] = useState<UserStatusDisplay | null>(null);

  useEffect(() => {
    if (!userId) {
      setStatus(null);
      return;
    }

    let cancelled = false;

    const loadStatus = async () => {
      const { data, error } = await GetRequest<UserStatusApiResponse>(
        `/users/${userId}/status`,
      );

      if (cancelled) {
        return;
      }

      if (error || !data?.data) {
        setStatus(null);
        return;
      }

      const statusData = data.data;
      if (statusData.expiry && statusData.expiry * 1000 < Date.now()) {
        setStatus(null);
        return;
      }

      setStatus(mapApiUserStatus(statusData));
    };

    loadStatus();

    return () => {
      cancelled = true;
    };
  }, [userId]);

  return status;
};
