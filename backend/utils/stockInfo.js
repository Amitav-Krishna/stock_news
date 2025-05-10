const zlib = require('zlib');
const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'company_tickers.json');

function loadCompanyData() {
    // Check if file exists first
    if (!fs.existsSync(filePath)) {
        console.error('Error: File not found at', filePath);
        return null;
    }

    // Read file and handle potential gzip
    const fileBuffer = fs.readFileSync(filePath);
    let jsonData;

    try {
        // First try parsing directly as JSON
        jsonData = JSON.parse(fileBuffer.toString('utf-8'));
    } catch (e) {
        // If fails, try decompressing as gzip
        try {
            const decompressed = zlib.gunzipSync(fileBuffer);
            jsonData = JSON.parse(decompressed.toString('utf-8'));
        } catch (e2) {
            console.error('Failed to parse JSON:', e2.message);
            console.error('File may be corrupted. Try downloading again.');
            return null;
        }
    }
    return jsonData;
}

const companyData = loadCompanyData();

function getCompanyName(ticker) {
    if (!companyData) return null;
    const entry = Object.values(companyData).find(company => 
        company.ticker === ticker.toUpperCase()
    );
    return entry ? entry.title : null;
}

// Export the function
module.exports = { getCompanyName };