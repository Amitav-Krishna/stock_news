const puppeteer = require('puppeteer');

async function scrapeYahooNews(stockTicker) {
    const url = `https://news.search.yahoo.com/search?p=${stockTicker}`;
    const browser = await puppeteer.launch({
        args: ['--no-sandbox', '--disable-setuid-sandbox'], // Added options to bypass sandboxing issues
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

        return articles;
    } catch (error) {
        throw error; // Re-throw the error after cleanup
    } finally {
        await browser.close(); // Ensure the browser is closed
    }
}

// Example usage:
// scrapeYahooNews("AAPL").then(articles => console.log(articles));
module.exports = scrapeYahooNews;
