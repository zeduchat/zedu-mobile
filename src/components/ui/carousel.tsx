import React, { useMemo, useState, useRef, useEffect } from 'react';
import {
  View,
  FlatList,
  Dimensions,
  NativeScrollEvent,
  NativeSyntheticEvent,
} from 'react-native';
import { useTheme } from '@/theme/ThemeProvider';
import { createSharedUIStyles } from '@/theme/createStep10Styles';

interface CarouselProps {
  data: any[];
  renderItem: (item: any, index: number) => React.ReactNode;
  itemWidth?: number;
  onIndexChange?: (index: number) => void;
}

const Carousel = ({
  data,
  renderItem,
  itemWidth = Dimensions.get('window').width,
  onIndexChange,
}: CarouselProps) => {
  const { colors } = useTheme();
  const styles = useMemo(() => createSharedUIStyles(colors).carousel, [colors]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<FlatList<any> | null>(null);
  const autoPlayRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const extendedData = [data[data.length - 1], ...data, data[0]];

  const startAutoPlay = () => {
    stopAutoPlay();
    autoPlayRef.current = setInterval(() => {
      if (flatListRef.current) {
        flatListRef.current.scrollToOffset({
          offset: (currentIndex + 2) * itemWidth,
          animated: true,
        });
      }
    }, 3000);
  };

  const stopAutoPlay = () => {
    if (autoPlayRef.current) {
      clearInterval(autoPlayRef.current);
      autoPlayRef.current = null;
    }
  };

  useEffect(() => {
    if (data.length > 1) {
      startAutoPlay();
    }
    return stopAutoPlay;
  }, [currentIndex, data.length]);

  const handleScrollEnd = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const x = event.nativeEvent.contentOffset.x;
    const indexWithClones = Math.round(x / itemWidth);

    if (indexWithClones === 0) {
      flatListRef.current?.scrollToOffset({
        offset: data.length * itemWidth,
        animated: false,
      });
      setCurrentIndex(data.length - 1);
    } else if (indexWithClones === extendedData.length - 1) {
      flatListRef.current?.scrollToOffset({
        offset: itemWidth,
        animated: false,
      });
      setCurrentIndex(0);
    } else {
      const actualIndex = indexWithClones - 1;
      if (actualIndex !== currentIndex) {
        setCurrentIndex(actualIndex);
        onIndexChange?.(actualIndex);
      }
    }
  };

  return (
    <View style={styles.container}>
      <FlatList
        ref={flatListRef}
        data={extendedData}
        renderItem={({ item, index }) => (
          <View style={{ width: itemWidth }}>
            {renderItem(item, (index - 1 + data.length) % data.length)}
          </View>
        )}
        keyExtractor={(_, index) => `carousel-${index}`}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={handleScrollEnd}
        onScrollBeginDrag={stopAutoPlay}
        onScrollEndDrag={startAutoPlay}
        initialScrollIndex={1}
        getItemLayout={(_, index) => ({
          length: itemWidth,
          offset: itemWidth * index,
          index,
        })}
      />
      <View style={styles.paginationContainer}>
        {data.map((_, index) => (
          <View
            key={`dot-${index}`}
            style={[
              styles.dot,
              {
                backgroundColor:
                  index === currentIndex ? colors.primary : colors.border,
              },
            ]}
          />
        ))}
      </View>
    </View>
  );
};

export default Carousel;
