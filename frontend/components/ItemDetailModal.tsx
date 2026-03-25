import React, { useEffect } from 'react';
import { MarketItem } from '../types';
import { X, Shield, Star, Zap, MapPin, Store } from 'lucide-react';

interface ItemDetailModalProps {
  item: MarketItem | null;
  onClose: () => void;
}

const ItemDetailModal: React.FC<ItemDetailModalProps> = ({ item, onClose }) => {
  // ESC 키로 모달 닫기
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    if (item) {
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [item, onClose]);

  if (!item) return null;

  const formatZeny = (amount: number) => new Intl.NumberFormat('ko-KR').format(amount);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
      <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        
        {/* Backdrop */}
        <div 
          className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" 
          aria-hidden="true" 
          onClick={onClose}
        ></div>

        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

        {/* Modal Panel */}
        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg w-full">
          
          <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div className="sm:flex sm:items-start">
              
              <div className="mt-3 text-center sm:mt-0 sm:ml-0 sm:text-left w-full">
                
                {/* Header with Icon and Name */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-4">
                    <div className="h-16 w-16 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden border border-gray-200 shadow-inner shrink-0">
                         <img src={item.image_placeholder} alt={item.name} className="w-full h-full object-cover"/>
                    </div>
                    <div>
                      <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-gray-100 text-gray-600 mb-1">
                        {item.server}
                      </span>
                      <h3 className="text-lg leading-6 font-bold text-gray-900 break-words" id="modal-title">
                        {item.refine_level > 0 && <span className="text-game-gold">+{item.refine_level} </span>}
                        {item.name}
                        {item.card_slots > 0 && <span className="text-gray-400 text-sm ml-1">[{item.card_slots}]</span>}
                      </h3>
                      <p className="text-sm text-gray-500">{item.category}</p>
                    </div>
                  </div>
                  <button onClick={onClose} className="text-gray-400 hover:text-gray-500">
                    <X size={24} />
                  </button>
                </div>

                {/* Seller Info Block - Top Priority in Market */}
                <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 mb-4">
                   <div className="flex justify-between items-start mb-2">
                       <div className="flex items-center gap-2">
                           <Store size={16} className="text-blue-600"/>
                           <span className="font-bold text-blue-900">{item.shop_title || "상점 제목 없음"}</span>
                       </div>
                       <div className="text-xs text-blue-400 font-mono">{item.created_at}</div>
                   </div>
                   <div className="grid grid-cols-2 gap-4 mt-3 pt-3 border-t border-blue-100/50">
                       <div>
                           <div className="text-xs text-blue-500 font-semibold mb-0.5">판매자</div>
                           <div className="text-sm font-medium text-gray-900">{item.seller}</div>
                       </div>
                       <div>
                           <div className="text-xs text-blue-500 font-semibold mb-0.5">위치</div>
                           <div className="text-sm text-gray-700 flex items-center gap-1">
                               <MapPin size={12}/> {item.location}
                           </div>
                       </div>
                   </div>
                </div>

                {/* Price Block */}
                <div className="flex justify-between items-center bg-gray-50 p-4 rounded-lg border border-gray-200 mb-4">
                    <span className="text-sm font-bold text-gray-600">판매 가격</span>
                    <div className="text-right">
                        <span className="text-2xl font-bold text-game-zeny">{formatZeny(item.price)}</span>
                        <span className="text-sm text-gray-500 ml-1">Zeny</span>
                        <div className="text-xs text-gray-400">수량: {item.amount}개</div>
                    </div>
                </div>

                {/* Cards Section */}
                {item.cards_equipped && item.cards_equipped.length > 0 && (
                  <div className="mb-4">
                    <span className="text-xs font-bold text-gray-500 uppercase block mb-2">장착된 카드</span>
                    <div className="flex flex-wrap gap-2">
                        {item.cards_equipped.map((card, idx) => (
                            <span key={idx} className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-yellow-50 text-yellow-700 border border-yellow-100">
                                <Zap size={10} className="mr-1"/> {card}
                            </span>
                        ))}
                    </div>
                  </div>
                )}

                {/* Stats / Description */}
                <div>
                    <h4 className="text-sm font-bold text-gray-900 mb-2">아이템 정보</h4>
                    <div className="space-y-1 text-sm text-gray-600 bg-gray-50 p-4 rounded-lg border border-gray-100 font-sans leading-relaxed">
                        {item.stats && item.stats.length > 0 ? (
                           item.stats.map((stat, i) => <div key={i}>• {stat}</div>)
                        ) : (
                            <>
                             <p>• 계열: {item.category}</p>
                             <p>• 무게: 50</p>
                             <p>• 요구 레벨: 40</p>
                             <p>• 장착: 전 직업</p>
                            </>
                        )}
                        {item.description && <p className="pt-3 text-gray-500 italic border-t border-gray-200 mt-3 text-xs">"{item.description}"</p>}
                    </div>
                </div>

              </div>
            </div>
          </div>
          <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse gap-2">
            <button 
                type="button" 
                className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-kafra-500 text-base font-medium text-white hover:bg-kafra-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-kafra-500 sm:w-auto sm:text-sm"
                onClick={onClose}
            >
              귓속말 복사
            </button>
            <button 
                type="button" 
                className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-kafra-500 sm:mt-0 sm:w-auto sm:text-sm"
                onClick={onClose}
            >
              닫기
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ItemDetailModal;