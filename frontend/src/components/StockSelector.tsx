export default function StockSelector({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  const popularStocks = ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'TSLA', 'META'];
  
  return (
    <select 
      value={value} 
      onChange={(e) => onChange(e.target.value)}
      className="stock-selector"
    >
      {popularStocks.map(stock => (
        <option key={stock} value={stock}>{stock}</option>
      ))}
    </select>
  );
}