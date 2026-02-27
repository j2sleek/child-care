import React from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, Share } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { WebView } from 'react-native-webview';
import { childrenApi } from '../../../../src/api/endpoints/children';
import { ErrorBoundary } from '../../../../src/components/ErrorBoundary';

const WEBVIEW_BASE_CSS = `
  <style>
    * { box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      font-size: 15px;
      line-height: 1.6;
      color: #1f2937;
      padding: 16px;
      margin: 0;
      background: #ffffff;
    }
    @media (prefers-color-scheme: dark) {
      body { color: #f9fafb; background: #111827; }
      h1, h2, h3 { color: #e5e7eb; }
      table { border-color: #374151; }
      td, th { border-color: #374151; }
    }
    h1 { font-size: 22px; font-weight: 700; margin-bottom: 8px; }
    h2 { font-size: 17px; font-weight: 600; color: #4f46e5; margin-top: 20px; }
    p { margin: 8px 0; }
    table { width: 100%; border-collapse: collapse; margin: 12px 0; }
    td, th { padding: 8px 10px; border: 1px solid #e5e7eb; text-align: left; font-size: 13px; }
    th { background: #f3f4f6; font-weight: 600; }
    .badge { display:inline-block; padding:2px 8px; border-radius:99px; font-size:11px; font-weight:600; }
  </style>
`;

export default function ReportScreen() {
  const { childId } = useLocalSearchParams<{ childId: string }>();

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['report', childId],
    queryFn: () => childrenApi.getReport(childId),
    staleTime: 300_000,
    retry: 1,
    enabled: !!childId,
  });

  const handleShare = async () => {
    if (!data?.html) return;
    await Share.share({
      message: data.html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim(),
      title: 'Pediatrician Report',
    });
  };

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-white dark:bg-gray-950">
        <ActivityIndicator size="large" color="#6366f1" />
        <Text className="text-gray-500 dark:text-gray-400 mt-3 text-sm">Generating report…</Text>
      </View>
    );
  }

  if (isError || !data?.html) {
    return (
      <View className="flex-1 items-center justify-center bg-white dark:bg-gray-950 px-6">
        <Text className="text-5xl mb-3" accessible={false}>📄</Text>
        <Text className="text-gray-700 dark:text-gray-300 font-semibold mb-2">Could not load report</Text>
        <Text className="text-gray-500 dark:text-gray-400 text-sm text-center mb-4">
          AI features are required to generate a report. Please check your plan.
        </Text>
        <TouchableOpacity
          onPress={() => refetch()}
          className="px-4 py-2 bg-primary-500 dark:bg-primary-600 rounded-xl"
          accessibilityRole="button"
          accessibilityLabel="Retry loading report"
        >
          <Text className="text-white font-semibold">Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const htmlContent = `<!DOCTYPE html><html><head><meta name="viewport" content="width=device-width, initial-scale=1">${WEBVIEW_BASE_CSS}</head><body>${data.html}</body></html>`;

  return (
    <ErrorBoundary>
      <View className="flex-1 bg-white dark:bg-gray-950">
        <View className="flex-row justify-between items-center px-4 py-3 border-b border-gray-100 dark:border-gray-800">
          <Text className="text-base font-bold text-gray-900 dark:text-white">
            Pediatrician Report
          </Text>
          <TouchableOpacity
            onPress={handleShare}
            className="px-3 py-1.5 bg-primary-100 dark:bg-primary-900 rounded-xl"
            accessibilityRole="button"
            accessibilityLabel="Share report"
          >
            <Text className="text-primary-600 dark:text-primary-300 text-sm font-semibold">
              Share
            </Text>
          </TouchableOpacity>
        </View>
        <WebView
          source={{ html: htmlContent }}
          style={{ flex: 1 }}
          originWhitelist={['*']}
          showsVerticalScrollIndicator={false}
        />
      </View>
    </ErrorBoundary>
  );
}
