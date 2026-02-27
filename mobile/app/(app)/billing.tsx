import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  Alert,
  TouchableOpacity,
  Linking,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { format, parseISO } from 'date-fns';
import { useBilling, useStartTrial } from '../../src/hooks/useBilling';
import { Button } from '../../src/components/ui/Button';
import { Card } from '../../src/components/ui/Card';
import { Badge } from '../../src/components/ui/Badge';
import { useI18n } from '../../src/lib/i18n';
import {
  getOfferings,
  purchasePackage,
  restorePurchases,
  configurePurchases,
} from '../../src/lib/purchases';
import { useAuthStore } from '../../src/stores/auth.store';
import { useQueryClient } from '@tanstack/react-query';
import { BILLING_KEY } from '../../src/hooks/useBilling';
import type { PurchasesPackage } from 'react-native-purchases';

const PRO_FEATURES = [
  { icon: '🤖', label: 'AI Insights & Recommendations' },
  { icon: '🔍', label: 'Anomaly Detection' },
  { icon: '📰', label: 'Daily Digest' },
  { icon: '💬', label: 'AI Chat Assistant' },
  { icon: '📊', label: 'Advanced Analytics' },
  { icon: '👶', label: 'Unlimited Children' },
  { icon: '⚡', label: 'Priority Support' },
];

