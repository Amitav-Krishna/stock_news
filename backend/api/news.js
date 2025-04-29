// backend/routes/news.js
const express = require('express');
const cors = require('cors');
const axios = require('axios');
const router = express.Router();
const db = require('../utils/db');
const { getCompanyName } = require('../utils/stockInfo');

const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

router.use(cors()); // Allow all origins for now

// Add function to get available cached stocks
const getCachedStocks = async (db) => {
  try {
    const result = await db.query(
      `SELECT DISTINCT ticker 
       FROM news_articles 
       GROUP BY ticker 
       HAVING COUNT(*) > 5
       ORDER BY ticker`
    );
    return result.rows.map(row => row.ticker);
  } catch (error) {
    console.error('[DEBUG] Error getting cached stocks:', error);
    return [];
  }
};

router.get('/', async (req, res) => {
  const ticker = (req.query.q || '').toUpperCase();

  if (!ticker) {
    console.error('Ticker is missing or invalid');
    return res.status(400).json({ error: 'Ticker is required' });
  }

  const baseUrl = 'https://gnews.io/api/v4/search';

  try {
    // Check database for existing articles
    console.log(`[DEBUG] Searching for ticker: ${ticker}`);
    let dbArticles = await db.query(
      `SELECT title, link, snippet, time as "publishedAt"
       FROM news_articles 
       WHERE ticker = $1 
       ORDER BY time DESC`,
      [ticker]
    );
    console.log(`[DEBUG] Found ${dbArticles.rows.length} articles in database`);

    // If no articles in DB, fetch from API
    if (dbArticles.rows.length === 0) {
      try {
        console.log('[DEBUG] No cached articles found, fetching from GNews API...');
        
        const companyName = getCompanyName(ticker);
        let allArticles = [];

        // Create more flexible search query
        const searchTerms = companyName
          ? [`${companyName.replace(/,?\s+Incorporated\.?$/, '')}`, ticker]
          : [ticker];
        
        const keywords = 'stock OR shares OR earnings OR financial OR market';
        const fullQuery = `${searchTerms}`;
        
        console.log(`[DEBUG] Base search query: ${fullQuery}`);

        // Create time ranges for 4-month intervals across 5 years
        const currentYear = new Date().getFullYear();
        const timeRanges = [];
        for (let year = 0; year < 5; year++) {
          const targetYear = currentYear - year;
          [
            { start: '01-01', end: '04-30' },
            { start: '05-01', end: '08-31' },
            { start: '09-01', end: '12-31' }
          ].forEach(({ start, end }) => {
            timeRanges.push({
              year: targetYear,
              from: `${targetYear}-${start}T00:00:00Z`,
              to: `${targetYear}-${end}T23:59:59Z`
            });
          });
        }

        // Helper function to check API errors
        const handleApiError = async (error) => {
          if (error.response?.status === 429 || error.response?.status === 403 || error.response?.status === 400) {
            const cachedStocks = await getCachedStocks(db);
            throw {
              status: error.response.status,
              apiLimit: true,
              cachedStocks,
              message: `Hey there! Sadly, we've run out of API tokens for our news articles. Here are the stocks that you can try out our app with: ${cachedStocks.join(', ')}`
            };
          }
          return error;
        };

        for (const range of timeRanges) {
          try {
            const response = await axios.get(
              `${baseUrl}?q=${encodeURIComponent(fullQuery)}&lang=en&country=us&max=3&from=${range.from}&to=${range.to}&apikey=${process.env.GNEWS_API_KEY}&sortby=relevance`
            );
            
            console.log('[DEBUG] GNews API Response:', {
              articles: response.data?.articles?.length || 0,
              sample: response.data?.articles?.[0]
            });
            
            if (!response.data?.articles) {
              console.error('[DEBUG] Invalid API response structure:', response.data);
              continue;
            }
            
            allArticles = [...allArticles, ...response.data.articles];
            await delay(1000);
          } catch (error) {
            await handleApiError(error); // This will throw immediately if it's an API limit error
            console.error(`[DEBUG] Query failed for ${range.year}:`, {
              status: error.response?.status,
              message: error.message
            });
          }
        }

        console.log('[DEBUG] Articles per year:', 
          allArticles.reduce((acc, article) => {
            const year = new Date(article.publishedAt).getFullYear();
            acc[year] = (acc[year] || 0) + 1;
            return acc;
          }, {})
        );

        const newArticles = allArticles
          .map(article => {
            console.log('[DEBUG] Processing article:', {
              title: article.title,
              url: article.url,
              link: article.link
            });
            return {
              title: article.title,
              link: article.link || article.url, // GNews API sometimes uses 'link' instead of 'url'
              snippet: article.description,
              publishedAt: article.publishedAt
            };
          })
          .filter((article, index, self) => 
            index === self.findIndex(a => a.title === article.title)
          );

        console.log(`[DEBUG] Fetched ${newArticles.length} articles from API`);

        // Insert new articles into DB
        for (const article of newArticles) {
          try {
            await db.query(
              `INSERT INTO news_articles (ticker, title, link, snippet, time)
               VALUES ($1, $2, $3, $4, $5)
               ON CONFLICT ON CONSTRAINT news_articles_ticker_title_time_key DO UPDATE 
               SET link = EXCLUDED.link, snippet = EXCLUDED.snippet`,
              [ticker, article.title, article.link, article.snippet, new Date(article.publishedAt)]
            );
          } catch (dbError) {
            console.error('[DEBUG] Error inserting article:', dbError.message);
          }
        }

        // Get updated articles from DB
        dbArticles = await db.query(
          `SELECT title, link, snippet, time as "publishedAt"
           FROM news_articles 
           WHERE ticker = $1 
           ORDER BY time DESC`,
          [ticker]
        );
      } catch (error) {
        if (error.apiLimit) {
          return res.status(429).json({
            error: 'API_LIMIT',
            message: error.message,
            cachedStocks: error.cachedStocks
          });
        }
        throw error;
      }
    }

    res.json(dbArticles.rows);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch news',
      details: error.message 
    });
  }
});

module.exports = router;




