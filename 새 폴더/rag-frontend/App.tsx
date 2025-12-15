
import React, { useState, useEffect, useRef } from 'react';
import Header from './components/Header';
import SearchFilters from './components/SearchFilters';
import ResultsTable from './components/ResultsTable';
import AuthModal from './components/AuthModal';
import ItemDetailView from './components/ItemDetailView';
import Board from './components/Board';
import ItemInfoView from './components/ItemInfoView';
import DamageCalculator from './components/DamageCalculator';
import Simulator from './components/Simulator';
import SkillSimulator from './components/SkillSimulator';
import { MarketItem, SearchParams, User, ViewMode } from './types';
import { searchMarketItems } from './services/apiService'; // Use new API Service
import { Sparkles, Construction, Database, ChevronLeft, ChevronRight } from 'lucide-react';

const App: React.FC = () => {
  // Navigation State
  const [currentView, setCurrentView] = useState<ViewMode>('search');

  // Search State
  const [items, setItems] = useState<MarketItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [lastParams, setLastParams] = useState<SearchParams | null>(null);
  const [selectedItem, setSelectedItem] = useState<MarketItem | null>(null);

  // Pagination State
  const [pagination, setPagination] = useState({ page: 1, size: 10, total: 0, total_pages: 0 });

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

  const abortRef = useRef<AbortController | null>(null);
  const reqIdRef = useRef<number>(0);

  const handleSearch = async (params: SearchParams) => {
    // 1. Cancel previous request
    if (abortRef.current) {
      abortRef.current.abort();
    }

    // 2. Create new controller
    const controller = new AbortController();
    abortRef.current = controller;

    // 3. Generate Request ID
    const currentReqId = Date.now();
    reqIdRef.current = currentReqId;

    // 4. Clear UI state
    setIsLoading(true);
    setLastParams(params);
    setSelectedItem(null);
    setItems([]);

    try {
      const { items: newItems, pagination: newPagination } = await searchMarketItems(
        params.query,
        params.server,
        params.category,
        1,
        controller.signal
      );

      // 5. Check if this is still the latest request
      if (currentReqId !== reqIdRef.current) return;

      setItems(newItems);
      setPagination(newPagination);
    } catch (error: any) {
      if (error.name === 'AbortError') return;
      console.error("Search failed:", error);
    } finally {
      if (currentReqId === reqIdRef.current) {
        setIsLoading(false);
      }
    }
  };

  const handlePageChange = async (newPage: number) => {
    if (!lastParams || newPage < 1 || newPage > pagination.total_pages) return;

    // 1. Cancel previous request
    if (abortRef.current) {
      abortRef.current.abort();
    }

    // 2. Create new controller
    const controller = new AbortController();
    abortRef.current = controller;

    // 3. Generate Request ID
    const currentReqId = Date.now();
    reqIdRef.current = currentReqId;

    setIsLoading(true);
    setSelectedItem(null);

    try {
      const { items: newItems, pagination: newPagination } = await searchMarketItems(
        lastParams.query,
        lastParams.server,
        lastParams.category,
        newPage,
        controller.signal
      );

      // 5. Check if this is still the latest request
      if (currentReqId !== reqIdRef.current) return;

      setItems(newItems);
      setPagination(newPagination);
    } catch (error: any) {
      if (error.name === 'AbortError') return;
      console.error("Page change failed:", error);
    } finally {
      if (currentReqId === reqIdRef.current) {
        setIsLoading(false);
      }
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
            <div className="max-w-4xl mx-auto lg:mx-0 lg:max-w-none">
              {!lastParams?.query && (
                <div className="mb-8 text-center lg:text-left">
                  <h1 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
                    <span className="text-kafra-500">RANO</span> Market
                  </h1>
                  <p className="mt-2 text-sm text-gray-500">라그나로크 노점 검색의 새로운 기준</p>
                </div>
              )}
              <SearchFilters onSearch={handleSearch} isLoading={isLoading} />
            </div>

            {/* Split View */}
            <div className="flex flex-col lg:flex-row items-start relative mt-8">
              {/* Left: List */}
              <div className={`w-full transition-all duration-300 ${selectedItem ? 'lg:w-[calc(100%-424px)]' : 'lg:w-full max-w-5xl mx-auto'}`}>
                <div className="flex items-center justify-between mb-4 pl-1">
                  <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                    {lastParams?.query ? `"${lastParams.query}" 검색 결과` : '실시간 인기 매물'}
                    {items.length > 0 && <span className="text-sm font-normal text-gray-500">({pagination.total.toLocaleString()}건)</span>}
                  </h2>
                  <span className="text-[10px] text-gray-400 border border-gray-200 bg-white px-2 py-1 rounded-full flex items-center gap-1">
                    <Database size={10} className="text-blue-500" /> Real Data
                  </span>
                </div>

                <ResultsTable
                  items={items}
                  isLoading={isLoading}
                  selectedItemId={selectedItem?.id || null}
                  onItemClick={(item) => setSelectedItem(item)}
                />

                {!isLoading && items.length > 0 && pagination.total_pages > 1 && (
                  <div className="flex justify-center mt-12 mb-20">
                    <nav className="inline-flex rounded-lg shadow-sm -space-x-px items-center gap-2">
                      <button
                        onClick={() => handlePageChange(pagination.page - 1)}
                        disabled={pagination.page === 1}
                        className="p-2 border border-gray-200 bg-white text-gray-500 hover:bg-gray-50 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <ChevronLeft size={16} />
                      </button>

                      <span className="text-sm font-bold text-gray-700">
                        {pagination.page} / {pagination.total_pages}
                      </span>

                      <button
                        onClick={() => handlePageChange(pagination.page + 1)}
                        disabled={pagination.page === pagination.total_pages}
                        className="p-2 border border-gray-200 bg-white text-gray-500 hover:bg-gray-50 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <ChevronRight size={16} />
                      </button>
                    </nav>
                  </div>
                )}
              </div>

              {/* Right: Detail */}
              <ItemDetailView
                item={selectedItem}
                onClose={() => setSelectedItem(null)}
              />
            </div>
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
    <div className="min-h-full flex flex-col bg-gray-50/50 font-sans">
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