export default function BillingScreen() {
  const { data, isLoading } = useBilling();
  const startTrial = useStartTrial();
  const { t } = useI18n();
  const user = useAuthStore((s) => s.user);
  const qc = useQueryClient();

  const [offerings, setOfferings] = useState<Awaited<ReturnType<typeof getOfferings>>>(null);
  const [purchasing, setPurchasing] = useState(false);
  const [restoring, setRestoring] = useState(false);

  useEffect(() => {
    if (user?.id) configurePurchases(user.id);
    getOfferings().then(setOfferings);
  }, [user?.id]);

  const handlePurchase = async (pkg: PurchasesPackage) => {
    setPurchasing(true);
    try {
      const success = await purchasePackage(pkg);
      if (success) {
        qc.invalidateQueries({ queryKey: BILLING_KEY });
        Alert.alert('Welcome to Pro! 🎉', 'Your subscription is now active.');
      }
    } catch (err: any) {
      Alert.alert('Purchase Failed', err?.message ?? 'Please try again.');
    } finally {
      setPurchasing(false);
    }
  };

  const handleRestore = async () => {
    setRestoring(true);
    try {
      const restored = await restorePurchases();
      if (restored) {
        qc.invalidateQueries({ queryKey: BILLING_KEY });
        Alert.alert('Restored!', 'Your purchases have been restored.');
      } else {
        Alert.alert('Nothing to Restore', 'No active purchases found for this account.');
      }
    } catch {
      Alert.alert('Error', 'Could not restore purchases. Please try again.');
    } finally {
      setRestoring(false);
    }
  };

  const handleManageSubscription = () => {
    const url =
      Platform.OS === 'android'
        ? 'https://play.google.com/store/account/subscriptions'
        : 'https://apps.apple.com/account/subscriptions';
    Linking.openURL(url).catch(() => {});
  };

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-gray-50 dark:bg-gray-950">
        <ActivityIndicator size="large" color="#6366f1" />
      </SafeAreaView>
    );
  }

  const isPro = data?.plan === 'pro';
  const isTrialActive = data?.trial?.active;
  const trialUsed = data?.trial?.used;

  // Get the first package from current offering (annual or monthly)
  const packages = offerings?.availablePackages ?? [];

  return (
    <SafeAreaView className="flex-1 bg-gray-50 dark:bg-gray-950">
      <ScrollView className="flex-1 px-6" showsVerticalScrollIndicator={false}>
        <Text className="text-2xl font-bold text-gray-900 dark:text-white pt-4 mb-6">
          {t('billing.title')}
        </Text>

        {/* Current plan card */}
        <Card className="mb-4 items-center py-6">
          <View className="mb-3">
            {isPro ? (
              <Badge label="PRO" variant="pro" />
            ) : isTrialActive ? (
              <Badge label="TRIAL ACTIVE" variant="info" />
            ) : (
              <Badge label="FREE" variant="default" />
            )}
          </View>
          <Text className="text-3xl font-bold text-gray-900 dark:text-white mt-1">
            {isPro ? 'Pro Plan' : isTrialActive ? 'Free Trial' : 'Free Plan'}
          </Text>
          {isTrialActive && data?.trial?.expiresAt ? (
            <Text className="text-sm text-gray-500 dark:text-gray-400 mt-2">
              {t('billing.trialExpires')}: {format(parseISO(data.trial.expiresAt), 'MMM d, yyyy')}
            </Text>
          ) : null}
          {isPro ? (
            <TouchableOpacity
              onPress={handleManageSubscription}
              className="mt-3"
              accessibilityRole="link"
              accessibilityLabel="Manage your subscription"
            >
              <Text className="text-sm text-primary-500 dark:text-primary-400 font-medium underline">
                {t('billing.manageSubscription')}
              </Text>
            </TouchableOpacity>
          ) : null}
        </Card>

        {/* Upgrade / Trial CTA */}
        {!isPro ? (
          <Card className="mb-4">
            {!isTrialActive && !trialUsed ? (
              <>
                <Text className="text-base font-bold text-gray-900 dark:text-white mb-1">
                  Try Pro Free for 14 Days
                </Text>
                <Text className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                  Full access to all features. No credit card required.
                </Text>
                <Button
                  title={t('billing.startTrial')}
                  onPress={() => startTrial.mutate()}
                  loading={startTrial.isPending}
                  size="lg"
                />
              </>
            ) : null}

            {/* RevenueCat packages */}
            {packages.length > 0 ? (
              <View className={!isTrialActive && !trialUsed ? 'mt-4 pt-4 border-t border-gray-100 dark:border-gray-700' : ''}>
                <Text className="text-base font-bold text-gray-900 dark:text-white mb-3">
                  {trialUsed ? 'Subscribe to Pro' : 'Or subscribe now'}
                </Text>
                {packages.map((pkg) => (
                  <TouchableOpacity
                    key={pkg.identifier}
                    onPress={() => handlePurchase(pkg)}
                    disabled={purchasing}
                    className="border border-primary-500 dark:border-primary-400 rounded-xl p-4 mb-3 flex-row justify-between items-center active:bg-primary-50 dark:active:bg-primary-950"
                    accessibilityRole="button"
                    accessibilityLabel={`Subscribe for ${pkg.product.priceString} ${pkg.packageType}`}
                  >
                    <View>
                      <Text className="font-semibold text-gray-900 dark:text-white">
                        {pkg.product.title}
                      </Text>
                      <Text className="text-sm text-gray-500 dark:text-gray-400">
                        {pkg.product.description}
                      </Text>
                    </View>
                    <View className="items-end">
                      <Text className="text-lg font-bold text-primary-500 dark:text-primary-400">
                        {pkg.product.priceString}
                      </Text>
                      <Text className="text-xs text-gray-400 dark:text-gray-500 capitalize">
                        {pkg.packageType?.toLowerCase()}
                      </Text>
                    </View>
                  </TouchableOpacity>
                ))}
                {purchasing ? (
                  <ActivityIndicator color="#6366f1" className="mt-2" />
                ) : null}
              </View>
            ) : (
              // Fallback when RevenueCat is not configured
              !isTrialActive ? (
                <View className={trialUsed ? '' : 'mt-4 pt-4 border-t border-gray-100 dark:border-gray-700'}>
                  <Button
                    title={t('billing.upgradePro')}
                    variant="outline"
                    onPress={() => Alert.alert('Coming soon', 'Subscription payments are being set up. Please check back soon.')}
                    className="mt-2"
                  />
                </View>
              ) : null
            )}
          </Card>
        ) : null}

        {/* Restore purchases */}
        <TouchableOpacity
          onPress={handleRestore}
          disabled={restoring}
          className="items-center mb-4"
          accessibilityRole="button"
          accessibilityLabel="Restore previous purchases"
        >
          {restoring ? (
            <ActivityIndicator size="small" color="#6366f1" />
          ) : (
            <Text className="text-sm text-gray-500 dark:text-gray-400 underline">
              {t('billing.restorePurchases')}
            </Text>
          )}
        </TouchableOpacity>

        {/* Feature list */}
        <Card className="mb-8">
          <Text className="text-base font-semibold text-gray-900 dark:text-white mb-3">
            {t('billing.proFeatures')}
          </Text>
          {PRO_FEATURES.map((feature) => (
            <View key={feature.label} className="flex-row items-center mb-3">
              <Text className="text-xl mr-3" accessible={false}>{feature.icon}</Text>
              <Text
                className={`text-sm flex-1 ${
                  isPro || isTrialActive
                    ? 'text-gray-700 dark:text-gray-300'
                    : 'text-gray-400 dark:text-gray-600'
                }`}
              >
                {feature.label}
              </Text>
              {isPro || isTrialActive ? (
                <Text className="text-green-500 font-bold" accessible={false}>✓</Text>
              ) : (
                <Text className="text-gray-300 dark:text-gray-700" accessible={false}>–</Text>
              )}
            </View>
          ))}
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}
