
import React, { useState, useEffect } from 'react';
import { X, User, Lock, Mail, ChevronRight, Check } from 'lucide-react';
import { User as UserType } from '../types';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLogin: (user: UserType) => void;
  initialMode?: 'login' | 'signup';
}

const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onLogin, initialMode = 'login' }) => {
  const [mode, setMode] = useState<'login' | 'signup'>(initialMode);
  const [formData, setFormData] = useState({
    id: '',
    password: '',
    confirmPassword: '',
    nickname: '',
    email: ''
  });
  const [error, setError] = useState('');

  // Sync mode when prop changes
  useEffect(() => {
    setMode(initialMode);
    setError('');
  }, [initialMode, isOpen]);

  if (!isOpen) return null;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setError('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Simple Validation Simulation
    if (!formData.id || !formData.password) {
      setError('아이디와 비밀번호를 입력해주세요.');
      return;
    }

    if (mode === 'signup') {
      if (formData.password !== formData.confirmPassword) {
        setError('비밀번호가 일치하지 않습니다.');
        return;
      }
      if (!formData.nickname) {
        setError('닉네임을 입력해주세요.');
        return;
      }
      // Simulate Signup Success -> Auto Login
      onLogin({
        id: formData.id,
        nickname: formData.nickname
      });
    } else {
      // Simulate Login Success
      onLogin({
        id: formData.id,
        nickname: formData.id === 'admin' ? '운영자' : '모험가' + Math.floor(Math.random() * 1000)
      });
    }
  };

  const switchMode = (newMode: 'login' | 'signup') => {
    setMode(newMode);
    setError('');
    setFormData({ id: '', password: '', confirmPassword: '', nickname: '', email: '' });
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto font-sans" aria-labelledby="auth-modal" role="dialog" aria-modal="true">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        
        {/* Backdrop */}
        <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm transition-opacity" onClick={onClose}></div>
        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

        {/* Modal Panel */}
        <div className="inline-block align-bottom bg-white rounded-3xl text-left overflow-hidden shadow-2xl transform transition-all sm:my-8 sm:align-middle sm:max-w-md w-full border border-white/20 relative">
          
          {/* Header Image / Branding */}
          <div className="relative h-40 overflow-hidden bg-kafra-600">
             <div className="absolute inset-0 bg-gradient-to-br from-kafra-500 to-kafra-800"></div>
             {/* Decorative circles */}
             <div className="absolute top-0 left-0 w-32 h-32 bg-white/10 rounded-full -ml-10 -mt-10 blur-xl"></div>
             <div className="absolute bottom-0 right-0 w-40 h-40 bg-purple-500/20 rounded-full -mr-10 -mb-10 blur-xl"></div>
             
             <div className="relative z-10 flex flex-col items-center justify-center h-full text-white">
                <div className="bg-white/20 p-3 rounded-2xl backdrop-blur-md mb-2 shadow-inner">
                  <User size={32} className="text-white drop-shadow-md"/>
                </div>
                <h2 className="text-2xl font-bold tracking-tight">RANO</h2>
                <p className="text-kafra-100 text-xs font-medium tracking-widest uppercase mt-1 opacity-80">Ragnarok Nojeom</p>
             </div>

             {/* Main Close Button (Top Right) */}
             <button 
               onClick={onClose} 
               className="absolute top-4 right-4 bg-black/20 hover:bg-black/30 text-white rounded-full p-2 transition-colors backdrop-blur-sm z-50 cursor-pointer"
               aria-label="Close modal"
             >
               <X size={20} />
             </button>
          </div>

          <div className="bg-white px-8 py-8">
            
            {/* Tabs */}
            <div className="flex p-1 bg-gray-100 rounded-xl mb-6">
              <button
                className={`flex-1 py-2 text-sm font-bold text-center rounded-lg transition-all shadow-sm ${mode === 'login' ? 'bg-white text-gray-900 ring-1 ring-black/5' : 'bg-transparent text-gray-500 shadow-none hover:text-gray-700'}`}
                onClick={() => switchMode('login')}
              >
                로그인
              </button>
              <button
                className={`flex-1 py-2 text-sm font-bold text-center rounded-lg transition-all shadow-sm ${mode === 'signup' ? 'bg-white text-gray-900 ring-1 ring-black/5' : 'bg-transparent text-gray-500 shadow-none hover:text-gray-700'}`}
                onClick={() => switchMode('signup')}
              >
                회원가입
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1.5 ml-1">아이디</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <User className="h-5 w-5 text-gray-400 group-focus-within:text-kafra-500 transition-colors" />
                  </div>
                  <input
                    name="id"
                    type="text"
                    required
                    className="block w-full pl-11 pr-3 py-3 border border-gray-200 bg-gray-50 rounded-xl focus:ring-2 focus:ring-kafra-100 focus:border-kafra-500 focus:bg-white text-sm transition-all outline-none"
                    placeholder="아이디를 입력하세요"
                    value={formData.id}
                    onChange={handleInputChange}
                  />
                </div>
              </div>

              {mode === 'signup' && (
                <>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 mb-1.5 ml-1">닉네임</label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                        <Check className="h-5 w-5 text-gray-400 group-focus-within:text-kafra-500 transition-colors" />
                      </div>
                      <input
                        name="nickname"
                        type="text"
                        required
                        className="block w-full pl-11 pr-3 py-3 border border-gray-200 bg-gray-50 rounded-xl focus:ring-2 focus:ring-kafra-100 focus:border-kafra-500 focus:bg-white text-sm transition-all outline-none"
                        placeholder="게임 내 닉네임"
                        value={formData.nickname}
                        onChange={handleInputChange}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 mb-1.5 ml-1">이메일 (선택)</label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                        <Mail className="h-5 w-5 text-gray-400 group-focus-within:text-kafra-500 transition-colors" />
                      </div>
                      <input
                        name="email"
                        type="email"
                        className="block w-full pl-11 pr-3 py-3 border border-gray-200 bg-gray-50 rounded-xl focus:ring-2 focus:ring-kafra-100 focus:border-kafra-500 focus:bg-white text-sm transition-all outline-none"
                        placeholder="example@email.com"
                        value={formData.email}
                        onChange={handleInputChange}
                      />
                    </div>
                  </div>
                </>
              )}

              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1.5 ml-1">비밀번호</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-400 group-focus-within:text-kafra-500 transition-colors" />
                  </div>
                  <input
                    name="password"
                    type="password"
                    required
                    className="block w-full pl-11 pr-3 py-3 border border-gray-200 bg-gray-50 rounded-xl focus:ring-2 focus:ring-kafra-100 focus:border-kafra-500 focus:bg-white text-sm transition-all outline-none"
                    placeholder="비밀번호 (4자리 이상)"
                    value={formData.password}
                    onChange={handleInputChange}
                  />
                </div>
              </div>

              {mode === 'signup' && (
                <div>
                   <label className="block text-xs font-bold text-gray-500 mb-1.5 ml-1">비밀번호 확인</label>
                   <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                      <Lock className={`h-5 w-5 transition-colors ${formData.confirmPassword && formData.password !== formData.confirmPassword ? 'text-red-500' : 'text-gray-400 group-focus-within:text-kafra-500'}`} />
                    </div>
                    <input
                      name="confirmPassword"
                      type="password"
                      required
                      className={`block w-full pl-11 pr-3 py-3 border bg-gray-50 rounded-xl focus:ring-2 focus:bg-white text-sm transition-all outline-none ${formData.confirmPassword && formData.password !== formData.confirmPassword ? 'border-red-300 focus:border-red-500 focus:ring-red-200' : 'border-gray-200 focus:ring-kafra-100 focus:border-kafra-500'}`}
                      placeholder="비밀번호 재입력"
                      value={formData.confirmPassword}
                      onChange={handleInputChange}
                    />
                  </div>
                  {formData.confirmPassword && formData.password !== formData.confirmPassword && (
                    <p className="text-[10px] text-red-500 font-bold mt-1 ml-1">비밀번호가 일치하지 않습니다.</p>
                  )}
                </div>
              )}

              {error && (
                <div className="text-red-500 text-xs font-bold text-center mt-2 bg-red-50 p-2.5 rounded-lg border border-red-100 animate-fade-in">
                  ⚠️ {error}
                </div>
              )}

              <div className="pt-2 flex flex-col gap-3">
                <button
                  type="submit"
                  className="w-full flex justify-center items-center py-3.5 px-4 border border-transparent rounded-xl shadow-lg shadow-kafra-500/30 text-sm font-bold text-white bg-gradient-to-r from-kafra-500 to-kafra-700 hover:from-kafra-600 hover:to-kafra-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-kafra-500 transition-all transform hover:scale-[1.02] active:scale-[0.98]"
                >
                  {mode === 'login' ? '로그인 하기' : '회원가입 완료'} <ChevronRight size={18} className="ml-1 opacity-80" />
                </button>
                
                {/* Secondary Close Button for better UX */}
                <button
                  type="button"
                  onClick={onClose}
                  className="w-full py-3 text-sm font-bold text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-xl transition-colors"
                >
                  닫기
                </button>
              </div>

            </form>

            {mode === 'login' && (
               <div className="mt-4 text-center">
                 <a href="#" className="text-xs font-medium text-gray-400 hover:text-kafra-600 transition-colors underline decoration-gray-300 underline-offset-2">비밀번호를 잊으셨나요?</a>
               </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthModal;
