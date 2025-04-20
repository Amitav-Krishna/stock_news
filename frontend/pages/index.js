// frontend/pages/index.js
import React, { useState } from 'react';
import axios from 'axios';
import { LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { format, differenceInMinutes } from 'date-fns'; // Import date-fns for date formatting and comparison
import dotenv from 'dotenv'; // Import dotenv to load environment variables
dotenv.config(); // Load .env file

export default function Home() {
    const [ticker, setTicker] = useState('');
    const [chartData, setChartData] = useState(null);
    const [articles, setArticles] = useState([]); // State for storing articles

    const fetchStockData = async () => { // Define fetchStockData
        try {
            const response = await axios.get(`/api/stock/${ticker}`);
            const data = response.data;

            const validatedData = data.map(item => ({
                ...item,
                price: Number(item.price) || 0,
            }));

            setChartData(validatedData);

            const significantChanges = [];
            for (let i = 1; i < validatedData.length; i++) {
                const prev = validatedData[i - 1];
                const curr = validatedData[i];
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
            
            const articlesResponse = await axios.get('/api/news', {
                params: {
                    q: ticker,
                    from: formattedDate,
                    to: today}
            });

            setArticles(articlesResponse.data.articles);
        } catch (error) {
            console.error('Error:', error.response?.data?.message || error.message);
        }
    };

    return (
        <div>
            <h1>Stock Price Graph</h1>
            <input
                type="text"
                placeholder="Enter stock ticker"
                value={ticker}
                onChange={(e) => setTicker(e.target.value)}
            />
            <button onClick={fetchStockData}>Fetch Data</button>
            {chartData && (
                <LineChart key={JSON.stringify(chartData)} width={800} height={500} data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                        dataKey="time" 
                        tickFormatter={(tick) => format(new Date(tick), 'MM/dd')} // Format dates
                    />
                    <YAxis 
                        type="number" // Ensure Y-axis is numeric
                        domain={[0, (dataMax) => {
                            console.log('dataMax:', dataMax); // Debugging
                            return Math.ceil(dataMax) + 10;
                        }]} 
                        tickFormatter={(tick) => `$${Math.round(tick)}`} // Round to nearest dollar
                    />
                    <Tooltip 
                        formatter={(value, name, props) => {
                            const date = props.payload?.time ? format(new Date(props.payload.time), 'yyyy-MM-dd HH:mm') : '';
                            return [
                                typeof value === 'number' ? `$${Math.round(value)}` : value, // Round to the nearest dollar
                                date // Format the date in the desired format
                            ];
                        }} 
                    />
                    <Line type="monotone" dataKey="price" stroke="rgba(75, 192, 192, 1)" />
                </LineChart>
            )}
            {articles.length > 0 && (
                <div>
                    <h2>Related Articles</h2>
                    <ul>
                        {articles.map((article, index) => (
                            <li key={index}>
                                <a href={article.url} target="_blank" rel="noopener noreferrer">
                                    {article.title}
                                </a>
                                <p>{article.description}</p>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
}
