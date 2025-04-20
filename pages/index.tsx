import React, { useState } from 'react';
import StockChart from '../components/StockChart';

const Home = () => {
    const [stockSymbol, setStockSymbol] = useState('');

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setStockSymbol(e.target.value);
    };

    return (
        <div>
            <h1>Stock Price Viewer</h1>
            <input
                type="text"
                placeholder="Enter stock symbol"
                value={stockSymbol}
                onChange={handleInputChange}
            />
            {stockSymbol && <StockChart stockSymbol={stockSymbol} />}
        </div>
    );
};

export default Home;
