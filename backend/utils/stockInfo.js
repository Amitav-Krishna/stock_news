const { execSync } = require('child_process');

function getCompanyName(ticker) {
    try {
        console.log(`[DEBUG] Fetching company name for ticker: ${ticker}`);
        const command = `source /home/amitav/stocks/backend/venv/bin/activate && python3 -c "
import yfinance as yf
try:
    ticker = yf.Ticker('${ticker}')
    info = ticker.info
    if 'longName' in info:
        print(info['longName'])
    else:
        print('')
except Exception as e:
    print(f'ERROR: {str(e)}')
"`;
        const output = execSync(command, { shell: '/bin/bash' }).toString().trim();
        if (output.startsWith('ERROR:')) {
            console.error(`[DEBUG] Python error: ${output}`);
            return null;
        }
        console.log(`[DEBUG] Found company name: ${output || 'None'}`);
        return output || null;
    } catch (error) {
        console.error('[DEBUG] System error:', error.message);
        return null;
    }
}

module.exports = { getCompanyName };
