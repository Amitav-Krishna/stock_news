const { getCompanyName } = require('../utils/stockInfo');

async function testStockInfo() {
    // Test valid tickers
    const testCases = ['AAPL', 'MSFT', 'GOOGL', 'INVALID', 'TSLA', 'AMD'];
    
    console.log('Testing stock info lookup...\n');
    
    for (const ticker of testCases) {
        console.log(`Testing ticker: ${ticker}`);
        const companyName = getCompanyName(ticker);
        console.log(`Result: ${companyName || 'Not found'}\n`);
    }
}

testStockInfo().catch(console.error);
