
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
    <div className="bg-white rounded-2xl shadow-lg shadow-gray-200/50 border border-gray-100 p-5 md:p-7 mb-8 relative overflow-visible">
      {/* Decorative background blob - hidden on mobile to prevent overflow/wobble */}
      <div className="absolute top-0 right-0 -mr-20 -mt-20 w-64 h-64 bg-kafra-50 rounded-full blur-3xl opacity-60 pointer-events-none hidden md:block"></div>

      <form onSubmit={handleSubmit} className="relative space-y-5">

        {/* Top Row: Search Input */}
        <div className="relative group" ref={searchContainerRef}>
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none z-10">
            <Search className="h-5 w-5 text-gray-400 group-focus-within:text-kafra-500 transition-colors" />
          </div>
          <input
            type="text"
            className="block w-full pl-12 pr-4 py-4 border-2 border-gray-100 bg-gray-50/50 rounded-xl focus:ring-4 focus:ring-kafra-100 focus:border-kafra-500 focus:bg-white transition-all duration-200 text-gray-800 placeholder-gray-400 font-medium text-base relative z-0"
            placeholder={placeholder}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setShowRecent(true)}
          />

          {/* Recent Searches Dropdown */}
          {showRecent && recentSearches.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-100 rounded-xl shadow-xl z-50 overflow-hidden animate-fade-in">
              <div className="px-4 py-2 bg-gray-50 text-xs font-bold text-gray-500 border-b border-gray-100">최근 검색어</div>
              {recentSearches.map((term, idx) => (
                <div
                  key={idx}
                  className="px-4 py-3 hover:bg-gray-50 cursor-pointer flex items-center justify-between group/item"
                  onClick={() => handleRecentClick(term)}
                >
                  <div className="flex items-center gap-2 text-gray-700 text-sm">
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

          <button
            type="submit"
            disabled={isLoading}
            className="absolute inset-y-2 right-2 px-8 bg-gradient-to-r from-kafra-500 to-kafra-600 hover:from-kafra-600 hover:to-kafra-700 text-white font-bold rounded-lg transition-all shadow-md hover:shadow-lg disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center min-w-[90px] z-10"
          >
            {isLoading ? (
              <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            ) : (
              '검색'
            )}
          </button>
        </div>

        {/* Bottom Row: Filters */}
        <div className="flex flex-col md:flex-row gap-4">
          <div className="w-full md:w-1/3">
            <label htmlFor="server-select" className="block text-xs font-bold text-gray-500 mb-1.5 ml-1">
              서버
            </label>
            <div className="relative">
              <select
                id="server-select"
                value={server}
                onChange={(e) => setServer(e.target.value)}
                className="block w-full px-3 py-2.5 text-sm font-medium text-gray-700 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-kafra-100 focus:border-kafra-500 bg-white shadow-sm transition-shadow appearance-none cursor-pointer hover:border-gray-300"
              >
                {SERVERS.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none text-gray-500">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
              </div>
            </div>
          </div>

          <div className="flex-grow flex items-end justify-end gap-2 mt-2 md:mt-0">
            <button
              type="button"
              onClick={handleReset}
              className="text-sm text-gray-500 font-medium hover:text-gray-800 flex items-center gap-1.5 px-4 py-2.5 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <RotateCcw size={14} /> 초기화
            </button>
            <button type="button" className="text-sm text-kafra-600 font-bold hover:text-kafra-700 flex items-center gap-1.5 px-4 py-2.5 bg-kafra-50/50 border border-kafra-100 rounded-lg hover:bg-kafra-100 hover:border-kafra-200 transition-all">
              <Filter size={14} /> 필터 설정
            </button>
          </div>
        </div>

      </form>
    </div>
  );
};

export default SearchFilters;