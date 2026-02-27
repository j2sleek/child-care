import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Tabs, useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useChild } from '../../../../src/hooks/useChildren';

function TabIcon({ emoji, focused }: { emoji: string; focused: boolean }) {
  return <Text style={{ fontSize: 20, opacity: focused ? 1 : 0.5 }}>{emoji}</Text>;
}

export default function ChildLayout() {
  const { childId } = useLocalSearchParams<{ childId: string }>();
  const { data: child } = useChild(childId);
  const router = useRouter();

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top']}>
      <View className="px-4 py-3 flex-row items-center border-b border-gray-100">
        <TouchableOpacity onPress={() => router.back()} className="mr-3 p-1">
          <Text className="text-primary-500 text-base">← Back</Text>
        </TouchableOpacity>
        <Text className="text-lg font-bold text-gray-900 flex-1" numberOfLines={1}>
          {child?.name ?? 'Child'}
        </Text>
      </View>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: '#6366f1',
          tabBarInactiveTintColor: '#9ca3af',
          tabBarStyle: { paddingBottom: 4 },
          tabBarLabelStyle: { fontSize: 10 },
        }}
      >
        <Tabs.Screen
          name="events"
          options={{
            title: 'Events',
            tabBarIcon: ({ focused }) => <TabIcon emoji="📋" focused={focused} />,
          }}
        />
        <Tabs.Screen
          name="analytics"
          options={{
            title: 'Analytics',
            tabBarIcon: ({ focused }) => <TabIcon emoji="📊" focused={focused} />,
          }}
        />
        <Tabs.Screen
          name="ai"
          options={{
            title: 'AI',
            tabBarIcon: ({ focused }) => <TabIcon emoji="🤖" focused={focused} />,
          }}
        />
        <Tabs.Screen
          name="growth"
          options={{
            title: 'Growth',
            tabBarIcon: ({ focused }) => <TabIcon emoji="📏" focused={focused} />,
          }}
        />
        <Tabs.Screen
          name="report"
          options={{
            title: 'Report',
            tabBarIcon: ({ focused }) => <TabIcon emoji="📄" focused={focused} />,
          }}
        />
      </Tabs>
    </SafeAreaView>
  );
}
