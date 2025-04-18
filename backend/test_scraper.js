// filepath: /home/amitav/stocks/backend/test_scraper.js
const scrapeYahooNews = require('./news_scraper');

(async () => {
    try {
        const articles = await scrapeYahooNews('AAPL');
        console.log(articles);
    } catch (error) {
        console.error('Error:', error.message);
    }
})();
