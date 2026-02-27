import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  Dimensions,
  TouchableOpacity,
  NativeScrollEvent,
  NativeSyntheticEvent,
  useColorScheme,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');

const SLIDES = [
  {
    id: '1',
    emoji: '👶',
    title: 'Track Every Moment',
    description:
      'Log sleep, feeds, diapers, and mood with a tap. Build a complete picture of your child\'s day.',
  },
  {
    id: '2',
    emoji: '📊',
    title: 'Understand the Patterns',
    description:
      'Beautiful charts reveal sleep cycles, feeding routines, and growth milestones over time.',
  },
  {
    id: '3',
    emoji: '🤖',
    title: 'AI-Powered Insights',
    description:
      'Get personalised recommendations, anomaly alerts, and daily digests — powered by AI trained on child development research.',
  },
  {
    id: '4',
    emoji: '👨‍👩‍👧',
    title: 'Share with Your Team',
    description:
      'Invite co-parents, nannies, and doctors. Everyone stays in sync with role-based access.',
  },
];

export default function OnboardingScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const flatListRef = useRef<FlatList>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const idx = Math.round(e.nativeEvent.contentOffset.x / width);
    setActiveIndex(idx);
  };

  const goNext = () => {
    if (activeIndex < SLIDES.length - 1) {
      flatListRef.current?.scrollToIndex({ index: activeIndex + 1 });
    } else {
      router.push('/(auth)/login');
    }
  };

  const isLast = activeIndex === SLIDES.length - 1;

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-gray-950">
      {/* Skip */}
      <View className="flex-row justify-end px-6 pt-2">
        <TouchableOpacity
          onPress={() => router.push('/(auth)/login')}
          accessibilityRole="button"
          accessibilityLabel="Skip onboarding"
        >
          <Text className="text-sm text-gray-400 dark:text-gray-500 font-medium">Skip</Text>
        </TouchableOpacity>
      </View>

      {/* Slides */}
      <FlatList
        ref={flatListRef}
        data={SLIDES}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={onScroll}
        scrollEventThrottle={16}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View
            style={{ width }}
            className="flex-1 items-center justify-center px-8"
          >
            <Text style={{ fontSize: 96 }} accessible={false}>{item.emoji}</Text>
            <Text className="text-3xl font-bold text-gray-900 dark:text-white text-center mt-6 mb-4">
              {item.title}
            </Text>
            <Text className="text-base text-gray-500 dark:text-gray-400 text-center leading-relaxed">
              {item.description}
            </Text>
          </View>
        )}
      />

      {/* Dots */}
      <View className="flex-row justify-center gap-2 mb-6">
        {SLIDES.map((_, i) => (
          <View
            key={i}
            className={`h-2 rounded-full transition-all ${
              i === activeIndex
                ? 'w-6 bg-primary-500'
                : 'w-2 bg-gray-200 dark:bg-gray-700'
            }`}
          />
        ))}
      </View>

      {/* CTA */}
      <View className="px-6 pb-8 gap-3">
        <TouchableOpacity
          onPress={goNext}
          className="bg-primary-500 active:bg-primary-600 rounded-2xl py-4 items-center"
          accessibilityRole="button"
          accessibilityLabel={isLast ? 'Get started' : 'Next slide'}
        >
          <Text className="text-white text-base font-bold">
            {isLast ? 'Get Started →' : 'Next →'}
          </Text>
        </TouchableOpacity>

        {isLast ? (
          <TouchableOpacity
            onPress={() => router.push('/(auth)/register')}
            className="rounded-2xl py-4 items-center border border-gray-200 dark:border-gray-700"
            accessibilityRole="button"
            accessibilityLabel="Create a new account"
          >
            <Text className="text-primary-500 text-base font-semibold">
              Create Account
            </Text>
          </TouchableOpacity>
        ) : null}
      </View>
    </SafeAreaView>
  );
}
