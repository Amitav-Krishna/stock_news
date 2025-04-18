import { Chart as ChartJS, registerables } from 'chart.js';
import React from 'react';
import { Line } from 'react-chartjs-2';

ChartJS.register(...registerables);

export default function ChartWrapper() {
  const chartData = {
    labels: ['January', 'February', 'March', 'April', 'May'],
    datasets: [
      {
        label: 'Example Dataset',
        data: [10, 20, 15, 30, 25],
        borderColor: 'rgb(75, 192, 192)',
        tension: 0.1,
      },
    ],
  };

  interface TooltipCallbackContext {
    label: string;
    parsed: { y: number };
  }

  interface TooltipCallbacks {
    label: (context: TooltipCallbackContext) => string;
  }

  interface TooltipOptions {
    mode: 'nearest' | 'index' | 'dataset' | 'point' | 'x' | 'y';
    intersect: boolean;
    callbacks: TooltipCallbacks;
  }

  interface LegendOptions {
    display: boolean;
  }

  interface PluginOptions {
    legend: LegendOptions;
    tooltip: TooltipOptions;
  }

  interface ChartOptionsType {
    responsive: boolean;
    plugins: PluginOptions;
  }

  const chartOptions: ChartOptionsType = {
    responsive: true,
    plugins: {
      legend: {
        display: true,
      },
      tooltip: {
        mode: 'nearest', // Show tooltip for the nearest point
        intersect: false, // Allow tooltips to appear even when not directly over a point
        callbacks: {
          label: (context: TooltipCallbackContext) => {
            const xValue = context.label; // X value (label)
            const yValue = context.parsed.y; // Y value (data point)
            return `X: ${xValue}, Y: ${yValue}`;
          },
        },
      },
    },
  };

  return (
    <div style={{ width: '600px', height: '400px' }}>
      <Line data={chartData} options={chartOptions} />
    </div>
  );
}
