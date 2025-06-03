const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const express = require('express');
const router = express.Router();
const { exec } = require('child_process');
const { Pool } = require('pg');

// Initialize database connection with error handling
const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

// Test database connection
pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
  process.exit(-1);
});

// Path to Python fetcher script and virtual environment
const PYTHON_SCRIPT_PATH = path.join(__dirname, '../yfinance_fetcher.py');
const VENV_PYTHON_PATH = path.join(__dirname, '../venv/bin/python');
async function fetchDataWithPython(ticker) {
  return new Promise((resolve, reject) => {
    const command = `${VENV_PYTHON_PATH} ${PYTHON_SCRIPT_PATH} ${ticker}`;
    
    console.log(`Executing command: ${command}`); // Log the exact command
    
    exec(command, { 
      shell: '/bin/bash',
      env: {
        ...process.env,
        PATH: `${path.join(__dirname, '../venv/bin')}:${process.env.PATH}`,
        PGUSER: process.env.DB_USER,
        PGPASSWORD: process.env.DB_PASSWORD,
        PGDATABASE: process.env.DB_NAME,
        PGHOST: process.env.DB_HOST,
        PGPORT: process.env.DB_PORT
      }
    }, (error, stdout, stderr) => {
      if (error) {
        console.error(`Python script error for ${ticker}:`);
        console.error('Stdout:', stdout);
        console.error('Stderr:', stderr);
        console.error('Full error object:', error);
        return reject(new Error(`Failed to fetch data for ${ticker}: ${stdout || stderr || error.message}`));
      }
      console.log(`Python script output for ${ticker}:`, stdout);
      resolve(true);
    });
  });
}
async function getHistoricalStockData(ticker) {
  const query = 'SELECT time, price, volume FROM stock_data WHERE ticker = $1 ORDER BY time DESC';
  try {
    const result = await pool.query(query, [ticker]);
    return result.rows;
  } catch (error) {
    console.error('Database query error:', error);
    throw error;
  }
}

router.get('/:ticker', async (req, res) => {
  const { ticker } = req.params;
  
  try {
    // First try to get historical data
    let data = await getHistoricalStockData(ticker);
    
    // If no data exists, attempt to fetch it
    if (!data || data.length === 0) {
      console.log(`No data found for ${ticker}, attempting to fetch...`);
      
      try {
        await fetchDataWithPython(ticker);
        
        // Try getting data again after fetch attempt
        data = await getHistoricalStockData(ticker);
        
        if (!data || data.length === 0) {
          return res.status(404).json({ 
            error: 'No data available',
            message: `Data for ${ticker} could not be fetched. Please verify the ticker symbol.`,
            suggestion: `Try manually fetching with: ${VENV_PYTHON_PATH} ${PYTHON_SCRIPT_PATH} ${ticker}`
          });
        }
      } catch (pythonError) {
        console.error(`Failed to fetch data for ${ticker}:`, pythonError);
        return res.status(503).json({ 
          error: 'Data fetch failed',
          message: `Attempt to fetch data for ${ticker} failed.`,
          details: pythonError.message,
          solution: 'Please check server logs and verify the ticker exists.'
        });
      }
    }
    
    // Return successful data response
    res.json({
      ticker,
      data: data.map(item => ({
        time: item.time,
        price: Number(item.price) || 0,
        volume: Number(item.volume) || 0
      })),
      count: data.length,
      message: data.length === 1 ? 
        'Single data point found' : 
        `${data.length} data points retrieved`
    });
    
  } catch (error) {
    console.error(`Error processing ${ticker}:`, error);
    res.status(500).json({ 
      error: 'Server error',
      ticker,
      message: `An unexpected error occurred while processing ${ticker}`,
      details: process.env.NODE_ENV === 'development' ? 
        error.message : undefined
    });
  }
});

module.exports = router;