import { useState } from 'react';
import { ACTIONS } from '@/store/types';
import { useDataContext } from '@/store/useDataContext';
import { clearAllData } from '@/utils/helper';

export const useLogout = () => {
  const [loading, setLoading] = useState(false);
  const { dispatch } = useDataContext();

  const logout = async () => {
    try {
      setLoading(true);

      await clearAllData();

      dispatch({ type: ACTIONS.TOKEN, payload: null });
      dispatch({ type: ACTIONS.USER, payload: null });
      dispatch({ type: ACTIONS.ORG_DATA, payload: null });
      dispatch({ type: ACTIONS.USER_CHANNELS, payload: [] });
      dispatch({ type: ACTIONS.DMS, payload: [] });
      dispatch({ type: ACTIONS.DMS_CHAT, payload: { data: [], page: 1 } });
    } catch (e) {
      console.error('Logout error', e);
    } finally {
      setLoading(false);
    }
  };

  return { logout, loading };
};
