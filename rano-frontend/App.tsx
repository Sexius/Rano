
import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import SearchFilters from './components/SearchFilters';
import ResultsTable from './components/ResultsTable';
import AuthModal from './components/AuthModal';
import ItemDetailView from './components/ItemDetailView';
import Board from './components/Board';
import ItemInfoView from './components/ItemInfoView';
import DamageCalculator from './components/DamageCalculator';
import Simulator from './components/Simulator';
import SkillSimulator from './components/SkillSimulator'; // Imported
import { MarketItem, SearchParams, User, ViewMode } from './types';
import { searchVendingItems, VendingSearchResult } from './services/vendingService';
import { Sparkles, Construction, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';

const App: React.FC = () => {
  // Navigation State
  const [currentView, setCurrentView] = useState<ViewMode>('search');

  // Search State
  const [items, setItems] = useState<MarketItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [lastQuery, setLastQuery] = useState('');
  const [selectedItem, setSelectedItem] = useState<MarketItem | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [totalResults, setTotalResults] = useState(0);
  const [lastSearchParams, setLastSearchParams] = useState<SearchParams | null>(null);
  const [lastSearchTime, setLastSearchTime] = useState<Date | null>(null);

  // Auth State
  const [user, setUser] = useState<User | null>(null);
  const [isAuthModalOpen, setAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');

  // Initialize User from LocalStorage on Mount
  useEffect(() => {
    const savedUser = localStorage.getItem('kafra_user');
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (e) {
        console.error("Failed to parse user from storage");
      }
    }
  }, []);

  const handleSearch = async (params: SearchParams, page: number = 1) => {
    setIsLoading(true);
    setLastQuery(params.query);
    setSelectedItem(null);
    if (page === 1) {
      setItems([]);
    }
    setLastSearchParams(params);

    try {
      const result = await searchVendingItems(params.query, params.server, params.category, page);
      setItems(result.items);
      setTotalResults(result.total);
      setCurrentPage(result.page);
      setTotalPages(result.totalPages);
      setLastSearchTime(new Date());
    } catch (error) {
      console.error("Search failed:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePageChange = (newPage: number) => {
    if (lastSearchParams && newPage >= 1 && newPage <= totalPages) {
      handleSearch(lastSearchParams, newPage);
    }
  };

  const openAuthModal = (mode: 'login' | 'signup') => {
    setAuthMode(mode);
    setAuthModalOpen(true);
  };

  const handleLogin = (newUser: User) => {
    setUser(newUser);
    localStorage.setItem('kafra_user', JSON.stringify(newUser));
    setAuthModalOpen(false);
  };

  const handleLogout = () => {
    if (window.confirm('로그아웃 하시겠습니까?')) {
      setUser(null);
      localStorage.removeItem('kafra_user');
    }
  };

  const handleNavigate = (view: ViewMode) => {
    setCurrentView(view);
    // Reset view specific states if needed
    if (view === 'search') {
      // Keep search state alive for better UX
    }
  };

  // Render Content based on currentView
  const renderContent = () => {
    switch (currentView) {
      case 'search':
        return (
          <>
            {/* Top Section: Search & Title */}
            <div className="max-w-5xl mx-auto">
              {!lastQuery && (
                <div className="mb-8 text-center lg:text-left">
                  <h1 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
                    <span className="text-kafra-500">RANO</span> Market
                  </h1>
                  <p className="mt-2 text-sm text-gray-500">라그나로크 노점 검색의 새로운 기준</p>
                </div>
              )}
              <SearchFilters onSearch={handleSearch} isLoading={isLoading} />
            </div>

            {/* List - Always Full Width */}
            <div className="flex flex-col gap-2 relative mt-8">
              <div className="w-full max-w-5xl mx-auto">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 pl-1 gap-1">
                  <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                    {lastQuery ? `"${lastQuery}" 검색 결과` : '실시간 인기 매물'}
                    {totalResults > 0 && <span className="text-sm font-normal text-gray-500">({totalResults}건)</span>}
                  </h2>
                  {lastSearchTime && totalResults > 0 && (
                    <span className="text-xs text-gray-400">
                      마지막 업데이트: {lastSearchTime.toLocaleString('ko-KR', {
                        timeZone: 'Asia/Seoul',
                        month: '2-digit',
                        day: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                  )}
                </div>

                <ResultsTable
                  items={items}
                  isLoading={isLoading}
                  selectedItemId={selectedItem?.id || null}
                  onItemClick={(item) => setSelectedItem(item)}
                />

                {/* Styled Pagination */}
                {!isLoading && items.length > 0 && totalPages > 1 && (
                  <div className="flex items-center justify-center gap-2 mt-12 mb-20">
                    {/* First Page */}
                    <button
                      onClick={() => handlePageChange(1)}
                      disabled={currentPage === 1}
                      className="w-9 h-9 flex items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-400 hover:text-kafra-600 hover:border-kafra-200 hover:bg-kafra-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed group"
                      title="첫 페이지"
                    >
                      <ChevronsLeft size={16} className="group-hover:-translate-x-0.5 transition-transform" />
                    </button>
                    {/* Prev Page */}
                    <button
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                      className="w-9 h-9 flex items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-400 hover:text-kafra-600 hover:border-kafra-200 hover:bg-kafra-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed group"
                      title="이전 페이지"
                    >
                      <ChevronLeft size={16} className="group-hover:-translate-x-0.5 transition-transform" />
                    </button>

                    <div className="flex items-center gap-1.5 mx-2 bg-white px-2 py-1 rounded-xl border border-gray-100 shadow-sm">
                      {/* Render visible page numbers */}
                      {(() => {
                        const pageNumbers = [];
                        const maxVisible = 5;

                        if (totalPages <= maxVisible) {
                          // Show all pages if total is small
                          for (let i = 1; i <= totalPages; i++) {
                            pageNumbers.push(i);
                          }
                        } else {
                          // Always show first page
                          pageNumbers.push(1);

                          if (currentPage <= 3) {
                            // Near start
                            pageNumbers.push(2, 3, 4);
                          } else if (currentPage >= totalPages - 2) {
                            // Near end
                            pageNumbers.push(totalPages - 3, totalPages - 2, totalPages - 1);
                          } else {
                            // Middle
                            pageNumbers.push(currentPage - 1, currentPage, currentPage + 1);
                          }

                          // Always show last page
                          if (!pageNumbers.includes(totalPages)) {
                            pageNumbers.push(totalPages);
                          }
                        }

                        return pageNumbers.map((pageNum, idx) => {
                          const prevNum = pageNumbers[idx - 1];
                          const showEllipsis = prevNum && pageNum - prevNum > 1;

                          return (
                            <React.Fragment key={pageNum}>
                              {showEllipsis && (
                                <div className="w-8 h-8 flex items-center justify-center text-gray-300 pb-2 font-serif tracking-widest">...</div>
                              )}
                              <button
                                onClick={() => handlePageChange(pageNum)}
                                className={`w-8 h-8 flex items-center justify-center rounded-lg font-medium text-sm transition-all ${pageNum === currentPage
                                  ? 'bg-kafra-600 text-white shadow-md shadow-kafra-500/20 transform scale-105'
                                  : 'text-gray-500 hover:bg-gray-100 hover:text-gray-900'
                                  }`}
                              >
                                {pageNum}
                              </button>
                            </React.Fragment>
                          );
                        });
                      })()}
                    </div>

                    {/* Next Page */}
                    <button
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      className="w-9 h-9 flex items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-400 hover:text-kafra-600 hover:border-kafra-200 hover:bg-kafra-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed group"
                      title="다음 페이지"
                    >
                      <ChevronRight size={16} className="group-hover:translate-x-0.5 transition-transform" />
                    </button>
                    {/* Last Page */}
                    <button
                      onClick={() => handlePageChange(totalPages)}
                      disabled={currentPage === totalPages}
                      className="w-9 h-9 flex items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-400 hover:text-kafra-600 hover:border-kafra-200 hover:bg-kafra-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed group"
                      title="마지막 페이지"
                    >
                      <ChevronsRight size={16} className="group-hover:translate-x-0.5 transition-transform" />
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* ===== COMMENTED OUT: Original Item Detail Popup Modal =====
               Now using Inspector panel in ResultsTable instead
            {selectedItem && (
              <ItemDetailView
                item={selectedItem}
                onClose={() => setSelectedItem(null)}
              />
            )}
            ===== END COMMENTED OUT ===== */}
          </>
        );

      case 'board':
        return <Board user={user} onOpenAuth={() => openAuthModal('login')} />;

      case 'itemInfo':
        return <ItemInfoView />;

      case 'calc':
        return <DamageCalculator />;

      case 'sim':
        return <Simulator />;

      case 'skill':
        return <SkillSimulator />;

      default:
        // Placeholder for other pages
        return (
          <div className="flex flex-col items-center justify-center py-32 text-center">
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-6">
              <Construction size={40} className="text-gray-400" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">서비스 준비 중입니다</h2>
            <p className="text-gray-500 max-w-md">
              현재 해당 기능은 개발 중에 있습니다. <br />
              더 나은 서비스를 위해 최선을 다하겠습니다.
            </p>
            <button
              onClick={() => setCurrentView('search')}
              className="mt-8 px-6 py-3 bg-kafra-600 text-white font-bold rounded-xl hover:bg-kafra-700 transition-colors"
            >
              홈으로 돌아가기
            </button>
          </div>
        );
    }
  };

  return (
    <div className="min-h-full flex flex-col bg-gray-50/50 font-sans overflow-x-hidden">
      <Header
        user={user}
        onOpenAuth={openAuthModal}
        onLogout={handleLogout}
        currentView={currentView}
        onNavigate={handleNavigate}
      />

      <div className="flex-1 max-w-[1400px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {renderContent()}
      </div>

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setAuthModalOpen(false)}
        initialMode={authMode}
        onLogin={handleLogin}
      />
    </div>
  );
};

export default App;
