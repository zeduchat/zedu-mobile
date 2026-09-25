import React, { useMemo } from 'react';
import { Linking } from 'react-native';
import { View, ScrollView, TouchableOpacity } from 'react-native';
import { AppText } from '@/components/ui/text';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import Container from '@/components/layout/container';
import { useDataContext } from '@/store/useDataContext';
import { CLIENT_URL } from '@env';
import { useTheme } from '@/theme/ThemeProvider';
import { createBillingScreenStyles } from '@/theme/createScreenStyles';

const BillingDetailsScreen = ({ route, navigation }: any) => {
  const { colors } = useTheme();
  const styles = useMemo(() => createBillingScreenStyles(colors), [colors]);
  const { state } = useDataContext();
  const { orgData } = state;
  const { plan } = route.params || {};

  if (!plan) {
    return (
      <Container>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons
              name="chevron-back"
              size={28}
              color={colors.iconDefault}
            />
          </TouchableOpacity>
        </View>
        <View style={styles.centered}>
          <MaterialCommunityIcons
            name={'package-variant-closed'}
            size={48}
            color={colors.textSecondary}
          />
          <AppText>No plan details found.</AppText>
        </View>
      </Container>
    );
  }

  const isCurrentPlan =
    orgData?.organisation_plan?.plan_details?.id === plan.id;

  return (
    <Container>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backBtn}
        >
          <Ionicons name="chevron-back" size={28} color={colors.iconDefault} />
          <AppText variant="bold" style={styles.headerTitle}>
            Plan Details
          </AppText>
        </TouchableOpacity>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.detailCard}>
          <View style={styles.detailHeader}>
            <View style={styles.row}>
              <MaterialCommunityIcons
                name={(plan.icon || 'package-variant-closed') as any}
                size={32}
                color={colors.primary}
              />
              <View style={{ marginLeft: 12 }}>
                <View style={styles.row}>
                  <AppText variant="bold" style={styles.planName}>
                    {plan.name}
                  </AppText>
                  {isCurrentPlan && (
                    <View style={styles.badge}>
                      <AppText
                        size={10}
                        variant="bold"
                        style={styles.badgeText}
                      >
                        Current plan
                      </AppText>
                    </View>
                  )}
                </View>
                <AppText style={styles.planDesc}>{plan.description}</AppText>
              </View>
            </View>
          </View>

          <View style={styles.priceSection}>
            <View style={styles.row}>
              <AppText variant="bold" style={styles.priceAmountLarge}>
                ${plan.fee}
              </AppText>
              <AppText style={styles.perMonth}>/month</AppText>
            </View>
            <AppText style={styles.creditsText}>
              {plan.credits} AI Credits included
            </AppText>
          </View>

          <View style={styles.featureBox}>
            <View style={styles.featureTitleBg}>
              <AppText variant="bold" size={13} style={styles.featureTitle}>
                What's included:
              </AppText>
            </View>

            {plan.benefits?.map((benefit: string, i: number) => (
              <View key={i} style={styles.featureRow}>
                <Ionicons
                  name="checkmark-circle"
                  size={18}
                  color={colors.primary}
                />
                <AppText style={styles.featureText}>{benefit}</AppText>
              </View>
            ))}
          </View>
        </View>

        <TouchableOpacity
          style={styles.outlineBtn}
          onPress={() =>
            Linking.openURL(`${CLIENT_URL || 'https://zedu.chat'}/contact`)
          }
        >
          <AppText variant="bold" style={styles.outlineBtnText}>
            Contact Sales
          </AppText>
        </TouchableOpacity>
      </ScrollView>
    </Container>
  );
};

export default BillingDetailsScreen;
