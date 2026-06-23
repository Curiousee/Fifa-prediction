import React from 'react';
import { Search } from 'lucide-react';

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

const SearchInput: React.FC<SearchInputProps> = ({
  value,
  onChange,
  placeholder = 'Search...',
  className = '',
}) => (
  <div className={`relative max-w-xs w-full ${className}`}>
    <Search
      size={15}
      className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none"
    />
    <input
      type="text"
      placeholder={placeholder}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="input-field pl-9 text-sm py-2.5"
    />
  </div>
);

export default SearchInput;
