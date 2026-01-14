
import React, { useState } from 'react';
import { ShoppingBag, Menu, X, User as UserIcon, LogOut, Calculator, Swords, MessageSquare, LineChart, Database, Search, BookOpen } from 'lucide-react';
import { User, ViewMode } from '../types';

interface HeaderProps {
  user: User | null;
  onOpenAuth: (mode: 'login' | 'signup') => void;
  onLogout: () => void;
  currentView: ViewMode;
  onNavigate: (view: ViewMode) => void;
  onReset?: () => void;
}

const Header: React.FC<HeaderProps> = ({ user, onOpenAuth, onLogout, currentView, onNavigate, onReset }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const navItemClass = (view: ViewMode) => `
    px-3 py-2 rounded-lg text-sm transition-all flex items-center gap-1.5 font-medium
    ${currentView === view
      ? 'text-kafra-600 bg-kafra-50 font-bold'
      : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
    }
  `;

  const mobileNavItemClass = (view: ViewMode) => `
    w-full px-4 py-3 rounded-xl text-left transition-all flex items-center gap-3 font-medium
    ${currentView === view
      ? 'text-kafra-600 bg-kafra-50 font-bold'
      : 'text-gray-600 hover:bg-gray-50'
    }
  `;

  const handleNav = (view: ViewMode) => {
    onNavigate(view);
    setIsMenuOpen(false);
  };

  return (
    <header className="bg-white/90 backdrop-blur-sm border-b border-gray-100 sticky top-0 z-40 shadow-sm transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">

          {/* Logo Section */}
          <div className="flex items-center gap-2.5 cursor-pointer group" onClick={() => onReset ? onReset() : handleNav('search')}>
            <div className="bg-gradient-to-tr from-kafra-500 to-kafra-400 p-2.5 rounded-xl text-white shadow-lg shadow-kafra-500/30 group-hover:scale-105 transition-transform duration-200">
              <ShoppingBag size={22} strokeWidth={2.5} />
            </div>
            <div className="flex flex-col">
              <span className="font-extrabold text-xl text-gray-900 leading-none tracking-tight font-sans">RANO</span>
              <span className="text-[10px] text-kafra-500 font-bold tracking-widest uppercase mt-0.5">Ragnarok Nojeom</span>
            </div>
          </div>

          {/* Desktop Nav */}
          <nav className="hidden lg:flex space-x-1">
            <button onClick={() => onNavigate('search')} className={navItemClass('search')}>
              <Search size={16} />
              노점 검색
            </button>
            <button onClick={() => onNavigate('itemInfo')} className={navItemClass('itemInfo')}>
              <Database size={16} />
              아이템 정보
            </button>
            <button onClick={() => onNavigate('market')} className={navItemClass('market')}>
              <LineChart size={16} />
              시세 통계
            </button>
            <button onClick={() => onNavigate('calc')} className={navItemClass('calc')}>
              <Swords size={16} />
              데미지 계산기
            </button>
            <button onClick={() => onNavigate('skill')} className={navItemClass('skill')}>
              <BookOpen size={16} />
              스킬
            </button>
            <button onClick={() => onNavigate('board')} className={navItemClass('board')}>
              <MessageSquare size={16} />
              게시판
            </button>
          </nav>

          {/* User Actions (Desktop & Mobile Toggle) */}
          <div className="flex items-center gap-3">
            {user ? (
              // Logged In State (Desktop)
              <div className="hidden lg:flex items-center gap-4">
                <div className="flex items-center gap-2 bg-gray-50 py-1.5 px-3 rounded-full border border-gray-100">
                  <div className="h-6 w-6 rounded-full bg-gradient-to-r from-kafra-400 to-kafra-600 flex items-center justify-center text-white shadow-sm">
                    <UserIcon size={14} />
                  </div>
                  <span className="text-sm font-bold text-gray-700">{user.nickname}</span>
                </div>
                <button
                  onClick={onLogout}
                  className="text-gray-400 hover:text-red-500 text-sm font-medium flex items-center gap-1 transition-colors"
                >
                  <LogOut size={16} />
                </button>
              </div>
            ) : (
              // Guest State (Desktop)
              <div className="hidden lg:flex items-center gap-2">
                <button
                  onClick={() => onOpenAuth('login')}
                  className="text-gray-500 hover:text-kafra-600 text-sm font-bold px-3 py-2 transition-colors"
                >
                  로그인
                </button>
                <button
                  onClick={() => onOpenAuth('signup')}
                  className="bg-gray-900 hover:bg-black text-white text-sm font-bold px-4 py-2 rounded-lg shadow-md hover:shadow-lg transition-all"
                >
                  회원가입
                </button>
              </div>
            )}

            {/* Hamburger Button (Mobile) */}
            <button
              className="lg:hidden text-gray-500 hover:text-gray-900 p-2 rounded-lg hover:bg-gray-100 transition-colors"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>

        </div>
      </div>

      {/* Mobile Menu Overlay */}
      {isMenuOpen && (
        <div className="lg:hidden absolute top-16 left-0 w-full bg-white border-b border-gray-200 shadow-2xl z-50 animate-fade-in flex flex-col max-h-[calc(100vh-64px)] overflow-y-auto">
          <div className="p-4 space-y-2">

            {/* Mobile User Section */}
            <div className="pb-4 mb-2 border-b border-gray-100">
              {user ? (
                <div className="flex items-center justify-between p-2 bg-gray-50 rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-gradient-to-r from-kafra-400 to-kafra-600 flex items-center justify-center text-white shadow-md">
                      <UserIcon size={20} />
                    </div>
                    <div>
                      <div className="text-sm font-bold text-gray-900">{user.nickname}</div>
                      <div className="text-xs text-green-500 font-medium flex items-center gap-1">
                        <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span> 온라인
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => { onLogout(); setIsMenuOpen(false); }}
                    className="text-gray-400 hover:text-red-500 p-2 hover:bg-white rounded-lg transition-all"
                  >
                    <LogOut size={20} />
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => { onOpenAuth('login'); setIsMenuOpen(false); }}
                    className="flex justify-center items-center py-3 rounded-xl border border-gray-200 text-gray-600 font-bold text-sm hover:bg-gray-50"
                  >
                    로그인
                  </button>
                  <button
                    onClick={() => { onOpenAuth('signup'); setIsMenuOpen(false); }}
                    className="flex justify-center items-center py-3 rounded-xl bg-kafra-600 text-white font-bold text-sm hover:bg-kafra-700 shadow-md"
                  >
                    회원가입
                  </button>
                </div>
              )}
            </div>

            {/* Mobile Nav Links */}
            <div className="space-y-1">
              <button onClick={() => handleNav('search')} className={mobileNavItemClass('search')}>
                <Search size={20} className={currentView === 'search' ? 'text-kafra-500' : 'text-gray-400'} />
                노점 검색
              </button>
              <button onClick={() => handleNav('itemInfo')} className={mobileNavItemClass('itemInfo')}>
                <Database size={20} className={currentView === 'itemInfo' ? 'text-kafra-500' : 'text-gray-400'} />
                아이템 정보
              </button>
              <button onClick={() => handleNav('market')} className={mobileNavItemClass('market')}>
                <LineChart size={20} className={currentView === 'market' ? 'text-kafra-500' : 'text-gray-400'} />
                시세 통계
              </button>
              <button onClick={() => handleNav('calc')} className={mobileNavItemClass('calc')}>
                <Swords size={20} className={currentView === 'calc' ? 'text-kafra-500' : 'text-gray-400'} />
                데미지 계산기
              </button>
              <button onClick={() => handleNav('skill')} className={mobileNavItemClass('skill')}>
                <BookOpen size={20} className={currentView === 'skill' ? 'text-kafra-500' : 'text-gray-400'} />
                스킬 시뮬레이터
              </button>
              <button onClick={() => handleNav('board')} className={mobileNavItemClass('board')}>
                <MessageSquare size={20} className={currentView === 'board' ? 'text-kafra-500' : 'text-gray-400'} />
                게시판
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;
