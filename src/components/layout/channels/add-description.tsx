import React, { useState, forwardRef, useEffect, useMemo, useRef } from 'react';
import {
  View,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
} from 'react-native';
import { AppText } from '@/components/ui/text';
import { useTheme } from '@/theme/ThemeProvider';
import { createAddDescriptionStyles } from '@/theme/createChatOverlayStyles';
import { AppInput } from '@/components/ui/input';
import { PatchRequest } from '@/utils/requests';
import { useDataContext } from '@/store/useDataContext';
import { ACTIONS } from '@/store/types';
import AppBottomSheet from '@/components/ui/bottom-sheet';

interface Props {
  onClose: () => void;
  channel_id: string;
}

// How long to wait for keyboardDidHide before closing the sheet anyway.
const KEYBOARD_HIDE_TIMEOUT_MS = 600;

export const AddDescription = forwardRef<any, Props>(
  ({ onClose, channel_id }, ref: any) => {
    const { colors } = useTheme();
    const styles = useMemo(() => createAddDescriptionStyles(colors), [colors]);
    const [description, setDescription] = useState('');
    const [loading, setLoading] = useState(false);
    // True after a successful save until the sheet has closed, so Add can't
    // send the same save again while the sheet waits for the keyboard.
    // It is cleared in handleClose, which the sheet calls once it has fully
    // closed, so Add stays disabled during the dismiss animation too.
    const [closing, setClosing] = useState(false);
    // Goes up every time the sheet closes, so a save that finishes after the
    // sheet was closed (and maybe reopened) doesn't close it again.
    const sheetSessionRef = useRef(0);
    const { state, dispatch } = useDataContext();
    const { channelCallback, channelDetails } = state;
    const [snapPoints, setSnapPoints] = useState(['35%']);

    useEffect(() => {
      setDescription(channelDetails?.description as string);
    }, []);

    const handleSave = async () => {
      if (!description.trim() || closing) return;
      const sheetSession = sheetSessionRef.current;
      setLoading(true);

      const { data, error } = await PatchRequest(`/channels/${channel_id}`, {
        description: description,
      });

      if (!error) {
        dispatch({ type: ACTIONS.CHANNEL_CALLBACK, payload: !channelCallback });
        dispatch({ type: ACTIONS.SUCCESS, payload: data.message });

        if (sheetSession === sheetSessionRef.current) {
          setClosing(true);
          closeAfterKeyboardHides();
        }
      } else {
        dispatch({ type: ACTIONS.ERROR, payload: error });
      }

      setLoading(false);
    };

    // Removes the listener and timer of a close that is waiting for the keyboard.
    const pendingCloseRef = useRef<(() => void) | null>(null);
    const cancelPendingClose = () => {
      pendingCloseRef.current?.();
      pendingCloseRef.current = null;
    };

    useEffect(() => cancelPendingClose, []);

    // Closing the sheet while the keyboard is still open lets the sheet
    // re-open when the keyboard finishes hiding, so wait for it first.
    // Android 10 and below may never send keyboardDidHide, so close after
    // KEYBOARD_HIDE_TIMEOUT_MS anyway.
    const closeAfterKeyboardHides = () => {
      cancelPendingClose();
      if (!Keyboard.isVisible()) {
        onClose();
        return;
      }
      // Runs once: whichever of the event or the timer comes first closes.
      const finish = () => {
        if (pendingCloseRef.current !== cleanup) return;
        cancelPendingClose();
        onClose();
      };
      const subscription = Keyboard.addListener('keyboardDidHide', finish);
      const timer = setTimeout(finish, KEYBOARD_HIDE_TIMEOUT_MS);
      const cleanup = () => {
        subscription.remove();
        clearTimeout(timer);
      };
      pendingCloseRef.current = cleanup;
      Keyboard.dismiss();
    };

    const handleFocus = () => {
      setSnapPoints(['70%']);
    };

    const handleClose = () => {
      sheetSessionRef.current += 1;
      cancelPendingClose();
      setClosing(false);
      onClose();
      Keyboard.dismiss();
      setSnapPoints(['35%']);
    };

    //

    return (
      <AppBottomSheet
        ref={ref}
        snapPoints={snapPoints}
        enablePanDownToClose={true}
        onClose={handleClose}
      >
        <View style={styles.mainWrapper}>
          <View style={styles.navHeader}>
            <TouchableOpacity onPress={handleClose}>
              <AppText style={styles.navActionText}>Cancel</AppText>
            </TouchableOpacity>

            <View style={styles.navTitleCenter}>
              <AppText style={styles.navTitle}>Add Description</AppText>
            </View>

            <TouchableOpacity
              onPress={handleSave}
              disabled={description === '' || loading || closing}
              style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}
            >
              {loading && (
                <ActivityIndicator size="small" color={colors.primary} />
              )}
              <AppText
                style={[
                  styles.navActionText,
                  {
                    color: colors.primary,
                    fontWeight: '700',
                    opacity: description === '' ? 0.5 : 1,
                  },
                ]}
              >
                Add
              </AppText>
            </TouchableOpacity>
          </View>

          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={{ flex: 1 }}
          >
            <View style={styles.searchSection}>
              <AppInput
                label=""
                placeholder="Add description"
                value={description}
                onChangeText={setDescription}
                onFocus={handleFocus}
                multiline={true}
              />
            </View>
          </KeyboardAvoidingView>
        </View>
      </AppBottomSheet>
    );
  },
);
