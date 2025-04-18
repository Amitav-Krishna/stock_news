import yfinance as yf

def fetch_stock_data(ticker, start_date, end_date):
    """
    Fetch historical stock price data for a given ticker symbol.

    Args:
        ticker (str): Stock ticker symbol (e.g., "AAPL").
        start_date (str): Start date in the format "YYYY-MM-DD".
        end_date (str): End date in the format "YYYY-MM-DD".

    Returns:
        pandas.DataFrame: DataFrame containing stock price data.
    """
    stock = yf.Ticker(ticker)
    data = stock.history(start=start_date, end=end_date)
    return data
# Example usage:
# data = fetch_stock_data("AAPL", "2018-01-01", "2023-01-01")
# print(data)
