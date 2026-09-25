import React, { useState, useRef, useEffect, useMemo } from 'react';
import { View, ScrollView, TouchableOpacity, Animated } from 'react-native';
import { AppText } from '@/components/ui/text';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import Container from '@/components/layout/container';
import { GetRequest } from '@/utils/requests';
import { useDataContext } from '@/store/useDataContext';
import { ACTIONS } from '@/store/types';
import { AppButton } from '@/components/ui/button';
import { useTheme } from '@/theme/ThemeProvider';
import { createBillingScreenStyles } from '@/theme/createScreenStyles';

interface Billing {
  id: string;
  name: string;
  fee: number;
  description: string;
  icon: string | null;
}

const SkeletonBox = ({
  width,
  height,
  style,
  skeletonStyle,
}: {
  width: number | string;
  height: number;
  style?: object;
  skeletonStyle: object;
}) => <View style={[{ width, height }, skeletonStyle, style]} />;

const BillingScreen = ({ navigation }: any) => {
  const { colors } = useTheme();
  const styles = useMemo(() => createBillingScreenStyles(colors), [colors]);
  const [isAnnual, setIsAnnual] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<Billing | null>(null);
  const toggleAnim = useRef(new Animated.Value(0)).current;

  const { state, dispatch } = useDataContext();
  const { billings } = state;

  const [loading, setLoading] = useState(billings.length === 0);

  useEffect(() => {
    const getBillings = async () => {
      const { data, error } = await GetRequest('/subscriptions/plans');
      if (!error && data?.data) {
        dispatch({ type: ACTIONS.BILLINGS, payload: data.data });
      }
      setLoading(false);
    };

    if (billings.length === 0) {
      getBillings();
    } else {
      setLoading(false);
    }
  }, []);

  const handleToggle = () => {
    const toValue = isAnnual ? 0 : 1;
    setIsAnnual(!isAnnual);
    Animated.spring(toggleAnim, { toValue, useNativeDriver: false }).start();
  };

  const toggleTranslate = toggleAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [2, 22],
  });

  const handleChoosePlan = () => {
    if (selectedPlan) {
      navigation.navigate('BillingDetails', { plan: selectedPlan });
    }
  };

  const BillingSkeleton = () => (
    <View style={styles.scrollContent}>
      <View style={[styles.toggleRow, { opacity: 0.6 }]}>
        <SkeletonBox width={80} height={16} skeletonStyle={styles.skeleton} />
        <SkeletonBox
          width={48}
          height={24}
          skeletonStyle={styles.skeleton}
          style={{ borderRadius: 12, marginHorizontal: 12 }}
        />
        <SkeletonBox width={100} height={16} skeletonStyle={styles.skeleton} />
      </View>
      <View style={styles.currentPlanCard}>
        <SkeletonBox
          width="60%"
          height={20}
          skeletonStyle={styles.skeleton}
          style={{ marginBottom: 12 }}
        />
        <SkeletonBox
          width="100%"
          height={14}
          skeletonStyle={styles.skeleton}
          style={{ marginBottom: 6 }}
        />
        <SkeletonBox width="80%" height={14} skeletonStyle={styles.skeleton} />
      </View>
      <SkeletonBox
        width="50%"
        height={22}
        skeletonStyle={styles.skeleton}
        style={{ marginBottom: 20 }}
      />
      {[1, 2, 3].map(i => (
        <View key={i} style={styles.planCard}>
          <View style={styles.row}>
            <SkeletonBox
              width={32}
              height={32}
              skeletonStyle={styles.skeleton}
              style={{ borderRadius: 16 }}
            />
            <View style={{ marginLeft: 15 }}>
              <SkeletonBox
                width={80}
                height={16}
                skeletonStyle={styles.skeleton}
                style={{ marginBottom: 8 }}
              />
              <SkeletonBox
                width={140}
                height={12}
                skeletonStyle={styles.skeleton}
              />
            </View>
          </View>
          <View style={styles.priceContainer}>
            <SkeletonBox
              width={50}
              height={20}
              skeletonStyle={styles.skeleton}
              style={{ marginBottom: 4 }}
            />
            <SkeletonBox
              width={60}
              height={10}
              skeletonStyle={styles.skeleton}
            />
          </View>
        </View>
      ))}
    </View>
  );

  return (
    <Container>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={28} color={colors.iconDefault} />
        </TouchableOpacity>
        <AppText variant="bold" style={styles.headerTitle}>
          Billing
        </AppText>
        <View style={{ width: 28 }} />
      </View>

      {loading ? (
        <BillingSkeleton />
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          <View style={styles.toggleRow}>
            <AppText style={styles.toggleLabel}>Pay monthly</AppText>
            <TouchableOpacity
              activeOpacity={1}
              onPress={handleToggle}
              style={styles.toggleOuter}
            >
              <Animated.View
                style={[
                  styles.toggleThumb,
                  { transform: [{ translateX: toggleTranslate }] },
                ]}
              />
            </TouchableOpacity>

            <AppText style={styles.toggleLabel}>
              Pay annually{' '}
              <AppText style={{ color: colors.error }}>(Save 20%)</AppText>
            </AppText>
          </View>

          <View style={styles.currentPlanCard}>
            <AppText variant="bold">
              Current Plan: <AppText>Free</AppText>
            </AppText>
            <AppText style={styles.currentPlanDesc}>
              You are enjoying the full Telex experience with ability to add as
              many users to your organisation.
            </AppText>
          </View>

          <AppText variant="bold" style={styles.sectionTitle}>
            Choose your Pricing Plans
          </AppText>

          {billings?.map(plan => (
            <TouchableOpacity
              key={plan.id}
              onPress={() => setSelectedPlan(plan)}
              style={[
                styles.planCard,
                selectedPlan?.id === plan.id && styles.selectedPlanCard,
              ]}
            >
              <View style={styles.row}>
                <MaterialCommunityIcons
                  name={(plan.icon || 'package-variant-closed') as any}
                  size={28}
                  color={colors.textPrimary}
                />
                <View style={{ marginLeft: 15 }}>
                  <AppText variant="bold" style={styles.planName}>
                    {plan.name}
                  </AppText>
                  <AppText style={styles.planDesc}>{plan.description}</AppText>
                </View>
              </View>
              <View style={styles.priceContainer}>
                <AppText variant="bold" style={styles.priceAmount}>
                  ${plan.fee}
                </AppText>
                <AppText size={10} style={styles.perMonthText}>
                  per month
                </AppText>
              </View>
            </TouchableOpacity>
          ))}

          <AppButton
            title="View Plan Details"
            variant="primary"
            onPress={handleChoosePlan}
            disabled={!selectedPlan}
            style={{ marginTop: 10 }}
          />
        </ScrollView>
      )}
    </Container>
  );
};

export default BillingScreen;
