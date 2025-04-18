const puppeteer = require('puppeteer');
const scrapeYahooNews = require('./news_scraper');

jest.mock('puppeteer');

describe('News Scraper', () => {
    it('should fetch news articles successfully', async () => {
        const mockPage = {
            goto: jest.fn(),
            evaluate: jest.fn().mockResolvedValue([
                {
                    title: 'Sample Article',
                    link: 'https://example.com',
                    snippet: 'This is a sample snippet.',
                    date: '1 day ago',
                },
            ]),
        };

        const mockBrowser = {
            newPage: jest.fn().mockResolvedValue(mockPage),
            close: jest.fn(),
        };

        puppeteer.launch.mockResolvedValue(mockBrowser);

        const articles = await scrapeYahooNews('AAPL');
        expect(articles).toEqual([
            {
                title: 'Sample Article',
                link: 'https://example.com',
                snippet: 'This is a sample snippet.',
                date: '1 day ago',
            },
        ]);

        expect(mockPage.goto).toHaveBeenCalledWith(
            'https://news.search.yahoo.com/search?p=AAPL'
        );
        expect(mockBrowser.close).toHaveBeenCalled();
    });
});

describe('News Scraper - Additional Tests', () => {
    it('should return an empty array if no articles are found', async () => {
        const mockPage = {
            goto: jest.fn(),
            evaluate: jest.fn().mockResolvedValue([]),
        };

        const mockBrowser = {
            newPage: jest.fn().mockResolvedValue(mockPage),
            close: jest.fn(),
        };

        puppeteer.launch.mockResolvedValue(mockBrowser);

        const articles = await scrapeYahooNews('INVALID_TICKER');
        expect(articles).toEqual([]);
        expect(mockPage.goto).toHaveBeenCalledWith(
            'https://news.search.yahoo.com/search?p=INVALID_TICKER'
        );
        expect(mockBrowser.close).toHaveBeenCalled();
    });

    it('should handle Puppeteer launch errors gracefully', async () => {
        puppeteer.launch.mockRejectedValue(new Error('Puppeteer failed to launch'));

        await expect(scrapeYahooNews('AAPL')).rejects.toThrow('Puppeteer failed to launch');
    });

    it('should handle page navigation errors gracefully', async () => {
        const mockPage = {
            goto: jest.fn().mockRejectedValue(new Error('Navigation failed')),
        };

        const mockBrowser = {
            newPage: jest.fn().mockResolvedValue(mockPage),
            close: jest.fn(),
        };

        puppeteer.launch.mockResolvedValue(mockBrowser);

        await expect(scrapeYahooNews('AAPL')).rejects.toThrow('Navigation failed');
        expect(mockBrowser.close).toHaveBeenCalled();
    });
});