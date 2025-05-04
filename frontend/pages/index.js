// frontend/pages/index.js
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
        setChartData(null); // Reset chart data to show loading state

        // First fetch and display stock data immediately
        const response = await axios.get(`/api/stock/${ticker}`);
        const responseData = response.data;

        if (!responseData.data || !Array.isArray(responseData.data)) {
        console.error('[DEBUG] Invalid data format:', responseData);
        return;
        }

        // Process and set initial chart data without articles
        const processedData = responseData.data.map(item => ({
        ...item,
        price: Number(item.price) || 0,
        hasArticle: false // Initially set to false, will update later
        }));

        const sortedData = processedData.sort((a, b) => new Date(a.time) - new Date(b.time));
        setChartData(sortedData);

        // Then fetch news data in the background
        try {
        const newsResponse = await axios.get('/api/news', {
            params: { q: ticker }
        });
        const newsArticles = newsResponse.data || [];
        setArticles(newsArticles);

        // Update chart data with article information
        const articleDates = new Set(
            newsArticles.map(article => 
            new Date(article.publishedAt).toDateString()
            )
        );

        const updatedData = sortedData.map(item => {
            const itemDate = new Date(item.time).toDateString();
            return {
            ...item,
            hasArticle: articleDates.has(itemDate)
            };
        });

        setChartData(updatedData);
        } catch (newsError) {
        if (newsError.response?.status === 429) {
            setApiLimitReached(true);
            setCachedStocks(newsError.response.data?.cachedStocks || []);
            setError(newsError.response.data?.message || 'API limit reached');
        } else {
            console.error('[DEBUG] News fetch error:', newsError);
        }
        }

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
        <a
        href="https://github.com/Amitav-Krishna/stock_news"
        className="github-corner"
        aria-label="View source on GitHub"
        target="_blank"
        rel="noopener noreferrer"
        >
        <svg
            width="80"
            height="80"
            viewBox="0 0 250 250"
            style={{
            fill: '#151513',
            color: '#fff',
            position: 'absolute',
            top: 0,
            border: 0,
            right: 0,
            }}
            aria-hidden="true"
        >
            <path d="M0,0 L115,115 L130,115 L142,142 L250,250 L250,0 Z"></path>
            <path
            d="M128.3,109.0 C113.8,99.7 119.0,89.6 119.0,89.6 C122.0,82.7 120.5,78.6 120.5,78.6 C119.2,72.0 123.4,76.3 123.4,76.3 C127.3,80.9 125.5,87.3 125.5,87.3 C122.9,97.6 130.6,101.9 134.4,103.2"
            fill="currentColor"
            style={{ transformOrigin: '130px 106px' }}
            className="octo-arm"
            ></path>
            <path
            d="M115.0,115.0 C114.9,115.1 118.7,116.5 119.8,115.4 L133.7,101.6 C136.9,99.2 139.9,98.4 142.2,98.6 C133.8,88.0 127.5,74.4 143.8,58.0 C148.5,53.4 154.0,51.2 159.7,51.0 C160.3,49.4 163.2,43.6 171.4,40.1 C171.4,40.1 176.1,42.5 178.8,56.2 C183.1,58.6 187.2,61.8 190.9,65.4 C194.5,69.0 197.7,73.2 200.1,77.6 C213.8,80.2 216.3,84.9 216.3,84.9 C212.7,93.1 206.9,96.0 205.4,96.6 C205.1,102.4 203.0,107.8 198.3,112.5 C181.9,128.9 168.3,122.5 157.7,114.1 C157.9,116.9 156.7,120.9 152.7,124.9 L141.0,136.5 C139.8,137.7 141.6,141.9 141.8,141.8 Z"
            fill="currentColor"
            className="octo-body"
            ></path>
        </svg>
        </a>
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
                                        
                                        // Render all dots here, but article dots will be larger and red
                                        return (
                                            <circle 
                                                cx={cx}
                                                cy={cy}
                                                r={hasArticle ? 6 : 3}
                                                fill={isSelected ? "#ff9900" : (hasArticle ? "red" : "rgba(75, 192, 192, 1)")}
                                                stroke={isSelected ? "#ff9900" : (hasArticle ? "red" : "rgba(75, 192, 192, 1)")}
                                                style={{ 
                                                    cursor: hasArticle ? 'pointer' : 'default',
                                                    zIndex: hasArticle ? 2 : 1  // Ensure article dots appear above
                                                }}
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