require('dotenv').config(); // Load environment variables from .env
const { Pool } = require('pg');

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

// Function to check if stock data exists in the cache
async function getCachedStockData(stockTicker) {
    const query = 'SELECT * FROM stock_data WHERE ticker = $1 ORDER BY date DESC LIMIT 1';
    const result = await pool.query(query, [stockTicker]);
    return result.rows.length ? result.rows[0] : null;
}

// Function to cache stock data
async function cacheStockData(stockTicker, data) {
    const query = 'INSERT INTO stock_data (ticker, date, data) VALUES ($1, NOW(), $2)';
    await pool.query(query, [stockTicker, data]);
}

// Function to check if news articles exist in the cache
async function getCachedNews(stockTicker) {
    const query = 'SELECT * FROM news_articles WHERE ticker = $1 ORDER BY date DESC LIMIT 1';
    const result = await pool.query(query, [stockTicker]);
    return result.rows.length ? result.rows[0] : null;
}

// Function to cache news articles
async function cacheNews(stockTicker, articles) {
    const query = 'INSERT INTO news_articles (ticker, date, articles) VALUES ($1, NOW(), $2)';
    await pool.query(query, [stockTicker, articles]);
}

module.exports = {
    getCachedStockData,
    cacheStockData,
    getCachedNews,
    cacheNews,
};
