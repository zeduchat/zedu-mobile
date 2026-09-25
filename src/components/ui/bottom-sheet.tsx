import React, {
  useCallback,
  forwardRef,
  useImperativeHandle,
  useMemo,
  useRef,
} from 'react';
import { StyleSheet } from 'react-native';
import BottomSheet, {
  BottomSheetBackdrop,
  BottomSheetBackdropProps,
  BottomSheetProps,
  BottomSheetScrollView,
  BottomSheetView,
} from '@gorhom/bottom-sheet';
import { useTheme } from '@/theme/ThemeProvider';

export type AppBottomSheetRef = {
  expand: () => void;
  close: () => void;
  snapToIndex: (index: number) => void;
};

interface Props extends Partial<BottomSheetProps> {
  children: React.ReactNode;
  snapPoints?: string[];
  paddingBottom?: number;
  scrollable?: boolean;
  enablePanDown?: boolean;
  enableContentPanningGesture?: boolean;
  enableHandlePanningGesture?: boolean;
  handleComponent?: null | undefined;
  showBackdrop?: boolean;
}

const AppBottomSheet = forwardRef<AppBottomSheetRef, Props>(
  (
    {
      children,
      snapPoints = ['50%'],
      paddingBottom,
      scrollable = true,
      enablePanDown = true,
      enableContentPanningGesture = true,
      enableHandlePanningGesture = true,
      handleComponent = undefined,
      showBackdrop = true,

      ...props
    },
    ref,
  ) => {
    const { colors } = useTheme();
    const bottomSheetRef = useRef<BottomSheet>(null);
    const themedStyles = useMemo(
      () =>
        StyleSheet.create({
          indicator: { backgroundColor: colors.border, width: 40 },
          background: {
            borderRadius: 32,
            backgroundColor: colors.surface,
          },
          scrollContent: {
            zIndex: 200,
            flexGrow: 1,
          },
          viewContent: {
            zIndex: 200,
            flex: 1,
          },
        }),
      [colors],
    );
    const { backgroundStyle, handleIndicatorStyle, ...bottomSheetProps } =
      props;

    useImperativeHandle(ref, () => ({
      expand: () => bottomSheetRef.current?.expand(),
      close: () => bottomSheetRef.current?.close(),
      snapToIndex: (index: number) =>
        bottomSheetRef.current?.snapToIndex(index),
    }));

    const renderBackdrop = useCallback(
      (backdropProps: BottomSheetBackdropProps) => (
        <BottomSheetBackdrop
          {...backdropProps}
          disappearsOnIndex={-1}
          appearsOnIndex={0}
          opacity={showBackdrop ? 0.5 : 0}
        />
      ),
      [],
    );

    return (
      <BottomSheet
        ref={bottomSheetRef}
        index={-1}
        snapPoints={snapPoints}
        enablePanDownToClose={enablePanDown}
        backdropComponent={renderBackdrop}
        handleIndicatorStyle={[themedStyles.indicator, handleIndicatorStyle]}
        backgroundStyle={[themedStyles.background, backgroundStyle]}
        enableContentPanningGesture={enableContentPanningGesture}
        enableHandlePanningGesture={enableHandlePanningGesture}
        handleComponent={handleComponent}
        activeOffsetY={[-5, 5]}
        failOffsetX={[-5, 5]}
        {...bottomSheetProps}
        enableDynamicSizing={false}
      >
        {scrollable ? (
          <BottomSheetScrollView
            contentContainerStyle={[
              themedStyles.scrollContent,
              { paddingBottom: paddingBottom },
            ]}
            showsVerticalScrollIndicator={false}
            bounces={true}
            overScrollMode="always"
            keyboardDismissMode="interactive"
            keyboardShouldPersistTaps="handled"
          >
            {children}
          </BottomSheetScrollView>
        ) : (
          <BottomSheetView
            style={[themedStyles.viewContent, { paddingBottom: paddingBottom }]}
          >
            {children}
          </BottomSheetView>
        )}
      </BottomSheet>
    );
  },
);

export default AppBottomSheet;
