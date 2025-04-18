import { Line } from 'react-chartjs-2';
import { Chart, registerables } from 'chart.js';
import 'chartjs-adapter-luxon';
import { DateTime } from 'luxon';

Chart.register(...registerables);

interface StockData {
  date: string;
  close: number;
}

interface NewsEvent {
  date: string;
  title: string;
}

interface ChartWrapperProps {
  stockData: StockData[];
  newsEvents: NewsEvent[];
}

export default function ChartWrapper({ stockData, newsEvents }: ChartWrapperProps) {
  // Process stock data into chart.js format
  const chartData = {
    labels: stockData.map(item => DateTime.fromISO(item.date).toJSDate()),
    datasets: [
      {
        label: 'Stock Price',
        data: stockData.map(item => item.close),
        borderColor: 'rgb(75, 192, 192)',
        tension: 0.1
      }
    ]
  };

  // Add annotations for news events
  const plugins = [{
    id: 'newsAnnotations',
    afterDraw: (chart: Chart) => {
      // Draw custom markers for news events
    }
  }];

  return (
    <div className="chart-container">
      <Line 
        data={chartData} 
        options={{
          responsive: true,
          scales: {
            x: {
              type: 'time',
              time: {
                unit: 'year'
              }
            }
          },
          plugins: {
            tooltip: {
              callbacks: {
                label: (context) => {
                  return `Price: $${context.parsed.y.toFixed(2)}`;
                }
              }
            }
          }
        }}
        plugins={plugins}
      />
    </div>
  );
}
