// backend/routes/news.js
const express = require("express");
const cors = require("cors");
const axios = require("axios");
const router = express.Router();
const db = require("../utils/db");
const { getCompanyName } = require("../utils/stockInfo");

// Constants
const API_DELAY_MS = 1000;
const MIN_CACHED_ARTICLES = 5;
const MAX_API_ARTICLES_PER_REQUEST = 3;
const API_YEAR_RANGE = 1; // Only fetch 1 year back to avoid rate limits
const QUARTERS_PER_YEAR = 4;

// Helper functions
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const getCachedStocks = async () => {
    try {
        const result = await db.query(
            `SELECT DISTINCT ticker
       FROM news_articles
       GROUP BY ticker
       HAVING COUNT(*) >= $1
       ORDER BY ticker`,
            [MIN_CACHED_ARTICLES],
        );
        return result.rows.map((row) => row.ticker);
    } catch (error) {
        console.error("Error getting cached stocks:", error);
        return [];
    }
};

const cleanCompanyName = (name) => {
    if (!name) return "";
    return name
        .replace(/,?\s+(Incorporated|Inc|Ltd|LLC|Corp|Company)\.?$/i, "")
        .trim();
};

const generateTimeRanges = () => {
    const ranges = [];
    const now = new Date();

    for (let yearOffset = 0; yearOffset < API_YEAR_RANGE; yearOffset++) {
        const year = now.getFullYear() - yearOffset;

        for (let quarter = 0; quarter < QUARTERS_PER_YEAR; quarter++) {
            const startMonth = quarter * 3;
            const endMonth = startMonth + 2;

            const fromDate = new Date(year, startMonth, 1);
            const toDate = new Date(year, endMonth + 1, 0);

            ranges.push({
                from: fromDate.toISOString(),
                to: toDate.toISOString(),
            });
        }
    }

    return ranges;
};

const handleApiError = async (error) => {
    if (error.response?.data?.message?.includes("limit")) {
        const cachedStocks = await getCachedStocks();
        throw {
            status: 429,
            apiLimit: true,
            message: `API limit reached. Try these cached tickers: ${cachedStocks.join(", ")}`,
        };
    }
    console.warn("API Error:", error.response?.data || error.message);
    throw error;
};

const processArticles = (articles) => {
    return articles
        .map((article) => ({
            title: article.title,
            link: article.link || article.url,
            snippet: article.description || article.content,
            publishedAt: article.publishedAt,
        }))
        .filter(
            (article, index, self) =>
                index ===
                self.findIndex(
                    (a) => a.title === article.title && a.link === article.link,
                ),
        );
};

// Routes
router.use(cors());

router.get("/", async (req, res) => {
    const ticker = (req.query.q || "").toUpperCase().trim();

    if (!ticker) {
        return res.status(400).json({
            error: "Invalid request",
            message: "Ticker parameter (q) is required",
        });
    }

    try {
        // Check database first
        let dbArticles = await db.query(
            `SELECT title, link, snippet, time as "publishedAt"
       FROM news_articles
       WHERE ticker = $1
       ORDER BY time DESC
       LIMIT 50`,
            [ticker],
        );

        if (dbArticles.rows.length >= MIN_CACHED_ARTICLES) {
            return res.json(dbArticles.rows);
        }

        // Fetch from API if not enough cached articles
        const companyName = getCompanyName(ticker);
        if (!companyName) {
            return res.status(404).json({
                error: "Company not found",
                message: `No company found for ticker: ${ticker}`,
            });
        }

        const searchQuery = cleanCompanyName(companyName);
        const timeRanges = generateTimeRanges();
        let allArticles = [];

        for (const range of timeRanges) {
            try {
                const response = await axios.get(
                    "https://gnews.io/api/v4/search",
                    {
                        params: {
                            q: searchQuery,
                            lang: "en",
                            country: "us",
                            max: MAX_API_ARTICLES_PER_REQUEST,
                            from: range.from,
                            to: range.to,
                            apikey: process.env.GNEWS_API_KEY,
                            sortby: "publishedAt",
                        },
                        timeout: 3000,
                    },
                );

                if (response.data?.articles?.length) {
                    allArticles = [...allArticles, ...response.data.articles];
                    await delay(API_DELAY_MS);
                }
            } catch (error) {
                await handleApiError(error);
            }
        }

        const processedArticles = processArticles(allArticles);

        // Cache new articles
        if (processedArticles.length > 0) {
            try {
                await db.query(
                    `INSERT INTO news_articles (ticker, title, link, snippet, time)
           VALUES ${processedArticles
               .map(
                   (_, i) =>
                       `($${i * 5 + 1}, $${i * 5 + 2}, $${i * 5 + 3}, $${i * 5 + 4}, $${i * 5 + 5})`,
               )
               .join(", ")}
           ON CONFLICT (ticker, title, time) DO NOTHING`,
                    processedArticles.flatMap((article) => [
                        ticker,
                        article.title,
                        article.link,
                        article.snippet,
                        new Date(article.publishedAt),
                    ]),
                );
            } catch (dbError) {
                console.error("Database insert error:", dbError);
            }
        }

        // Get updated results
        dbArticles = await db.query(
            `SELECT title, link, snippet, time as "publishedAt"
       FROM news_articles
       WHERE ticker = $1
       ORDER BY time DESC
       LIMIT 50`,
            [ticker],
        );

        return res.json(dbArticles.rows);
    } catch (error) {
        console.error("News fetch error:", error);

        if (error.apiLimit) {
            return res.status(429).json({
                error: "API limit reached",
                message: error.message,
            });
        }

        return res.status(500).json({
            error: "Server error",
            message: error.message || "Failed to fetch news articles",
        });
    }
});

module.exports = router;
