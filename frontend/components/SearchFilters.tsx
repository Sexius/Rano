
import React, { useState, useEffect, useRef } from 'react';
import { Search, Filter, RotateCcw, Clock, X } from 'lucide-react';
import { SERVERS, CATEGORIES, DEFAULT_SEARCH_PLACEHOLDERS } from '../constants';
import { SearchParams } from '../types';

interface SearchFiltersProps {
  onSearch: (params: SearchParams) => void;
  isLoading: boolean;
}

const SearchFilters: React.FC<SearchFiltersProps> = ({ onSearch, isLoading }) => {
  const [query, setQuery] = useState('');
  const [server, setServer] = useState(SERVERS[0]);
  const [placeholder] = useState(DEFAULT_SEARCH_PLACEHOLDERS[Math.floor(Math.random() * DEFAULT_SEARCH_PLACEHOLDERS.length)]);

  // Recent Search State
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [showRecent, setShowRecent] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const saved = localStorage.getItem('kafra_recent_searches');
    if (saved) {
      setRecentSearches(JSON.parse(saved));
    }
  }, []);

  // Close recent dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setShowRecent(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const saveRecentSearch = (searchTerm: string) => {
    if (!searchTerm.trim()) return;
    const newRecent = [searchTerm, ...recentSearches.filter(s => s !== searchTerm)].slice(0, 5);
    setRecentSearches(newRecent);
    localStorage.setItem('kafra_recent_searches', JSON.stringify(newRecent));
  };

  const removeRecentSearch = (e: React.MouseEvent, term: string) => {
    e.stopPropagation();
    const newRecent = recentSearches.filter(s => s !== term);
    setRecentSearches(newRecent);
    localStorage.setItem('kafra_recent_searches', JSON.stringify(newRecent));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    saveRecentSearch(query);
    setShowRecent(false);
    onSearch({ query, server, category: '전체' });
  };

  const handleRecentClick = (term: string) => {
    setQuery(term);
    saveRecentSearch(term);
    setShowRecent(false);
    onSearch({ query: term, server, category: '전체' });
  };

  const handleReset = () => {
    setQuery('');
    setServer(SERVERS[0]);
  }

  return (
    <div className="mb-6">
      <form onSubmit={handleSubmit}>
        {/* Single Row: Server Select + Search Input */}
        <div className="flex flex-col md:flex-row gap-2">
          {/* Server Select */}
          <div className="relative shrink-0 w-full md:w-32">
            <select
              id="server-select"
              value={server}
              onChange={(e) => setServer(e.target.value)}
              className="block w-full h-12 px-3 text-sm font-medium text-gray-700 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-kafra-100 focus:border-kafra-500 bg-white shadow-sm appearance-none cursor-pointer hover:border-gray-300"
            >
              {SERVERS.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
            <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none text-gray-500">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
            </div>
          </div>

          {/* Search Input */}
          <div className="relative flex-1" ref={searchContainerRef}>
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              className="block w-full h-12 pl-12 pr-24 border border-gray-200 bg-white rounded-lg focus:ring-2 focus:ring-kafra-100 focus:border-kafra-500 transition-all text-gray-800 placeholder-gray-400 text-sm shadow-sm"
              placeholder={placeholder}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onFocus={() => setShowRecent(true)}
            />

            {/* Recent Searches Dropdown */}
            {showRecent && recentSearches.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-100 rounded-lg shadow-lg z-50 overflow-hidden">
                <div className="px-3 py-2 bg-gray-50 text-xs font-bold text-gray-500 border-b border-gray-100">최근 검색어</div>
                {recentSearches.map((term, idx) => (
                  <div
                    key={idx}
                    className="px-3 py-2 hover:bg-gray-50 cursor-pointer flex items-center justify-between group/item text-sm"
                    onClick={() => handleRecentClick(term)}
                  >
                    <div className="flex items-center gap-2 text-gray-700">
                      <Clock size={14} className="text-gray-400" />
                      <span>{term}</span>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => removeRecentSearch(e, term)}
                      className="text-gray-300 hover:text-red-500 p-1 rounded-full hover:bg-red-50 opacity-0 group-hover/item:opacity-100 transition-all"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Search Button inside input */}
            <button
              type="submit"
              disabled={isLoading}
              className="absolute inset-y-1.5 right-1.5 px-5 bg-kafra-500 hover:bg-kafra-600 text-white font-bold rounded-md transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center text-sm"
            >
              {isLoading ? (
                <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              ) : (
                '검색'
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default SearchFilters;