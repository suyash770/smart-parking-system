import { useState, useRef } from 'react';

export default function SearchBar({ onSearch }) {
  const [query, setQuery] = useState('');
  const debounce = useRef(null);

  const handleChange = (e) => {
    const val = e.target.value;
    setQuery(val);
    clearTimeout(debounce.current);
    debounce.current = setTimeout(() => onSearch(val), 300);
  };

  return (
    <div className="search-wrap">
      <span className="icon">🔍</span>
      <input
        id="search-vehicle"
        type="text"
        placeholder="UP92J7765"
        value={query}
        onChange={handleChange}
      />
    </div>
  );
}
