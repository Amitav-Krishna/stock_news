## Project definition
An app or website that shows the timeline of a stock price over long term (5 years+) with major news articles of the stock pinned on the price chart. This way it is easy to see and learn how news affects stock prices past and present. (recommended by marnus.db@gmail.com)
## Project stack
1. **Frontend (UI & Visualization)**
- Next.js 
- React-chartjs-2 for rendering charts
2. **Data fetching**
	- Stock prices
		- Yahoo Finance API (yfinance)
	- News
		- Yahoo News
3. **Database**
	- PostgreSQL + TimescaleDB
4. **Miscellaneous**
	- Luxon for date handling
	- Axios for API calls 
	- Puppeteer for news scraping
## Project flow

```mermaid
graph TD;\n
    User chooses stock in the frontend --> Get data from TimescaleDB
	Get data from TimescaleDB --> (if data is missing)
	Get data from TimescaleDB --> Send data to frontend to be displayed
	(if data is missing) --> Use yfinance to get data about stock prices
	(if data is missing) --> Scrape Yahoo News using Puppeteer for news about the stock
	Use yfinance to get data about stock prices --> Store data in TimescaleDB
	Scrape Yahoo News using Puppeteer for news about the stock --> Store data in TimescaleDB
	Scrape Yahoo News using Puppeteer for news about the stock --> Send data to frontend to be displayed
	Use yfinance to get data about stock prices --> Send data to frontend to be displayed
    ```