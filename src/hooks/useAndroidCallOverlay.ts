import { useCallback, useEffect, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { useDataContext } from '@/store/useDataContext';
import { navigate } from '@/navigation/root-navigation';
import { ACTIONS } from '@/store/types';
import {
  bringAppToForeground,
  canDrawCallOverlay,
  dismissCallOverlay,
  hideAndroidCallOverlay,
  isAndroidCallOverlaySupported,
  isCallOverlaySupported,
  isIosCallPiPSupported,
  prepareIosCallPiP,
  requestCallOverlayPermission,
  showAndroidCallOverlay,
  subscribeToCallOverlayActions,
  syncOngoingCallCallKit,
  updateAndroidCallOverlayMic,
} from '@/native/android-call-overlay';
import { useActiveCallActions } from '@/hooks/useActiveCallActions';
import { ShowNotify } from '@/components/ui/toast';

interface UseAndroidCallOverlayOptions {
  currentRoute?: string;
}

export const useAndroidCallOverlay = ({
  currentRoute,
}: UseAndroidCallOverlayOptions) => {
  const { state, dispatch } = useDataContext();
  const {
    buzzCode,
    buzzData,
    isMuted,
    toggleMic,
    syncMicMuted,
    sendQuickEmoji,
    endCall,
  } = useActiveCallActions();

  const overlayVisibleRef = useRef(false);
  const permissionRequestedRef = useRef(false);
  const appStateRef = useRef<AppStateStatus>(AppState.currentState);
  const lastCallKitBuzzCodeRef = useRef<string | null>(null);
  const lastCallKitBuzzIdRef = useRef<string | null>(null);

  const isCallRoute =
    currentRoute === 'OngoingDirectCall' ||
    currentRoute === 'CallScreen' ||
    currentRoute === 'ChannelCall';

  const isActiveCall = Boolean(
    buzzCode &&
      buzzData &&
      (state?.hasJoined || state?.isCallMinimized || isCallRoute),
  );

  const expandCall = useCallback(() => {
    if (!buzzCode || !buzzData || !state?.hasJoined) return;

    if (isCallRoute && !state?.isCallMinimized) {
      return;
    }

    dispatch({ type: ACTIONS.CALL_MINIMIZED, payload: false });

    if (state?.minimizedFrom === 'CallScreen') {
      navigate('BuzzStack', {
        screen: 'CallScreen',
        params: { buzzCode, buzzData },
      } as any);
      return;
    }

    if (state?.minimizedFrom === 'ChannelCall') {
      navigate('BuzzStack', {
        screen: 'ChannelCall',
        params: { buzzCode, buzzData },
      } as any);
      return;
    }

    if (state?.minimizedFrom === 'OngoingDirectCall' || isCallRoute) {
      navigate('DirectCallStack', {
        screen: 'OngoingDirectCall',
        params: { buzzCode, buzzData },
      } as any);
      return;
    }

    navigate('BuzzStack', {
      screen: 'CallScreen',
      params: { buzzCode, buzzData },
    } as any);
  }, [
    buzzCode,
    buzzData,
    dispatch,
    isCallRoute,
    state?.hasJoined,
    state?.isCallMinimized,
    state?.minimizedFrom,
  ]);

  const ensureOverlayPermission = useCallback(async (): Promise<boolean> => {
    const hasPermission = await canDrawCallOverlay();
    if (hasPermission) {
      return true;
    }

    if (!permissionRequestedRef.current) {
      permissionRequestedRef.current = true;
      await requestCallOverlayPermission();
    }

    return canDrawCallOverlay();
  }, []);

  const showOverlay = useCallback(async () => {
    if (!isCallOverlaySupported || !isActiveCall) {
      return;
    }

    const hasPermission = await ensureOverlayPermission();
    if (!hasPermission) {
      if (isAndroidCallOverlaySupported) {
        ShowNotify(
          'Permission needed',
          'Allow display over other apps to keep your buzz call widget visible',
        );
      }
      return;
    }

    const title = buzzData?.buzz_code || buzzData?.title || 'Buzz call';
    await showAndroidCallOverlay(String(title), isMuted);
    overlayVisibleRef.current = true;
  }, [
    buzzData?.buzz_code,
    buzzData?.title,
    ensureOverlayPermission,
    isActiveCall,
    isMuted,
  ]);

  const hideOverlay = useCallback(async () => {
    if (isIosCallPiPSupported) {
      await hideAndroidCallOverlay();
      overlayVisibleRef.current = false;
      return;
    }

    if (!overlayVisibleRef.current) {
      return;
    }

    await hideAndroidCallOverlay();
    overlayVisibleRef.current = false;
  }, []);

  const dismissOverlay = useCallback(async () => {
    await dismissCallOverlay();
    overlayVisibleRef.current = false;
  }, []);

  useEffect(() => {
    if (!isCallOverlaySupported) {
      return;
    }

    updateAndroidCallOverlayMic(isMuted);
  }, [isMuted]);

  useEffect(() => {
    if (
      !isIosCallPiPSupported ||
      !isActiveCall ||
      appStateRef.current !== 'active'
    ) {
      return;
    }

    const title = buzzData?.buzz_code || buzzData?.title || 'Buzz call';
    prepareIosCallPiP(String(title), isMuted);
  }, [buzzData?.buzz_code, buzzData?.title, isActiveCall, isMuted]);

  useEffect(() => {
    if (!isCallOverlaySupported) {
      return;
    }

    const subscription = subscribeToCallOverlayActions(
      async (action, payload) => {
        switch (action) {
          case 'expand':
            await bringAppToForeground();
            expandCall();
            break;
          case 'endCall':
            if (payload?.handledNatively) {
              await endCall({ skipMedia: true });
              break;
            }
            await dismissOverlay();
            await endCall();
            break;
          case 'toggleMic':
            if (
              payload?.handledNatively &&
              typeof payload.isMuted === 'boolean'
            ) {
              syncMicMuted(payload.isMuted);
              break;
            }
            await toggleMic();
            break;
          case 'toggleEmoji':
            await sendQuickEmoji();
            break;
          default:
            break;
        }
      },
    );

    return subscription;
  }, [endCall, expandCall, sendQuickEmoji, syncMicMuted, toggleMic]);

  useEffect(() => {
    if (!isCallOverlaySupported || !isActiveCall) {
      hideOverlay();
      return;
    }

    const handleAppStateChange = async (nextState: AppStateStatus) => {
      const previousState = appStateRef.current;
      appStateRef.current = nextState;

      const movedToBackground =
        previousState === 'active' &&
        (nextState === 'background' || nextState === 'inactive');

      const movedToForeground =
        (previousState === 'background' || previousState === 'inactive') &&
        nextState === 'active';

      if (movedToBackground) {
        await showOverlay();
        return;
      }

      if (movedToForeground) {
        await hideOverlay();
      }
    };

    const subscription = AppState.addEventListener(
      'change',
      handleAppStateChange,
    );

    if (appStateRef.current !== 'active' && isActiveCall) {
      showOverlay();
    }

    return () => {
      subscription.remove();
      hideOverlay();
    };
  }, [hideOverlay, isActiveCall, showOverlay]);

  useEffect(() => {
    if (!isActiveCall) {
      dismissOverlay();
    }
  }, [dismissOverlay, isActiveCall]);

  useEffect(() => {
    if (!isIosCallPiPSupported) {
      return;
    }

    const title = buzzData?.buzz_code || buzzData?.title || 'Buzz call';
    const buzzId = buzzData?.buzz_id ? String(buzzData.buzz_id) : null;

    if (isActiveCall && buzzCode) {
      const normalizedBuzzCode = String(buzzCode);
      lastCallKitBuzzCodeRef.current = normalizedBuzzCode;
      lastCallKitBuzzIdRef.current = buzzId;
      syncOngoingCallCallKit(normalizedBuzzCode, String(title), true, buzzId);
      return;
    }

    const codeToEnd = lastCallKitBuzzCodeRef.current;
    if (!codeToEnd) {
      return;
    }

    syncOngoingCallCallKit(
      codeToEnd,
      String(title),
      false,
      lastCallKitBuzzIdRef.current,
    );
    lastCallKitBuzzCodeRef.current = null;
    lastCallKitBuzzIdRef.current = null;
  }, [
    buzzCode,
    buzzData?.buzz_code,
    buzzData?.buzz_id,
    buzzData?.title,
    isActiveCall,
  ]);
};
