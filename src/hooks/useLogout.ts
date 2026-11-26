import { useState } from 'react';
import { useDataContext } from '@/store/useDataContext';
import { signOut } from '@/utils/sign-out';
import { unregisterAndroidPushToken } from '@/services/android-fcm.service';

export const useLogout = () => {
  const [loading, setLoading] = useState(false);
  const { dispatch } = useDataContext();

  const logout = async () => {
    try {
      setLoading(true);

      await unregisterAndroidPushToken();
      await signOut(dispatch);
    } catch (e) {
      console.error('Logout error', e);
    } finally {
      setLoading(false);
    }
  };

  return { logout, loading };
};
