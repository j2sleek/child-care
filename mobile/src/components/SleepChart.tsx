import React, { memo } from 'react';
import { View, Text, useWindowDimensions } from 'react-native';
import { VictoryChart, VictoryLine, VictoryAxis, VictoryTheme } from 'victory-native';
import { format, parseISO } from 'date-fns';
import { SleepSummary } from '../api/endpoints/analytics';

interface SleepChartProps {
  data: SleepSummary[];
}

export const SleepChart = memo(function SleepChart({ data }: SleepChartProps) {
  const { width } = useWindowDimensions();

  if (!data.length) {
    return (
      <View className="h-40 items-center justify-center">
        <Text className="text-gray-400 dark:text-gray-500">No sleep data available</Text>
      </View>
    );
  }

  const chartData = data.map((d) => ({
    x: format(parseISO(d.date), 'MM/dd'),
    y: Math.round((d.totalMinutes / 60) * 10) / 10,
  }));

  return (
    <View>
      <Text className="text-sm text-gray-500 dark:text-gray-400 mb-1">Hours of sleep per day</Text>
      <VictoryChart
        width={width - 64}
        height={200}
        theme={VictoryTheme.material}
        padding={{ top: 20, bottom: 40, left: 50, right: 20 }}
      >
        <VictoryAxis
          tickFormat={(t: string) => t}
          style={{ tickLabels: { fontSize: 10, angle: -30 } }}
        />
        <VictoryAxis dependentAxis tickFormat={(t: number) => `${t}h`} />
        <VictoryLine
          data={chartData}
          style={{ data: { stroke: '#6366f1', strokeWidth: 2 } }}
          interpolation="monotoneX"
        />
      </VictoryChart>
    </View>
  );
});
