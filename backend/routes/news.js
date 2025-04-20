// backend/routes/news.js
const express = require('express');
const axios = require('axios');
const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const params = {
      q: req.query.q,
      from: req.query.from,
      to: req.query.to,
      sortBy: 'publishedAt',
      apiKey: process.env.NEWSAPI_KEY,
      language: 'en',
      pageSize: 5,
    };

    const response = await axios.get('https://newsapi.org/v2/everything', { params });
    res.json(response.data);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch news' });
  }
});

module.exports = router;