import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { subDays, format } from 'date-fns';
import {
  useSleepAnalytics,
  useFeedingAnalytics,
  useWakeWindowAnalytics,
} from '../../../../src/hooks/useAnalytics';
import { SleepChart } from '../../../../src/components/SleepChart';
import { FeedingChart } from '../../../../src/components/FeedingChart';
import { Card } from '../../../../src/components/ui/Card';
import { useI18n } from '../../../../src/lib/i18n';

type Range = '7' | '30';

export default function AnalyticsScreen() {
  const { childId } = useLocalSearchParams<{ childId: string }>();
  const [range, setRange] = useState<Range>('7');
  const { t } = useI18n();

  // Memoize params so object reference is stable between renders
  const params = useMemo(() => ({
    from: format(subDays(new Date(), parseInt(range)), 'yyyy-MM-dd'),
    to: format(new Date(), 'yyyy-MM-dd'),
  }), [range]);

  const sleep = useSleepAnalytics(childId, params);
  const feeding = useFeedingAnalytics(childId, params);
  const wakeWindows = useWakeWindowAnalytics(childId, params);

  const isLoading = sleep.isLoading || feeding.isLoading || wakeWindows.isLoading;
  const isRefetching = sleep.isRefetching || feeding.isRefetching || wakeWindows.isRefetching;
  const isError = sleep.isError || feeding.isError || wakeWindows.isError;

  const refetchAll = () => {
    sleep.refetch();
    feeding.refetch();
    wakeWindows.refetch();
  };

  return (
    <ScrollView
      className="flex-1 bg-gray-50 dark:bg-gray-950"
      refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetchAll} />}
    >
      <View className="px-4 pt-4">
        {/* Range selector */}
        <View className="flex-row gap-2 mb-4">
          {(['7', '30'] as Range[]).map((r) => (
            <TouchableOpacity
              key={r}
              onPress={() => setRange(r)}
              className={`flex-1 py-2 rounded-xl border items-center ${
                range === r
                  ? 'border-primary-500 bg-primary-50 dark:bg-primary-950'
                  : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800'
              }`}
              accessibilityRole="button"
              accessibilityLabel={r === '7' ? t('analytics.last7Days') : t('analytics.last30Days')}
              accessibilityState={{ selected: range === r }}
            >
              <Text
                className={`text-sm font-medium ${
                  range === r ? 'text-primary-600 dark:text-primary-300' : 'text-gray-600 dark:text-gray-400'
                }`}
              >
                {r === '7' ? t('analytics.last7Days') : t('analytics.last30Days')}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {isLoading ? (
          <View className="mt-20 items-center">
            <ActivityIndicator size="large" color="#6366f1" />
          </View>
        ) : isError ? (
          <View className="mt-20 items-center">
            <Text className="text-4xl mb-3" accessible={false}>📊</Text>
            <Text className="text-gray-500 dark:text-gray-400 text-center mb-4">
              Could not load analytics. Pull to refresh.
            </Text>
          </View>
        ) : (
          <>
            <Card className="mb-4">
              <Text className="text-base font-semibold text-gray-900 dark:text-white mb-3">
                {t('analytics.sleep')}
              </Text>
              <SleepChart data={sleep.data?.summary ?? []} />
            </Card>

            <Card className="mb-4">
              <Text className="text-base font-semibold text-gray-900 dark:text-white mb-3">
                {t('analytics.feeding')}
              </Text>
              <FeedingChart data={feeding.data?.patterns ?? []} />
            </Card>

            <Card className="mb-8">
              <Text className="text-base font-semibold text-gray-900 dark:text-white mb-3">
                {t('analytics.wakeWindows')}
              </Text>
              {wakeWindows.data?.windows?.length ? (
                wakeWindows.data.windows.slice(0, 7).map((w) => (
                  <View
                    key={w.date}
                    className="flex-row justify-between py-2 border-b border-gray-50 dark:border-gray-700"
                  >
                    <Text className="text-sm text-gray-700 dark:text-gray-300">{w.date}</Text>
                    <Text className="text-sm font-medium text-gray-900 dark:text-white">
                      {w.avgMinutes}min avg
                    </Text>
                  </View>
                ))
              ) : (
                <Text className="text-gray-400 dark:text-gray-500 text-sm">No wake window data</Text>
              )}
            </Card>
          </>
        )}
      </View>
    </ScrollView>
  );
}
