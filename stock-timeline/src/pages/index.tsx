import { useState, useEffect } from 'react';
import axios from 'axios';
import ChartWrapper from '@/components/ChartWrapper';
import StockSelector from '@/components/StockSelector';
import TimeRangeSelector from '@/components/TimeRangeSelector';

export default function Home() {
  const [stockData, setStockData] = useState([]);
  const [newsEvents, setNewsEvents] = useState([]);
  const [selectedStock, setSelectedStock] = useState('AAPL');
  const [timeRange, setTimeRange] = useState('5y');

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch stock data
        const stockResponse = await axios.get(`/api/stock?symbol=${selectedStock}&range=${timeRange}`);
        setStockData(stockResponse.data);
        
        // Fetch news data
        const newsResponse = await axios.get(`/api/news?symbol=${selectedStock}`);
        setNewsEvents(newsResponse.data);
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };
    
    fetchData();
  }, [selectedStock, timeRange]);

  return (
    <div className="container">
      <h1>Stock Price Timeline</h1>
      <div className="controls">
        <StockSelector value={selectedStock} onChange={setSelectedStock} />
        <TimeRangeSelector value={timeRange} onChange={setTimeRange} />
      </div>
      <div className="chart-area">
        {stockData.length > 0 && (
          <ChartWrapper stockData={stockData} newsEvents={newsEvents} />
        )}
      </div>
    </div>
  );
}