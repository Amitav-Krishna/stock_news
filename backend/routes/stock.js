const express = require('express');
const { getHistoricalStockData } = require('../db');
const { exec } = require('child_process');
const router = express.Router();

router.get('/:ticker', async (req, res) => {
    const ticker = req.params.ticker;

    try {
        const cachedData = await getHistoricalStockData(ticker);
        if (cachedData.length) {
            return res.json(cachedData);
        }

        if (!/^[a-zA-Z0-9]+$/.test(ticker)) {
            return res.status(400).send('Invalid ticker symbol');
        }

        exec(`python3 yfinance_fetcher.py ${ticker}`, async (error) => {
            if (error) {
                console.error('Error fetching stock data using yfinance:', error);
                return res.status(500).send('Error fetching stock data');
            }

            const newData = await getHistoricalStockData(ticker);
            res.json(newData);
        });
    } catch (err) {
        console.error('Internal server error:', err); // Log the error
        res.status(500).send('Internal server error');
    }
});

module.exports = router;
