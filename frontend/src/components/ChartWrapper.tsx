import React, { useEffect, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import axios from 'axios';

interface StockDataItem {
  time: string;
  price: number;
}

export default function ChartWrapper() {
  const [data, setData] = useState<StockDataItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStockData = async () => {
      console.log('[DEBUG] Fetching stock data...');
      try {
        const response = await axios.get('http://localhost:3300/api/stock/AAPL');
        console.log('[DEBUG] Stock data fetched successfully:', response.data);
        setData(response.data);
        setLoading(false);
      } catch (error) {
        console.error('[DEBUG] Error fetching stock data:', error);
        setLoading(false);
      }
    };

    fetchStockData();
  }, []);

  // Custom tooltip to format display values
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-4 border border-gray-200 shadow-md rounded">
          <p className="text-gray-700 mb-1">{`Time: ${label}`}</p>
          <p className="text-teal-600 font-medium">{`Price: $${payload[0].value.toFixed(2)}`}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="w-full h-96">
      {loading ? (
        <>
          {console.log('[DEBUG] Loading state active')}
          <div className="flex items-center justify-center h-full">
            <p className="text-gray-500">Loading...</p>
          </div>
        </>
      ) : (
        <>
          {console.log('[DEBUG] Rendering LineChart with data:', data)}
          <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={data}
            margin={{ top: 20, right: 30, left: 20, bottom: 10 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis 
              dataKey="time" 
              tick={{ fontSize: 12 }}
              tickLine={{ stroke: "#ccc" }}
              axisLine={{ stroke: "#ccc" }}
            />
            <YAxis 
              tick={{ fontSize: 12 }}
              tickLine={{ stroke: "#ccc" }}
              axisLine={{ stroke: "#ccc" }}
              tickFormatter={(value) => `$${value}`}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ paddingTop: 10 }} />
            <Line
              type="monotone"
              dataKey="price"
              name="Graph"
              stroke="#4db6ac"
              strokeWidth={2}
              dot={{ r: 3, fill: "#4db6ac" }}
              animationDuration={1500}
            />
          </LineChart>
          </ResponsiveContainer>
        </>
      )}
    </div>
  );
}