import React, { memo } from 'react';
import { View, Text, useWindowDimensions } from 'react-native';
import { VictoryChart, VictoryLine, VictoryAxis, VictoryTheme } from 'victory-native';
import { format, parseISO } from 'date-fns';
import { GrowthEntry } from '../api/endpoints/growth';

interface GrowthChartProps {
  data: GrowthEntry[];
  metric: 'weightKg' | 'heightCm' | 'headCircumferenceCm';
}

const metricLabels = {
  weightKg: { label: 'Weight (kg)', color: '#6366f1' },
  heightCm: { label: 'Height (cm)', color: '#10b981' },
  headCircumferenceCm: { label: 'Head circumference (cm)', color: '#f59e0b' },
};

export const GrowthChart = memo(function GrowthChart({ data, metric }: GrowthChartProps) {
  const { width } = useWindowDimensions();
  const filtered = data.filter((d) => d[metric] != null);

  if (!filtered.length) {
    return (
      <View className="h-40 items-center justify-center">
        <Text className="text-gray-400 dark:text-gray-500">
          No {metricLabels[metric].label} data
        </Text>
      </View>
    );
  }

  const chartData = filtered.map((d) => ({
    x: format(parseISO(d.date), 'MM/dd'),
    y: d[metric] as number,
  }));

  const { label, color } = metricLabels[metric];

  return (
    <View>
      <Text className="text-sm text-gray-500 dark:text-gray-400 mb-1">{label}</Text>
      <VictoryChart
        width={width - 64}
        height={200}
        theme={VictoryTheme.material}
        padding={{ top: 20, bottom: 40, left: 50, right: 20 }}
      >
        <VictoryAxis style={{ tickLabels: { fontSize: 10, angle: -30 } }} />
        <VictoryAxis dependentAxis />
        <VictoryLine
          data={chartData}
          style={{ data: { stroke: color, strokeWidth: 2 } }}
          interpolation="monotoneX"
        />
      </VictoryChart>
    </View>
  );
});
