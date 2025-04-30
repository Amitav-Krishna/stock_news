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
    const [apiLimitReached, setApiLimitReached] = useState(false);
    const [cachedStocks, setCachedStocks] = useState([]);
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

    const fetchStockData = async () => {
      try {
        // Reset states
        setError(null);
        setApiLimitReached(false);
        setArticles([]);
        setCachedStocks([]);

        // Fetch stock data
        const response = await axios.get(`/api/stock/${ticker}`);
        const responseData = response.data;

        if (!responseData.data || !Array.isArray(responseData.data)) {
          console.error('[DEBUG] Invalid data format:', responseData);
          return;
        }

        let newsArticles = [];
        try {
          const newsResponse = await axios.get('/api/news', {
            params: { q: ticker }
          });
          newsArticles = newsResponse.data || [];
          setArticles(newsArticles);
        } catch (newsError) {
          if (newsError.response?.status === 429) {
            setApiLimitReached(true);
            setCachedStocks(newsError.response.data?.cachedStocks || []);
            setError(newsError.response.data?.message || 'API limit reached');
          } else {
            throw newsError;
          }
        }

        // Create a Set of dates that have articles for quick lookup
        const articleDates = new Set(
          newsArticles.map(article => 
            new Date(article.publishedAt).toDateString()
          )
        );

        // Process and enhance chart data with article information
        const processedData = responseData.data.map(item => {
          const itemDate = new Date(item.time).toDateString();
          
          return {
            ...item,
            price: Number(item.price) || 0,
            hasArticle: articleDates.has(itemDate) && !apiLimitReached
          };
        });

        const sortedData = processedData.sort((a, b) => new Date(a.time) - new Date(b.time));
        setChartData(sortedData);

      } catch (err) {
        console.error('[DEBUG] Error:', err);
        setError(err.response?.data?.message || 'Failed to fetch data');
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
                {!apiLimitReached && dataPoint.hasArticle && (
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

    // Function to handle article date click
    const handleArticleDateClick = (articleDate) => {
        scrollToDataPoint(articleDate);
        setSelectedPoint(articleDate);
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
                <h1 className="text-3xl font-bold text-gray-900 mb-8">Price Pulse</h1>
                <div className="bg-white rounded-lg shadow p-6 mb-8">
                    <div className="flex gap-4 mb-6">
                        <input
                            type="text"
                            placeholder="Enter stock ticker (e.g., AAPL)"
                            value={ticker}
                            onChange={(e) => setTicker(e.target.value.toUpperCase())}
                            className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-primary"
                        />
                        <button 
                            onClick={fetchStockData}
                            className="px-6 py-2 bg-primary text-white rounded-md hover:bg-primary-hover transition-colors"
                        >
                            Fetch Data
                        </button>
                    </div>

                    {apiLimitReached && (
                        <div className="mb-4 p-4 bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700">
                            <p>{error}</p>
                            {cachedStocks.length > 0 && (
                                <p className="mt-2">
                                    Available stocks: {cachedStocks.join(', ')}
                                </p>
                            )}
                        </div>
                    )}

                    {chartData && (
                        <div ref={chartRef} className="w-full h-[600px] mb-8">
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
                                        const { cx, cy, payload } = props;
                                        const isSelected = selectedPoint && 
                                            new Date(selectedPoint).toDateString() === new Date(payload.time).toDateString();
                                        
                                        const hasArticle = payload.hasArticle;
                                        const handleClick = () => {
                                            if (hasArticle) {
                                                const article = articles.find(a => 
                                                    new Date(a.publishedAt).toDateString() === new Date(payload.time).toDateString()
                                                );
                                                if (article?.link) {
                                                    window.open(article.link, '_blank', 'noopener,noreferrer');
                                                }
                                            }
                                        };
                                        
                                        return (
                                            <circle 
                                                cx={cx}
                                                cy={cy}
                                                r={hasArticle ? 6 : 3}
                                                fill={isSelected ? "#ff9900" : (hasArticle ? "red" : "rgba(75, 192, 192, 1)")}
                                                stroke={isSelected ? "#ff9900" : (hasArticle ? "red" : "rgba(75, 192, 192, 1)")}
                                                style={{ cursor: hasArticle ? 'pointer' : 'default' }}
                                                onClick={handleClick}
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
{/* Articles List Section */}
                {!apiLimitReached && articles.length > 0 && (
                    <div className="mt-8">
                        <h2 className="text-2xl font-bold text-gray-800 mb-4">Related Articles</h2>
                        <div className="space-y-4">
                            {articles.map((article, index) => {
                                const articleDate = new Date(article.publishedAt);
                                const dataPoint = getChartDataForDate(article.publishedAt);
                                const price = dataPoint ? dataPoint.price : 'N/A';
                                
                                return (
                                    <div key={index} className="border-b border-gray-200 pb-4">
                                        <div className="flex items-start">
                                            <div className="mr-4">
                                                <span 
                                                    onClick={() => handleArticleDateClick(article.publishedAt)}
                                                    className="text-blue-600 hover:text-blue-800 hover:underline cursor-pointer"
                                                >
                                                    <u>{format(articleDate, 'MMM dd, yyyy')}</u>
                                                </span>
                                                {dataPoint && (
                                                    <p className="text-sm text-gray-600">
                                                        Price: ${price.toFixed(2)}
                                                    </p>
                                                )}
                                            </div>
                                            <div>
                                                <a 
                                                    href={article.link} 
                                                    target="_blank" 
                                                    rel="noopener noreferrer"
                                                    className="text-lg font-medium text-gray-900 hover:text-primary"
                                                >
                                                    {article.title}
                                                </a>
                                                <p className="text-gray-600 mt-1">{article.description}</p>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}
                {/*Platypus*/}
                </div>
            </div>
        </div>
    );
}