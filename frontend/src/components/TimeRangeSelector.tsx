interface TimeRangeSelectorProps {
  value: string;
  onChange: (value: string) => void;
}

export default function TimeRangeSelector({ value, onChange }: TimeRangeSelectorProps) {
  const ranges = [
    { value: '1y', label: '1 Year' },
    { value: '3y', label: '3 Years' },
    { value: '5y', label: '5 Years' },
    { value: '10y', label: '10 Years' }
  ];
  
  return (
    <select 
      value={value} 
      onChange={(e) => onChange(e.target.value)}
      className="time-range-selector"
    >
      {ranges.map(range => (
        <option key={range.value} value={range.value}>{range.label}</option>
      ))}
    </select>
  );
}