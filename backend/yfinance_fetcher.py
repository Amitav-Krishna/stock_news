import os
import sys
import subprocess
import yfinance as yf
import psycopg2
from datetime import datetime
import pandas as pd
from dotenv import load_dotenv
load_dotenv()
print(os.getenv("DB_NAME"))
print(os.getenv("DB_USER"))
print(os.getenv("DB_PASSWORD"))
print(os.getenv("DB_HOST"))
print(os.getenv("DB_PORT"))

def activate_virtualenv(venv_path='venv'):
    """Activate virtual environment"""
    if not os.path.exists(venv_path):
        print(f"Virtual environment not found at {venv_path}")
        sys.exit(1)
    
    # For Windows
    if sys.platform == 'win32':
        activate_script = os.path.join(venv_path, 'Scripts', 'activate.bat')
        subprocess.call([activate_script], shell=True)
    # For Unix/Linux/MacOS
    else:
        activate_script = os.path.join(venv_path, 'bin', 'activate')
        os.system(f'/bin/bash -c "source {activate_script}"')

def fetch_and_store_stock_data(ticker):
    """Fetch stock data and store in database"""
    try:
        print(f"Fetching data for {ticker}...")
        stock = yf.Ticker(ticker)
        
        # Verify ticker exists
        if not stock.info:
            print(f"Invalid ticker: {ticker}")
            return False
            
        hist = stock.history(period="5y")
        if hist.empty:
            print(f"No data available for {ticker}")
            return False

        conn = psycopg2.connect(
            dbname=os.getenv("DB_NAME"),
            user=os.getenv("DB_USER"),
            password=os.getenv("DB_PASSWORD"),
            host=os.getenv("DB_HOST"),
            port=os.getenv("DB_PORT"),
        )
        cursor = conn.cursor()


        for date, row in hist.iterrows():
            close_price = float(row['Close']) if not pd.isna(row['Close']) else None
            volume = int(row['Volume']) if not pd.isna(row['Volume']) else None

            if close_price is not None and volume is not None:
                cursor.execute(
                    """
                    INSERT INTO stock_data (time, ticker, price, volume)
                    VALUES (%s, %s, %s, %s)
                    ON CONFLICT DO NOTHING
                    """,
                    (date, ticker, close_price, volume)
                )
        conn.commit()
        conn.close()
        print(f"Successfully stored data for {ticker}")
        return True

    except Exception as e:
        print(f"Error processing {ticker}: {str(e)}")
        return False

if __name__ == "__main__":
    # Activate virtual environment
    activate_virtualenv()
    
    # Check dependencies
    try:
        import yfinance
        import psycopg2
        import pandas
    except ImportError as e:
        print(f"Missing dependency: {e}")
        print("Please install requirements: pip install yfinance psycopg2-binary pandas")
        sys.exit(1)
    
    if len(sys.argv) != 2:
        print("Usage: python yfinance_fetcher.py <ticker>")
        sys.exit(1)
    
    success = fetch_and_store_stock_data(sys.argv[1])
    sys.exit(0 if success else 1)