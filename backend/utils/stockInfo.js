const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const secData = JSON.parse(fs.readFileSync(path.join(__dirname, 'company_tickers.json')));

function getCompanyName(ticker) {
    const entry = Object.values(secData).find(company => 
        company.ticker === ticker.toUpperCase()
    );
    return entry ? entry.title : null;
}
module.exports = { getCompanyName };
