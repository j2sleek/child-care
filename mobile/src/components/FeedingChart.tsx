import React, { memo } from 'react';
import { View, Text, useWindowDimensions } from 'react-native';
import { VictoryChart, VictoryBar, VictoryAxis, VictoryTheme } from 'victory-native';
import { format, parseISO } from 'date-fns';
import { FeedingPattern } from '../api/endpoints/analytics';

interface FeedingChartProps {
  data: FeedingPattern[];
}

export const FeedingChart = memo(function FeedingChart({ data }: FeedingChartProps) {
  const { width } = useWindowDimensions();

  if (!data.length) {
    return (
      <View className="h-40 items-center justify-center">
        <Text className="text-gray-400 dark:text-gray-500">No feeding data available</Text>
      </View>
    );
  }

  const chartData = data.map((d) => ({
    x: format(parseISO(d.date), 'MM/dd'),
    y: d.count,
  }));

  return (
    <View>
      <Text className="text-sm text-gray-500 dark:text-gray-400 mb-1">Feeding sessions per day</Text>
      <VictoryChart
        width={width - 64}
        height={200}
        theme={VictoryTheme.material}
        padding={{ top: 20, bottom: 40, left: 50, right: 20 }}
      >
        <VictoryAxis style={{ tickLabels: { fontSize: 10, angle: -30 } }} />
        <VictoryAxis dependentAxis />
        <VictoryBar data={chartData} style={{ data: { fill: '#10b981' } }} />
      </VictoryChart>
    </View>
  );
});
