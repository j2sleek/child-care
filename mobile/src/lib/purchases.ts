/**
 * RevenueCat in-app purchase integration.
 * Configure REVENUE_CAT_API_KEY in your .env file.
 *
 * Setup steps:
 * 1. Create products in App Store Connect / Google Play Console
 * 2. Create offerings in RevenueCat dashboard
 * 3. Set EXPO_PUBLIC_REVENUECAT_IOS_KEY and EXPO_PUBLIC_REVENUECAT_ANDROID_KEY
 */
import Purchases, { LOG_LEVEL, PurchasesPackage } from 'react-native-purchases';
import { Platform } from 'react-native';

const IOS_KEY = process.env.EXPO_PUBLIC_REVENUECAT_IOS_KEY ?? '';
const ANDROID_KEY = process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_KEY ?? '';

let configured = false;

export function configurePurchases(userId?: string) {
  const apiKey = Platform.OS === 'ios' ? IOS_KEY : ANDROID_KEY;
  if (!apiKey) {
    if (__DEV__) console.warn('[Purchases] RevenueCat key not set — payments disabled');
    return;
  }
  if (configured) return;
  if (__DEV__) Purchases.setLogLevel(LOG_LEVEL.DEBUG);
  Purchases.configure({ apiKey });
  if (userId) Purchases.logIn(userId);
  configured = true;
}

export async function getOfferings() {
  try {
    const offerings = await Purchases.getOfferings();
    return offerings.current;
  } catch (err) {
    if (__DEV__) console.warn('[Purchases] getOfferings error:', err);
    return null;
  }
}

export async function purchasePackage(pkg: PurchasesPackage): Promise<boolean> {
  try {
    const { customerInfo } = await Purchases.purchasePackage(pkg);
    return Object.keys(customerInfo.entitlements.active).length > 0;
  } catch (err: any) {
    if (err.userCancelled) return false;
    throw err;
  }
}

export async function restorePurchases(): Promise<boolean> {
  try {
    const customerInfo = await Purchases.restorePurchases();
    return Object.keys(customerInfo.entitlements.active).length > 0;
  } catch (err) {
    if (__DEV__) console.warn('[Purchases] restorePurchases error:', err);
    return false;
  }
}

export async function getCustomerInfo() {
  try {
    return await Purchases.getCustomerInfo();
  } catch {
    return null;
  }
}
