import React, { useMemo, useRef, useState } from 'react';
import {
  View,
  Image,
  TouchableOpacity,
  ScrollView,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { AppText } from '@/components/ui/text';
import { useTheme } from '@/theme/ThemeProvider';
import { createAgentScreenStyles } from '@/theme/createStep10Styles';
import Container from '@/components/layout/container';
import Feather from 'react-native-vector-icons/Feather';
import { normalize } from '@/utils/normalize';
import { AppInput } from '@/components/ui/input'; // Assuming path to AppInput
import AvatarSheet from '@/components/layout/agents/avatar-sheet';
import { AppBottomSheetRef } from '@/components/ui/bottom-sheet';
import { PostRequest } from '@/utils/requests';
import { useDataContext } from '@/store/useDataContext';
import { ACTIONS } from '@/store/types';

const CreateAgentScreen = ({ navigation }: any) => {
  const { colors } = useTheme();
  const styles = useMemo(
    () => createAgentScreenStyles(colors).createAgent,
    [colors],
  );
  const [visibility, setVisibility] = useState('public');
  const [showToneDropdown, setShowToneDropdown] = useState(false);
  const [buttonLoading, setButtonLoading] = useState(false);
  const [agentData, setAgentData] = useState({
    name: '',
    title: '',
    description: '',
    tone: '',
    selectedAvatar: null as any,
  });

  const tones = ['Friendly', 'Formal', 'Casual'];
  const avatarSheetRef = useRef<AppBottomSheetRef>(null);
  const { state, dispatch } = useDataContext();
  const { orgId, callback } = state;

  const handleAvatarSelect = (img: any) => {
    setAgentData({ ...agentData, selectedAvatar: img });
    avatarSheetRef.current?.close();
  };

  const handleToneSelect = (selectedTone: string) => {
    setAgentData({ ...agentData, tone: selectedTone });
    setShowToneDropdown(false);
  };

  const handleCreate = async () => {
    setButtonLoading(true);

    const payload = {
      name: agentData.name,
      tone: agentData.tone,
      avatar: agentData.selectedAvatar,
      title: agentData.title,
      description: agentData.description,
      visibility: visibility,
    };

    const { data, error } = await PostRequest(
      `/organisations/${orgId}/agents`,
      payload,
    );

    if (!error) {
      dispatch({ type: ACTIONS.AGENT_CALLBACK, payload: !callback });
      dispatch({ type: ACTIONS.SUCCESS, payload: data.message });
      navigation.goBack();
    } else {
      dispatch({ type: ACTIONS.ERROR, payload: error });
    }

    setButtonLoading(false);
  };

  const VisibilityOption = ({ label, subLabel, value }: any) => (
    <TouchableOpacity
      style={styles.radioRow}
      onPress={() => setVisibility(value)}
      activeOpacity={0.7}
    >
      <View style={styles.radioLabelContainer}>
        <AppText variant="bold" size={14}>
          {label}
        </AppText>
        <AppText size={12} style={styles.subLabel}>
          {subLabel}
        </AppText>
      </View>
      <View
        style={[
          styles.radioCircle,
          visibility === value && styles.radioSelected,
        ]}
      />
    </TouchableOpacity>
  );

  return (
    <>
      <Container color={colors.primary} dark>
        <View style={styles.headerTitleContainer}>
          {/* BACK BUTTON */}
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Feather name="arrow-left" size={24} color="white" />
          </TouchableOpacity>

          <AppText
            variant="bold"
            size={18}
            style={{ color: 'white', marginBottom: normalize(25) }}
          >
            Create Ai Agent
          </AppText>
        </View>

        <View style={styles.whiteSheet}>
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            <TouchableOpacity
              style={styles.avatarContainer}
              onPress={() => avatarSheetRef.current?.expand()}
              activeOpacity={0.8}
            >
              <View style={styles.avatarCircle}>
                <Image
                  source={{ uri: agentData.selectedAvatar }}
                  style={[
                    styles.avatarImg,
                    agentData.selectedAvatar && styles.avatarImgSelected,
                  ]}
                />
                <View style={styles.plusBtn}>
                  <Feather name="plus" size={16} color="white" />
                </View>
              </View>
              <AppText style={styles.addAvatarText}>
                {agentData.selectedAvatar ? 'Change Avatar' : 'Add Avatar'}
              </AppText>
            </TouchableOpacity>

            <View style={styles.formSection}>
              <AppText variant="medium" size={14} style={styles.labelOverride}>
                Tone
              </AppText>
              <TouchableOpacity
                style={styles.dropdown}
                onPress={() => setShowToneDropdown(true)}
              >
                <AppText
                  style={{
                    color: agentData.tone ? colors.black : colors.iconMuted,
                  }}
                >
                  {agentData.tone || 'Select Tone'}
                </AppText>
                <Feather name="chevron-down" size={20} color="#54656F" />
              </TouchableOpacity>

              <AppInput
                label="Agent Name"
                placeholder="e.g Axel"
                value={agentData.name}
                onChangeText={text =>
                  setAgentData({ ...agentData, name: text })
                }
              />

              <AppInput
                label="Agent Title"
                placeholder="e.g E-mail Sender"
                value={agentData.title}
                onChangeText={text =>
                  setAgentData({ ...agentData, title: text })
                }
              />

              <AppText variant="medium" size={14} style={styles.labelOverride}>
                Job Description
              </AppText>
              <View style={styles.textAreaWrapper}>
                <AppInput
                  placeholder="e.g monitors and auto-sends emails."
                  value={agentData.description}
                  onChangeText={text =>
                    setAgentData({
                      ...agentData,
                      description: text.slice(0, 80),
                    })
                  }
                  multiline
                  style={styles.textArea}
                />
                <AppText size={12} style={styles.charCount}>
                  {agentData.description.length}/80
                </AppText>
              </View>
            </View>

            <View style={styles.visibilitySection}>
              <AppText variant="bold" size={15} style={styles.label}>
                Agent Visibility
              </AppText>
              <VisibilityOption
                label="Public"
                subLabel="(Visible to everyone)"
                value="public"
              />
              <VisibilityOption
                label="Private"
                subLabel="(Visible only to your workspace or team)"
                value="private"
              />
              <VisibilityOption
                label="Only me"
                subLabel="(Visible only to you)"
                value="only_me"
              />
            </View>

            <View style={styles.buttonRow}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => navigation.goBack()}
              >
                <AppText variant="bold">Cancel</AppText>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.createBtn}
                onPress={handleCreate}
                activeOpacity={0.7}
                disabled={buttonLoading}
              >
                {buttonLoading && <ActivityIndicator color="white" />}
                <AppText variant="bold" style={{ color: 'white' }}>
                  Create Agent
                </AppText>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>

        {/* tone dropdown modall */}
        <Modal visible={showToneDropdown} transparent animationType="fade">
          <TouchableOpacity
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={() => setShowToneDropdown(false)}
          >
            <View style={styles.dropdownMenu}>
              {tones.map(tone => (
                <TouchableOpacity
                  key={tone}
                  style={styles.dropdownItem}
                  onPress={() => handleToneSelect(tone)}
                >
                  <AppText size={16}>{tone}</AppText>
                </TouchableOpacity>
              ))}
            </View>
          </TouchableOpacity>
        </Modal>
      </Container>

      <AvatarSheet
        ref={avatarSheetRef}
        onSelect={handleAvatarSelect}
        selectedAvatar={agentData.selectedAvatar}
      />
    </>
  );
};

export default CreateAgentScreen;
