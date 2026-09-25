import { SafeAreaProvider } from 'react-native-safe-area-context';
import BootSplash from 'react-native-bootsplash';
import { useEffect, useRef, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { AppNavigator } from '@/navigation/navigator';
import { DataProvider } from '@/store/GlobalState';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import Toast from 'react-native-toast-message';
import { NotificationToastConfig } from '@/components/ui/toast';
import StatusConnection from '@/centrifugoo/status-connection';
import {
  flushPendingNavigations,
  navigationRef,
} from '@/navigation/root-navigation';
import { ThemeProvider, useTheme } from '@/theme/ThemeProvider';

function AppContent() {
  const { navigationTheme, isReady } = useTheme();
  const initCompleteRef = useRef(false);
  const [currentRoute, setCurrentRoute] = useState<string | undefined>(
    undefined,
  );

  const onNavigationStateChange = (state: any) => {
    const getDeepestRoute = (navState: any): string | undefined => {
      if (!navState?.routes) return undefined;

      const lastRoute = navState.routes[navState.routes.length - 1];
      if (!lastRoute) return undefined;

      if (lastRoute.state?.routes) {
        return getDeepestRoute(lastRoute.state);
      }

      return lastRoute.name;
    };

    const routeName = getDeepestRoute(state);
    setCurrentRoute(routeName);
    flushPendingNavigations();
  };

  useEffect(() => {
    const init = async () => {
      // …do multiple sync or async tasks
    };

    init().finally(async () => {
      initCompleteRef.current = true;
      if (isReady) {
        await BootSplash.hide({ fade: true });
      }
    });
  }, []);

  useEffect(() => {
    if (isReady && initCompleteRef.current) {
      void BootSplash.hide({ fade: true });
    }
  }, [isReady]);

  return (
    <BottomSheetModalProvider>
      <DataProvider>
        <SafeAreaProvider>
          <NavigationContainer
            theme={navigationTheme}
            ref={navigationRef}
            onStateChange={onNavigationStateChange}
          >
            <AppNavigator currentRoute={currentRoute} />
            <Toast config={NotificationToastConfig} />
            <StatusConnection />
          </NavigationContainer>
        </SafeAreaProvider>
      </DataProvider>
    </BottomSheetModalProvider>
  );
}

function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider>
        <AppContent />
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}

export default App;
