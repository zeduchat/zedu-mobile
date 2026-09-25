import { useEffect } from 'react';
import { setCallKeepAwake } from '@/native/call-keep-awake';

export const useCallKeepAwake = (enabled: boolean) => {
  useEffect(() => {
    if (!enabled) {
      setCallKeepAwake(false);
      return;
    }

    setCallKeepAwake(true);

    return () => {
      setCallKeepAwake(false);
    };
  }, [enabled]);
};
