require('dotenv').config(); // Load environment variables from .env
const { Pool } = require('pg');

// Validate environment variables
if (!process.env.DB_USER || !process.env.DB_PASSWORD || !process.env.DB_HOST || !process.env.DB_NAME || !process.env.DB_PORT) {
    console.error('Missing required database environment variables.');
    process.exit(1);
}


const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: parseInt(process.env.DB_PORT, 10), // Ensure port is a number
});

pool.on('error', (err) => {
    console.error('Unexpected error on idle client', err); // Log database errors
    process.exit(-1);
});

// Function to check if stock data exists in the cache
async function getCachedStockData(stockTicker) {
    const query = `
        SELECT time, price, volume 
        FROM stock_data 
        WHERE ticker = $1 
        ORDER BY time DESC 
        LIMIT 1
    `;
    const result = await pool.query(query, [stockTicker]);
    return result.rows.length ? result.rows[0] : null;
}

// Function to cache stock data
async function cacheStockData(stockTicker, price, volume) {
    const query = `
        INSERT INTO stock_data (time, ticker, price, volume) 
        VALUES (NOW(), $1, $2, $3)
    `;
    await pool.query(query, [stockTicker, price, volume]);
}

// Function to check if news articles exist in the cache
async function getCachedNews(stockTicker) {
    const query = `
        SELECT time, title, link, snippet 
        FROM news_articles 
        WHERE ticker = $1 
        ORDER BY time DESC 
        LIMIT 1
    `;
    const result = await pool.query(query, [stockTicker]);
    return result.rows.length ? result.rows[0] : null;
}

// Function to cache news articles
async function cacheNews(stockTicker, title, link, snippet) {
    const query = `
        INSERT INTO news_articles (time, ticker, title, link, snippet) 
        VALUES (NOW(), $1, $2, $3, $4)
    `;
    await pool.query(query, [stockTicker, title, link, snippet]);
}

// Function to fetch historical stock data for a given ticker
async function getHistoricalStockData(stockTicker) {
    try {
        const query = `
            SELECT time, price 
            FROM stock_data 
            WHERE ticker = $1 
            ORDER BY time ASC
        `;
        const result = await pool.query(query, [stockTicker]);
        return result.rows;
    } catch (err) {
        console.error('Error querying historical stock data:', err); // Log query errors
        throw err;
    }
}

module.exports = {
    getCachedStockData,
    cacheStockData,
    getCachedNews,
    cacheNews,
    getHistoricalStockData,
};
