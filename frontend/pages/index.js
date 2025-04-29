import React, { useState } from 'react';
import axios from 'axios';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { format } from 'date-fns';
import dotenv from 'dotenv';
dotenv.config();

export default function Home() {
    const [ticker, setTicker] = useState('');
    const [chartData, setChartData] = useState(null);
    const [articles, setArticles] = useState([]);
    const [selectedDate, setSelectedDate] = useState(null);
    const [selectedPoint, setSelectedPoint] = useState(null);
    const chartRef = React.useRef(null);
    const [dimensions, setDimensions] = useState({ width: 800, height: 500 });
    const [error, setError] = useState(null);

    // Prevent unnecessary re-renders of dimensions
    const debouncedUpdateDimensions = React.useCallback(() => {
        const containerWidth = Math.min(window.innerWidth - 40, 1200);
        const containerHeight = Math.min(window.innerHeight * 0.6, 600);
        setDimensions({ width: containerWidth, height: containerHeight });
    }, []);

    React.useEffect(() => {
        debouncedUpdateDimensions();
        
        let resizeTimer;
        const handleResize = () => {
            clearTimeout(resizeTimer);
            resizeTimer = setTimeout(debouncedUpdateDimensions, 100);
        };

        window.addEventListener('resize', handleResize);
        return () => {
            window.removeEventListener('resize', handleResize);
            clearTimeout(resizeTimer);
        };
    }, [debouncedUpdateDimensions]);

    // Cleanup highlight timeout
    React.useEffect(() => {
        let highlightTimer;
        if (selectedPoint) {
            highlightTimer = setTimeout(() => setSelectedPoint(null), 2000);
        }
        return () => clearTimeout(highlightTimer);
    }, [selectedPoint]);

    // Move scrollToDataPoint outside render
    const scrollToDataPoint = React.useCallback((date) => {
        if (chartRef.current) {
            chartRef.current.scrollIntoView({ behavior: 'smooth' });
            setSelectedPoint(date);
        }
    }, []);

    const getChartDataForDate = (articleDate) => {
        if (!chartData) return null;
        return chartData.find(point => 
            new Date(point.time).toDateString() === new Date(articleDate).toDateString()
        );
    };

    const ArticleTooltip = ({ date }) => {
        const dataPoint = getChartDataForDate(date);
        if (!dataPoint) return null;

        return (
            <div style={{ 
                position: 'absolute',
                backgroundColor: '#fff',
                border: '1px solid #ccc',
                padding: '10px',
                borderRadius: '4px',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                zIndex: 1000,
                marginLeft: '20px'
            }}>
                <p><strong>Date:</strong> {format(new Date(date), 'MM/dd/yyyy')}</p>
                <p><strong>Price:</strong> ${dataPoint.price.toFixed(2)}</p>
            </div>
        );
    };

    const fetchStockData = async () => {
      try {
        // Fetch stock data
        const response = await axios.get(`/api/stock/${ticker}`);
        const responseData = response.data;

        if (!responseData.data || !Array.isArray(responseData.data)) {
          console.error('[DEBUG] Invalid data format:', responseData);
          return;
        }

        // Fetch news before processing chart data
        const newsResponse = await axios.get('/api/news', {
          params: { q: ticker }
        });
        
        const articles = newsResponse.data || [];
        setArticles(articles);

        // Process and enhance chart data with article information
        const processedData = responseData.data.map(item => {
          const itemDate = new Date(item.time).toDateString();
          const hasArticle = articles.some(article => 
            new Date(article.publishedAt).toDateString() === itemDate
          );
          
          return {
            ...item,
            price: Number(item.price) || 0,
            hasArticle
          };
        });

        const sortedData = processedData.sort((a, b) => new Date(a.time) - new Date(b.time));
        console.log('[DEBUG] Processed chart data:', sortedData);
        setChartData(sortedData);
        setError(null);

      } catch (err) {
        console.error('[DEBUG] Error:', err);
        setError(err);
        setArticles([]);
      }
    };

    const CustomTooltip = ({ active, payload, label, selectedPoint }) => {
        if ((!active && !selectedPoint) || !payload || !payload.length) return null;
        
        const dataPoint = payload[0].payload;
        const showTooltip = active || (selectedPoint && 
            new Date(selectedPoint).toDateString() === new Date(label).toDateString());
            
        if (!showTooltip) return null;
        
        return (
            <div style={{ backgroundColor: '#fff', border: '1px solid #ccc', padding: '10px' }}>
                <p><strong>Date:</strong> {format(new Date(label), 'MM/dd/yyyy')}</p>
                <p><strong>Price:</strong> ${payload[0].value.toFixed(2)}</p>
                {dataPoint.hasArticle && (
                    <p>
                        <strong>Article:</strong>{' '}
                        <a href={articles.find(a => 
                            new Date(a.publishedAt).toDateString() === new Date(label).toDateString()
                        )?.link} target="_blank" rel="noopener noreferrer">
                            {articles.find(a => 
                                new Date(a.publishedAt).toDateString() === new Date(label).toDateString()
                            )?.title}
                        </a>
                    </p>
                )}
            </div>
        );
    };

    return (
        <div className="min-h-screen bg-gray-50">
            {console.log('[DEBUG] Rendering Home component')}
            <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
                <h1 className="text-3xl font-bold text-gray-900 mb-8">Stock Price Analysis</h1>
                <div className="bg-white rounded-lg shadow p-6 mb-8">
                    <div className="flex gap-4 mb-6">
                        <input
                            type="text"
                            placeholder="Enter stock ticker (e.g., AAPL)"
                            value={ticker}
                            onChange={(e) => {
                              const newTicker = e.target.value.toUpperCase();
                              console.log('[DEBUG] Ticker input changed:', newTicker);
                              setTicker(newTicker);
                            }}
                            className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-primary"
                        />
                        <button 
                            onClick={() => {
                              console.log('[DEBUG] Fetch Data button clicked');
                              fetchStockData();
                            }}
                            className="px-6 py-2 bg-primary text-white rounded-md hover:bg-primary-hover transition-colors"
                        >
                            Fetch Data
                        </button>
                    </div>

                    {chartData && (
                        <div ref={chartRef} className="w-full h-[600px] mb-8">
                            {console.log('[DEBUG] Rendering LineChart with chartData:', chartData)}
                            <LineChart width={dimensions.width} height={dimensions.height} data={chartData}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis 
                                    dataKey="time" 
                                    tickFormatter={(tick) => format(new Date(tick), 'MM/dd')}
                                />
                                <YAxis 
                                    domain={[0, dataMax => Math.ceil(dataMax) + 10]}
                                    tickFormatter={tick => `$${Math.round(tick)}`}
                                />
                                <Tooltip 
                                    content={<CustomTooltip selectedPoint={selectedPoint} />}
                                    cursor={{ strokeDasharray: '3 3' }}
                                    isAnimationActive={false}
                                />
                                <Line 
                                    type="monotone" 
                                    dataKey="price" 
                                    stroke="rgba(75, 192, 192, 1)"
                                    dot={(props) => {
                                        const { payload } = props;
                                        const isSelected = selectedPoint && 
                                            new Date(selectedPoint).toDateString() === new Date(payload.time).toDateString();
                                        
                                        return (
                                            <circle 
                                                {...props} 
                                                r={payload.hasArticle ? 6 : 3}
                                                fill={payload.hasArticle ? "red" : "rgba(75, 192, 192, 1)"}
                                                stroke={payload.hasArticle ? "red" : "rgba(75, 192, 192, 1)"}
                                            />
                                        );
                                    }}
                                    activeDot={{
                                        r: 8,
                                        strokeWidth: 2,
                                        fill: "#ff9900",
                                        stroke: "#ff9900"
                                    }}
                                />
                            </LineChart>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

