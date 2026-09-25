import React, { useMemo } from 'react';
import {
  View,
  Image,
  TouchableOpacity,
  ScrollView,
  StatusBar,
} from 'react-native';
import { AppText } from '@/components/ui/text';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { SafeAreaView } from 'react-native-safe-area-context';
import UseAgentDetails from '@/services/agents/agent-details';
import Markdown from 'react-native-markdown-display';
import { AgentDetailsSkeleton } from '@/components/skeleton/agent-details';
import { useTheme } from '@/theme/ThemeProvider';
import { createAgentScreenStyles } from '@/theme/createStep10Styles';

const AgentDetailsScreen = ({ navigation, route }: any) => {
  const { colors } = useTheme();
  const { agentDetails: styles, agentDetailsMarkdown: markdownStyles } =
    useMemo(() => createAgentScreenStyles(colors), [colors]);
  const { id } = route.params as { id: string };
  const { loading, agent } = UseAgentDetails(id);

  const InfoSection = ({
    title,
    children,
  }: {
    title: string;
    children: React.ReactNode;
  }) => (
    <View style={styles.section}>
      <AppText variant="bold" style={styles.sectionTitle}>
        {title}
      </AppText>
      {children}
      <View style={styles.divider} />
    </View>
  );

  const BulletPoint = ({ text }: { text: { content: string } }) => (
    <View style={styles.bulletRow}>
      <View style={styles.bullet} />
      <AppText style={styles.bulletText}>{text.content}</AppText>
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar
        barStyle={colors.statusBarStyle}
        backgroundColor={colors.secondary}
      />

      {/* Dark Header */}
      <View style={styles.header}>
        <SafeAreaView>
          <View style={styles.headerContent}>
            <TouchableOpacity
              onPress={() => navigation?.goBack()}
              style={styles.backBtn}
            >
              <Ionicons name="chevron-back" size={24} color={colors.white} />
            </TouchableOpacity>
            <AppText variant="bold" style={styles.headerTitle}>
              {agent?.name}
            </AppText>
            <View style={{ width: 24 }} />
          </View>
        </SafeAreaView>
      </View>

      {/* Content Container */}
      <View style={styles.contentCard}>
        {loading ? (
          <AgentDetailsSkeleton />
        ) : (
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            {/* Agent Branding */}
            <View style={styles.brandingSection}>
              <View style={styles.avatarContainer}>
                <Image
                  source={
                    agent?.avatar
                      ? { uri: agent?.avatar }
                      : require('@/assets/images/agent-avatar.png')
                  }
                  style={styles.avatar}
                  resizeMode="contain"
                />
              </View>
              <AppText variant="bold" style={styles.agentName}>
                {agent?.name}
              </AppText>
              <View style={styles.roleBadge}>
                <AppText variant="medium" style={styles.roleText}>
                  {agent?.title}
                </AppText>
              </View>
            </View>

            {/* About Section */}
            <InfoSection title="About">
              <AppText style={styles.aboutText}>{agent?.description}</AppText>
            </InfoSection>

            <InfoSection title="">
              <Markdown style={markdownStyles}>
                {agent?.benefits || ''}
              </Markdown>
            </InfoSection>

            <InfoSection title="">
              <Markdown style={markdownStyles}>{agent?.why_use || ''}</Markdown>
            </InfoSection>

            <InfoSection title="">
              <Markdown style={markdownStyles}>
                {agent?.how_it_works || ''}
              </Markdown>
            </InfoSection>

            {/* Capabilities Section */}
            <InfoSection title="What it can do">
              {agent?.system_prompts.map((item: any, index: number) => (
                <BulletPoint key={index} text={item} />
              ))}
            </InfoSection>

            {/* Remove Action */}
            {/* <TouchableOpacity style={styles.removeButton}>
                        <AppText variant="bold" style={styles.removeButtonText}>Remove Agent</AppText>
                    </TouchableOpacity> */}
          </ScrollView>
        )}
      </View>
    </View>
  );
};

export default AgentDetailsScreen;
