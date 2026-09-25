import React, { forwardRef, useEffect, useState } from 'react';
import {
  StyleSheet,
  View,
  TouchableOpacity,
  FlatList,
  Dimensions,
} from 'react-native';
import { AppText } from '@/components/ui/text';
import { normalize } from '@/utils/normalize';
import AppBottomSheet, {
  AppBottomSheetRef,
} from '@/components/ui/bottom-sheet';
import { GetRequest } from '@/utils/requests';
import { Avatar } from '@/types/agents';
import FastImage from 'react-native-fast-image';

const { width } = Dimensions.get('window');

const HORIZONTAL_PADDING = 24;
const COLUMN_COUNT = 5;
const GAP = 12;

interface AvatarSheetProps {
  onSelect: (img: any) => void;
  selectedAvatar?: any;
}

const AvatarSheet = forwardRef<AppBottomSheetRef, AvatarSheetProps>(
  ({ onSelect, selectedAvatar }, ref) => {
    const FastImageSize =
      (width - HORIZONTAL_PADDING * 2 - GAP * (COLUMN_COUNT - 1)) /
      COLUMN_COUNT;
    const [avatars, setAvatars] = useState<Avatar[]>([]);

    useEffect(() => {
      const getAvatar = async () => {
        const { data, error } = await GetRequest('/avatars');
        if (!error) {
          setAvatars(data.data);
        }
      };

      getAvatar();
    }, []);

    return (
      <AppBottomSheet ref={ref} snapPoints={['65%']} paddingBottom={40}>
        <View style={styles.sheetHeader}>
          <AppText variant="bold" size={18}>
            Choose Avatar
          </AppText>
        </View>

        <View style={styles.gridContainer}>
          <FlatList
            data={avatars}
            keyExtractor={item => item.name}
            numColumns={COLUMN_COUNT}
            scrollEnabled={false}
            columnWrapperStyle={styles.columnWrapper}
            renderItem={({ item }) => {
              const isSelected = selectedAvatar === item.url;
              return (
                <TouchableOpacity
                  style={[
                    styles.avatarOption,
                    { width: FastImageSize, height: FastImageSize },
                    isSelected && styles.selectedWrapper,
                  ]}
                  onPress={() => onSelect(item.url)}
                >
                  <FastImage
                    source={{ uri: item.url }}
                    style={{
                      width: '100%',
                      height: '100%',
                      borderRadius: FastImageSize / 2,
                    }}
                  />
                </TouchableOpacity>
              );
            }}
          />
        </View>
      </AppBottomSheet>
    );
  },
);

const styles = StyleSheet.create({
  sheetHeader: {
    paddingVertical: normalize(20),
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F2F5',
    marginBottom: 15,
  },
  gridContainer: {
    paddingHorizontal: HORIZONTAL_PADDING,
  },
  columnWrapper: {
    justifyContent: 'flex-start',
    gap: GAP,
    marginBottom: GAP,
  },
  avatarOption: {
    borderRadius: 100,
    borderWidth: 2,
    borderColor: 'transparent',
    padding: 2,
  },
  selectedWrapper: {
    borderColor: '#7165E3',
  },
});

export default AvatarSheet;
