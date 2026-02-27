import React from 'react';
import { View, Text } from 'react-native';
import { useBilling } from '../hooks/useBilling';
import { Badge } from './ui/Badge';

export function PlanBadge() {
  const { data } = useBilling();
  if (!data) return null;

  if (data.plan === 'pro') return <Badge label="PRO" variant="pro" />;
  if (data.trial.active) return <Badge label="TRIAL" variant="info" />;
  return <Badge label="FREE" variant="default" />;
}
