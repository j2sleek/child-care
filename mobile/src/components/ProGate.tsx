import React from 'react';
import { View, Text, ActivityIndicator, Linking, Platform } from 'react-native';
import { useBilling, useStartTrial } from '../hooks/useBilling';
import { Button } from './ui/Button';
import { Card } from './ui/Card';
import { useI18n } from '../lib/i18n';

interface ProGateProps {
  feature?: string;
  children: React.ReactNode;
}

export function ProGate({ feature = 'This feature', children }: ProGateProps) {
  const { data, isLoading } = useBilling();
  const startTrial = useStartTrial();
  const { t } = useI18n();

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-gray-50 dark:bg-gray-950">
        <ActivityIndicator size="large" color="#6366f1" />
      </View>
    );
  }

  const isPro = data?.plan === 'pro';
  const isTrialActive = data?.trial?.active === true;

  if (isPro || isTrialActive) {
    return <>{children}</>;
  }

  const trialUsed = data?.trial?.used === true;

  return (
    <View className="flex-1 bg-gray-50 dark:bg-gray-950 justify-center">
      <Card className="mx-6 items-center">
        <Text className="text-4xl mb-3" accessible={false}>✨</Text>
        <Text className="text-lg font-bold text-gray-900 dark:text-white mb-2 text-center">
          {feature} requires Pro
        </Text>
        {!trialUsed ? (
          <>
            <Text className="text-sm text-gray-500 dark:text-gray-400 text-center mb-4">
              Start your free 14-day trial to unlock AI insights, recommendations, and more. No credit card required.
            </Text>
            <Button
              title={t('billing.startTrial')}
              onPress={() => startTrial.mutate()}
              loading={startTrial.isPending}
              className="w-full"
            />
          </>
        ) : (
          <>
            <Text className="text-sm text-gray-500 dark:text-gray-400 text-center mb-4">
              Your trial has ended. Upgrade to Pro to continue accessing {feature}.
            </Text>
            <Button
              title={t('billing.upgradePro')}
              onPress={() => {
                const url =
                  Platform.OS === 'android'
                    ? 'https://play.google.com/store/account/subscriptions'
                    : 'https://apps.apple.com/account/subscriptions';
                Linking.openURL(url).catch(() => {});
              }}
              className="w-full"
            />
          </>
        )}
      </Card>
    </View>
  );
}
