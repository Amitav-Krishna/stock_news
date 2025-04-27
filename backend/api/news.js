// backend/routes/news.js
const express = require('express');
const cors = require('cors');
const axios = require('axios');
const router = express.Router();
const db = require('../utils/db');
const { getCompanyName } = require('../utils/stockInfo');

const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

router.use(cors()); // Allow all origins for now

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
      console.log('[DEBUG] No cached articles found, fetching from GNews API...');
      
      const companyName = getCompanyName(ticker);
      let allArticles = [];

      // Prepare search query
      const searchTerm = companyName 
        ? `"${companyName.replace(/,?\s+Inc\.?$/, '')}"`
        : `"${ticker}"`;

      // Generate year ranges for the past 5 years
      const currentYear = new Date().getFullYear();
      const yearRanges = Array.from({ length: 5 }, (_, i) => ({
        year: currentYear - i,
        from: `${currentYear - i}-01-01T00:00:00Z`,
        to: `${currentYear - i}-12-31T23:59:59Z`
      }));

      // Fetch 3 articles per year
      for (const range of yearRanges) {
        console.log(`[DEBUG] Fetching articles for ${range.year}`);
        const fullQuery = `${searchTerm} stock`;

        try {
          const response = await axios.get(
            `${baseUrl}?q=${encodeURIComponent(fullQuery)}&lang=en&country=us&max=3&from=${range.from}&to=${range.to}&apikey=${process.env.GNEWS_API_KEY}&sortby=publishedAt`
          );
          
          console.log('[DEBUG] API Response for year', range.year, ':', {
            totalArticles: response.data.totalArticles,
            received: response.data.articles?.length || 0
          });

          allArticles = [...allArticles, ...(response.data.articles || [])];
          await delay(1000); // Rate limiting delay
        } catch (error) {
          console.error(`[DEBUG] Query failed for ${range.year}:`, {
            status: error.response?.status,
            message: error.message
          });
          if (error.response?.status === 429) {
            await delay(60000);
            // Retry this year
            try {
              const retryResponse = await axios.get(
                `${baseUrl}?q=${encodeURIComponent(fullQuery)}&lang=en&country=us&max=3&from=${range.from}&to=${range.to}&apikey=${process.env.GNEWS_API_KEY}&sortby=publishedAt`
              );
              allArticles = [...allArticles, ...(retryResponse.data.articles || [])];
            } catch (retryError) {
              console.error(`[DEBUG] Retry failed for ${range.year}`);
            }
          }
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
        .map(article => ({
          title: article.title,
          link: article.url,
          snippet: article.description,
          publishedAt: article.publishedAt
        }))
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




