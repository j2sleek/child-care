// Built-in matchers from @testing-library/react-native v12.4+
// (replaces deprecated @testing-library/jest-native)
import '@testing-library/react-native/extend-expect';

// Silence Animated warnings in tests
jest.useFakeTimers();

// Mock expo-secure-store
jest.mock('expo-secure-store', () => ({
  setItemAsync: jest.fn(() => Promise.resolve()),
  getItemAsync: jest.fn(() => Promise.resolve(null)),
  deleteItemAsync: jest.fn(() => Promise.resolve()),
}));

// Mock @react-native-async-storage/async-storage
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

// Mock expo-localization
jest.mock('expo-localization', () => ({
  getLocales: () => [{ languageCode: 'en' }],
}));

// Mock expo-router
jest.mock('expo-router', () => ({
  useRouter: () => ({ push: jest.fn(), replace: jest.fn(), back: jest.fn() }),
  useLocalSearchParams: () => ({}),
  Redirect: ({ href }: { href: string }) => null,
  Tabs: ({ children }: { children: React.ReactNode }) => children,
  Stack: ({ children }: { children: React.ReactNode }) => children,
}));

// Mock expo-notifications
jest.mock('expo-notifications', () => ({
  setNotificationHandler: jest.fn(),
  setNotificationChannelAsync: jest.fn(),
  getPermissionsAsync: jest.fn(() => Promise.resolve({ status: 'undetermined' })),
  requestPermissionsAsync: jest.fn(() => Promise.resolve({ status: 'denied' })),
  getExpoPushTokenAsync: jest.fn(),
  addNotificationReceivedListener: jest.fn(() => ({ remove: jest.fn() })),
  addNotificationResponseReceivedListener: jest.fn(() => ({ remove: jest.fn() })),
  AndroidImportance: { MAX: 5 },
}));

// Mock expo-device
jest.mock('expo-device', () => ({ isDevice: false }));

// Mock react-native-purchases
jest.mock('react-native-purchases', () => ({
  __esModule: true,
  default: {
    setLogLevel: jest.fn(),
    configure: jest.fn(),
    logIn: jest.fn(),
    getOfferings: jest.fn(() => Promise.resolve({ current: null })),
    purchasePackage: jest.fn(),
    restorePurchases: jest.fn(),
    getCustomerInfo: jest.fn(() => Promise.resolve({ entitlements: { active: {} } })),
  },
  LOG_LEVEL: { DEBUG: 'debug' },
}));

// Mock react-native-webview
jest.mock('react-native-webview', () => {
  const { View } = require('react-native');
  return { WebView: View };
});

// Mock victory-native
jest.mock('victory-native', () => ({
  VictoryChart: () => null,
  VictoryLine: () => null,
  VictoryBar: () => null,
  VictoryAxis: () => null,
  VictoryTheme: { material: {} },
}));
