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

    React.useEffect(() => {
        const updateDimensions = () => {
            const containerWidth = Math.min(window.innerWidth - 40, 1200); // max width of 1200px, 20px padding on each side
            const containerHeight = Math.min(window.innerHeight * 0.6, 600); // 60% of viewport height, max 600px
            setDimensions({ width: containerWidth, height: containerHeight });
        };

        // Set initial dimensions
        updateDimensions();

        // Add event listener
        window.addEventListener('resize', updateDimensions);

        // Cleanup
        return () => window.removeEventListener('resize', updateDimensions);
    }, []);

    const scrollToDataPoint = (date) => {
        if (chartRef.current) {
            chartRef.current.scrollIntoView({ behavior: 'smooth' });
            setSelectedPoint(date);
            // Reset the highlight after 2 seconds
            setTimeout(() => setSelectedPoint(null), 2000);
        }
    };

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
            console.log('Fetching data for ticker:', ticker);
            const response = await axios.get(`/api/stock/${ticker}`);
            console.log('Raw API response:', response);
            const responseData = response.data;
            console.log('Response data:', responseData);

            if (!responseData.data || !Array.isArray(responseData.data)) {
                console.error('Expected data array in response but got:', responseData);
                return;
            }

            const validatedData = responseData.data.map(item => {
                console.log('Processing item:', item);
                return {
                    ...item,
                    price: Number(item.price) || 0,
                };
            });

            // Sort data chronologically
            const sortedData = validatedData.sort((a, b) => new Date(a.time) - new Date(b.time));
            console.log('Sorted data:', sortedData);
            setChartData(sortedData);

            const significantChanges = [];
            for (let i = 1; i < sortedData.length; i++) {
                const prev = sortedData[i - 1];
                const curr = sortedData[i];
                const priceChange = Math.abs(curr.price - prev.price);
                if (priceChange / prev.price > 0.05) {
                    significantChanges.push(curr.time);
                }
            }

            // Critical fixes for NewsAPI implementation
            if (!significantChanges.length) {
                console.warn('No significant price changes detected');
                return;
            }

            const formattedDate = format(new Date(significantChanges[0]), 'yyyy-MM-dd');
            const today = format(new Date(), 'yyyy-MM-dd');
            
            // Fetch related news articles
            console.log('Fetching news articles...');
            const newsResponse = await axios.get('/api/news', {
                params: { q: ticker }
            });

            console.log('News response:', newsResponse.data);

            const processedArticles = newsResponse.data || [];
            setArticles(processedArticles);
            
            // Enhance chartData with article information
            const enhancedData = sortedData.map(dataPoint => {
                const hasArticle = processedArticles.some(article => 
                    new Date(article.publishedAt).toDateString() === new Date(dataPoint.time).toDateString()
                );
                return {
                    ...dataPoint,
                    hasArticle,
                    pointStyle: hasArticle ? 'circle' : 'none',
                    pointRadius: hasArticle ? 4 : 0,
                    pointBackgroundColor: hasArticle ? 'red' : 'transparent',
                    pointBorderColor: hasArticle ? 'red' : 'transparent',
                };
            });
            setChartData(enhancedData);
            
        } catch (error) {
            console.error('Error:', error);
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
            <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
                <h1 className="text-3xl font-bold text-gray-900 mb-8">Stock Price Analysis</h1>
                
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
                                        const { payload } = props;
                                        const isSelected = selectedPoint && 
                                            new Date(selectedPoint).toDateString() === new Date(payload.time).toDateString();
                                        if (payload.hasArticle || isSelected) {
                                            return (
                                                <circle 
                                                    {...props} 
                                                    r={isSelected ? 12 : 8} 
                                                    fill={isSelected ? "#ff9900" : "red"}
                                                    stroke={isSelected ? "#ff9900" : "red"}
                                                />
                                            );
                                        }
                                        return null;
                                    }}
                                    activeDot={{
                                        r: 12,
                                        strokeWidth: 2,
                                        fill: "#ff9900",
                                        stroke: "#ff9900"
                                    }}
                                />
                            </LineChart>
                        </div>
                    )}
                </div>

                {articles.length > 0 && (
                    <div className="bg-white rounded-lg shadow p-6">
                        <h2 className="text-2xl font-semibold text-gray-900 mb-6">Related Articles</h2>
                        <div className="space-y-6">
                            {articles.map((article, index) => (
                                <div key={index} className="border-b border-gray-200 last:border-0 pb-6">
                                    <h3 className="text-lg font-medium mb-2">
                                        {article.link ? (
                                            <a 
                                                href={article.link} 
                                                target="_blank" 
                                                rel="noopener noreferrer"
                                                className="text-primary hover:underline"
                                            >
                                                {article.title}
                                            </a>
                                        ) : (
                                            <span>{article.title}</span>
                                        )}
                                    </h3>
                                    <p className="text-sm text-gray-600 mb-2">
                                        <strong>Source:</strong> {article.source}
                                    </p>
                                    <p className="relative text-sm text-gray-600 mb-2">
                                        <strong>Published:</strong>{' '}
                                        <span 
                                            onClick={() => {
                                                scrollToDataPoint(article.publishedAt);
                                                setSelectedDate(selectedDate === article.publishedAt ? null : article.publishedAt);
                                            }}
                                            className="cursor-pointer text-primary hover:underline"
                                        >
                                            {article.publishedAt}
                                        </span>
                                    </p>
                                    <p className="text-gray-700">{article.snippet}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

