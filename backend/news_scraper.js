const puppeteer = require('puppeteer');
const { getCachedNews, cacheNews } = require('./db');

async function scrapeYahooNews(stockTicker) {
    const cachedNews = await getCachedNews(stockTicker);
    if (cachedNews) {
        return cachedNews.articles; // Return cached news if available
    }

    const url = `https://news.search.yahoo.com/search?p=${stockTicker}`;
    const browser = await puppeteer.launch({
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
    try {
        const page = await browser.newPage();
        await page.goto(url);

        const articles = await page.evaluate(() => {
            return Array.from(document.querySelectorAll('.NewsArticle')).map(article => ({
                title: article.querySelector('h4')?.innerText || '',
                link: article.querySelector('a')?.href || '',
                snippet: article.querySelector('p')?.innerText || '',
                date: article.querySelector('.fc-2nd')?.innerText || ''
            }));
        });

        await cacheNews(stockTicker, articles); // Cache the fetched news
        return articles;
    } catch (error) {
        throw error;
    } finally {
        await browser.close();
    }
}

module.exports = scrapeYahooNews;
